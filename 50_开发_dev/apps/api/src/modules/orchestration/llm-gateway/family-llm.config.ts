/**
 * Family DEV/TEST real-LLM configuration.
 *
 * Credentials are injected only at runtime through local environment variables,
 * an uncommitted .env.local file, or a controlled secret provider. Never log,
 * serialize, return, snapshot, or persist credential values.
 */
export const FAMILY_LLM_DEFAULT_ALLOWLIST = [
  'gpt-5-mini',
  'gpt-5',
  'claude-sonnet-4-6',
  'gemini-3-flash-preview',
] as const;

export type FamilyLlmFailureCode =
  | 'LLM_DISABLED'
  | 'LLM_ENVIRONMENT_BLOCKED'
  | 'LLM_NOT_CONFIGURED'
  | 'LLM_MODEL_NOT_ALLOWED';

export interface FamilyLlmRuntimeConfig {
  enabled: true;
  environment: 'DEV' | 'TEST';
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  allowlist: readonly string[];
}

export type FamilyLlmConfigResolution =
  | { enabled: true; config: FamilyLlmRuntimeConfig }
  | { enabled: false; code: FamilyLlmFailureCode };

function isProductionLike(env: Record<string, string | undefined>): boolean {
  const normalized = [env.NODE_ENV, env.FAMILY_RUNTIME_ENV, env.FAMILY_RUNTIME_PROFILE, env.FAMILY_LLM_ENVIRONMENT]
    .filter(Boolean)
    .join(':')
    .toLowerCase();
  return normalized.includes('prod') || normalized.includes('production') || normalized.includes('pilot');
}

function resolveEnvironment(env: Record<string, string | undefined>): 'DEV' | 'TEST' | null {
  const configured = (env.FAMILY_LLM_ENVIRONMENT ?? env.FAMILY_RUNTIME_ENV ?? '').trim().toUpperCase();
  if (configured === 'DEV' || configured === 'TEST') return configured;
  return null;
}

function parseAllowlist(value: string | undefined): readonly string[] {
  if (!value?.trim()) return FAMILY_LLM_DEFAULT_ALLOWLIST;
  const requested = value.split(',').map((entry) => entry.trim()).filter(Boolean);
  return requested.filter((model) => FAMILY_LLM_DEFAULT_ALLOWLIST.includes(model as (typeof FAMILY_LLM_DEFAULT_ALLOWLIST)[number]));
}

function parseTimeout(value: string | undefined): number {
  const parsed = Number(value ?? 30000);
  return Number.isFinite(parsed) && parsed >= 1000 && parsed <= 120000 ? parsed : 30000;
}

/**
 * Resolves only whether a real LLM path is allowed. The failure result contains
 * an enum only; it intentionally exposes no configuration details or secrets.
 */
export function resolveFamilyLlmConfig(
  env: Record<string, string | undefined> = process.env,
): FamilyLlmConfigResolution {
  if (env.FAMILY_LLM_ENABLED !== 'true') return { enabled: false, code: 'LLM_DISABLED' };
  if (isProductionLike(env)) return { enabled: false, code: 'LLM_ENVIRONMENT_BLOCKED' };

  const environment = resolveEnvironment(env);
  if (!environment) return { enabled: false, code: 'LLM_ENVIRONMENT_BLOCKED' };

  const baseUrl = env.FAMILY_LLM_API_BASE?.trim();
  const apiKey = env.FAMILY_LLM_API_KEY?.trim();
  const model = env.FAMILY_LLM_MODEL?.trim();
  if (!baseUrl || !apiKey || !model) return { enabled: false, code: 'LLM_NOT_CONFIGURED' };

  const allowlist = parseAllowlist(env.FAMILY_LLM_MODEL_ALLOWLIST);
  if (!allowlist.includes(model)) return { enabled: false, code: 'LLM_MODEL_NOT_ALLOWED' };

  return {
    enabled: true,
    config: {
      enabled: true,
      environment,
      baseUrl,
      apiKey,
      model,
      timeoutMs: parseTimeout(env.FAMILY_LLM_TIMEOUT_MS),
      allowlist,
    },
  };
}

export const __test__ = { isProductionLike, parseAllowlist, parseTimeout, resolveEnvironment };
