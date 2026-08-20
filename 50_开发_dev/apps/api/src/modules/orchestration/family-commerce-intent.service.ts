import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { OrchestrationRepository } from './orchestration.repository';
import { FamilyProductEventService } from './family-product-event.service';
import {
  commerceIntentTextEquivalent,
  pageAllowedForCommerceIntent,
  type CancelOrderIntentDto,
  type CommerceProductReadModel,
  type CustomerCommerceProjection,
  type FamilyEntitlementReceipt,
  type OrderIntentReceipt,
  type SubmitOrderIntentDto,
} from './family-commerce-intent.contract';
import { requireDevSyntheticTestLoop } from './test-env.policy';

interface ProductRow {
  product_id: string;
  product_ref: string;
  version_no: number;
  title: string;
  admission_status: 'ADMITTED';
  source_ref: string;
  fixture_only: true;
  attributes_schema_version: number;
}

interface IntentRow {
  order_intent_id: string;
  intent_ref: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | 'EXPIRED';
  product_ref: string;
  product_version: number;
  row_version: number;
  correlation_id: string;
  created_at: string;
}

interface EntitlementRow {
  entitlement_id: string;
  entitlement_ref: string;
  status: 'PENDING' | 'AVAILABLE' | 'REVOKED' | 'EXPIRED';
  source_order_intent_id: string;
  available_at: string | null;
  expires_at: string | null;
}

@Injectable()
export class FamilyCommerceIntentService {
  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(FamilyProductEventService) private readonly events: FamilyProductEventService,
  ) {}

  private environment(): 'DEV' | 'TEST' {
    return requireDevSyntheticTestLoop().environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  private async tenantForFamily(familyId: string): Promise<string> {
    const result = await this.repo.query<{ tenant_id: string }>(
      `select tenant_id
         from tenant_family_bindings
        where family_id=$1 and status='ACTIVE'
        order by effective_from desc limit 1`,
      [familyId],
    );
    const tenantId = result.rows[0]?.tenant_id;
    if (!tenantId) throw new ForbiddenException('tenant_family_binding_required');
    return tenantId;
  }

  /** Reuses the existing synthetic service-consent posture; no child/contact fields are accepted from the client. */
  private async assertTestCommerceEligible(familyId: string): Promise<void> {
    const child = await this.repo.query<{ person_id: string }>(
      `select person_id from persons
        where family_id=$1 and person_type='CHILD'
          and birth_date is not null
          and date_part('year', age(current_date, birth_date)) between 12 and 15
        order by person_id asc limit 1`,
      [familyId],
    );
    const subjectPersonId = child.rows[0]?.person_id;
    if (!subjectPersonId) throw new ForbiddenException('commerce_synthetic_subject_unavailable');
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
  }

  private async activeProduct(tenantId: string, productRef: string, version: number): Promise<ProductRow> {
    const result = await this.repo.query<ProductRow>(
      `select product_id, product_ref, version_no, title, admission_status, source_ref,
              fixture_only, attributes_schema_version
         from family_product_offerings
        where product_ref=$1 and version_no=$2
          and status='ACTIVE' and admission_status='ADMITTED' and fixture_only=true
          and effective_from <= now() and (effective_to is null or effective_to > now())
          and ((scope_type='PLATFORM' and tenant_id is null) or (scope_type='TENANT' and tenant_id=$3))
        order by case when scope_type='TENANT' then 0 else 1 end
        limit 1`,
      [productRef, version, tenantId],
    );
    const row = result.rows[0];
    if (!row) throw new ForbiddenException('commerce_product_not_admitted_or_not_visible');
    return row;
  }

  async products(familyId: string): Promise<{ tenant_id: string; products: CommerceProductReadModel[] }> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const result = await this.repo.query<ProductRow>(
      `select product_id, product_ref, version_no, title, admission_status, source_ref,
              fixture_only, attributes_schema_version
         from family_product_offerings
        where status='ACTIVE' and admission_status='ADMITTED' and fixture_only=true
          and effective_from <= now() and (effective_to is null or effective_to > now())
          and ((scope_type='PLATFORM' and tenant_id is null) or (scope_type='TENANT' and tenant_id=$1))
        order by product_ref, version_no desc`,
      [tenantId],
    );
    const byRef = new Map<string, ProductRow>();
    for (const row of result.rows) if (!byRef.has(row.product_ref)) byRef.set(row.product_ref, row);
    return {
      tenant_id: tenantId,
      products: [...byRef.values()].map((row) => ({
        product_id: row.product_id,
        product_ref: row.product_ref,
        product_version: row.version_no,
        title: row.title,
        admission_status: row.admission_status,
        source_ref: row.source_ref,
        fixture_only: row.fixture_only,
        attributes_schema_version: row.attributes_schema_version,
      })),
    };
  }

  async submit(
    familyId: string,
    actorPersonId: string,
    dto: SubmitOrderIntentDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<{ intent: OrderIntentReceipt; entitlement: FamilyEntitlementReceipt }> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForCommerceIntent(dto?.page_id)) throw new BadRequestException('commerce_intent_page_not_allowed');
    if (!dto?.product_ref || !Number.isInteger(dto.product_version) || dto.product_version! <= 0) {
      throw new BadRequestException('commerce_product_ref_and_version_required');
    }
    if (dto.attributes && (typeof dto.attributes !== 'object' || Array.isArray(dto.attributes))) {
      throw new BadRequestException('commerce_intent_attributes_must_be_object');
    }
    await this.assertTestCommerceEligible(familyId);
    const tenantId = await this.tenantForFamily(familyId);
    const product = await this.activeProduct(tenantId, dto.product_ref, dto.product_version!);

    // Sequential replay is answered from the original fact chain. The database unique index remains
    // the final protection for concurrent writers; it never creates a second entitlement receipt.
    if (idempotencyKey) {
      const existing = await this.repo.query<IntentRow>(
        `select oi.order_intent_id, oi.intent_ref, oi.status, p.product_ref,
                p.version_no as product_version, oi.row_version, oi.correlation_id, oi.created_at
           from family_order_intents oi
           join family_product_offerings p on p.product_id=oi.product_id
          where oi.tenant_id=$1 and oi.family_id=$2 and oi.idempotency_key=$3
          limit 1`,
        [tenantId, familyId, idempotencyKey],
      );
      const replay = existing.rows[0];
      if (replay) {
        if (replay.product_ref !== product.product_ref || replay.product_version !== product.version_no) {
          throw new ConflictException('commerce_intent_idempotency_conflict');
        }
        const entitlement = await this.repo.query<EntitlementRow>(
          `select entitlement_id, entitlement_ref, status, source_order_intent_id, available_at, expires_at
             from family_entitlements
            where tenant_id=$1 and family_id=$2 and source_order_intent_id=$3
            limit 1`,
          [tenantId, familyId, replay.order_intent_id],
        );
        const receipt = entitlement.rows[0];
        if (!receipt) throw new Error('commerce_intent_idempotency_entitlement_missing');
        const event = await this.events.record({
          tenantId, familyId, actorId: actorPersonId,
          eventType: 'order_intent_submitted', objectType: 'OrderIntent', objectId: replay.order_intent_id,
          sourcePageId: dto.page_id, purpose: 'PRODUCT_EXPERIENCE', consentRef: `service-consent:${familyId}`,
          correlationId: replay.correlation_id,
          payload: { product_ref: product.product_ref, product_version: product.version_no, intent_ref: replay.intent_ref },
          createdBy: actorPersonId,
        });
        return {
          intent: {
            order_intent_id: replay.order_intent_id, intent_ref: replay.intent_ref, status: replay.status,
            product_ref: replay.product_ref, product_version: replay.product_version, row_version: replay.row_version,
            event_id: event.eventId, external_effect: false, environment: this.environment(),
            text_equivalent: commerceIntentTextEquivalent('SUBMIT_ORDER_INTENT'),
          },
          entitlement: {
            entitlement_id: receipt.entitlement_id, entitlement_ref: receipt.entitlement_ref, status: receipt.status,
            source_order_intent_id: receipt.source_order_intent_id, asset_projection_version: 1,
            external_effect: false, text_equivalent: commerceIntentTextEquivalent('SUBMIT_ORDER_INTENT'),
          },
        };
      }
    }

    const persisted = await this.repo.withTransaction(async (client) => {
      const intentRef = `INTENT-${randomUUID()}`;
      const intent = await client.query<IntentRow>(
        `insert into family_order_intents(
           tenant_id, family_id, actor_person_id, intent_ref, product_id, source_page_id,
           consent_ref, status, catalog_snapshot, attributes, environment, source_system,
           external_effect, correlation_id, idempotency_key, created_by, updated_by
         ) values ($1,$2,$3,$4,$5,$6,$7,'SUBMITTED',$8::jsonb,$9::jsonb,$10,'TEST_FIXTURE',false,$11,$12,$13,$13)
         returning order_intent_id, intent_ref, status, row_version,
           (select product_ref from family_product_offerings where product_id=$5) as product_ref,
           (select version_no from family_product_offerings where product_id=$5) as product_version,
           correlation_id, created_at`,
        [tenantId, familyId, actorPersonId, intentRef, product.product_id, dto.page_id,
          `service-consent:${familyId}`,
          JSON.stringify({ product_ref: product.product_ref, product_version: product.version_no, source_ref: product.source_ref }),
          JSON.stringify(dto.attributes ?? {}), this.environment(), correlationId, idempotencyKey ?? null, actorPersonId],
      );
      const intentRow = intent.rows[0];
      if (!intentRow) throw new Error('commerce_intent_persistence_failed');
      await client.query(
        `insert into family_order_intent_lines(
           tenant_id, family_id, order_intent_id, line_no, product_id, product_ref, product_version, attributes
         ) values ($1,$2,$3,1,$4,$5,$6,$7::jsonb)`,
        [tenantId, familyId, intentRow.order_intent_id, product.product_id, product.product_ref, product.version_no, JSON.stringify({})],
      );
      const entitlementRef = `ENTITLEMENT-${product.product_ref}-V${product.version_no}`;
      const entitlement = await client.query<EntitlementRow>(
        `insert into family_entitlements(
           tenant_id, family_id, source_order_intent_id, entitlement_ref, status,
           environment, source_system, external_effect, attributes, available_at, created_by, updated_by
         ) values ($1,$2,$3,$4,'AVAILABLE',$5,'TEST_NOOP_ADAPTER',false,$6::jsonb,now(),$7,$7)
         returning entitlement_id, entitlement_ref, status, source_order_intent_id, available_at, expires_at`,
        [tenantId, familyId, intentRow.order_intent_id, entitlementRef, this.environment(),
          JSON.stringify({ product_ref: product.product_ref, product_version: product.version_no }), actorPersonId],
      );
      const entitlementRow = entitlement.rows[0];
      if (!entitlementRow) throw new Error('commerce_entitlement_persistence_failed');
      return { intent: intentRow, entitlement: entitlementRow };
    });

    const event = await this.events.record({
      tenantId,
      familyId,
      actorId: actorPersonId,
      eventType: 'order_intent_submitted',
      objectType: 'OrderIntent',
      objectId: persisted.intent.order_intent_id,
      sourcePageId: dto.page_id,
      purpose: 'PRODUCT_EXPERIENCE',
      consentRef: `service-consent:${familyId}`,
      correlationId,
      payload: { product_ref: product.product_ref, product_version: product.version_no, intent_ref: persisted.intent.intent_ref },
      createdBy: actorPersonId,
    });

    return {
      intent: {
        order_intent_id: persisted.intent.order_intent_id,
        intent_ref: persisted.intent.intent_ref,
        status: persisted.intent.status,
        product_ref: persisted.intent.product_ref,
        product_version: persisted.intent.product_version,
        row_version: persisted.intent.row_version,
        event_id: event.eventId,
        external_effect: false,
        environment: this.environment(),
        text_equivalent: commerceIntentTextEquivalent('SUBMIT_ORDER_INTENT'),
      },
      entitlement: {
        entitlement_id: persisted.entitlement.entitlement_id,
        entitlement_ref: persisted.entitlement.entitlement_ref,
        status: persisted.entitlement.status,
        source_order_intent_id: persisted.entitlement.source_order_intent_id,
        asset_projection_version: 1,
        external_effect: false,
        text_equivalent: commerceIntentTextEquivalent('SUBMIT_ORDER_INTENT'),
      },
    };
  }

  async cancel(
    familyId: string,
    actorPersonId: string,
    dto: CancelOrderIntentDto,
    correlationId: string,
  ): Promise<OrderIntentReceipt> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForCommerceIntent(dto?.page_id) || !dto.order_intent_id) {
      throw new BadRequestException('commerce_cancel_page_and_order_intent_required');
    }
    const tenantId = await this.tenantForFamily(familyId);
    const expected = dto.expected_row_version ?? null;
    const updated = await this.repo.withTransaction(async (client) => {
      const intent = await client.query<IntentRow>(
        `update family_order_intents oi
            set status='CANCELLED', cancelled_at=now(), row_version=oi.row_version+1,
                updated_at=now(), updated_by=$4
          from family_product_offerings p
         where oi.order_intent_id=$1 and oi.tenant_id=$2 and oi.family_id=$3
           and oi.product_id=p.product_id and oi.status='SUBMITTED'
           and ($5::integer is null or oi.row_version=$5)
         returning oi.order_intent_id, oi.intent_ref, oi.status, p.product_ref,
                   p.version_no as product_version, oi.row_version, oi.created_at`,
        [dto.order_intent_id, tenantId, familyId, actorPersonId, expected],
      );
      const row = intent.rows[0];
      if (!row) throw new ConflictException('commerce_intent_not_cancellable_or_version_conflict');
      await client.query(
        `update family_entitlements
            set status='REVOKED', revoked_at=now(), row_version=row_version+1,
                updated_at=now(), updated_by=$4
          where source_order_intent_id=$1 and tenant_id=$2 and family_id=$3
            and status in ('PENDING','AVAILABLE')`,
        [dto.order_intent_id, tenantId, familyId, actorPersonId],
      );
      return row;
    });
    const event = await this.events.record({
      tenantId, familyId, actorId: actorPersonId,
      eventType: 'order_intent_cancelled', objectType: 'OrderIntent', objectId: updated.order_intent_id,
      sourcePageId: dto.page_id, purpose: 'PRODUCT_EXPERIENCE', consentRef: `service-consent:${familyId}`,
      correlationId, payload: { intent_ref: updated.intent_ref }, createdBy: actorPersonId,
    });
    return {
      order_intent_id: updated.order_intent_id,
      intent_ref: updated.intent_ref,
      status: updated.status,
      product_ref: updated.product_ref,
      product_version: updated.product_version,
      row_version: updated.row_version,
      event_id: event.eventId,
      external_effect: false,
      environment: this.environment(),
      text_equivalent: commerceIntentTextEquivalent('CANCEL_ORDER_INTENT'),
    };
  }

  async customerProjection(familyId: string): Promise<CustomerCommerceProjection> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const [intents, entitlements, policy] = await Promise.all([
      this.repo.query<IntentRow>(
        `select oi.order_intent_id, oi.intent_ref, oi.status, p.product_ref,
                p.version_no as product_version, oi.row_version, oi.created_at
           from family_order_intents oi
           join family_product_offerings p on p.product_id=oi.product_id
          where oi.tenant_id=$1 and oi.family_id=$2
          order by oi.created_at desc, oi.order_intent_id desc`,
        [tenantId, familyId],
      ),
      this.repo.query<EntitlementRow>(
        `select entitlement_id, entitlement_ref, status, source_order_intent_id, available_at, expires_at
           from family_entitlements
          where tenant_id=$1 and family_id=$2
          order by created_at desc, entitlement_id desc`,
        [tenantId, familyId],
      ),
      this.repo.query<{ policy_version: string }>(
        `select policy_version from tenant_policy_profiles where tenant_id=$1 and status='ACTIVE' limit 1`,
        [tenantId],
      ),
    ]);
    return {
      tenant_id: tenantId,
      family_id: familyId,
      projection_version: 1,
      as_of: new Date().toISOString(),
      source_refs: ['family_order_intents', 'family_order_intent_lines', 'family_entitlements'],
      policy_version: policy.rows[0]?.policy_version ?? null,
      visibility: 'FAMILY_PRIVATE',
      expires_at: null,
      order_intents: intents.rows.map((row) => ({
        order_intent_id: row.order_intent_id,
        intent_ref: row.intent_ref,
        status: row.status,
        product_ref: row.product_ref,
        product_version: row.product_version,
        created_at: row.created_at,
      })),
      entitlements: entitlements.rows.map((row) => ({
        entitlement_id: row.entitlement_id,
        entitlement_ref: row.entitlement_ref,
        status: row.status,
        source_order_intent_id: row.source_order_intent_id,
        available_at: row.available_at,
        expires_at: row.expires_at,
      })),
      text_equivalent: '以下显示当前家庭的商品选择与服务权益回执。本次数据只用于本地体验，不代表支付、外部订单或生产权益。',
    };
  }
}
