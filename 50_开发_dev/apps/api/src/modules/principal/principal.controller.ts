import { BadRequestException, Body, Controller, ForbiddenException, Get, Header, Headers, Inject, NotFoundException, Param, Post, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrincipalService } from './principal.service';
import { AuthService, bearerToken, sessionTokenFromHeaders } from '../auth/auth.service';
import { assertCookieOriginOk } from '../auth/family-platform-auth.guard';
import { assertReviewer } from './reviewer-policy';

function requireActor(actorId?: string): string {
  if (!actorId || actorId.trim().length === 0) throw new BadRequestException('x-actor-id header is required');
  return actorId.trim();
}
/** IAM-103:消费路径是否强制真实 Bearer(默认关=内部 dogfood 仍可 x-actor-id;开=x-actor-id-only 必拒)。 */
function requireBearer(): boolean {
  return process.env.FPAI_REQUIRE_BEARER === 'true';
}
function corr(id?: string): string {
  return id && id.trim() ? id.trim() : randomUUID();
}
/** M3-INT-001 §31-33:内部 Ops 面(复核运营台 + 用量)默认关闭,须 FPAI_INTERNAL_OPS=true 显式开启。 */
function assertInternalOps(): void {
  if (process.env.FPAI_INTERNAL_OPS !== 'true') {
    throw new NotFoundException('internal ops surface disabled (set FPAI_INTERNAL_OPS=true)');
  }
}

/**
 * M3-107 REVIEW 队列操作台(自包含静态页,无构建链;调用同域 handoffs / resolve 端点)。
 * familyId 从后端注入;actor 由页面输入(→ x-actor-id)。仅列 OPEN、可解决,不触碰 canonical。
 */
function renderReviewConsole(familyId: string): string {
  const fid = String(familyId).replace(/[<>"'&]/g, '');
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>FPAI 复核队列 · ${fid}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#1a1a1a}
h1{font-size:18px}.row{border:1px solid #e2e2e2;border-radius:10px;padding:12px 14px;margin:8px 0}
.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:#f0f0f4;margin-right:6px}
.HIGH_RISK{background:#fde8e8;color:#b42318}.REVIEW{background:#fff4e5;color:#b25e09}
button{border:0;border-radius:8px;padding:6px 12px;margin-right:6px;cursor:pointer;background:#eef;color:#334}
button.p{background:#2f6feb;color:#fff}input,select{padding:6px;border:1px solid #ccc;border-radius:8px}
.muted{color:#888;font-size:12px}</style></head>
<body>
<h1>Famili Principal · 人工复核队列</h1>
<p class="muted">family=${fid} · 仅 OPEN 项;解决即出队。这是运营台,不写 Growth 核心态。</p>
<p>复核人 <input id="actor" value="reviewer-1"/> <button class="p" onclick="load()">刷新</button></p>
<div id="list"></div>
<script>
const FID=${JSON.stringify(fid)};
function actor(){return document.getElementById('actor').value||'reviewer-1';}
async function load(){
  const r=await fetch('handoffs',{headers:{'x-actor-id':actor()}});
  const d=await r.json();const el=document.getElementById('list');
  if(!d.handoffs||!d.handoffs.length){el.innerHTML='<p class=muted>队列为空。</p>';return;}
  el.innerHTML=d.handoffs.map(h=>'<div class=row><span class="tag '+h.risk_route+'">'+h.risk_route+'</span>'
    +'<span class=tag>'+(h.trigger_reason||'')+'</span><span class=muted>'+(h.subject_ref||'')+' · '+(h.created_at||'')+'</span><br/>'
    +'<div style="margin-top:8px">'
    +btn(h.handoff_id,'APPROVED','通过')+btn(h.handoff_id,'ESCALATED','升级')+btn(h.handoff_id,'REJECTED','驳回')+btn(h.handoff_id,'INFO_ONLY','仅记录')
    +'</div></div>').join('');
}
function btn(id,res,label){return '<button onclick="resolve(\\''+id+'\\',\\''+res+'\\')">'+label+'</button>';}
async function resolve(id,resolution){
  const r=await fetch('handoffs/'+id+'/resolve',{method:'POST',headers:{'content-type':'application/json','x-actor-id':actor()},body:JSON.stringify({resolution})});
  if(r.ok)load();else alert('解决失败: '+r.status);
}
load();
</script></body></html>`;
}

@Controller('families/:familyId/principal')
export class PrincipalController {
  constructor(
    @Inject(PrincipalService) private readonly service: PrincipalService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  /**
   * P0 Runtime Trust:消费主体只能由 Account→ACTIVE binding→ACTIVE membership→family strict context 得出。
   * 不允许 x-actor-id 回退；同一 Account 在该家庭出现多条有效 person context 时明确拒绝，绝不任选一条。
   */
  private async resolveConsumerActor(familyId: string, authorization?: string, cookie?: string): Promise<string> {
    const token = sessionTokenFromHeaders({ authorization, cookie });
    if (!token) throw new UnauthorizedException('account_session_required');
    const strict = await this.auth.resolveFamilyContextStrict(token, familyId);
    if (strict.status === 'AMBIGUOUS') throw new ForbiddenException('ambiguous_family_context');
    if (strict.status === 'OK' && strict.ctx) return strict.ctx.personId;
    const account = await this.auth.resolveAccount(token);
    if (!account) throw new UnauthorizedException('invalid_or_expired_account_session');
    throw new ForbiddenException('account_has_no_active_membership_in_family');
  }

  private assertConsumerOrigin(method: string, authorization?: string, cookie?: string, origin?: string): void {
    assertCookieOriginOk({ method, headers: { authorization, cookie, origin } });
  }

  /**
   * IAM-103 复核主体解析:认证身份(Bearer,flag 开时强制)+ reviewer 授权(assertReviewer allowlist)。
   * flag 关时保持既有 x-actor-id + reviewer-policy(默认关)行为。
   */
  private async resolveReviewerActor(authorization?: string, actorId?: string): Promise<string> {
    const token = bearerToken(authorization);
    let actor: string;
    if (token) {
      const resolved = await this.auth.resolveActor(token);
      if (!resolved) throw new UnauthorizedException('invalid_or_expired_token');
      actor = resolved.personId;
    } else {
      if (requireBearer()) throw new UnauthorizedException('bearer_token_required');
      actor = requireActor(actorId);
    }
    assertReviewer(actor); // reviewer 授权门(FPAI_REQUIRE_REVIEWER_AUTH)
    return actor;
  }

  @Post('sessions')
  async createSession(
    @Param('familyId') familyId: string,
    @Body() body: { subject_ref?: string },
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
    @Headers('origin') origin?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    this.assertConsumerOrigin('POST', authorization, cookie, origin);
    const actor = await this.resolveConsumerActor(familyId, authorization, cookie);
    if (!body?.subject_ref) throw new BadRequestException('subject_ref is required');
    return this.service.createSession(familyId, body.subject_ref, actor, corr(correlationId));
  }

  @Post('sessions/:sessionId/messages')
  async postMessage(
    @Param('familyId') familyId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { message?: string; subject_ref?: string; images?: Array<{ media_type?: string; data?: string }> },
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
    @Headers('origin') origin?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    this.assertConsumerOrigin('POST', authorization, cookie, origin);
    const actor = await this.resolveConsumerActor(familyId, authorization, cookie);
    if (!body?.message) throw new BadRequestException('message is required');
    if (!body?.subject_ref) throw new BadRequestException('subject_ref is required');
    let images: Array<{ media_type: string; data: string }> | undefined;
    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) throw new BadRequestException('images must be an array');
      images = body.images.map((img, i) => {
        if (!img?.media_type || !img?.data) throw new BadRequestException(`images[${i}] requires media_type and data`);
        return { media_type: img.media_type, data: img.data };
      });
    }
    if (!(await this.service.sessionBelongsToFamily(sessionId, familyId))) {
      throw new NotFoundException('session not found for family');
    }
    return this.service.handleMessage(familyId, sessionId, body.subject_ref, actor, body.message, corr(correlationId), images);
  }

  @Get('sessions/:sessionId')
  async getSession(
    @Param('familyId') familyId: string,
    @Param('sessionId') sessionId: string,
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
  ) {
    await this.resolveConsumerActor(familyId, authorization, cookie);
    const agg = await this.service.getSession(familyId, sessionId);
    if (!agg) throw new NotFoundException('session not found');
    return agg;
  }

  @Get('usage')
  async usage(
    @Param('familyId') familyId: string,
    @Headers('x-actor-id') actorId?: string,
  ) {
    assertInternalOps();
    requireActor(actorId);
    return this.service.getUsage(familyId);
  }

  @Get('review-console')
  @Header('Content-Type', 'text/html; charset=utf-8')
  reviewConsole(@Param('familyId') familyId: string): string {
    assertInternalOps();
    return renderReviewConsole(familyId);
  }

  @Get('handoffs')
  async listHandoffs(
    @Param('familyId') familyId: string,
    @Headers('x-actor-id') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.resolveReviewerActor(authorization, actorId);   // IAM-103:认证身份 + reviewer 授权
    return { handoffs: await this.service.listHandoffs(familyId) };
  }

  @Post('handoffs/:handoffId/resolve')
  async resolveHandoff(
    @Param('familyId') familyId: string,
    @Param('handoffId') handoffId: string,
    @Body() body: { resolution?: string; note?: string },
    @Headers('x-actor-id') actorId?: string,
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = await this.resolveReviewerActor(authorization, actorId);   // IAM-103:认证身份 + reviewer 授权
    const resolution = body?.resolution ?? 'INFO_ONLY';
    if (!['APPROVED', 'REJECTED', 'ESCALATED', 'INFO_ONLY'].includes(resolution)) {
      throw new BadRequestException('resolution must be APPROVED|REJECTED|ESCALATED|INFO_ONLY');
    }
    const result = await this.service.resolveHandoff(familyId, handoffId, actor, resolution, body?.note ?? null, corr(correlationId));
    if (!result.ok) throw new NotFoundException('open handoff not found for family');
    // W2R-105:APPROVED 释放此前扣留的候选响应;其余 resolution released_response=null(保持扣留)。
    return { ok: true, resolution, released_response: result.released_response };
  }

  @Post('proposals/:proposalId/accept')
  async acceptProposal(
    @Param('familyId') familyId: string,
    @Param('proposalId') proposalId: string,
    @Body() body: { onboarding_id?: string; priority_id?: string; idempotency_key?: string },
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
    @Headers('origin') origin?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    this.assertConsumerOrigin('POST', authorization, cookie, origin);
    const actor = await this.resolveConsumerActor(familyId, authorization, cookie);
    if (!body?.onboarding_id) throw new BadRequestException('onboarding_id is required');
    if (!body?.priority_id) throw new BadRequestException('priority_id is required');
    if (!body?.idempotency_key) throw new BadRequestException('idempotency_key is required');
    const result = await this.service.acceptProposal(familyId, proposalId, actor, corr(correlationId), {
      onboarding_id: body.onboarding_id, priority_id: body.priority_id, idempotency_key: body.idempotency_key,
    });
    if (!result) throw new NotFoundException('proposal not found for family');
    return result;
  }

  @Post('responses/:responseId/feedback')
  async feedback(
    @Param('familyId') familyId: string,
    @Param('responseId') responseId: string,
    @Body() body: { rating?: string; note?: string },
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
    @Headers('origin') origin?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    this.assertConsumerOrigin('POST', authorization, cookie, origin);
    const actor = await this.resolveConsumerActor(familyId, authorization, cookie);
    await this.service.submitFeedback(familyId, responseId, actor, body?.rating ?? null, body?.note ?? null, corr(correlationId));
    return { ok: true };
  }
}
