import { describe, it, expect } from 'vitest';
import { ZhipuAiGateway, createZhipuAiGatewayFromEnv, createAiGatewayFromEnv, type AiGatewayModelConfig } from './index';

const cfg = (timeoutMs = 5000): AiGatewayModelConfig => ({
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: 'id.secret', model: 'glm-4v-plus', timeoutMs,
});
const req = (images?: Array<{ media_type: string; data: string }>) => ({
  use_case: 'test', prompt_version: 'p1', schema_version: 's1', input: { q: 'x' }, output_schema: {},
  input_refs: [], images,
  policy_context: { human_confirmation_required: true as const, may_mutate_business_state: false as const },
});
const okResp = (content: string) => ({
  ok: true, status: 200, statusText: 'OK',
  json: async () => ({ model: 'glm-4v-plus', choices: [{ message: { content } }], usage: { total_tokens: 42 } }),
});

describe('ZhipuAiGateway (GLM-4V vision)', () => {
  it('POSTs /chat/completions with Bearer auth, parses choices content, tags zhipu-compatible', async () => {
    let url = ''; let headers: Record<string, string> = {};
    const gw = new ZhipuAiGateway(cfg(), async (u, init) => { url = u; headers = init.headers; return okResp('{"say":"hi"}'); });
    const r = await gw.generateStructured(req());
    expect(url).toBe('https://open.bigmodel.cn/api/paas/v4/chat/completions');
    expect(headers.authorization).toBe('Bearer id.secret');
    expect(r.output).toEqual({ say: 'hi' });
    expect(r.metadata?.model_provider).toBe('zhipu-compatible');
    expect(r.metadata?.token_usage?.total_tokens).toBe(42);
  });

  it('sends OpenAI-style image_url block for multimodal input', async () => {
    let body: any = {};
    const gw = new ZhipuAiGateway(cfg(), async (_u, init) => { body = JSON.parse(init.body); return okResp('{"seen":true}'); });
    await gw.generateStructured(req([{ media_type: 'image/png', data: 'B64' }]));
    const parts = body.messages[1].content;
    const image = parts.find((p: any) => p.type === 'image_url');
    expect(image.image_url.url).toBe('data:image/png;base64,B64');
    expect(parts.some((p: any) => p.type === 'text')).toBe(true);
  });

  it('strips ```json fences before parsing (GLM wraps JSON)', async () => {
    const gw = new ZhipuAiGateway(cfg(), async () => okResp('```json\n{"say":"fenced"}\n```'));
    expect((await gw.generateStructured(req())).output).toEqual({ say: 'fenced' });
  });

  it('maps 4xx/5xx and empty content to AiGatewayError (FAIL CLOSED)', async () => {
    const gw4 = new ZhipuAiGateway(cfg(), async () => ({ ok: false, status: 401, statusText: 'U', json: async () => ({}) }));
    await expect(gw4.generateStructured(req())).rejects.toMatchObject({ kind: 'PROVIDER_4XX', status: 401 });
    const gwEmpty = new ZhipuAiGateway(cfg(), async () => okResp(''));
    await expect(gwEmpty.generateStructured(req())).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });

  it('factory + vendor selection', () => {
    const gw = createZhipuAiGatewayFromEnv({ ZHIPUAI_BASE_URL: 'https://x/v4', ZHIPUAI_API_KEY: 'k', ZHIPUAI_VISION_MODEL: 'glm-4v-plus' });
    expect(gw).toBeInstanceOf(ZhipuAiGateway);
    const selected = createAiGatewayFromEnv({ FPAI_MODEL_VENDOR: 'zhipu', ZHIPUAI_BASE_URL: 'https://x/v4', ZHIPUAI_API_KEY: 'k' });
    expect(selected).toBeInstanceOf(ZhipuAiGateway);
    expect(() => createZhipuAiGatewayFromEnv({})).toThrow();
  });
});
