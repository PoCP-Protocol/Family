import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  getFamilyGrowthSurfaceArchitectureBinding,
  type FamilyBusinessLoop,
  type FamilyUiId,
} from '@family/contracts';
import { FamilyRepository } from './family.repository';
import { assertFamilyManagePermission } from './family-permission';

export interface DevFlowReceipt {
  event_id: string;
  family_id: string;
  ui_id: FamilyUiId;
  business_loop: FamilyBusinessLoop;
  command: string;
  event_state: 'DEV_CONFIRMED';
  data_source: 'SYNTHETIC_DEV_ONLY';
  external_effect: false;
  model_gateway_status: 'NOOP_NOT_INVOKED';
  replayed: boolean;
  /** Optional bounded synthetic DEV selection; it is a Perspective, not a fact or diagnosis. */
  selection?: string;
  created_at: string;
}

/**
 * DEV-only bridge for interactive UI scenarios. It deliberately persists a
 * traceable test receipt rather than an order, booking, entitlement, public
 * post, clinical/education outcome, or model-generated ontology update.
 */
@Injectable()
export class DevFlowReceiptService {
  constructor(@Inject(FamilyRepository) private readonly repository: FamilyRepository) {}

  async record(
    familyId: string,
    actorId: string,
    input: { ui_id: string; command: string; correlation_id: string; idempotency_key?: string; selection?: string },
  ): Promise<DevFlowReceipt> {
    const uiId = input.ui_id as FamilyUiId;
    let architecture;
    try {
      architecture = getFamilyGrowthSurfaceArchitectureBinding(uiId);
    } catch {
      throw new BadRequestException('unknown_dev_flow_ui');
    }
    if (!input.command?.trim() || !input.correlation_id?.trim()) {
      throw new BadRequestException('dev_flow_command_and_correlation_required');
    }
    if (input.selection && (!/^[A-Z0-9_]{3,64}$/.test(input.selection))) {
      throw new BadRequestException('invalid_dev_flow_selection');
    }

    return this.repository.withTransaction(async (client) => {
      const family = await client.query('select family_id from families where family_id=$1 for share', [familyId]);
      if ((family.rowCount ?? 0) !== 1) throw new NotFoundException('family_not_found');
      await assertFamilyManagePermission(client, familyId, actorId);
      const actorPerson = await client.query<{ person_id: string }>(
        `select person_id from persons where family_id = $1 and (person_id::text = $2 or account_id = $2) order by person_id limit 1`,
        [familyId, actorId],
      );
      const actorPersonId = actorPerson.rows[0]?.person_id || actorId;

      if (input.idempotency_key) {
        const replay = await client.query<DevFlowReceipt>(
          `select event_id, family_id, ui_id, business_loop, command, event_state,
                  data_source, external_effect, model_gateway_status, payload->>'selection' as selection, created_at
             from family_dev_flow_events
            where family_id=$1 and idempotency_key=$2
            for share`,
          [familyId, input.idempotency_key],
        );
        if (replay.rows[0]) return mapReceipt(replay.rows[0], true);
      }

      const result = await client.query<DevFlowReceipt>(
        `insert into family_dev_flow_events(
           family_id, actor_person_id, ui_id, business_loop, command, correlation_id, idempotency_key, payload
         ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         returning event_id, family_id, ui_id, business_loop, command, event_state,
                   data_source, external_effect, model_gateway_status, payload->>'selection' as selection, created_at`,
        [
          familyId,
          actorPersonId,
          uiId,
          architecture.loop,
          input.command.trim(),
          input.correlation_id.trim(),
          input.idempotency_key?.trim() || null,
          JSON.stringify({
            business_capability: architecture.business_capability,
            primary_objects: architecture.primary_objects,
            state_boundary: architecture.state_boundary,
            evidence_boundary: architecture.evidence_boundary,
            synthetic_only: true,
            ...(input.selection ? { selection: input.selection } : {}),
          }),
        ],
      );
      return mapReceipt(result.rows[0], false);
    });
  }

  async list(familyId: string, actorId: string): Promise<DevFlowReceipt[]> {
    return this.repository.withTransaction(async (client) => {
      const family = await client.query('select family_id from families where family_id=$1 for share', [familyId]);
      if ((family.rowCount ?? 0) !== 1) throw new NotFoundException('family_not_found');
      await assertFamilyManagePermission(client, familyId, actorId);
      const rows = await client.query<DevFlowReceipt>(
        `select event_id, family_id, ui_id, business_loop, command, event_state,
                data_source, external_effect, model_gateway_status, payload->>'selection' as selection, created_at
           from family_dev_flow_events
          where family_id=$1
          order by created_at desc, event_id desc`,
        [familyId],
      );
      return rows.rows.map((row) => mapReceipt(row, false));
    });
  }
}

function mapReceipt(row: Omit<DevFlowReceipt, 'replayed'>, replayed: boolean): DevFlowReceipt {
  return {
    ...row,
    ui_id: row.ui_id as FamilyUiId,
    business_loop: row.business_loop as FamilyBusinessLoop,
    event_state: 'DEV_CONFIRMED',
    data_source: 'SYNTHETIC_DEV_ONLY',
    external_effect: false,
    model_gateway_status: 'NOOP_NOT_INVOKED',
    replayed,
  };
}
