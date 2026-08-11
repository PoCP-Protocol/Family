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

  async saveHandoff(sessionId: string, familyId: string, subjectRef: string, riskRoute: string, trigger: string): Promise<void> {
    await this.pool.query(
      `insert into principal_human_handoffs(session_id, family_id, subject_ref, risk_route, trigger_reason)
         values ($1,$2,$3,$4,$5)`,
      [sessionId, familyId, subjectRef, riskRoute, trigger],
    );
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
