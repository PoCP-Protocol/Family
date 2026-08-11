export interface StructuredGenerationRequest<TInput extends object, TOutput extends object> {
  use_case: string;
  prompt_version: string;
  schema_version: string;
  input: TInput;
  output_schema: unknown;
  input_refs: string[];
  /** 可选多模态图片(base64)。Anthropic 适配器会作为 image content block 发送;OpenAI 适配器当前忽略。 */
  images?: Array<{ media_type: string; data: string }>;
  policy_context: {
    human_confirmation_required: true;
    may_mutate_business_state: false;
  };
}

export interface AiGatewayModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface StructuredGenerationMetadata {
  model_provider: 'fake' | 'openai-compatible' | 'anthropic-compatible';
  model_version?: string;
  latency_ms: number;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface StructuredGenerationResult<TOutput extends object> {
  model: string;
  prompt_version: string;
  schema_version: string;
  input_refs: string[];
  generated_at: string;
  validation_status: 'valid' | 'invalid';
  human_status: 'draft';
  output: TOutput;
  metadata?: StructuredGenerationMetadata;
}

export interface EmbeddingRequest {
  input_refs: string[];
  texts: string[];
  model_hint?: string;
}

export interface EmbeddingResult {
  model: string;
  generated_at: string;
  vectors: number[][];
}

export interface RerankRequest {
  query: string;
  documents: Array<{ id: string; text: string }>;
  model_hint?: string;
}

export interface RerankResult {
  model: string;
  generated_at: string;
  ranked: Array<{ id: string; score: number }>;
}

export interface AiGateway {
  generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>>;

  embed(request: EmbeddingRequest): Promise<EmbeddingResult>;

  rerank?(request: RerankRequest): Promise<RerankResult>;
}

/** A5 失败分类(业务层不得直接接收 provider 异常;一律映射为此类)。 */
export type AiGatewayErrorKind =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_4XX'
  | 'PROVIDER_5XX'
  | 'INVALID_JSON'
  | 'SCHEMA_INVALID'
  | 'POLICY_REJECTED';

export class AiGatewayError extends Error {
  constructor(
    readonly kind: AiGatewayErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(`[${kind}] ${message}`);
    this.name = 'AiGatewayError';
  }
}

export class FakeAiGateway implements AiGateway {
  constructor(private readonly responseByUseCase: Record<string, object> = {}) {}

  async generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startedAt = Date.now();
    const output = this.responseByUseCase[request.use_case] ?? {};

    return {
      model: 'fake-gateway',
      prompt_version: request.prompt_version,
      schema_version: request.schema_version,
      input_refs: request.input_refs,
      generated_at: new Date().toISOString(),
      validation_status: Object.keys(output).length > 0 ? 'valid' : 'invalid',
      human_status: 'draft',
      output: output as TOutput,
      metadata: {
        model_provider: 'fake',
        latency_ms: Date.now() - startedAt,
      },
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return {
      model: 'fake-embedding',
      generated_at: new Date().toISOString(),
      vectors: request.texts.map(() => [0]),
    };
  }

  async rerank(request: RerankRequest): Promise<RerankResult> {
    return {
      model: 'fake-rerank',
      generated_at: new Date().toISOString(),
      ranked: request.documents.map((document, index) => ({ id: document.id, score: request.documents.length - index })),
    };
  }
}

interface JsonHttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}

type JsonFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<JsonHttpResponse>;

export class OpenAICompatibleAiGateway implements AiGateway {
  constructor(private readonly config: AiGatewayModelConfig, private readonly httpFetch: JsonFetch = getGlobalFetch()) {}

  async generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startedAt = Date.now();
    // A5: 真实超时 = AbortController + Promise.race(即使注入的 fetch 忽略 signal 也能中止)。retry=0,无 fallback。
    const timeoutMs = this.config.timeoutMs > 0 ? this.config.timeoutMs : 30000;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new AiGatewayError('TIMEOUT', `provider timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    let response: JsonHttpResponse;
    try {
      response = await Promise.race([
        this.httpFetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.config.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: [
                  `use_case=${request.use_case}`,
                  `prompt_version=${request.prompt_version}`,
                  `schema_version=${request.schema_version}`,
                  'Return only one JSON object matching the provided schema. Do not include markdown.',
                  `output_schema=${JSON.stringify(request.output_schema)}`,
                ].join('\n'),
              },
              { role: 'user', content: JSON.stringify(request.input) },
            ],
          }),
          signal: controller.signal,
        }),
        timeout,
      ]);
    } catch (err) {
      if (err instanceof AiGatewayError) throw err; // TIMEOUT
      if (controller.signal.aborted) throw new AiGatewayError('TIMEOUT', 'request aborted');
      throw new AiGatewayError('NETWORK_ERROR', (err as Error)?.message ?? 'network error');
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!response.ok) {
      const kind: AiGatewayErrorKind = response.status >= 500 ? 'PROVIDER_5XX' : 'PROVIDER_4XX';
      throw new AiGatewayError(kind, `provider ${response.status} ${response.statusText}`, response.status);
    }

    let payload: {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: StructuredGenerationMetadata['token_usage'];
    };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new AiGatewayError('INVALID_JSON', 'provider response body is not JSON');
    }
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new AiGatewayError('INVALID_JSON', 'provider returned no message content');

    let parsed: TOutput;
    try {
      parsed = JSON.parse(content) as TOutput;
    } catch {
      // FAIL CLOSED:模型内容非合法 JSON 时,绝不把原始文本返回给用户。
      throw new AiGatewayError('INVALID_JSON', 'model content is not valid JSON');
    }

    return {
      model: payload.model ?? this.config.model,
      prompt_version: request.prompt_version,
      schema_version: request.schema_version,
      input_refs: request.input_refs,
      generated_at: new Date().toISOString(),
      validation_status: 'valid',
      human_status: 'draft',
      output: parsed,
      metadata: {
        model_provider: 'openai-compatible',
        latency_ms: Date.now() - startedAt,
        token_usage: payload.usage,
      },
    };
  }

  async embed(): Promise<EmbeddingResult> {
    throw new Error('Embedding is not required for FP1 deterministic retrieval');
  }
}

export function createOpenAICompatibleAiGatewayFromEnv(env: Record<string, string | undefined>): OpenAICompatibleAiGateway {
  const baseUrl = env.FPAI_MODEL_BASE_URL;
  const apiKey = env.FPAI_MODEL_API_KEY;
  const model = env.FPAI_MODEL_NAME;
  const timeoutMs = Number(env.FPAI_MODEL_TIMEOUT_MS ?? 30000);

  if (!baseUrl || !apiKey || !model) {
    throw new Error('Missing FPAI_MODEL_BASE_URL, FPAI_MODEL_API_KEY, or FPAI_MODEL_NAME');
  }

  return new OpenAICompatibleAiGateway({ baseUrl, apiKey, model, timeoutMs });
}

/** 剥离模型输出外层的 ```json ... ``` / ``` ... ``` markdown 围栏(仅去外层,内容不改)。 */
export function stripCodeFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return m ? m[1].trim() : t;
}

function getGlobalFetch(): JsonFetch {
  const candidate = (globalThis as unknown as { fetch?: JsonFetch }).fetch;
  if (!candidate) throw new Error('Global fetch is unavailable; Node 20+ or an injected fetch implementation is required');
  return candidate;
}

export const AI_GATEWAY_POLICY = {
  provider_sdk_access: 'gateway_only',
  business_module_direct_provider_call: 'forbidden',
  canonical_mutation_by_ai: 'forbidden',
  structured_output_required: true,
  schema_validation_required: true,
  human_confirmation_required: true,
  // A5 hardening
  on_failure: 'fail_closed',
  automatic_retry: 0,
  cross_provider_fallback: 'forbidden',
  schema_failure_returns_raw_text: false,
  timeout_enforced: true,
} as const;

/**
 * Anthropic Messages API 适配器(支持多模态图片)。
 * 用于接 cc switch 本地代理(ANTHROPIC_BASE_URL,Anthropic /v1/messages 格式)及 IBM ICA 后端。
 * 复用 A5 硬化:AbortController 超时、AiGatewayError 失败分类、retry=0、无 fallback、schema/JSON 失败绝不返原始文本。
 */
export class AnthropicAiGateway implements AiGateway {
  constructor(private readonly config: AiGatewayModelConfig, private readonly httpFetch: JsonFetch = getGlobalFetch()) {}

  async generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startedAt = Date.now();
    const timeoutMs = this.config.timeoutMs > 0 ? this.config.timeoutMs : 30000;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new AiGatewayError('TIMEOUT', `provider timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const content: Array<Record<string, unknown>> = [];
    for (const img of request.images ?? []) {
      content.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } });
    }
    content.push({ type: 'text', text: JSON.stringify(request.input) });

    let response: JsonHttpResponse;
    try {
      response = await Promise.race([
        this.httpFetch(`${this.config.baseUrl.replace(/\/$/, '')}/v1/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            max_tokens: 1024,
            system: [
              `use_case=${request.use_case}`,
              `prompt_version=${request.prompt_version}`,
              `schema_version=${request.schema_version}`,
              'Return only one JSON object matching this schema. No markdown, no prose.',
              `output_schema=${JSON.stringify(request.output_schema)}`,
            ].join('\n'),
            messages: [{ role: 'user', content }],
          }),
          signal: controller.signal,
        }),
        timeout,
      ]);
    } catch (err) {
      if (err instanceof AiGatewayError) throw err;
      if (controller.signal.aborted) throw new AiGatewayError('TIMEOUT', 'request aborted');
      throw new AiGatewayError('NETWORK_ERROR', (err as Error)?.message ?? 'network error');
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!response.ok) {
      const kind: AiGatewayErrorKind = response.status >= 500 ? 'PROVIDER_5XX' : 'PROVIDER_4XX';
      throw new AiGatewayError(kind, `provider ${response.status} ${response.statusText}`, response.status);
    }

    let payload: { model?: string; content?: Array<{ type?: string; text?: string }>; usage?: unknown };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new AiGatewayError('INVALID_JSON', 'provider response body is not JSON');
    }
    const text = (payload.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
    if (!text) throw new AiGatewayError('INVALID_JSON', 'provider returned no text content');

    let parsed: TOutput;
    try {
      // 部分模型即便被要求"无 markdown"仍会用 ```json ``` 包裹 → 先剥离围栏再解析(仍 FAIL CLOSED)。
      parsed = JSON.parse(stripCodeFence(text)) as TOutput;
    } catch {
      throw new AiGatewayError('INVALID_JSON', 'model content is not valid JSON'); // FAIL CLOSED:不返原始文本
    }

    return {
      model: payload.model ?? this.config.model,
      prompt_version: request.prompt_version,
      schema_version: request.schema_version,
      input_refs: request.input_refs,
      generated_at: new Date().toISOString(),
      validation_status: 'valid',
      human_status: 'draft',
      output: parsed,
      metadata: { model_provider: 'anthropic-compatible', latency_ms: Date.now() - startedAt },
    };
  }

  async embed(): Promise<EmbeddingResult> {
    throw new Error('Embedding not supported by AnthropicAiGateway');
  }
}

export function createAnthropicAiGatewayFromEnv(env: Record<string, string | undefined>): AnthropicAiGateway {
  const baseUrl = env.ANTHROPIC_BASE_URL;
  const apiKey = env.ANTHROPIC_AUTH_TOKEN ?? env.ANTHROPIC_API_KEY;
  const model = env.FPAI_MM_MODEL ?? env.ANTHROPIC_MODEL ?? 'claude-opus-4-8';
  const timeoutMs = Number(env.FPAI_MODEL_TIMEOUT_MS ?? 40000);
  if (!baseUrl || !apiKey) throw new Error('Missing ANTHROPIC_BASE_URL or ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY');
  return new AnthropicAiGateway({ baseUrl, apiKey, model, timeoutMs });
}

/**
 * 统一工厂:Anthropic(cc switch,多模态)优先 → OpenAI 兼容 → Fake。
 * 未配置真实 provider 时回退 FakeAiGateway,确保测试/CI 确定性、无真实调用。
 */
export function createAiGatewayFromEnv(env: Record<string, string | undefined>): AiGateway {
  if ((env.ANTHROPIC_BASE_URL) && (env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY)) {
    return createAnthropicAiGatewayFromEnv(env);
  }
  if (env.FPAI_MODEL_BASE_URL && env.FPAI_MODEL_API_KEY && env.FPAI_MODEL_NAME) {
    return createOpenAICompatibleAiGatewayFromEnv(env);
  }
  return new FakeAiGateway();
}
