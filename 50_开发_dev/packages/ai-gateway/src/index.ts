export interface StructuredGenerationRequest<TInput extends object, TOutput extends object> {
  use_case: string;
  prompt_version: string;
  schema_version: string;
  input: TInput;
  output_schema: unknown;
  input_refs: string[];
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
  model_provider: 'fake' | 'openai-compatible';
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

type JsonFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<JsonHttpResponse>;

export class OpenAICompatibleAiGateway implements AiGateway {
  constructor(private readonly config: AiGatewayModelConfig, private readonly httpFetch: JsonFetch = getGlobalFetch()) {}

  async generateStructured<TInput extends object, TOutput extends object>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startedAt = Date.now();
    const response = await this.httpFetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
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
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible gateway failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: StructuredGenerationMetadata['token_usage'];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI-compatible gateway returned no message content');

    return {
      model: payload.model ?? this.config.model,
      prompt_version: request.prompt_version,
      schema_version: request.schema_version,
      input_refs: request.input_refs,
      generated_at: new Date().toISOString(),
      validation_status: 'valid',
      human_status: 'draft',
      output: JSON.parse(content) as TOutput,
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
} as const;
