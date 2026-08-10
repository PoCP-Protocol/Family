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

export interface StructuredGenerationResult<TOutput extends object> {
  model: string;
  prompt_version: string;
  schema_version: string;
  input_refs: string[];
  generated_at: string;
  validation_status: 'valid' | 'invalid';
  human_status: 'draft';
  output: TOutput;
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

export const AI_GATEWAY_POLICY = {
  provider_sdk_access: 'gateway_only',
  business_module_direct_provider_call: 'forbidden',
  canonical_mutation_by_ai: 'forbidden',
  structured_output_required: true,
  schema_validation_required: true,
  human_confirmation_required: true,
} as const;
