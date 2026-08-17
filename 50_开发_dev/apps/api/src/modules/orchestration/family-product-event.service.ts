import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrchestrationRepository } from './orchestration.repository';
import {
  FAMILY_PRODUCT_EVENT_SCHEMA_VERSION,
  FORBIDDEN_PRODUCT_EVENT_KEYS,
  type FamilyProductEventReceipt,
  type RecordFamilyProductEventInput,
} from './family-product-event.contract';

function findForbiddenKey(value: unknown, path = ''): string | null {
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const current = path ? `${path}.${key}` : key;
    if ((FORBIDDEN_PRODUCT_EVENT_KEYS as readonly string[]).includes(key)) return current;
    const nested = findForbiddenKey(child, current);
    if (nested) return nested;
  }
  return null;
}

@Injectable()
export class FamilyProductEventService {
  constructor(@Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository) {}

  async record(input: RecordFamilyProductEventInput): Promise<FamilyProductEventReceipt> {
    if (!input.tenantId || !input.correlationId || !input.objectType) {
      throw new BadRequestException('product_event_identity_required');
    }
    const forbidden = findForbiddenKey(input.payload ?? {});
    if (forbidden) throw new BadRequestException(`forbidden_product_event_field:${forbidden}`);
    if (input.familyId && !input.consentRef && input.purpose !== 'ACCESSIBILITY') {
      throw new ForbiddenException('family_product_event_consent_required');
    }
    if (!input.familyId && (input.actorId || input.consentRef)) {
      throw new BadRequestException('tenant_event_cannot_have_family_actor_fields');
    }

    const eventId = randomUUID();
    const result = await this.repo.query<{ event_id: string }>(
      `insert into family_product_events
        (event_id, tenant_id, family_id, actor_id, event_type, object_type, object_id,
         source_page_id, purpose, consent_ref, correlation_id, schema_version,
         retention_class, payload, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$15)
       on conflict (tenant_id, correlation_id, event_type, object_type, coalesce(object_id, ''))
       do update set updated_at = now()
       returning event_id`,
      [eventId, input.tenantId, input.familyId ?? null, input.actorId ?? null, input.eventType,
        input.objectType, input.objectId ?? null, input.sourcePageId ?? null, input.purpose,
        input.consentRef ?? null, input.correlationId, FAMILY_PRODUCT_EVENT_SCHEMA_VERSION,
        input.retentionClass ?? 'PRODUCT_EVENT_MINIMAL', JSON.stringify(input.payload ?? {}), input.createdBy ?? null],
    );
    const persisted = result.rows[0];
    if (!persisted) throw new Error('product_event_persistence_failed');
    return {
      eventId: persisted.event_id,
      eventType: input.eventType,
      tenantId: input.tenantId,
      familyId: input.familyId ?? null,
      correlationId: input.correlationId,
      schemaVersion: FAMILY_PRODUCT_EVENT_SCHEMA_VERSION,
      recorded: true,
      externalEffect: false,
    };
  }
}
