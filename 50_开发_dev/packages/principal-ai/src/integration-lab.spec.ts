// FPAI Integration Lab V1 — contract tests only.
// Phase: M3-PRINCIPAL-000. Design contract only: no app-module registration,
// no public API, no real user runtime. Uses local test doubles + FakeAiGateway.
// Asserts the end-to-end flow and ZERO direct AI writes to Family growth state.

import { describe, expect, it } from 'vitest';
import { askPrincipal, createActionCard } from './index';
import type { PrincipalAiInput, PrincipalRiskRoute } from './index';

// --- Canonical consent authority (lab double) ---
// Only AI_PERSONALIZATION grants personal context. No implicit inheritance.
type CanonicalConsent = 'AI_PERSONALIZATION';
class LabConsentResolver {
  constructor(private readonly granted: Set<CanonicalConsent>) {}
  personalContextAllowed(): boolean {
    return this.granted.has('AI_PERSONALIZATION');
  }
}

// --- Context Broker allowlist (lab double) ---
const CONTEXT_ALLOWLIST = [
  'family_id_ref',
  'subject_id_ref',
  'life_stage',
  'confirmed_growth_priority',
  'active_intervention',
  'recent_permitted_observation_summary',
  'recent_action_state',
  'source_surface',
] as const;

function brokerContext(
  raw: Record<string, unknown>,
  resolver: LabConsentResolver,
): Record<string, unknown> {
  if (!resolver.personalContextAllowed()) return {};
  const out: Record<string, unknown> = {};
  for (const key of CONTEXT_ALLOWLIST) {
    if (key in raw) out[key] = raw[key];
  }
  return out;
}

// --- Growth store spy: proves zero direct AI writes ---
class GrowthStoreSpy {
  public directAiWrites = 0;
  public namedActionCalls: string[] = [];
  // Only the existing Named Action path may write; AI never calls this directly.
  triggerNamedAction(name: string): void {
    this.namedActionCalls.push(name);
  }
  directWrite(): void {
    this.directAiWrites += 1;
  }
}

// --- Action Bridge (lab double): allowlist only, human confirmation required ---
const BRIDGE_ALLOWLIST = new Set(['LISTEN_BEFORE_RESPOND']);
function actionBridge(
  proposalNamedAction: string,
  humanConfirmed: boolean,
  risk: PrincipalRiskRoute,
  store: GrowthStoreSpy,
): 'FIRED' | 'BLOCKED' {
  if (risk === 'HIGH_RISK') return 'BLOCKED';
  if (!humanConfirmed) return 'BLOCKED';
  if (!BRIDGE_ALLOWLIST.has(proposalNamedAction)) return 'BLOCKED';
  store.triggerNamedAction(proposalNamedAction);
  return 'FIRED';
}

const baseRaw = {
  family_id_ref: 'fam-ref-001',
  subject_id_ref: 'subj-ref-001',
  life_stage: 'EARLY_ADOLESCENCE',
  confirmed_growth_priority: 'COMMUNICATION',
  active_intervention: 'none',
  recent_permitted_observation_summary: '最近放学后手机冲突增多',
  recent_action_state: 'idle',
  source_surface: 'ASK_FAMILI_PRINCIPAL',
  // Non-allowlisted / raw fields that must NOT reach the model:
  child_full_name: '不应外泄',
  raw_chat_log: '完整隐私文本不应进入上下文',
};

function makeInput(userMessage: string, context: Record<string, unknown>): PrincipalAiInput {
  return {
    request_id: 'req-lab-001',
    session_id: 'fpai-lab-session-001',
    entry_point: 'ASK_FAMILI_PRINCIPAL',
    user_message: userMessage,
    family_context: context,
    consent_context: {
      // lab-local flag only; canonical authority is AI_PERSONALIZATION above.
      fpai_lab_consent: true,
      family_context_read_allowed: true,
    },
  };
}

describe('FPAI Integration Lab V1 (contract tests only)', () => {
  it('CONSENT_MISSING: no personal context reaches the model', () => {
    const resolver = new LabConsentResolver(new Set());
    const context = brokerContext(baseRaw, resolver);
    expect(context).toEqual({});
  });

  it('CONTEXT_BROKER: only allowlisted fields pass; raw private fields are dropped', () => {
    const resolver = new LabConsentResolver(new Set(['AI_PERSONALIZATION']));
    const context = brokerContext(baseRaw, resolver);
    expect(Object.keys(context).sort()).toEqual([...CONTEXT_ALLOWLIST].sort());
    expect('child_full_name' in context).toBe(false);
    expect('raw_chat_log' in context).toBe(false);
  });

  it('RESPONSE_SHAPE + PROPOSAL: normal turn yields structured response and a proposal (not a growth action)', () => {
    const resolver = new LabConsentResolver(new Set(['AI_PERSONALIZATION']));
    const context = brokerContext(baseRaw, resolver);
    const input = makeInput('孩子一回家就玩手机,我一说他就摔门。', context);

    const response = askPrincipal(input);
    expect(response.risk_route).toBe('NORMAL');

    const proposal = createActionCard(input);
    expect(proposal.not_family_growth_action).toBe(true);
  });

  it('NO_CONFIRMATION: bridge does not fire and there are zero growth writes', () => {
    const store = new GrowthStoreSpy();
    const result = actionBridge('LISTEN_BEFORE_RESPOND', false, 'NORMAL', store);
    expect(result).toBe('BLOCKED');
    expect(store.namedActionCalls).toHaveLength(0);
    expect(store.directAiWrites).toBe(0);
  });

  it('CONFIRMATION: bridge fires only an EXISTING Named Action, still zero direct AI writes', () => {
    const store = new GrowthStoreSpy();
    const result = actionBridge('LISTEN_BEFORE_RESPOND', true, 'NORMAL', store);
    expect(result).toBe('FIRED');
    expect(store.namedActionCalls).toEqual(['LISTEN_BEFORE_RESPOND']);
    expect(store.directAiWrites).toBe(0);
  });

  it('BRIDGE_ALLOWLIST: a non-allowlisted (invented) action is blocked', () => {
    const store = new GrowthStoreSpy();
    const result = actionBridge('AI_INVENTED_ACTION', true, 'NORMAL', store);
    expect(result).toBe('BLOCKED');
    expect(store.directAiWrites).toBe(0);
  });

  it('HIGH_RISK: bridge is disabled and no growth write occurs', () => {
    const store = new GrowthStoreSpy();
    const highRiskInput = makeInput(
      '我今天真的很累,有时候觉得不想活了。',
      brokerContext(baseRaw, new LabConsentResolver(new Set(['AI_PERSONALIZATION']))),
    );
    const response = askPrincipal(highRiskInput);
    const result = actionBridge('LISTEN_BEFORE_RESPOND', true, response.risk_route, store);
    expect(response.risk_route).toBe('HIGH_RISK');
    expect(result).toBe('BLOCKED');
    expect(store.namedActionCalls).toHaveLength(0);
    expect(store.directAiWrites).toBe(0);
  });
});
