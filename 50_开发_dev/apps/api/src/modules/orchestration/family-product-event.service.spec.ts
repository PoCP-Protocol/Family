import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FamilyProductEventService } from './family-product-event.service';

describe('FamilyProductEventService', () => {
  const repo = { query: vi.fn().mockResolvedValue({ rows: [{ event_id: 'event-1' }] }) } as any;
  const service = new FamilyProductEventService(repo);

  it('records a tenant-family event with a minimal receipt', async () => {
    const receipt = await service.record({
      tenantId: 'tenant-1', familyId: 'family-1', actorId: 'actor-1',
      eventType: 'decision_submitted', objectType: 'FamilyDecision', objectId: 'decision-1',
      sourcePageId: 'UI-03', purpose: 'SERVICE_PLANNING', consentRef: 'consent-1',
      correlationId: 'corr-1', payload: { decision: 'NO_ACTION' }, createdBy: 'actor-1',
    });
    expect(receipt).toMatchObject({ eventId: 'event-1', recorded: true, externalEffect: false });
    expect(repo.query).toHaveBeenCalledOnce();
  });

  it('fails closed for sensitive/raw event fields', async () => {
    await expect(service.record({
      tenantId: 'tenant-1', familyId: 'family-1', eventType: 'explanation_requested',
      objectType: 'LLMContext', purpose: 'PRODUCT_EXPERIENCE', consentRef: 'consent-1',
      correlationId: 'corr-raw', payload: { raw_prompt: 'secret' },
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires consent for family product events', async () => {
    await expect(service.record({
      tenantId: 'tenant-1', familyId: 'family-1', eventType: 'page_view',
      objectType: 'FamilyHome', purpose: 'PRODUCT_EXPERIENCE', correlationId: 'corr-consent',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow family actor fields on tenant-only events', async () => {
    await expect(service.record({
      tenantId: 'tenant-1', actorId: 'actor-1', eventType: 'catalog_viewed',
      objectType: 'Catalog', purpose: 'PRODUCT_EXPERIENCE', correlationId: 'corr-tenant',
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
