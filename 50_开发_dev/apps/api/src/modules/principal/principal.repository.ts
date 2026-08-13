import { Injectable } from '@nestjs/common';
import pg from 'pg';
import type { CanonicalConsentRow } from '@family/principal-runtime';

const { Pool } = pg;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PrincipalProposalRow {
  proposal_id: string;
  family_id: string;
  session_id: string;
  subject_ref: string;
  recommended_intervention_id: string;
  risk_route: string;
  status: string;
  canonical: boolean;
  accepted_episode_id: string | null;
}

/** Principal 域持久化(L3;principal_* + product_events,隔离于 Family/Growth canonical)。 */
@Injectable()
export class PrincipalRepository {
  private readonly pool: pg.Pool;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({ connectionString });
  }

  async createSession(familyId: string, subjectRef: string, actorId: string): Promise<{ session_id: string }> {
    const r = await this.pool.query(
      `insert into principal_sessions(family_id, subject_ref, actor_id) values ($1,$2,$3) returning session_id`,
      [familyId, subjectRef, actorId],
    );
    return r.rows[0];
  }

  async sessionBelongsToFamily(sessionId: string, familyId: string): Promise<boolean> {
    const r = await this.pool.query(
      `select 1 from principal_sessions where session_id=$1 and family_id=$2`,
      [sessionId, familyId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async loadConsents(familyId: string, subjectRef: string): Promise<CanonicalConsentRow[]> {
    // consents.subject_person_id 是 uuid FK。subject_ref 是 Principal 会话层的自由引用,
    // 非 person-uuid 时无 canonical consent 可解析 —— fail closed 返回空(→ consent.allowed=false,不注入 Family context)。
    if (!UUID_RE.test(subjectRef)) return [];
    const r = await this.pool.query(
      `select subject_person_id, guardian_person_id, purpose, status, policy_version
         from consents where family_id=$1 and subject_person_id=$2`,
      [familyId, subjectRef],
    );
    return r.rows as CanonicalConsentRow[];
  }

  /**
   * W2R-101 对象化上下文:从真实 Growth read model 取【最小 allowlist】slice(仅 canonical FACT/状态,
   * 不含私有文本/全量 perspectives/AI_INFERENCE)。供 buildPrincipalFamilyContext 构造 PrincipalFamilyContextV1。
   * subjectRef 须为 person uuid(consent 允许时才调用)。
   */
  async loadFamilyContextSlice(familyId: string, subjectRef: string): Promise<{
    familyRef: string; subjectRef: string; lifeStage: string;
    confirmedGrowthPriority: string[]; activeIntervention: string[];
    recentGrowthActionState: string[]; recentPermittedObservationSummary: string[];
  }> {
    const ls = await this.pool.query<{ life_stage_code: string }>(
      `select life_stage_code from life_stage_assignments where family_id=$1 and child_id=$2 order by effective_from desc limit 1`,
      [familyId, subjectRef],
    );
    const pr = await this.pool.query<{ dimension_id: string }>(
      `select dimension_id from growth_priorities where family_id=$1 and status='ACTIVE' order by created_at desc limit 5`,
      [familyId],
    );
    const iv = await this.pool.query<{ intervention_code: string }>(
      `select intervention_code from intervention_episodes where family_id=$1 and status='ACTIVE' order by created_at desc limit 5`,
      [familyId],
    );
    const ga = await this.pool.query<{ status: string }>(
      `select status from growth_actions where family_id=$1 order by created_at desc limit 7`,
      [familyId],
    );
    return {
      familyRef: familyId, subjectRef, lifeStage: ls.rows[0]?.life_stage_code ?? 'UNKNOWN',
      confirmedGrowthPriority: pr.rows.map((x) => x.dimension_id),
      activeIntervention: iv.rows.map((x) => x.intervention_code),
      recentGrowthActionState: ga.rows.map((x) => x.status),
      recentPermittedObservationSummary: [], // 最小必要:观察摘要暂不外露(敏感);allowlist 空
    };
  }

  async addMessage(sessionId: string, familyId: string, sender: string, body: string, correlationId: string): Promise<void> {
    await this.pool.query(
      `insert into principal_messages(session_id, family_id, sender, body, correlation_id) values ($1,$2,$3,$4,$5)`,
      [sessionId, familyId, sender, body, correlationId],
    );
  }

  async saveResponse(sessionId: string, familyId: string, riskRoute: string, schemaValid: boolean, output: unknown): Promise<{ response_id: string }> {
    const r = await this.pool.query(
      `insert into principal_responses(session_id, family_id, risk_route, schema_valid, output)
         values ($1,$2,$3,$4,$5) returning response_id`,
      [sessionId, familyId, riskRoute, schemaValid, JSON.stringify(output)],
    );
    return r.rows[0];
  }

  async saveModelRun(run: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `insert into principal_model_runs
        (request_id, session_id, family_id_ref, model_provider, model_name, prompt_version, soul_version, soul_hash,
         scenario_id, method_refs, source_refs, input_hash, output_hash, risk_route, schema_validation, latency_ms)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [run.request_id, run.session_id, run.family_id_ref, run.model_provider, run.model_name, run.prompt_version,
        run.soul_version, run.soul_hash, run.scenario_id, JSON.stringify(run.method_refs ?? []),
        JSON.stringify(run.source_refs ?? []), run.input_hash, run.output_hash, run.risk_route,
        run.schema_validation, run.latency_ms],
    );
  }

  async saveProposal(p: Record<string, unknown>): Promise<{ proposal_id: string }> {
    const r = await this.pool.query(
      `insert into principal_action_proposals
        (response_id, session_id, family_id, subject_ref, proposal_type, recommended_intervention_id,
         display_title, display_instruction, rationale, risk_route)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning proposal_id`,
      [p.response_id, p.session_id, p.family_id, p.subject_ref, p.proposal_type, p.recommended_intervention_id,
        p.display_title, p.display_instruction, p.rationale, p.risk_route],
    );
    return r.rows[0];
  }

  async loadProposal(proposalId: string): Promise<PrincipalProposalRow | null> {
    const r = await this.pool.query<PrincipalProposalRow>(
      `select proposal_id, family_id, session_id, subject_ref, recommended_intervention_id,
              risk_route, status, canonical, accepted_episode_id
         from principal_action_proposals where proposal_id=$1`,
      [proposalId],
    );
    return r.rows[0] ?? null;
  }

  async markProposalAccepted(proposalId: string, episodeId: string, actorId: string): Promise<void> {
    await this.pool.query(
      `update principal_action_proposals
          set status='ACCEPTED', accepted_episode_id=$2, accepted_by_actor_id=$3, accepted_at=now()
        where proposal_id=$1`,
      [proposalId, episodeId, actorId],
    );
  }

  // W2R-105:responseId 挂 REVIEW 扣留的候选响应(HIGH_RISK 无响应 → null)。
  async saveHandoff(sessionId: string, familyId: string, subjectRef: string, riskRoute: string, trigger: string, assignedRole: string | null = null, responseId: string | null = null): Promise<void> {
    await this.pool.query(
      `insert into principal_human_handoffs(session_id, family_id, subject_ref, risk_route, trigger_reason, assigned_role, response_id)
         values ($1,$2,$3,$4,$5,$6,$7)`,
      [sessionId, familyId, subjectRef, riskRoute, trigger, assignedRole, responseId],
    );
  }

  async listOpenHandoffs(familyId: string): Promise<Array<Record<string, unknown>>> {
    const r = await this.pool.query(
      `select handoff_id, session_id, subject_ref, risk_route, trigger_reason, assigned_role, status, response_id, created_at
         from principal_human_handoffs where family_id=$1 and status='OPEN' order by created_at desc`,
      [familyId],
    );
    return r.rows;
  }

  async resolveHandoff(handoffId: string, familyId: string, actorId: string, resolution: string, note: string | null): Promise<boolean> {
    const r = await this.pool.query(
      `update principal_human_handoffs
          set status='RESOLVED', resolution=$3, resolution_note=$4, resolved_by_actor_id=$5, resolved_at=now()
        where handoff_id=$1 and family_id=$2 and status='OPEN'`,
      [handoffId, familyId, resolution, note, actorId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  // W2R-105 Human Confirmation 闭环:读 handoff(含扣留响应指针)、读候选响应、标记释放。
  async loadHandoff(handoffId: string, familyId: string): Promise<{ handoff_id: string; family_id: string; status: string; resolution: string | null; response_id: string | null; released_at: Date | null } | null> {
    const r = await this.pool.query(
      `select handoff_id, family_id, status, resolution, response_id, released_at
         from principal_human_handoffs where handoff_id=$1 and family_id=$2`,
      [handoffId, familyId],
    );
    return r.rows[0] ?? null;
  }

  async loadResponse(responseId: string, familyId: string): Promise<{ response_id: string; risk_route: string; output: unknown } | null> {
    const r = await this.pool.query(
      `select response_id, risk_route, output from principal_responses where response_id=$1 and family_id=$2`,
      [responseId, familyId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return { response_id: row.response_id, risk_route: row.risk_route, output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output };
  }

  // 仅对【已 APPROVED 且未释放】的 handoff 打释放戳,幂等(重复调用不二次释放)。返回是否本次真正释放。
  async markHandoffReleased(handoffId: string, familyId: string, responseId: string): Promise<boolean> {
    const r = await this.pool.query(
      `update principal_human_handoffs
          set released_at=now()
        where handoff_id=$1 and family_id=$2 and response_id=$3
          and resolution='APPROVED' and released_at is null`,
      [handoffId, familyId, responseId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  // ---------- B1 Attempt 账本(实现 AttemptSink) ----------
  async begin(ctx: { provider: string; requestId?: string; sessionId?: string; failoverSequence: number }): Promise<string | undefined> {
    const r = await this.pool.query<{ attempt_id: string }>(
      `insert into principal_model_attempts(request_id, session_id, provider, failover_sequence, status)
         values ($1,$2,$3,$4,'STARTED') returning attempt_id`,
      [ctx.requestId ?? 'unknown', ctx.sessionId ?? null, ctx.provider, ctx.failoverSequence],
    );
    return r.rows[0]?.attempt_id;
  }

  async finish(attemptId: string | undefined, res: { status: string; latencyMs: number; failureKind?: string; modelName?: string }): Promise<void> {
    if (!attemptId) return;
    await this.pool.query(
      `update principal_model_attempts
          set status=$2, latency_ms=$3, failure_kind=$4, model_name=$5, finished_at=now()
        where attempt_id=$1`,
      [attemptId, res.status, res.latencyMs, res.failureKind ?? null, res.modelName ?? null],
    );
  }

  /** B2 配额:今日该 family 的真实 provider ATTEMPT 数(含失败/failover;经 session 关联 family)。 */
  async countRealAttemptsToday(familyId: string): Promise<number> {
    const r = await this.pool.query<{ n: string }>(
      `select count(*)::int as n
         from principal_model_attempts a
         join principal_sessions s on s.session_id = a.session_id
        where s.family_id=$1 and a.created_at >= date_trunc('day', now())`,
      [familyId],
    );
    return Number(r.rows[0]?.n ?? 0);
  }

  /** B2 usage 明细(今日,按 family)。 */
  async attemptUsageToday(familyId: string): Promise<{ attempts: number; successes: number; failures: number; failovers: number; logical_runs: number }> {
    const r = await this.pool.query<{ attempts: string; successes: string; failures: string; failovers: string; runs: string }>(
      `select
         count(*)::int as attempts,
         count(*) filter (where a.status='SUCCESS')::int as successes,
         count(*) filter (where a.status='FAILURE')::int as failures,
         count(*) filter (where a.failover_sequence > 0)::int as failovers,
         count(distinct a.request_id)::int as runs
       from principal_model_attempts a
       join principal_sessions s on s.session_id = a.session_id
      where s.family_id=$1 and a.created_at >= date_trunc('day', now())`,
      [familyId],
    );
    const row = r.rows[0];
    return {
      attempts: Number(row?.attempts ?? 0), successes: Number(row?.successes ?? 0),
      failures: Number(row?.failures ?? 0), failovers: Number(row?.failovers ?? 0),
      logical_runs: Number(row?.runs ?? 0),
    };
  }

  /** (保留)基于成功 Run 的旧口径,供对照/回归。 */
  async countRealModelRunsToday(familyId: string): Promise<number> {
    const r = await this.pool.query<{ n: string }>(
      `select count(*)::int as n from principal_model_runs
        where family_id_ref=$1 and model_provider not in ('fake','deterministic-fallback')
          and created_at >= date_trunc('day', now())`,
      [familyId],
    );
    return Number(r.rows[0]?.n ?? 0);
  }

  async recordProductEvent(eventName: string, familyId: string | null, sessionId: string | null, correlationId: string, payload: unknown = {}): Promise<void> {
    await this.pool.query(
      `insert into product_events(event_name, family_id, session_id, correlation_id, payload) values ($1,$2,$3,$4,$5)`,
      [eventName, familyId, sessionId, correlationId, JSON.stringify(payload)],
    );
  }

  async saveFeedback(responseId: string, familyId: string, actorId: string, rating: string | null, note: string | null): Promise<void> {
    await this.pool.query(
      `insert into principal_feedback(response_id, family_id, actor_id, rating, note) values ($1,$2,$3,$4,$5)`,
      [responseId, familyId, actorId, rating, note],
    );
  }

  async getSessionAggregate(familyId: string, sessionId: string): Promise<Record<string, unknown> | null> {
    const s = await this.pool.query(`select * from principal_sessions where session_id=$1 and family_id=$2`, [sessionId, familyId]);
    if ((s.rowCount ?? 0) === 0) return null;
    const messages = await this.pool.query(`select message_id, sender, body, created_at from principal_messages where session_id=$1 order by created_at`, [sessionId]);
    const responses = await this.pool.query(`select response_id, risk_route, schema_valid, output, created_at from principal_responses where session_id=$1 order by created_at`, [sessionId]);
    return { session: s.rows[0], messages: messages.rows, responses: responses.rows };
  }
}
