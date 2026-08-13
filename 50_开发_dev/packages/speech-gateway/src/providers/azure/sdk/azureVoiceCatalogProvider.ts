/**
 * MM1-B1.1 · AzureVoiceCatalogProvider (§12)
 *
 * 契约:
 *   - 无 credential → { status: 'BLOCKED_MISSING_CREDENTIAL', voices: [] }
 *   - 有 credential 时通过 SpeechSynthesizer.getVoicesAsync('zh-CN') 拉取。
 *   - 输出必须是 provider-neutral 的 VoiceInfoNeutral, 不暴露 SDK 类型。
 *   - 不做任何硬编码 catalog; DEFAULT_CONFIGURATION_CANDIDATE 只是"未验证前的默认候选",
 *     禁止标记为 REGION_AVAILABLE=TRUE 直到 live 查询 PASS。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { loadAzureSdk, type AzureSdk } from './sdkLoader';
import { readAzureSpeechCredential, type AzureSpeechCredential } from '../secretReader';

export interface VoiceInfoNeutral {
  voice_id: string; // Azure shortName, provider-scoped id
  locale: string;
  gender: 'FEMALE' | 'MALE' | 'UNKNOWN';
  voice_type: 'NEURAL' | 'STANDARD' | 'CUSTOM' | 'UNKNOWN';
  styles: string[];
  roles: string[];
  region_available: 'TRUE' | 'UNKNOWN';
}

export interface VoiceCatalogResult {
  status: 'READY' | 'BLOCKED_MISSING_CREDENTIAL' | 'ERROR';
  region_queried?: string;
  voices: VoiceInfoNeutral[];
  reason?: string;
}

export interface AzureVoiceCatalogProviderOptions {
  env?: NodeJS.ProcessEnv;
  __sdkOverride?: AzureSdk;
  /** 默认候选,仅供 lab reference,不代表 region_available。 */
  defaultConfigurationCandidates?: string[];
}

export const DEFAULT_CONFIGURATION_CANDIDATES = Object.freeze([
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-XiaochenNeural',
  'zh-CN-XiaohanNeural',
]);

export class AzureVoiceCatalogProvider {
  private readonly credential: AzureSpeechCredential;
  private readonly sdk: AzureSdk | null;

  public constructor(opts: AzureVoiceCatalogProviderOptions = {}) {
    this.credential = readAzureSpeechCredential(opts.env ?? process.env);
    if (opts.__sdkOverride) {
      this.sdk = opts.__sdkOverride;
    } else if (this.credential.hasKey && this.credential.hasRegion) {
      try {
        this.sdk = loadAzureSdk();
      } catch {
        this.sdk = null;
      }
    } else {
      this.sdk = null;
    }
  }

  /** 未 live 时返回的候选清单;region_available 永远为 UNKNOWN。 */
  public listDefaultConfigurationCandidates(): VoiceInfoNeutral[] {
    return DEFAULT_CONFIGURATION_CANDIDATES.map((id) => ({
      voice_id: id,
      locale: 'zh-CN',
      gender: 'FEMALE', // 官方文档标注,未活体校验
      voice_type: 'NEURAL',
      styles: [],
      roles: [],
      region_available: 'UNKNOWN',
    }));
  }

  public async fetchLive(locale: string = 'zh-CN'): Promise<VoiceCatalogResult> {
    if (!this.credential.hasKey || !this.credential.hasRegion || !this.sdk) {
      return {
        status: 'BLOCKED_MISSING_CREDENTIAL',
        voices: [],
        reason: 'BLOCKED_MISSING_CREDENTIAL',
      };
    }
    const sdk = this.sdk as any;
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      this.credential.subscriptionKey,
      this.credential.region,
    );
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    try {
      const result = await new Promise<any>((resolve, reject) => {
        try {
          synthesizer.getVoicesAsync(
            locale,
            (r: any) => resolve(r),
            (err: any) => reject(err),
          );
        } catch (err) {
          reject(err);
        }
      });
      const voices = Array.isArray(result?.voices) ? result.voices : [];
      const region = this.credential.region ?? 'unknown';
      const neutral: VoiceInfoNeutral[] = voices.map((v: any) => this.toNeutral(v, region));
      return {
        status: 'READY',
        region_queried: region,
        voices: neutral,
      };
    } catch (err) {
      return {
        status: 'ERROR',
        voices: [],
        reason: `azure-getVoices-failed:${String(err)}`,
      };
    } finally {
      try {
        synthesizer.close();
      } catch {
        /* ignore */
      }
    }
  }

  private toNeutral(v: any, region: string): VoiceInfoNeutral {
    const voice_id: string = typeof v?.shortName === 'string' && v.shortName
      ? v.shortName
      : (typeof v?.name === 'string' ? v.name : 'unknown');
    const locale: string = typeof v?.locale === 'string' ? v.locale : 'unknown';
    const gender: VoiceInfoNeutral['gender'] = decodeGender(v?.gender);
    const voice_type: VoiceInfoNeutral['voice_type'] = decodeVoiceType(v?.voiceType);
    const styles: string[] = Array.isArray(v?.styleList) ? v.styleList.filter((s: any) => typeof s === 'string') : [];
    const roles: string[] = Array.isArray(v?.rolePlayList) ? v.rolePlayList.filter((r: any) => typeof r === 'string') : [];
    // region_available: 只要出现在该 region 的 catalog 里就是 TRUE
    return {
      voice_id,
      locale,
      gender,
      voice_type,
      styles,
      roles,
      region_available: region ? 'TRUE' : 'UNKNOWN',
    };
  }
}

function decodeGender(g: any): VoiceInfoNeutral['gender'] {
  // Azure SynthesisVoiceGender: Unknown=0, Female=1, Male=2, Neutral=3
  if (g === 1) return 'FEMALE';
  if (g === 2) return 'MALE';
  return 'UNKNOWN';
}

function decodeVoiceType(t: any): VoiceInfoNeutral['voice_type'] {
  // Azure SynthesisVoiceType: OnlineNeural=1, OnlineStandard=2, OfflineNeural=3, OfflineStandard=4
  if (t === 1 || t === 3) return 'NEURAL';
  if (t === 2 || t === 4) return 'STANDARD';
  return 'UNKNOWN';
}
