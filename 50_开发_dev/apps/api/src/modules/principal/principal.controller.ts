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
    @Body() body: { message?: string; subject_ref?: string },
    @Headers('x-actor-id') actorId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const actor = requireActor(actorId);
    if (!body?.message) throw new BadRequestException('message is required');
    if (!body?.subject_ref) throw new BadRequestException('subject_ref is required');
    if (!(await this.service.sessionBelongsToFamily(sessionId, familyId))) {
      throw new NotFoundException('session not found for family');
    }
    return this.service.handleMessage(familyId, sessionId, body.subject_ref, actor, body.message, corr(correlationId));
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
