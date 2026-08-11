import { describe, it, expect } from 'vitest';
import { AnthropicAiGateway, createAiGatewayFromEnv, FakeAiGateway, type AiGatewayModelConfig } from './index';

const cfg = (timeoutMs = 5000): AiGatewayModelConfig => ({
  baseUrl: 'http://127.0.0.1:15722', apiKey: 't-secret', model: 'claude-opus-4-8', timeoutMs,
});
const req = (images?: Array<{ media_type: string; data: string }>) => ({
  use_case: 'test', prompt_version: 'p1', schema_version: 's1', input: { q: 'x' }, output_schema: {},
  input_refs: [], images,
  policy_context: { human_confirmation_required: true as const, may_mutate_business_state: false as const },
});
const okResp = (text: string) => ({
  ok: true, status: 200, statusText: 'OK',
  json: async () => ({ model: 'claude-opus-4-8', content: [{ type: 'text', text }] }),
});

describe('AnthropicAiGateway (cc switch multimodal)', () => {
  it('hits /v1/messages with x-api-key + anthropic-version, parses JSON text', async () => {
    let capturedUrl = ''; let capturedHeaders: Record<string, string> = {};
    const gw = new AnthropicAiGateway(cfg(), async (url, init) => {
      capturedUrl = url; capturedHeaders = init.headers;
      return okResp('{"say":"hi"}');
    });
    const r = await gw.generateStructured(req());
    expect(capturedUrl).toBe('http://127.0.0.1:15722/v1/messages');
    expect(capturedHeaders['x-api-key']).toBe('t-secret');
    expect(capturedHeaders['anthropic-version']).toBe('2023-06-01');
    expect(r.output).toEqual({ say: 'hi' });
    expect(r.metadata?.model_provider).toBe('anthropic-compatible');
  });

  it('sends image content block for multimodal input', async () => {
    let body: any = {};
    const gw = new AnthropicAiGateway(cfg(), async (_url, init) => {
      body = JSON.parse(init.body); return okResp('{"color":"magenta"}');
    });
    await gw.generateStructured(req([{ media_type: 'image/png', data: 'BASE64DATA' }]));
    const blocks = body.messages[0].content;
    const image = blocks.find((b: any) => b.type === 'image');
    expect(image).toBeTruthy();
    expect(image.source).toEqual({ type: 'base64', media_type: 'image/png', data: 'BASE64DATA' });
    expect(blocks.some((b: any) => b.type === 'text')).toBe(true);
  });

  it('strips ```json markdown fences before parsing (real models sometimes fence despite instructions)', async () => {
    const gw = new AnthropicAiGateway(cfg(), async () => okResp('```json\n{"say":"fenced"}\n```'));
    const r = await gw.generateStructured(req());
    expect(r.output).toEqual({ say: 'fenced' });
  });

  it('TIMEOUT on hung fetch', async () => {
    const gw = new AnthropicAiGateway(cfg(20), () => new Promise(() => {}) as never);
    await expect(gw.generateStructured(req())).rejects.toMatchObject({ kind: 'TIMEOUT' });
  });

  it('PROVIDER_4XX / PROVIDER_5XX', async () => {
    const gw4 = new AnthropicAiGateway(cfg(), async () => ({ ok: false, status: 403, statusText: 'F', json: async () => ({}) }));
    await expect(gw4.generateStructured(req())).rejects.toMatchObject({ kind: 'PROVIDER_4XX', status: 403 });
    const gw5 = new AnthropicAiGateway(cfg(), async () => ({ ok: false, status: 502, statusText: 'B', json: async () => ({}) }));
    await expect(gw5.generateStructured(req())).rejects.toMatchObject({ kind: 'PROVIDER_5XX', status: 502 });
  });

  it('INVALID_JSON: non-JSON text never returned raw', async () => {
    const gw = new AnthropicAiGateway(cfg(), async () => okResp('sorry, here is the answer...'));
    await expect(gw.generateStructured(req())).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });

  it('INVALID_JSON: no text content', async () => {
    const gw = new AnthropicAiGateway(cfg(), async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ content: [] }) }));
    await expect(gw.generateStructured(req())).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });
});

describe('createAiGatewayFromEnv factory', () => {
  it('Anthropic env → AnthropicAiGateway', () => {
    const gw = createAiGatewayFromEnv({ ANTHROPIC_BASE_URL: 'http://127.0.0.1:15722', ANTHROPIC_AUTH_TOKEN: 'x' });
    expect(gw).toBeInstanceOf(AnthropicAiGateway);
  });
  it('no provider env → FakeAiGateway', () => {
    expect(createAiGatewayFromEnv({})).toBeInstanceOf(FakeAiGateway);
  });
});
