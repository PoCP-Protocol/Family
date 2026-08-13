/**
 * MM1-B1 · Azure Secret Reader tests
 */
import { describe, expect, it } from 'vitest';
import { readAzureSpeechCredential, safeCredentialDiagnostic, AZURE_CREDENTIAL_BLOCKER } from './secretReader';

describe('mm1-b1 · azure secret reader', () => {
  it('AZ-SR-01 · 完全缺失时 hasKey=false, hasRegion=false, namingSource=none', () => {
    const c = readAzureSpeechCredential({});
    expect(c.hasKey).toBe(false);
    expect(c.hasRegion).toBe(false);
    expect(c.namingSource).toBe('none');
    expect(c.subscriptionKey).toBeUndefined();
    expect(c.region).toBeUndefined();
  });

  it('AZ-SR-02 · FPAI_ 命名优先于 AZURE_', () => {
    const c = readAzureSpeechCredential({
      FPAI_AZURE_SPEECH_KEY: 'K-FPAI',
      AZURE_SPEECH_KEY: 'K-AZURE',
      FPAI_AZURE_SPEECH_REGION: 'r-fpai',
      AZURE_SPEECH_REGION: 'r-azure',
    });
    expect(c.subscriptionKey).toBe('K-FPAI');
    expect(c.region).toBe('r-fpai');
    expect(c.namingSource).toBe('fpai');
  });

  it('AZ-SR-03 · 仅 AZURE_ 时 fallback 到 azure 命名', () => {
    const c = readAzureSpeechCredential({
      AZURE_SPEECH_KEY: 'K',
      AZURE_SPEECH_REGION: 'eastasia',
    });
    expect(c.hasKey).toBe(true);
    expect(c.hasRegion).toBe(true);
    expect(c.namingSource).toBe('azure');
    expect(c.subscriptionKey).toBe('K');
    expect(c.region).toBe('eastasia');
  });

  it('AZ-SR-04 · 空字符串 / whitespace 视为无凭据', () => {
    const c = readAzureSpeechCredential({
      FPAI_AZURE_SPEECH_KEY: '   ',
      AZURE_SPEECH_KEY: '',
    });
    expect(c.hasKey).toBe(false);
  });

  it('AZ-SR-05 · safeCredentialDiagnostic 不泄露 key / region 值', () => {
    const c = readAzureSpeechCredential({
      FPAI_AZURE_SPEECH_KEY: 'SECRET-KEY-VALUE',
      FPAI_AZURE_SPEECH_REGION: 'eastasia',
    });
    const diag = safeCredentialDiagnostic(c);
    const s = JSON.stringify(diag);
    expect(s).not.toContain('SECRET-KEY-VALUE');
    expect(s).not.toContain('eastasia');
    expect(diag.hasKey).toBe(true);
    expect(diag.hasRegion).toBe(true);
    expect(diag.namingSource).toBe('fpai');
  });

  it('AZ-SR-06 · 只有 key 没 region 时 hasKey=true, hasRegion=false', () => {
    const c = readAzureSpeechCredential({ FPAI_AZURE_SPEECH_KEY: 'K' });
    expect(c.hasKey).toBe(true);
    expect(c.hasRegion).toBe(false);
  });

  it('AZ-SR-07 · Blocker constant 稳定', () => {
    expect(AZURE_CREDENTIAL_BLOCKER).toBe('BLOCKED_MISSING_CREDENTIAL');
  });
});
