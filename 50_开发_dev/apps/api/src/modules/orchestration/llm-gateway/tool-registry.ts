import type { FamilyLlmSnapshot, FamilyLlmToolName, FamilyLlmToolProposal } from './family-llm.contract';

export class FamilyLlmToolBlockedError extends Error {
  constructor(readonly code: 'LLM_TOOL_NOT_ALLOWED' | 'LLM_TOOL_NOT_SUPPORTED_ON_PAGE' | 'LLM_TOOL_ARGUMENT_INVALID' | 'LLM_TOOL_FIXTURE_REFERENCE_INVALID') {
    super(code);
    this.name = 'FamilyLlmToolBlockedError';
  }
}

export interface ValidatedFamilyLlmToolProposal {
  name: FamilyLlmToolName;
  arguments: Readonly<Record<string, string | boolean>>;
  /** This is a request only. Domain services must still authorize and execute it. */
  execution_mode: 'DOMAIN_ACTION_REQUIRED';
}

const TOOL_TO_ACTION: Record<FamilyLlmToolName, FamilyLlmSnapshot['supported_actions'][number] | null> = {
  read_fixture_state: null,
  propose_return_or_pause: null,
  propose_no_action: 'NO_ACTION',
  propose_select_option: 'SELECT_OPTION',
  propose_task_toggle: 'TOGGLE_TASK',
  propose_mock_invite_or_group: null,
  propose_mock_booking_or_event: null,
  propose_fixed_post_receipt: 'PUBLISH_TEMPLATE',
};

function hasOnlyKeys(value: Record<string, string | boolean>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
}

export class FamilyLlmToolRegistry {
  validate(snapshot: FamilyLlmSnapshot, proposal: FamilyLlmToolProposal): ValidatedFamilyLlmToolProposal {
    const expectedAction = TOOL_TO_ACTION[proposal.name];
    if (expectedAction && !snapshot.supported_actions.includes(expectedAction)) {
      throw new FamilyLlmToolBlockedError('LLM_TOOL_NOT_SUPPORTED_ON_PAGE');
    }

    const args = proposal.arguments ?? {};
    if (proposal.name === 'read_fixture_state' || proposal.name === 'propose_no_action') {
      if (Object.keys(args).length !== 0) throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
    }

    if (proposal.name === 'propose_return_or_pause') {
      if (!hasOnlyKeys(args, ['action']) || (args.action !== 'RETURN' && args.action !== 'PAUSE')) {
        throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
      }
      if (args.action === 'RETURN' && !snapshot.supported_actions.includes('RETURN')) throw new FamilyLlmToolBlockedError('LLM_TOOL_NOT_SUPPORTED_ON_PAGE');
      if (args.action === 'PAUSE' && !snapshot.supported_actions.includes('PAUSE')) throw new FamilyLlmToolBlockedError('LLM_TOOL_NOT_SUPPORTED_ON_PAGE');
    }

    if (proposal.name === 'propose_select_option') {
      if (!hasOnlyKeys(args, ['option']) || !isNonEmptyString(args.option)) throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
    }

    if (proposal.name === 'propose_task_toggle') {
      if (!hasOnlyKeys(args, ['task_id', 'completed']) || !isNonEmptyString(args.task_id) || typeof args.completed !== 'boolean') {
        throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
      }
    }

    if (proposal.name === 'propose_mock_invite_or_group') {
      if (!hasOnlyKeys(args, ['kind', 'fixture_id']) || (args.kind !== 'INVITE' && args.kind !== 'GROUP') || !isNonEmptyString(args.fixture_id)) {
        throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
      }
    }

    if (proposal.name === 'propose_mock_booking_or_event') {
      if (!hasOnlyKeys(args, ['kind', 'fixture_id']) || (args.kind !== 'BOOKING' && args.kind !== 'EVENT') || !isNonEmptyString(args.fixture_id)) {
        throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
      }
    }

    if (proposal.name === 'propose_fixed_post_receipt') {
      if (!hasOnlyKeys(args, ['template_id']) || !isNonEmptyString(args.template_id)) {
        throw new FamilyLlmToolBlockedError('LLM_TOOL_ARGUMENT_INVALID');
      }
    }

    return Object.freeze({
      name: proposal.name,
      arguments: Object.freeze({ ...args }),
      execution_mode: 'DOMAIN_ACTION_REQUIRED',
    });
  }
}
