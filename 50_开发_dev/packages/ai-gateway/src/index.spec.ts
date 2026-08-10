import { describe, it, expect } from 'vitest';
import { OpenAICompatibleAiGateway, AiGatewayError, type AiGatewayModelConfig } from './index';

const cfg = (timeoutMs = 5000): AiGatewayModelConfig => ({
  baseUrl: 'http://provider.local', apiKey: 'k', model: 'm', timeoutMs,
});
const req = {
  use_case: 'test', prompt_version: 'p1', schema_version: 's1', input: { a: 1 }, output_schema: {},
  input_refs: [], policy_context: { human_confirmation_required: true as const, may_mutate_business_state: false as const },
};
const okResp = (content: string) => ({
  ok: true, status: 200, statusText: 'OK',
  json: async () => ({ model: 'm', choices: [{ message: { content } }] }),
});

describe('A5 gateway hardening', () => {
  it('success path returns parsed structured output', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => okResp('{"say":"hi"}'));
    const r = await gw.generateStructured(req);
    expect(r.output).toEqual({ say: 'hi' });
    expect(r.metadata?.model_provider).toBe('openai-compatible');
  });

  it('TIMEOUT: hung fetch aborts within timeoutMs', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(20), () => new Promise(() => {}) as never);
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'TIMEOUT' });
  });

  it('PROVIDER_4XX', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => ({ ok: false, status: 404, statusText: 'NF', json: async () => ({}) }));
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'PROVIDER_4XX', status: 404 });
  });

  it('PROVIDER_5XX', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => ({ ok: false, status: 503, statusText: 'SU', json: async () => ({}) }));
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'PROVIDER_5XX', status: 503 });
  });

  it('NETWORK_ERROR on fetch rejection', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => { throw new Error('econnrefused'); });
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'NETWORK_ERROR' });
  });

  it('INVALID_JSON: model content not valid JSON, never returns raw text', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => okResp('not-json-raw-text'));
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });

  it('INVALID_JSON: no message content', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ choices: [] }) }));
    await expect(gw.generateStructured(req)).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });

  it('errors are AiGatewayError (业务层不直接接收 provider 异常)', async () => {
    const gw = new OpenAICompatibleAiGateway(cfg(), async () => { throw new Error('x'); });
    await gw.generateStructured(req).catch((e) => expect(e).toBeInstanceOf(AiGatewayError));
  });
});
