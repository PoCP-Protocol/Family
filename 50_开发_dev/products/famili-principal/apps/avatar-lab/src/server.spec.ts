import { describe, expect, it } from 'vitest';
import { buildPrincipalOutput, classifyRiskRoute, shouldDropEvent } from './runtime';

describe('avatar lab runtime rules', () => {
  it('routes high-risk prompts to the human gate', () => {
    expect(classifyRiskRoute('我想伤害我自己')).toBe('HIGH_RISK');
    expect(classifyRiskRoute('我儿子每天回来就玩手机')).toBe('NORMAL');
  });

  it('drops stale events after a new turn takes over', () => {
    expect(shouldDropEvent('turn-1', 'turn-2', 1, 2)).toBe(true);
    expect(shouldDropEvent('turn-2', 'turn-2', 2, 2)).toBe(false);
  });

  it('builds a principal output with the session context', () => {
    const output = buildPrincipalOutput('turn-42', '我儿子每天回来就玩手机', 'NORMAL', 'session-1');
    expect(output.turn_id).toBe('turn-42');
    expect(output.session_id).toBe('session-1');
    expect(output.risk_route).toBe('NORMAL');
    expect(output.response_text).toContain('手机');
  });
});
