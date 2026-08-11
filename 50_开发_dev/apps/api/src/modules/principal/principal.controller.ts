import { BadRequestException, Body, Controller, Get, Headers, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrincipalService } from './principal.service';

function requireActor(actorId?: string): string {
  if (!actorId || actorId.trim().length === 0) throw new BadRequestException('x-actor-id header is required');
  return actorId.trim();
}
function corr(id?: string): string {
  return id && id.trim() ? id.trim() : randomUUID();
}

@Controller('families/:familyId/principal')
export class PrincipalController {
  constructor(@Inject(PrincipalService) private readonly service: PrincipalService) {}

  @Post('sessions')
  async createSession(
    @Param('familyId') familyId: string,
    @Body() body: { subject_ref?: string },
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
    if (!body?.subject_ref) throw new BadRequestException('subject_ref is required');
    return this.service.createSession(familyId, body.subject_ref, actor, corr(correlationId));
  }

  @Post('sessions/:sessionId/messages')
  async postMessage(
    @Param('familyId') familyId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { message?: string; subject_ref?: string; images?: Array<{ media_type?: string; data?: string }> },
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
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
    @Headers('x-actor-id') actorId?: string,
  ) {
    requireActor(actorId);
    const agg = await this.service.getSession(familyId, sessionId);
    if (!agg) throw new NotFoundException('session not found');
    return agg;
  }

  @Get('handoffs')
  async listHandoffs(
    @Param('familyId') familyId: string,
    @Headers('x-actor-id') actorId?: string,
  ) {
    requireActor(actorId);
    return { handoffs: await this.service.listHandoffs(familyId) };
  }

  @Post('handoffs/:handoffId/resolve')
  async resolveHandoff(
    @Param('familyId') familyId: string,
    @Param('handoffId') handoffId: string,
    @Body() body: { resolution?: string; note?: string },
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
    const resolution = body?.resolution ?? 'INFO_ONLY';
    if (!['APPROVED', 'REJECTED', 'ESCALATED', 'INFO_ONLY'].includes(resolution)) {
      throw new BadRequestException('resolution must be APPROVED|REJECTED|ESCALATED|INFO_ONLY');
    }
    const ok = await this.service.resolveHandoff(familyId, handoffId, actor, resolution, body?.note ?? null, corr(correlationId));
    if (!ok) throw new NotFoundException('open handoff not found for family');
    return { ok: true, resolution };
  }

  @Post('proposals/:proposalId/accept')
  async acceptProposal(
    @Param('familyId') familyId: string,
    @Param('proposalId') proposalId: string,
    @Body() body: { onboarding_id?: string; priority_id?: string; idempotency_key?: string },
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
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
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
    await this.service.submitFeedback(familyId, responseId, actor, body?.rating ?? null, body?.note ?? null, corr(correlationId));
    return { ok: true };
  }
}
