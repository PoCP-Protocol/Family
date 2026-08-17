import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { OrchestrationRepository } from './orchestration.repository';
import { requireDevSyntheticTestLoop } from './test-env.policy';
import type {
  FamilyPageObjectActionDto,
  FamilyPageObjectActionResultDto,
  FamilyPageObjectProjectionDto,
  FamilyPageTaskItemDto,
  FamilyProfileSnapshotDto,
  FamilyServiceRecordDto,
  FamilySupportReportSnapshotDto,
} from './family-page-objects.contract';

interface JsonObject { [key: string]: unknown }

function objectArray(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((item): item is JsonObject => !!item && typeof item === 'object') : [];
}

function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

@Injectable()
export class FamilyPageObjectsService {
  constructor(@Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository) {}

  private environment(): 'DEV' | 'TEST' {
    return requireDevSyntheticTestLoop().environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  private async withIdempotency<T>(action: string, familyId: string, key: string | undefined, request: unknown, work: () => Promise<T>): Promise<T> {
    if (!key) return work();
    const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
    await this.repo.query(
      `insert into idempotency_keys(idempotency_key, action_name, request_hash)
       values ($1,$2,$3) on conflict (idempotency_key) do nothing`,
      [key, action, requestHash],
    );
    const row = (await this.repo.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
      `select action_name, request_hash, response_body from idempotency_keys where idempotency_key=$1`, [key],
    )).rows[0];
    if (!row || row.action_name !== action || row.request_hash !== requestHash) throw new ConflictException('idempotency_conflict');
    if (row.response_body) return row.response_body as T;
    const response = await work();
    await this.repo.query(`update idempotency_keys set response_code=200, response_body=$2::jsonb where idempotency_key=$1`, [key, JSON.stringify(response)]);
    return response;
  }

  async projection(familyId: string): Promise<FamilyPageObjectProjectionDto> {
    requireDevSyntheticTestLoop();
    const [profileRows, reportRows, taskRows, recordRows] = await Promise.all([
      this.repo.query<{ profile_snapshot_id: string; family_id: string; source: FamilyProfileSnapshotDto['source']; version: number; profile_payload: unknown; created_at: string; withdrawn_at: string | null }>(
        `select profile_snapshot_id, family_id, source, version, profile_payload, created_at, withdrawn_at
         from family_profile_snapshots where family_id=$1 and withdrawn_at is null
         order by version desc, created_at desc limit 1`, [familyId],
      ),
      this.repo.query<{ report_snapshot_id: string; family_id: string; intent_ref: string | null; source: FamilySupportReportSnapshotDto['source']; status: FamilySupportReportSnapshotDto['status']; evidence_refs: string[]; report_payload: unknown; created_at: string; withdrawn_at: string | null }>(
        `select report_snapshot_id, family_id, intent_ref, source, status, evidence_refs, report_payload, created_at, withdrawn_at
         from family_support_report_snapshots where family_id=$1 and withdrawn_at is null and status <> 'WITHDRAWN'
         order by created_at desc limit 20`, [familyId],
      ),
      this.repo.query<{ task_id: string; family_id: string; source_page_id: string; subject_person_id: string | null; plan_ref: string | null; source: FamilyPageTaskItemDto['source']; title: string; status: FamilyPageTaskItemDto['status']; task_payload: unknown; created_at: string; completed_at: string | null; cancelled_at: string | null }>(
        `select task_id, family_id, source_page_id, subject_person_id, plan_ref, source, title, status, task_payload, created_at, completed_at, cancelled_at
         from family_page_task_items where family_id=$1 and status <> 'CANCELLED'
         order by created_at desc limit 50`, [familyId],
      ),
      this.repo.query<{ service_record_id: string; family_id: string; case_ref: string | null; operation_ref: string | null; record_kind: string; source: FamilyServiceRecordDto['source']; status: FamilyServiceRecordDto['status']; occurred_at: string }>(
        `select service_record_id, family_id, case_ref, operation_ref, record_kind, source, status, occurred_at
         from family_service_records where family_id=$1 and status <> 'CANCELLED'
         order by occurred_at desc limit 50`, [familyId],
      ),
    ]);

    const profileRow = profileRows.rows[0];
    const profilePayload = (profileRow?.profile_payload && typeof profileRow.profile_payload === 'object') ? profileRow.profile_payload as JsonObject : {};
    const profile: FamilyProfileSnapshotDto | null = profileRow ? {
      profile_snapshot_id: profileRow.profile_snapshot_id,
      family_id: profileRow.family_id,
      source: profileRow.source,
      visibility: 'FAMILY_PRIVATE',
      version: profileRow.version,
      members: objectArray(profilePayload.members).map((member) => ({
        person_id: textValue(member.person_id),
        person_type: member.person_type === 'CHILD' ? 'CHILD' : 'PARENT',
        display_name: textValue(member.display_name, '家庭成员'),
        life_stage: typeof member.life_stage === 'string' ? member.life_stage : null,
      })),
      active_intent_refs: Array.isArray(profilePayload.active_intent_refs) ? profilePayload.active_intent_refs.filter((x): x is string => typeof x === 'string') : [],
      active_service_record_count: typeof profilePayload.active_service_record_count === 'number' ? profilePayload.active_service_record_count : 0,
      created_at: profileRow.created_at,
      withdrawn_at: profileRow.withdrawn_at,
    } : null;

    const reports: FamilySupportReportSnapshotDto[] = reportRows.rows.map((row) => {
      const payload = (row.report_payload && typeof row.report_payload === 'object') ? row.report_payload as JsonObject : {};
      const summary = objectArray(payload.support_summary).map((item) => ({ key: textValue(item.key), value: textValue(item.value), source: textValue(item.source, row.source) }));
      return {
        report_snapshot_id: row.report_snapshot_id,
        family_id: row.family_id,
        intent_ref: row.intent_ref,
        source: row.source,
        status: row.status,
        visibility: 'FAMILY_PRIVATE',
        evidence_refs: row.evidence_refs ?? [],
        support_summary: summary,
        created_at: row.created_at,
        withdrawn_at: row.withdrawn_at,
      };
    });

    const tasks: FamilyPageTaskItemDto[] = taskRows.rows.map((row) => {
      const payload = (row.task_payload && typeof row.task_payload === 'object') ? row.task_payload as JsonObject : {};
      return {
        task_id: row.task_id,
        family_id: row.family_id,
        source_page_id: row.source_page_id,
        subject_person_id: row.subject_person_id,
        plan_ref: row.plan_ref,
        source: row.source,
        title: row.title,
        status: row.status,
        duration_minutes: typeof payload.duration_minutes === 'number' ? payload.duration_minutes : null,
        text_equivalent: row.status === 'COMPLETED' ? '这项家庭行动已记录。' : '你可以现在完成、暂停，或稍后再继续。',
        created_at: row.created_at,
        completed_at: row.completed_at,
        cancelled_at: row.cancelled_at,
      };
    });

    const serviceRecords: FamilyServiceRecordDto[] = recordRows.rows.map((row) => ({
      service_record_id: row.service_record_id,
      family_id: row.family_id,
      case_ref: row.case_ref,
      operation_ref: row.operation_ref,
      record_kind: row.record_kind,
      source: row.source,
      status: row.status,
      visibility: 'FAMILY_PRIVATE',
      external_effect: false,
      occurred_at: row.occurred_at,
      text_equivalent: '这是一条家庭私有服务记录，不代表外部服务已经发生。',
    }));

    return {
      family_id: familyId,
      environment: this.environment(),
      source: profile?.source === 'TEST_FIXTURE' ? 'TEST_FIXTURE' : 'SERVICE_PROJECTION',
      profile,
      reports,
      tasks,
      service_records: serviceRecords,
      allowed_state_upper_bound: 'READ_ONLY_PRIVATE_FAMILY_OBJECTS',
      text_equivalent: '以下仅显示当前家庭的私有成长与服务记录。你可以返回、暂停或撤回。',
    };
  }

  async act(familyId: string, actorPersonId: string, dto: FamilyPageObjectActionDto, correlationId: string, idempotencyKey?: string): Promise<FamilyPageObjectActionResultDto> {
    requireDevSyntheticTestLoop();
    const allowed = new Set([
      'UI-09:COMPLETE_TASK', 'UI-09:PAUSE_TASK', 'UI-09:CANCEL_TASK',
      'UI-29:WITHDRAW_REPORT', 'UI-31:PAUSE_TASK', 'UI-34:CANCEL_TASK',
    ]);
    if (!dto?.page_id || !dto.action || !allowed.has(`${dto.page_id}:${dto.action}`)) throw new ForbiddenException('family_page_object_action_not_allowed');
    if (!dto.object_id) throw new BadRequestException('object_id_required');
    const consent = await this.repo.query<{ granted: number }>(
      `select 1 as granted from consents
       where family_id=$1 and purpose='SERVICE' and status='GRANTED' and withdrawn_at is null
       order by granted_at desc limit 1`,
      [familyId],
    );
    if ((consent.rowCount ?? 0) !== 1) throw new ForbiddenException('service_consent_required');
    return this.withIdempotency(`FamilyPageObject:${dto.action}`, familyId, idempotencyKey, { familyId, actorPersonId, dto }, async () => {
      if (dto.action === 'WITHDRAW_REPORT') {
        const updated = await this.repo.query<{ report_snapshot_id: string }>(
          `update family_support_report_snapshots set status='WITHDRAWN', withdrawn_at=now()
           where report_snapshot_id=$1 and family_id=$2 and status <> 'WITHDRAWN'
           returning report_snapshot_id`, [dto.object_id, familyId],
        );
        if ((updated.rowCount ?? 0) !== 1) throw new BadRequestException('report_not_withdrawable');
        return { object_id: dto.object_id, action: dto.action, status: 'WITHDRAWN', external_effect: false, allowed_state_upper_bound: 'PRIVATE_FAMILY_OBJECT_STATE', text_equivalent: '这条家庭私有记录已撤回。' };
      }
      const status = dto.action === 'COMPLETE_TASK' ? 'COMPLETED' : dto.action === 'PAUSE_TASK' ? 'PAUSED' : 'CANCELLED';
      const updated = await this.repo.query<{ task_id: string }>(
        `update family_page_task_items set status=$4::family_page_task_status, completed_at=case when $4='COMPLETED' then now() else completed_at end, cancelled_at=case when $4='CANCELLED' then now() else cancelled_at end
         where task_id=$1 and family_id=$2 and source_page_id=$3 and status in ('OPEN','PAUSED') returning task_id`, [dto.object_id, familyId, dto.page_id, status],
      );
      if ((updated.rowCount ?? 0) !== 1) throw new BadRequestException('task_not_actionable');
      return { object_id: dto.object_id, action: dto.action, status, external_effect: false, allowed_state_upper_bound: 'PRIVATE_FAMILY_OBJECT_STATE', text_equivalent: status === 'COMPLETED' ? '这项家庭行动已记录。' : status === 'PAUSED' ? '这项家庭行动已暂停，可以稍后继续。' : '这项家庭行动已取消。' };
    });
  }
}
