import { describe, expect, it, vi } from 'vitest';
import { MultimodalService } from './multimodal.service';
import { validateMultimodalOutput } from './multimodal.contract';

describe('MultimodalService', () => {
  const input = {
    pageId: 'growth-checkup',
    assetRef: 'fixture:guardian-note-001',
    purpose: 'MATERIAL_STRUCTURE_ASSIST' as const,
    idempotencyKey: 'mm-idem-001',
  };

  it('fails closed when context is unavailable', async () => {
    const policy = {
      resolveContext: vi.fn().mockResolvedValue(null),
      recordBlocked: vi.fn().mockResolvedValue(undefined),
    };
    const runtime = { run: vi.fn() };
    const response = await new MultimodalService(policy, runtime).assist(input);
    expect(response.status).toBe('UNAVAILABLE');
    expect(policy.recordBlocked).toHaveBeenCalledWith(input, 'MULTIMODAL_CONTEXT_UNAVAILABLE');
    expect(runtime.run).not.toHaveBeenCalled();
  });

  it('returns a private derived draft and never writes a core fact', async () => {
    const policy = {
      resolveContext: vi.fn().mockResolvedValue({
        tenantPolicyVersion: 'tenant-policy-1',
        pageId: input.pageId,
        purpose: input.purpose,
        modality: 'DOCUMENT' as const,
        capabilityRef: 'fixture-ocr',
        policyRef: 'fixture-material-assist',
        outputSchemaRef: 'fixture-derived-draft',
        consentStatus: 'GRANTED' as const,
        allowedStateUpperBound: 'DERIVED_DRAFT_PRIVATE' as const,
        externalEffect: 'NONE' as const,
        familyFacts: [],
      }),
      recordBlocked: vi.fn(),
    };
    const runtime = { run: vi.fn().mockResolvedValue({ artifactRef: 'artifact-001', textEquivalent: '已形成可供你确认的文字草稿。' }) };
    const response = await new MultimodalService(policy, runtime).assist(input);
    expect(response).toEqual({ status: 'DERIVED_DRAFT_PRIVATE', artifactRef: 'artifact-001', textEquivalent: '已形成可供你确认的文字草稿。' });
    expect(runtime.run).toHaveBeenCalledTimes(1);
  });

  it('blocks disallowed pages before runtime', async () => {
    const policy = { resolveContext: vi.fn(), recordBlocked: vi.fn().mockResolvedValue(undefined) };
    const runtime = { run: vi.fn() };
    const response = await new MultimodalService(policy, runtime).assist({ ...input, pageId: 'community-public' });
    expect(response.status).toBe('BLOCKED');
    expect(response.blockCode).toBe('MULTIMODAL_PAGE_NOT_ALLOWED');
    expect(runtime.run).not.toHaveBeenCalled();
  });

  it('rejects output that exceeds the private draft state or has external effects', () => {
    expect(() => validateMultimodalOutput({ stateUpperBound: 'Need', externalEffect: 'NONE' })).toThrow('MULTIMODAL_STATE_UPPER_BOUND_EXCEEDED');
    expect(() => validateMultimodalOutput({ stateUpperBound: 'DERIVED_DRAFT_PRIVATE', externalEffect: 'PAYMENT' })).toThrow('MULTIMODAL_EXTERNAL_EFFECT_FORBIDDEN');
    expect(() => validateMultimodalOutput({ stateUpperBound: 'DERIVED_DRAFT_PRIVATE', externalEffect: 'NONE', writeBackTarget: 'Diagnosis' })).toThrow('MULTIMODAL_FORBIDDEN_WRITE_BACK');
  });
});
