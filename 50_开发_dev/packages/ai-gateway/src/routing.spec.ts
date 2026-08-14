import { describe, it, expect } from 'vitest';
import { RoutingAiGateway, AiGatewayError, createAiGatewayFromEnv, type AiGateway, type StructuredGenerationResult } from './index';

const req = () => ({
  use_case: 'test', prompt_version: 'p1', schema_version: 's1', input: { q: 'x' }, output_schema: {}, input_refs: [],
  policy_context: { human_confirmation_required: true as const, may_mutate_business_state: false as const },
});
const okGw = (tag: string): AiGateway => ({
  async generateStructured() { return { model: tag, output: { from: tag } } as unknown as StructuredGenerationResult<object>; },
  async embed() { return { model: tag, generated_at: '', vectors: [] }; },
} as unknown as AiGateway);
const failGw = (kind: 'TIMEOUT' | 'NETWORK_ERROR' | 'PROVIDER_5XX' | 'PROVIDER_4XX' | 'INVALID_JSON'): AiGateway => ({
  async generateStructured() { throw new AiGatewayError(kind, kind); },
  async embed() { return { model: 'x', generated_at: '', vectors: [] }; },
} as unknown as AiGateway);

describe('RoutingAiGateway (M3-106 controlled failover)', () => {
  it('falls over to next provider on infra error (5xx -> success)', async () => {
    const gw = new RoutingAiGateway([failGw('PROVIDER_5XX'), okGw('secondary')]);
    expect((await gw.generateStructured(req())).output).toEqual({ from: 'secondary' });
  });

  it('falls over on TIMEOUT and NETWORK_ERROR', async () => {
    expect((await new RoutingAiGateway([failGw('TIMEOUT'), okGw('b')]).generateStructured(req())).output).toEqual({ from: 'b' });
    expect((await new RoutingAiGateway([failGw('NETWORK_ERROR'), okGw('c')]).generateStructured(req())).output).toEqual({ from: 'c' });
  });

  it('does NOT fall over on 4xx (fail closed immediately, secondary never tried)', async () => {
    let secondaryTried = false;
    const secondary = { async generateStructured() { secondaryTried = true; return okGw('s').generateStructured(req()); }, async embed() { return { model: '', generated_at: '', vectors: [] }; } } as unknown as AiGateway;
    await expect(new RoutingAiGateway([failGw('PROVIDER_4XX'), secondary]).generateStructured(req())).rejects.toMatchObject({ kind: 'PROVIDER_4XX' });
    expect(secondaryTried).toBe(false);
  });

  it('does NOT fall over on INVALID_JSON (schema/parse failures are not infra transient)', async () => {
    await expect(new RoutingAiGateway([failGw('INVALID_JSON'), okGw('s')]).generateStructured(req())).rejects.toMatchObject({ kind: 'INVALID_JSON' });
  });

  it('throws last infra error when all providers fail', async () => {
    await expect(new RoutingAiGateway([failGw('PROVIDER_5XX'), failGw('TIMEOUT')]).generateStructured(req())).rejects.toMatchObject({ kind: 'TIMEOUT' });
  });

  it('createAiGatewayFromEnv builds a RoutingAiGateway from a comma vendor list', () => {
    const gw = createAiGatewayFromEnv({
      FPAI_MODEL_VENDOR: 'anthropic,zhipu',
      ANTHROPIC_BASE_URL: 'http://x', ANTHROPIC_AUTH_TOKEN: 't',
      ZHIPUAI_BASE_URL: 'https://y/v4', ZHIPUAI_API_KEY: 'k',
    });
    expect(gw).toBeInstanceOf(RoutingAiGateway);
  });
});
