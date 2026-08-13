/**
 * MM1-B1 · DevFallbackPolicy tests (§30)
 */
import { describe, expect, it } from 'vitest';
import { decideDevFallback } from './devFallbackPolicy';

describe('mm1-b1 · decideDevFallback', () => {
  it('DFP-01 · primary READY 不 fallback, telemetry NO', () => {
    const d = decideDevFallback({ primaryProviderId: 'stt.azure_speech_realtime', primaryHealth: 'READY', env: { FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } });
    expect(d.useFallback).toBe(false);
    expect(d.telemetry.FALLBACK_PROVIDER_USED).toBe('NO');
    expect(d.reason).toBe('PRIMARY_READY');
  });

  it('DFP-02 · DEGRADED 且 env 未开 → 不 fallback', () => {
    const d = decideDevFallback({ primaryProviderId: 'x', primaryHealth: 'DEGRADED', env: {} });
    expect(d.useFallback).toBe(false);
    expect(d.reason).toBe('FALLBACK_DISABLED_BY_ENV');
    expect(d.telemetry.FALLBACK_PROVIDER_USED).toBe('NO');
  });

  it('DFP-03 · DEGRADED 且 env=YES → fallback', () => {
    const d = decideDevFallback({ primaryProviderId: 'x', primaryHealth: 'DEGRADED', env: { FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } });
    expect(d.useFallback).toBe(true);
    expect(d.reason).toBe('FALLBACK_USED_DEGRADED');
    expect(d.telemetry.FALLBACK_PROVIDER_USED).toBe('YES');
  });

  it('DFP-04 · BLOCKED_MISSING_CREDENTIAL + env=YES → fallback', () => {
    const d = decideDevFallback({ primaryProviderId: 'x', primaryHealth: 'BLOCKED_MISSING_CREDENTIAL', env: { FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } });
    expect(d.useFallback).toBe(true);
    expect(d.reason).toBe('FALLBACK_USED_BLOCKED');
  });

  it('DFP-05 · BLOCKED_MISSING_CREDENTIAL + env 缺失 → 不 fallback (生产安全默认)', () => {
    const d = decideDevFallback({ primaryProviderId: 'x', primaryHealth: 'BLOCKED_MISSING_CREDENTIAL', env: {} });
    expect(d.useFallback).toBe(false);
    expect(d.reason).toBe('FALLBACK_DISABLED_BY_ENV');
  });

  it('DFP-06 · UNKNOWN + env=YES → fallback with UNKNOWN reason', () => {
    const d = decideDevFallback({ primaryProviderId: 'x', primaryHealth: 'UNKNOWN', env: { FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } });
    expect(d.useFallback).toBe(true);
    expect(d.reason).toBe('FALLBACK_USED_UNKNOWN');
  });

  it('DFP-07 · telemetry 不泄露 env / provider secret', () => {
    const d = decideDevFallback({ primaryProviderId: 'stt.azure_speech_realtime', primaryHealth: 'BLOCKED_MISSING_CREDENTIAL', env: { FPAI_AZURE_SPEECH_KEY: 'SECRET', FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } });
    const dump = JSON.stringify(d);
    expect(dump).not.toContain('SECRET');
  });
});
