import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrchestrationRepository } from '../orchestration.repository';
import type { FamilyLlmGatewayAuditRecord } from './family-llm.contract';

export interface PersistFamilyLlmAuditInput extends Omit<FamilyLlmGatewayAuditRecord, 'audit_id' | 'created_at'> {
  environment: 'DEV' | 'TEST';
  family_id: string;
  actor_person_id: string;
}

@Injectable()
export class AuditReplayService {
  constructor(@Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository) {}

  async record(input: PersistFamilyLlmAuditInput): Promise<FamilyLlmGatewayAuditRecord> {
    const auditId = randomUUID();
    const row = await this.repo.query<{
      audit_id: string;
      trace_id: string;
      use_case: FamilyLlmGatewayAuditRecord['use_case'];
      fixture_id: string;
      fixture_version: string;
      page_id: string;
      model_id: string | null;
      policy_version: string;
      schema_version: string;
      gateway_decision: FamilyLlmGatewayAuditRecord['gateway_decision'];
      input_block_reason: string | null;
      output_block_reason: string | null;
      allowed_state_upper_bound: FamilyLlmGatewayAuditRecord['allowed_state_upper_bound'];
      tool_names: FamilyLlmGatewayAuditRecord['tool_names'];
      created_at: Date;
    }>(
      `insert into family_llm_gateway_audits (
        audit_id, family_id, actor_person_id, trace_id, environment, use_case,
        fixture_id, fixture_version, page_id, model_id, policy_version, schema_version,
        gateway_decision, input_block_reason, output_block_reason, allowed_state_upper_bound, tool_names
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) returning audit_id, trace_id, use_case, fixture_id, fixture_version, page_id, model_id,
        policy_version, schema_version, gateway_decision, input_block_reason, output_block_reason,
        allowed_state_upper_bound, tool_names, created_at`,
      [
        auditId, input.family_id, input.actor_person_id, input.trace_id, input.environment, input.use_case,
        input.fixture_id, input.fixture_version, input.page_id, input.model, input.policy_version,
        input.schema_version, input.gateway_decision, input.input_block_reason, input.output_block_reason,
        input.allowed_state_upper_bound, input.tool_names,
      ],
    );
    const audit = row.rows[0];
    return {
      audit_id: audit.audit_id,
      trace_id: audit.trace_id,
      use_case: audit.use_case,
      fixture_id: audit.fixture_id,
      fixture_version: audit.fixture_version,
      page_id: audit.page_id,
      model: audit.model_id,
      policy_version: audit.policy_version,
      schema_version: audit.schema_version,
      gateway_decision: audit.gateway_decision,
      input_block_reason: audit.input_block_reason,
      output_block_reason: audit.output_block_reason,
      allowed_state_upper_bound: audit.allowed_state_upper_bound,
      tool_names: audit.tool_names ?? [],
      created_at: audit.created_at.toISOString(),
    };
  }

  /** Metadata-only replay: no API key, prompt, response text, or reasoning is stored or returned. */
  async replay(familyId: string, traceId: string): Promise<FamilyLlmGatewayAuditRecord[]> {
    const result = await this.repo.query<{
      audit_id: string;
      trace_id: string;
      use_case: FamilyLlmGatewayAuditRecord['use_case'];
      fixture_id: string;
      fixture_version: string;
      page_id: string;
      model_id: string | null;
      policy_version: string;
      schema_version: string;
      gateway_decision: FamilyLlmGatewayAuditRecord['gateway_decision'];
      input_block_reason: string | null;
      output_block_reason: string | null;
      allowed_state_upper_bound: FamilyLlmGatewayAuditRecord['allowed_state_upper_bound'];
      tool_names: FamilyLlmGatewayAuditRecord['tool_names'];
      created_at: Date;
    }>(
      `select audit_id, trace_id, use_case, fixture_id, fixture_version, page_id, model_id,
        policy_version, schema_version, gateway_decision, input_block_reason, output_block_reason,
        allowed_state_upper_bound, tool_names, created_at
       from family_llm_gateway_audits
       where family_id=$1 and trace_id=$2
       order by created_at asc`,
      [familyId, traceId],
    );
    return result.rows.map((row) => ({
      audit_id: row.audit_id,
      trace_id: row.trace_id,
      use_case: row.use_case,
      fixture_id: row.fixture_id,
      fixture_version: row.fixture_version,
      page_id: row.page_id,
      model: row.model_id,
      policy_version: row.policy_version,
      schema_version: row.schema_version,
      gateway_decision: row.gateway_decision,
      input_block_reason: row.input_block_reason,
      output_block_reason: row.output_block_reason,
      allowed_state_upper_bound: row.allowed_state_upper_bound,
      tool_names: row.tool_names ?? [],
      created_at: row.created_at.toISOString(),
    }));
  }
}
