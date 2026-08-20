import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrchestrationRepository } from './orchestration.repository';
import { FamilyProductEventService } from './family-product-event.service';
import {
  membershipEntitlementTextEquivalent,
  pageAllowedForMembershipEntitlement,
  type ConsumeMembershipBenefitDto,
  type FamilyMembershipAssetProjection,
  type MembershipBenefitActionReceipt,
  type MembershipBenefitGrantReceipt,
  type MembershipPlanReadModel,
  type MembershipSubscriptionReceipt,
  type RevokeMembershipBenefitDto,
  type SubscribeMembershipDto,
} from './family-membership-entitlement.contract';
import { requireDevSyntheticTestLoop } from './test-env.policy';

interface PlanRow {
  plan_id: string;
  plan_ref: string;
  version_no: number;
  title: string;
  status: 'ACTIVE';
  scope_type: 'PLATFORM' | 'TENANT';
  tenant_id: string | null;
  effective_from: string;
  effective_to: string | null;
  attributes_schema_version: number;
  fixture_only: true;
}
interface BenefitDefinitionRow {
  benefit_definition_id: string;
  benefit_ref: string;
  title: string;
  allocation_type: 'COUNT' | 'ACCESS' | 'CREDIT';
  units_per_grant: number;
  valid_days: number | null;
}
interface SubscriptionRow {
  membership_subscription_id: string;
  subscription_ref: string;
  plan_ref: string;
  plan_version: number;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  subject_person_id: string | null;
  row_version: number;
  effective_from: string;
  effective_to: string | null;
  correlation_id: string;
}
interface GrantRow {
  benefit_grant_id: string;
  benefit_ref: string;
  status: 'PENDING' | 'AVAILABLE' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
  allocated_units: number;
  remaining_units: number;
  valid_from: string;
  valid_to: string | null;
  row_version: number;
}

/** Explicit shape of the read-only projection view; aliases are not part of base transaction rows. */
type MembershipProjectionRow = SubscriptionRow & Partial<GrantRow> & {
  benefit_status?: GrantRow['status'];
  benefit_row_version?: number;
};

@Injectable()
export class FamilyMembershipEntitlementService {
  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(FamilyProductEventService) private readonly events: FamilyProductEventService,
  ) {}

  private environment(): 'DEV' | 'TEST' {
    return requireDevSyntheticTestLoop().environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  private async tenantForFamily(familyId: string): Promise<string> {
    const result = await this.repo.query<{ tenant_id: string }>(
      `select tenant_id from tenant_family_bindings
        where family_id=$1 and status='ACTIVE'
        order by effective_from desc limit 1`,
      [familyId],
    );
    const tenantId = result.rows[0]?.tenant_id;
    if (!tenantId) throw new ForbiddenException('tenant_family_binding_required');
    return tenantId;
  }

  /** Consent and subject are server revalidated; a client cannot create a membership for another family. */
  private async eligibleSubject(familyId: string, requestedSubjectId?: string): Promise<string | null> {
    const subject = await this.repo.query<{ person_id: string }>(
      `select person_id from persons
        where family_id=$1 and person_type='CHILD'
          and birth_date is not null
          and date_part('year', age(current_date, birth_date)) between 12 and 15
          and ($2::uuid is null or person_id=$2)
        order by person_id asc limit 1`,
      [familyId, requestedSubjectId ?? null],
    );
    if (requestedSubjectId && !subject.rows[0]) throw new ForbiddenException('membership_subject_not_in_family');
    const subjectId = subject.rows[0]?.person_id;
    // Family-level membership has nullable subject_person_id, but existing synthetic service consent
    // remains mandatory whenever a test child exists.
    if (subjectId) {
      const facts = await this.repo.loadEligibilityFacts(familyId, subjectId);
      if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
    }
    return requestedSubjectId ?? null;
  }

  private async activePlan(tenantId: string, planRef: string, version: number): Promise<{ plan: PlanRow; benefits: BenefitDefinitionRow[] }> {
    const plan = await this.repo.query<PlanRow>(
      `select plan_id, plan_ref, version_no, title, status, scope_type, tenant_id,
              effective_from, effective_to, attributes_schema_version, fixture_only
         from family_membership_plans
        where plan_ref=$1 and version_no=$2 and status='ACTIVE' and fixture_only=true
          and effective_from<=now() and (effective_to is null or effective_to>now())
          and ((scope_type='PLATFORM' and tenant_id is null) or (scope_type='TENANT' and tenant_id=$3))
        order by case when scope_type='TENANT' then 0 else 1 end
        limit 1`,
      [planRef, version, tenantId],
    );
    const row = plan.rows[0];
    if (!row) throw new ForbiddenException('membership_plan_not_active_or_not_visible');
    const benefits = await this.repo.query<BenefitDefinitionRow>(
      `select benefit_definition_id, benefit_ref, title, allocation_type, units_per_grant, valid_days
         from family_membership_benefit_definitions
        where plan_id=$1 and status='ACTIVE' and fixture_only=true
          and effective_from<=now() and (effective_to is null or effective_to>now())
        order by benefit_ref, version_no desc`,
      [row.plan_id],
    );
    if (!benefits.rows.length) throw new ForbiddenException('membership_plan_benefits_unavailable');
    return { plan: row, benefits: benefits.rows };
  }

  async plans(familyId: string): Promise<{ tenant_id: string; plans: MembershipPlanReadModel[] }> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const rows = await this.repo.query<PlanRow>(
      `select plan_id, plan_ref, version_no, title, status, scope_type, tenant_id,
              effective_from, effective_to, attributes_schema_version, fixture_only
         from family_membership_plans
        where status='ACTIVE' and fixture_only=true and effective_from<=now()
          and (effective_to is null or effective_to>now())
          and ((scope_type='PLATFORM' and tenant_id is null) or (scope_type='TENANT' and tenant_id=$1))
        order by plan_ref, version_no desc`,
      [tenantId],
    );
    const distinct = new Map<string, PlanRow>();
    for (const row of rows.rows) if (!distinct.has(row.plan_ref)) distinct.set(row.plan_ref, row);
    const plans = await Promise.all([...distinct.values()].map(async (plan) => {
      const benefitRows = await this.repo.query<BenefitDefinitionRow>(
        `select benefit_definition_id, benefit_ref, title, allocation_type, units_per_grant, valid_days
           from family_membership_benefit_definitions
          where plan_id=$1 and status='ACTIVE' and fixture_only=true
            and effective_from<=now() and (effective_to is null or effective_to>now())
          order by benefit_ref, version_no desc`,
        [plan.plan_id],
      );
      return {
        plan_id: plan.plan_id, scope_type: plan.scope_type, tenant_id: plan.tenant_id,
        plan_ref: plan.plan_ref, version_no: plan.version_no, title: plan.title, status: plan.status,
        effective_from: plan.effective_from, effective_to: plan.effective_to,
        attributes_schema_version: plan.attributes_schema_version, fixture_only: plan.fixture_only,
        benefits: benefitRows.rows.map((benefit) => ({
          benefit_definition_id: benefit.benefit_definition_id, benefit_ref: benefit.benefit_ref,
          title: benefit.title, allocation_type: benefit.allocation_type,
          units_per_grant: benefit.units_per_grant, valid_days: benefit.valid_days,
        })),
      } satisfies MembershipPlanReadModel;
    }));
    return { tenant_id: tenantId, plans };
  }

  async subscribe(
    familyId: string,
    actorPersonId: string,
    dto: SubscribeMembershipDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<{ subscription: MembershipSubscriptionReceipt; grants: MembershipBenefitGrantReceipt[] }> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForMembershipEntitlement(dto?.page_id) || !dto?.plan_ref || !Number.isInteger(dto.plan_version) || dto.plan_version! <= 0) {
      throw new BadRequestException('membership_subscription_page_plan_and_version_required');
    }
    if (dto.attributes && (typeof dto.attributes !== 'object' || Array.isArray(dto.attributes))) {
      throw new BadRequestException('membership_subscription_attributes_must_be_object');
    }
    const tenantId = await this.tenantForFamily(familyId);
    const subjectPersonId = await this.eligibleSubject(familyId, dto.subject_person_id);
    const catalogue = await this.activePlan(tenantId, dto.plan_ref, dto.plan_version!);

    if (idempotencyKey) {
      const existing = await this.repo.query<SubscriptionRow>(
        `select membership_subscription_id, subscription_ref, plan_ref, plan_version, status,
                subject_person_id, row_version, effective_from, effective_to, correlation_id
           from family_membership_subscriptions
          where tenant_id=$1 and family_id=$2 and idempotency_key=$3 limit 1`,
        [tenantId, familyId, idempotencyKey],
      );
      const replay = existing.rows[0];
      if (replay) {
        if (replay.plan_ref !== catalogue.plan.plan_ref || replay.plan_version !== catalogue.plan.version_no) {
          throw new ConflictException('membership_subscription_idempotency_conflict');
        }
        const grants = await this.grantsForSubscription(tenantId, familyId, replay.membership_subscription_id);
        const event = await this.recordEvent('membership_subscribed', tenantId, familyId, actorPersonId, replay.membership_subscription_id, dto.page_id, replay.correlation_id, { subscription_ref: replay.subscription_ref, plan_ref: replay.plan_ref });
        return { subscription: this.subscriptionReceipt(replay, event.eventId), grants: grants.map((grant) => this.grantReceipt(grant)) };
      }
    }

    const persisted = await this.repo.withTransaction(async (client) => {
      const subscriptionRef = `MEMBERSHIP-${catalogue.plan.plan_ref}-${randomUUID()}`;
      const subscription = await client.query<SubscriptionRow>(
        `insert into family_membership_subscriptions(
           tenant_id, family_id, actor_person_id, subject_person_id, subscription_ref,
           plan_id, plan_ref, plan_version, status, consent_ref, environment, source_system,
           external_effect, attributes, correlation_id, idempotency_key, created_by, updated_by
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9,$10,'TEST_NOOP_ADAPTER',false,$11::jsonb,$12,$13,$14,$14)
         returning membership_subscription_id, subscription_ref, plan_ref, plan_version, status,
                   subject_person_id, row_version, effective_from, effective_to, correlation_id`,
        [tenantId, familyId, actorPersonId, subjectPersonId, subscriptionRef,
          catalogue.plan.plan_id, catalogue.plan.plan_ref, catalogue.plan.version_no,
          `service-consent:${familyId}`, this.environment(), JSON.stringify(dto.attributes ?? {}),
          correlationId, idempotencyKey ?? null, actorPersonId],
      );
      const subscriptionRow = subscription.rows[0];
      if (!subscriptionRow) throw new Error('membership_subscription_persistence_failed');
      const grantRows: GrantRow[] = [];
      for (const benefit of catalogue.benefits) {
        const validToExpression = benefit.valid_days ? `now() + ($14::integer * interval '1 day')` : 'null';
        const grant = await client.query<GrantRow>(
          `insert into family_membership_benefit_grants(
             tenant_id, family_id, actor_person_id, subject_person_id, membership_subscription_id,
             benefit_definition_id, benefit_ref, grant_ref, allocation_type, allocated_units, remaining_units,
             status, environment, source_system, external_effect, attributes, correlation_id, created_by, updated_by, valid_to
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,'AVAILABLE',$11,'TEST_NOOP_ADAPTER',false,'{}'::jsonb,$12,$13,$13,${validToExpression})
           returning benefit_grant_id, benefit_ref, status, allocated_units, remaining_units, valid_from, valid_to, row_version`,
          benefit.valid_days
            ? [tenantId, familyId, actorPersonId, subjectPersonId, subscriptionRow.membership_subscription_id,
              benefit.benefit_definition_id, benefit.benefit_ref, `GRANT-${benefit.benefit_ref}-${randomUUID()}`,
              benefit.allocation_type, benefit.units_per_grant, this.environment(), correlationId, actorPersonId, benefit.valid_days]
            : [tenantId, familyId, actorPersonId, subjectPersonId, subscriptionRow.membership_subscription_id,
              benefit.benefit_definition_id, benefit.benefit_ref, `GRANT-${benefit.benefit_ref}-${randomUUID()}`,
              benefit.allocation_type, benefit.units_per_grant, this.environment(), correlationId, actorPersonId],
        );
        const grantRow = grant.rows[0];
        if (!grantRow) throw new Error('membership_benefit_grant_persistence_failed');
        await client.query(
          `insert into family_membership_benefit_ledger(
             tenant_id, family_id, actor_person_id, subject_person_id, benefit_grant_id,
             ledger_ref, action, units, remaining_units_after, source_page_id, environment,
             source_system, external_effect, attributes, correlation_id, created_by
           ) values ($1,$2,$3,$4,$5,$6,'GRANT',$7,$7,$8,$9,'TEST_NOOP_ADAPTER',false,'{}'::jsonb,$10,$11)`,
          [tenantId, familyId, actorPersonId, subjectPersonId, grantRow.benefit_grant_id,
            `LEDGER-GRANT-${randomUUID()}`, benefit.units_per_grant, dto.page_id, this.environment(), correlationId, actorPersonId],
        );
        grantRows.push(grantRow);
      }
      return { subscription: subscriptionRow, grants: grantRows };
    });

    const event = await this.recordEvent('membership_subscribed', tenantId, familyId, actorPersonId, persisted.subscription.membership_subscription_id, dto.page_id, correlationId, { subscription_ref: persisted.subscription.subscription_ref, plan_ref: persisted.subscription.plan_ref });
    return { subscription: this.subscriptionReceipt(persisted.subscription, event.eventId), grants: persisted.grants.map((grant) => this.grantReceipt(grant)) };
  }

  async consume(
    familyId: string,
    actorPersonId: string,
    dto: ConsumeMembershipBenefitDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<MembershipBenefitActionReceipt> {
    return this.changeBenefit('CONSUME', familyId, actorPersonId, dto, correlationId, idempotencyKey);
  }

  async revoke(
    familyId: string,
    actorPersonId: string,
    dto: RevokeMembershipBenefitDto,
    correlationId: string,
  ): Promise<MembershipBenefitActionReceipt> {
    return this.changeBenefit('REVOKE', familyId, actorPersonId, dto, correlationId);
  }

  private async changeBenefit(
    action: 'CONSUME' | 'REVOKE',
    familyId: string,
    actorPersonId: string,
    dto: ConsumeMembershipBenefitDto | RevokeMembershipBenefitDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<MembershipBenefitActionReceipt> {
    requireDevSyntheticTestLoop();
    if (!pageAllowedForMembershipEntitlement(dto?.page_id) || !dto?.benefit_grant_id) {
      throw new BadRequestException('membership_benefit_page_and_grant_required');
    }
    if ('attributes' in dto && dto.attributes && (typeof dto.attributes !== 'object' || Array.isArray(dto.attributes))) {
      throw new BadRequestException('membership_benefit_attributes_must_be_object');
    }
    const units = action === 'CONSUME' ? (dto as ConsumeMembershipBenefitDto).units ?? 1 : 0;
    if (!Number.isInteger(units) || units < 0) throw new BadRequestException('membership_benefit_units_invalid');
    const tenantId = await this.tenantForFamily(familyId);
    await this.eligibleSubject(familyId);

    if (action === 'CONSUME' && idempotencyKey) {
      const replay = await this.repo.query<{ benefit_grant_id: string; action: 'GRANT' | 'CONSUME' | 'REVOKE'; units: number; remaining_units_after: number; correlation_id: string }>(
        `select benefit_grant_id, action, units, remaining_units_after, correlation_id from family_membership_benefit_ledger
          where tenant_id=$1 and family_id=$2 and idempotency_key=$3 limit 1`,
        [tenantId, familyId, idempotencyKey],
      );
      const ledger = replay.rows[0];
      if (ledger) {
        if (ledger.benefit_grant_id !== dto.benefit_grant_id || ledger.action !== 'CONSUME' || ledger.units !== units) {
          throw new ConflictException('membership_benefit_idempotency_conflict');
        }
        const grant = await this.grantForFamily(tenantId, familyId, dto.benefit_grant_id);
        // Reuse the original correlation id so the append-only event envelope performs its own idempotent upsert.
        const event = await this.recordEvent('membership_benefit_consumed', tenantId, familyId, actorPersonId, grant.benefit_grant_id, dto.page_id, ledger.correlation_id, { remaining_units: grant.remaining_units });
        return this.actionReceipt(grant, 'CONSUME', event.eventId);
      }
    }

    const updated = await this.repo.withTransaction(async (client) => {
      const expected = dto.expected_row_version ?? null;
      let grant: GrantRow | undefined;
      if (action === 'CONSUME') {
        const result = await client.query<GrantRow>(
          `update family_membership_benefit_grants
              set remaining_units=remaining_units-$4,
                  status=case when remaining_units-$4=0 then 'CONSUMED'::family_membership_benefit_status else 'AVAILABLE'::family_membership_benefit_status end,
                  row_version=row_version+1, updated_at=now(), updated_by=$5
            where benefit_grant_id=$1 and tenant_id=$2 and family_id=$3
              and status='AVAILABLE' and remaining_units >= $4
              and (valid_to is null or valid_to > now())
              and ($6::integer is null or row_version=$6)
            returning benefit_grant_id, benefit_ref, status, allocated_units, remaining_units, valid_from, valid_to, row_version`,
          [dto.benefit_grant_id, tenantId, familyId, units, actorPersonId, expected],
        );
        grant = result.rows[0];
      } else {
        const result = await client.query<GrantRow>(
          `update family_membership_benefit_grants
              set status='REVOKED', revoked_at=now(), row_version=row_version+1, updated_at=now(), updated_by=$4
            where benefit_grant_id=$1 and tenant_id=$2 and family_id=$3
              and status in ('PENDING','AVAILABLE','CONSUMED')
              and ($5::integer is null or row_version=$5)
            returning benefit_grant_id, benefit_ref, status, allocated_units, remaining_units, valid_from, valid_to, row_version`,
          [dto.benefit_grant_id, tenantId, familyId, actorPersonId, expected],
        );
        grant = result.rows[0];
      }
      if (!grant) throw new ConflictException('membership_benefit_not_actionable_or_version_conflict');
      await client.query(
        `insert into family_membership_benefit_ledger(
           tenant_id, family_id, actor_person_id, subject_person_id, benefit_grant_id,
           ledger_ref, action, units, remaining_units_after, source_page_id, environment,
           source_system, external_effect, attributes, correlation_id, idempotency_key, created_by
         ) values ($1,$2,$3,null,$4,$5,$6,$7,$8,$9,$10,'TEST_NOOP_ADAPTER',false,$11::jsonb,$12,$13,$14)`,
        [tenantId, familyId, actorPersonId, grant.benefit_grant_id,
          `LEDGER-${action}-${randomUUID()}`, action, units, grant.remaining_units, dto.page_id,
          this.environment(), JSON.stringify(('attributes' in dto && dto.attributes) ? dto.attributes : {}), correlationId,
          idempotencyKey ?? null, actorPersonId],
      );
      return grant;
    });
    const eventType = action === 'CONSUME' ? 'membership_benefit_consumed' : 'membership_benefit_revoked';
    const event = await this.recordEvent(eventType, tenantId, familyId, actorPersonId, updated.benefit_grant_id, dto.page_id, correlationId, { remaining_units: updated.remaining_units });
    return this.actionReceipt(updated, action, event.eventId);
  }

  async customerProjection(familyId: string): Promise<FamilyMembershipAssetProjection> {
    requireDevSyntheticTestLoop();
    const tenantId = await this.tenantForFamily(familyId);
    const rows = await this.repo.query<MembershipProjectionRow>(
      `select membership_subscription_id, subscription_ref, plan_ref, plan_version, subscription_status as status,
              subject_person_id, effective_from, effective_to, subscription_row_version as row_version,
              benefit_grant_id, benefit_ref, benefit_status, allocated_units, remaining_units,
              valid_from, valid_to, benefit_row_version
         from family_customer_membership_asset_projection_v
        where tenant_id=$1 and family_id=$2
        order by effective_from desc, benefit_created_at desc nulls last`,
      [tenantId, familyId],
    );
    const subscriptions = new Map<string, FamilyMembershipAssetProjection['subscriptions'][number]>();
    const benefits: FamilyMembershipAssetProjection['benefits'] = [];
    for (const row of rows.rows) {
      if (!subscriptions.has(row.membership_subscription_id)) {
        subscriptions.set(row.membership_subscription_id, {
          membership_subscription_id: row.membership_subscription_id, subscription_ref: row.subscription_ref,
          plan_ref: row.plan_ref, plan_version: row.plan_version, status: row.status,
          subject_person_id: row.subject_person_id, effective_from: row.effective_from,
          effective_to: row.effective_to, row_version: row.row_version,
        });
      }
      if (row.benefit_grant_id && row.benefit_ref && row.benefit_status && row.allocated_units !== undefined && row.remaining_units !== undefined && row.valid_from) {
        benefits.push({
          benefit_grant_id: row.benefit_grant_id, benefit_ref: row.benefit_ref,
          status: row.benefit_status, allocated_units: row.allocated_units,
          remaining_units: row.remaining_units, valid_from: row.valid_from,
          valid_to: row.valid_to ?? null, row_version: row.benefit_row_version ?? 1,
        });
      }
    }
    return {
      tenant_id: tenantId, family_id: familyId, projection_version: 1, as_of: new Date().toISOString(),
      source_refs: [...subscriptions.values()].map((subscription) => subscription.subscription_ref),
      policy_version: null, visibility: 'FAMILY_PRIVATE', expires_at: null,
      subscriptions: [...subscriptions.values()],
      benefits,
      dev_points: { balance: 1280, source: 'DEV_FIXTURE', redeemable: false },
      text_equivalent: benefits.length ? '可查看当前家庭的会员订阅和权益资产。该内容仅在家庭范围内展示。' : '当前没有可展示的会员权益资产。',
    };
  }

  private async grantsForSubscription(tenantId: string, familyId: string, subscriptionId: string): Promise<GrantRow[]> {
    const result = await this.repo.query<GrantRow>(
      `select benefit_grant_id, benefit_ref, status, allocated_units, remaining_units, valid_from, valid_to, row_version
         from family_membership_benefit_grants
        where tenant_id=$1 and family_id=$2 and membership_subscription_id=$3
        order by created_at asc`,
      [tenantId, familyId, subscriptionId],
    );
    return result.rows;
  }

  private async grantForFamily(tenantId: string, familyId: string, grantId: string): Promise<GrantRow> {
    const result = await this.repo.query<GrantRow>(
      `select benefit_grant_id, benefit_ref, status, allocated_units, remaining_units, valid_from, valid_to, row_version
         from family_membership_benefit_grants
        where tenant_id=$1 and family_id=$2 and benefit_grant_id=$3 limit 1`,
      [tenantId, familyId, grantId],
    );
    const row = result.rows[0];
    if (!row) throw new ForbiddenException('membership_benefit_not_visible');
    return row;
  }

  private subscriptionReceipt(row: SubscriptionRow, eventId: string): MembershipSubscriptionReceipt {
    return {
      membership_subscription_id: row.membership_subscription_id, subscription_ref: row.subscription_ref,
      plan_ref: row.plan_ref, plan_version: row.plan_version, status: row.status,
      subject_person_id: row.subject_person_id, row_version: row.row_version, event_id: eventId,
      external_effect: false, environment: this.environment(),
      text_equivalent: membershipEntitlementTextEquivalent('SUBSCRIBE_MEMBERSHIP'),
    };
  }

  private grantReceipt(row: GrantRow): MembershipBenefitGrantReceipt {
    return {
      benefit_grant_id: row.benefit_grant_id, benefit_ref: row.benefit_ref, status: row.status,
      allocated_units: row.allocated_units, remaining_units: row.remaining_units,
      valid_from: row.valid_from, valid_to: row.valid_to, row_version: row.row_version,
      external_effect: false, text_equivalent: membershipEntitlementTextEquivalent('SUBSCRIBE_MEMBERSHIP'),
    };
  }

  private actionReceipt(row: GrantRow, action: 'CONSUME' | 'REVOKE', eventId: string): MembershipBenefitActionReceipt {
    return {
      benefit_grant_id: row.benefit_grant_id, action, status: row.status,
      remaining_units: row.remaining_units, row_version: row.row_version, event_id: eventId,
      external_effect: false,
      text_equivalent: membershipEntitlementTextEquivalent(action === 'CONSUME' ? 'CONSUME_BENEFIT' : 'REVOKE_BENEFIT'),
    };
  }

  private async recordEvent(
    eventType: 'membership_subscribed' | 'membership_benefit_consumed' | 'membership_benefit_revoked',
    tenantId: string,
    familyId: string,
    actorPersonId: string,
    objectId: string,
    pageId: string | undefined,
    correlationId: string,
    payload: Record<string, unknown>,
  ) {
    return this.events.record({
      tenantId, familyId, actorId: actorPersonId, eventType, objectType: 'MembershipBenefit', objectId,
      sourcePageId: pageId, purpose: 'PRODUCT_EXPERIENCE', consentRef: `service-consent:${familyId}`,
      correlationId, payload, createdBy: actorPersonId,
    });
  }
}
