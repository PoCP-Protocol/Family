import { describe, it, expect } from 'vitest';
import { AttemptRecordingGateway, RoutingAiGateway, AiGatewayError, type AiGateway, type AttemptSink, type StructuredGenerationRequest, type StructuredGenerationResult } from './index';

const req = () => ({
  use_case: 'test', prompt_version: 'p', schema_version: 's',
  input: { request_id: 'R1', session_id: 'S1', q: 'x' }, output_schema: {}, input_refs: [],
  policy_context: { human_confirmation_required: true as const, may_mutate_business_state: false as const },
});

// 测试替身真正实现 AiGateway 的泛型契约(不使用 as unknown as 掩盖接口)。
const okGw = (): AiGateway => ({
  async generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    return {
      model: 'test-model',
      prompt_version: request.prompt_version,
      schema_version: request.schema_version,
      input_refs: request.input_refs,
      generated_at: new Date(0).toISOString(),
      validation_status: 'valid',
      human_status: 'draft',
      output: {} as TOutput,
      metadata: { model_provider: 'anthropic-compatible', latency_ms: 1 },
    };
  },
  async embed() { return { model: 'test-model', generated_at: new Date(0).toISOString(), vectors: [] }; },
});
const failGw = (kind: 'PROVIDER_5XX' | 'TIMEOUT' | 'PROVIDER_4XX'): AiGateway => ({
  async generateStructured<TInput extends object, TOutput extends object>(
    _request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    throw new AiGatewayError(kind, kind);
  },
  async embed() { return { model: 'test-model', generated_at: new Date(0).toISOString(), vectors: [] }; },
});
function recorder() {
  const rows: Array<Record<string, unknown>> = [];
  let seq = 0;
  const sink: AttemptSink = {
    async begin(ctx) { const id = `a${++seq}`; rows.push({ id, ...ctx, status: 'STARTED' }); return id; },
    async finish(id, res) { const r = rows.find((x) => x.id === id); if (r) Object.assign(r, res); },
  };
  return { sink, rows };
}

describe('AttemptRecordingGateway (M3-INT-001 B1)', () => {
  it('records a SUCCESS attempt with ctx from request.input', async () => {
    const { sink, rows } = recorder();
    const gw = new AttemptRecordingGateway(okGw(), 'anthropic-cc-switch', sink, 0);
    await gw.generateStructured(req());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ provider: 'anthropic-cc-switch', requestId: 'R1', sessionId: 'S1', failoverSequence: 0, status: 'SUCCESS' });
  });

  it('records a FAILURE attempt (timeout persisted, not lost) and rethrows', async () => {
    const { sink, rows } = recorder();
    const gw = new AttemptRecordingGateway(failGw('TIMEOUT'), 'zhipu-glm4v', sink, 0);
    await expect(gw.generateStructured(req())).rejects.toMatchObject({ kind: 'TIMEOUT' });
    expect(rows[0]).toMatchObject({ status: 'FAILURE', failureKind: 'TIMEOUT' });
  });

  it('failover records TWO attempts (primary FAILURE seq0 + secondary SUCCESS seq1)', async () => {
    const { sink, rows } = recorder();
    const primary = new AttemptRecordingGateway(failGw('PROVIDER_5XX'), 'anthropic-cc-switch', sink, 0);
    const secondary = new AttemptRecordingGateway(okGw(), 'zhipu-glm4v', sink, 1);
    await new RoutingAiGateway([primary, secondary]).generateStructured(req());
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ provider: 'anthropic-cc-switch', failoverSequence: 0, status: 'FAILURE', failureKind: 'PROVIDER_5XX' });
    expect(rows[1]).toMatchObject({ provider: 'zhipu-glm4v', failoverSequence: 1, status: 'SUCCESS' });
  });
});
