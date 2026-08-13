/**
 * MM1-B1 · Azure Secret Reader
 *
 * 严格约束(§5 SECRETS RULE):
 * - **只读 process.env**,永不读文件
 * - **永不返回 secret 到 event / telemetry / browser**
 * - **永不 console.log secret**,只 log presence 布尔
 * - 支持双命名(FPAI_ 前缀 + Azure 原生命名),不并存时 FPAI_ 优先
 * - 缺失时不 throw,返回 { hasKey: false, ... } 让 adapter 走 BLOCKED_MISSING_CREDENTIAL
 *
 * 本文件**不允许**被 browser / client-side 代码 import。
 * 由 sdkIsolation.spec.ts + KNOWN_SECRET_READER_SERVER_ONLY 守卫。
 */

export interface AzureSpeechCredential {
  /** 是否具备可用凭据。仅供 adapter 判断是否 BLOCKED_MISSING_CREDENTIAL。 */
  hasKey: boolean;
  /** 是否具备 region。 */
  hasRegion: boolean;
  /** subscription key。**永不写入 event / log**。 */
  subscriptionKey?: string;
  /** azure region, 如 'eastasia'。region 不属于 secret,但只在 server 侧使用。 */
  region?: string;
  /** 命名来源: 'fpai' | 'azure' | 'none'。仅用于 diagnostic。 */
  namingSource: 'fpai' | 'azure' | 'none';
}

/**
 * 从 process.env 读 Azure Speech 凭据。
 *
 * 优先级: FPAI_AZURE_SPEECH_KEY > AZURE_SPEECH_KEY。
 * 同理 FPAI_AZURE_SPEECH_REGION > AZURE_SPEECH_REGION。
 *
 * @returns AzureSpeechCredential (即便完全缺失也返回结构,由 adapter 判断)
 */
export function readAzureSpeechCredential(
  env: NodeJS.ProcessEnv = process.env,
): AzureSpeechCredential {
  const fpaiKey = env.FPAI_AZURE_SPEECH_KEY?.trim();
  const azureKey = env.AZURE_SPEECH_KEY?.trim();
  const fpaiRegion = env.FPAI_AZURE_SPEECH_REGION?.trim();
  const azureRegion = env.AZURE_SPEECH_REGION?.trim();

  let subscriptionKey: string | undefined;
  let region: string | undefined;
  let namingSource: 'fpai' | 'azure' | 'none' = 'none';

  if (fpaiKey && fpaiKey.length > 0) {
    subscriptionKey = fpaiKey;
    namingSource = 'fpai';
  } else if (azureKey && azureKey.length > 0) {
    subscriptionKey = azureKey;
    namingSource = 'azure';
  }

  if (fpaiRegion && fpaiRegion.length > 0) {
    region = fpaiRegion;
    if (namingSource === 'none') namingSource = 'fpai';
  } else if (azureRegion && azureRegion.length > 0) {
    region = azureRegion;
    if (namingSource === 'none') namingSource = 'azure';
  }

  return {
    hasKey: Boolean(subscriptionKey),
    hasRegion: Boolean(region),
    subscriptionKey,
    region,
    namingSource,
  };
}

/**
 * 生成一份**可以安全写入日志 / telemetry** 的诊断快照。
 * 只返回 presence 布尔,永远不返回 key / region 值本身。
 */
export function safeCredentialDiagnostic(cred: AzureSpeechCredential): {
  hasKey: boolean;
  hasRegion: boolean;
  namingSource: 'fpai' | 'azure' | 'none';
} {
  return {
    hasKey: cred.hasKey,
    hasRegion: cred.hasRegion,
    namingSource: cred.namingSource,
  };
}

/** 缺凭据时的标准 blocker code, adapter 用它构造 ProviderHealth。 */
export const AZURE_CREDENTIAL_BLOCKER = 'BLOCKED_MISSING_CREDENTIAL' as const;
