import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { OrchestrationRepository } from './orchestration.repository';
import {
  type ExecuteTestExperienceDto,
  type TestExperienceAction,
  type TestExperienceCustomerProjection,
  type TestExperienceOperationResult,
  TEST_EXPERIENCE_FIXTURE_VERSION,
  fixtureAllowedForTestExperienceAction,
  isTestExperienceAction,
  operationKindForTestExperienceAction,
  pageAllowedForTestExperienceAction,
  testExperienceTextEquivalent,
} from './test-experience.contract';
import { getFamilyLlmPagePolicy } from './llm-gateway/family-llm-page-policy';
import { requireDevSyntheticTestLoop } from './test-env.policy';
import { FamilyProductEventService } from './family-product-event.service';

interface OperationRow {
  operation_id: string;
  page_id: string;
  operation_kind: TestExperienceOperationResult['operation_kind'];
  fixture_ref: string;
  fixture_version: string;
  status: 'CREATED' | 'CONFIRMED' | 'CANCELLED';
  environment: 'DEV' | 'TEST';
  source: 'TEST_FIXTURE';
  external_effect: boolean;
  created_at: string;
}

@Injectable()
export class TestExperienceService {
  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(FamilyProductEventService) private readonly productEvents: FamilyProductEventService,
  ) {}

  private async assertSyntheticFamilyEligible(familyId: string): Promise<void> {
    const subject = await this.repo.query<{ person_id: string }>(
      `select person_id from persons
       where family_id=$1 and person_type='CHILD'
         and birth_date is not null
         and date_part('year', age(current_date, birth_date)) between 12 and 15
       order by person_id asc limit 1`,
      [familyId],
    );
    const personId = subject.rows[0]?.person_id;
    if (!personId) throw new ForbiddenException('test_experience_synthetic_subject_unavailable');
    const facts = await this.repo.loadEligibilityFacts(familyId, personId);
    if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
  }

  private async withIdempotency<T>(familyId: string, action: string, key: string | undefined, request: unknown, work: () => Promise<T>): Promise<T> {
    if (!key) return work();
    const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
    await this.repo.query(
      `insert into idempotency_keys(idempotency_key, action_name, request_hash)
       values ($1,$2,$3) on conflict (idempotency_key) do nothing`,
      [key, action, requestHash],
    );
    const row = (await this.repo.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
      `select action_name, request_hash, response_body from idempotency_keys where idempotency_key=$1`,
      [key],
    )).rows[0];
    if (!row || row.action_name !== action || row.request_hash !== requestHash) throw new ConflictException('idempotency_conflict');
    if (row.response_body) return row.response_body as T;
    const response = await work();
    await this.repo.query(
      `update idempotency_keys set response_code=201, response_body=$2::jsonb
       where idempotency_key=$1`,
      [key, JSON.stringify(response)],
    );
    return response;
  }

  private async tenantForFamily(familyId: string): Promise<string> {
    const result = await this.repo.query<{ tenant_id: string }>(
      `select tenant_id from tenant_family_bindings where family_id=$1 and status='ACTIVE' order by effective_from desc limit 1`,
      [familyId],
    );
    const tenantId = result.rows[0]?.tenant_id;
    if (!tenantId) throw new ForbiddenException('tenant_family_binding_required');
    return tenantId;
  }

  private environment(): 'DEV' | 'TEST' {
    const status = requireDevSyntheticTestLoop().environment_status;
    return status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  async execute(
    familyId: string,
    actorPersonId: string,
    dto: ExecuteTestExperienceDto,
    correlationId: string,
    idempotencyKey?: string,
  ): Promise<TestExperienceOperationResult> {
    requireDevSyntheticTestLoop();
    if (!isTestExperienceAction(dto?.action)) throw new BadRequestException('test_experience_action_not_allowed');
    if (dto.fixture_version !== TEST_EXPERIENCE_FIXTURE_VERSION) throw new BadRequestException('test_experience_fixture_version_mismatch');
    if (!pageAllowedForTestExperienceAction(dto.action, dto.page_id)) throw new BadRequestException('test_experience_action_page_mismatch');
    if (!fixtureAllowedForTestExperienceAction(dto.action, dto.fixture_ref)) throw new BadRequestException('test_experience_fixture_not_allowed');

    const pagePolicy = getFamilyLlmPagePolicy(dto.page_id!);
    if (!pagePolicy || !(pagePolicy.supported_actions as readonly string[]).includes(dto.action)) {
      throw new ForbiddenException('test_experience_page_policy_denied');
    }
    if (dto.action === 'CREATE_BOOKING' && dto.channel && !['VIDEO', 'TEXT', 'OFFLINE'].includes(dto.channel)) {
      throw new BadRequestException('test_experience_booking_channel_not_allowed');
    }
    if (dto.action !== 'CREATE_BOOKING' && dto.channel) throw new BadRequestException('test_experience_channel_not_allowed');

    await this.assertSyntheticFamilyEligible(familyId);
    const action = dto.action;
    return this.withIdempotency(
      familyId,
      `ExecuteTestExperience:${action}`,
      idempotencyKey,
      { familyId, actorPersonId, pageId: dto.page_id, action, fixtureRef: dto.fixture_ref, fixtureVersion: dto.fixture_version, channel: dto.channel ?? null },
      async () => {
        const operationKind = operationKindForTestExperienceAction(action);
        const result = await this.repo.query<OperationRow>(
          `insert into test_experience_operations(
             family_id, actor_person_id, page_id, operation_kind, fixture_version, fixture_ref,
             channel, status, environment, source, correlation_id, idempotency_key, external_effect
           ) values ($1,$2,$3,$4,$5,$6,$7,'CONFIRMED',$8,'TEST_FIXTURE',$9,$10,false)
           returning operation_id, page_id, operation_kind, fixture_ref, fixture_version, status,
                     environment, source, external_effect, created_at`,
          [
            familyId,
            actorPersonId,
            dto.page_id,
            operationKind,
            TEST_EXPERIENCE_FIXTURE_VERSION,
            dto.fixture_ref,
            dto.channel ?? null,
            this.environment(),
            correlationId,
            idempotencyKey ?? null,
          ],
        );
        const row = result.rows[0];
        if (action === 'ENTER_EXPERT_LIVE' || action === 'CREATE_EVENT') {
          const isActivityInterest = action === 'CREATE_EVENT';
          await this.repo.query(
            `insert into family_service_records(
               family_id, operation_ref, record_kind, source, status, visibility, record_payload,
               external_effect, created_by_person_id, occurred_at
             ) values ($1,$2,$3,'TEST_EXPERIENCE_OPERATION','RECORDED','FAMILY_PRIVATE',$4::jsonb,false,$5,now())
             on conflict do nothing`,
            [
              familyId,
              row.operation_id,
              isActivityInterest ? 'EVENT_REGISTRATION_INTEREST' : 'EXPERT_LIVE_INTEREST',
              JSON.stringify({
                ...(isActivityInterest ? { event_ref: dto.fixture_ref } : { session_ref: dto.fixture_ref }),
                page_id: dto.page_id,
                perspective_boundary: isActivityInterest ? 'REGISTRATION_DRAFT_NOT_ATTENDANCE' : 'FAMILY_INTEREST_ONLY',
                service_effect: 'NOT_ESTABLISHED',
                fixture_only: true,
              }),
              actorPersonId,
            ],
          );
        }
        const tenantId = await this.tenantForFamily(familyId);
        await this.productEvents.record({
          tenantId,
          familyId,
          actorId: actorPersonId,
          eventType: action === 'CREATE_BOOKING' ? 'booking_requested'
            : action === 'CREATE_EVENT' ? 'registration_requested'
            : action === 'PUBLISH_TEMPLATE' ? 'publication_recorded'
            : action === 'CREATE_INVITE' ? 'invite_created' : 'group_created',
          objectType: 'TestExperienceOperation',
          objectId: row.operation_id,
          sourcePageId: dto.page_id,
          purpose: 'PRODUCT_EXPERIENCE',
          consentRef: `service-consent:${familyId}`,
          correlationId,
          payload: { action, fixture_ref: dto.fixture_ref, fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION },
          createdBy: actorPersonId,
        });
        return {
          operation_id: row.operation_id,
          page_id: row.page_id,
          action,
          operation_kind: row.operation_kind,
          fixture_ref: row.fixture_ref,
          fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
          status: 'CONFIRMED',
          environment: row.environment,
          source: 'TEST_FIXTURE',
          external_effect: false,
          text_equivalent: testExperienceTextEquivalent(action),
        };
      },
    );
  }

  async cancel(familyId: string, operationId: string): Promise<{ operation_id: string; status: 'CANCELLED'; external_effect: false; text_equivalent: string }> {
    requireDevSyntheticTestLoop();
    const updated = await this.repo.query<{ operation_id: string }>(
      `update test_experience_operations
       set status='CANCELLED', cancelled_at=now()
       where operation_id=$1 and family_id=$2 and status='CONFIRMED'
       returning operation_id`,
      [operationId, familyId],
    );
    if ((updated.rowCount ?? 0) !== 1) throw new BadRequestException('test_experience_operation_not_cancellable');
    return {
      operation_id: operationId,
      status: 'CANCELLED',
      external_effect: false,
      text_equivalent: '已取消本次体验回执。不会撤销支付、预约、活动或任何外部发布，因为这些副作用从未发生。',
    };
  }

  async customerProjection(familyId: string): Promise<TestExperienceCustomerProjection> {
    requireDevSyntheticTestLoop();
    await this.assertSyntheticFamilyEligible(familyId);
    const rows = await this.repo.query<OperationRow>(
      `select operation_id, page_id, operation_kind, fixture_ref, fixture_version, status,
              environment, source, external_effect, created_at
       from test_experience_operations
       where family_id=$1
       order by created_at desc, operation_id desc`,
      [familyId],
    );
    return {
      environment: this.environment(),
      source: 'TEST_FIXTURE',
      operations: rows.rows.map((row) => ({
        operation_id: row.operation_id,
        operation_kind: row.operation_kind,
        fixture_ref: row.fixture_ref,
        status: row.status,
        created_at: row.created_at,
      })),
      text_equivalent: '以下显示当前家庭的体验回执。它们不代表订单、权益、预约、活动资格、社区内容或家庭档案。',
    };
  }
}
