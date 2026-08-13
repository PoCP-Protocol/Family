/**
 * MM1-B1.1 · Speech Composition Root (§J)
 *
 * 目的:
 *   业务 runtime 不得散落 `if azure / if fake` 分支。Provider 选择集中在此。
 *
 * 决策矩阵:
 *   env.FPAI_REAL_SPEECH_ENABLED !== 'YES'
 *     → { mode: 'FAKE', speech_gateway = FakeSTT + FakeTTS }
 *   env.FPAI_REAL_SPEECH_ENABLED === 'YES'
 *     credential 缺失
 *       env.FPAI_ALLOW_DEV_FAKE_FALLBACK === 'YES'
 *         → { mode: 'FAKE_FALLBACK', FALLBACK_PROVIDER_USED='YES', 用 Fake, 记 telemetry }
 *       否则
 *         → { mode: 'BLOCKED_MISSING_CREDENTIAL', 不构造 Fake, 让上层拒绝 realtime 建立 }
 *     credential 到位
 *       SDK 未安装 → mode='BLOCKED_SDK_MISSING'
 *       SDK 就绪 → { mode: 'AZURE_SDK', speech_gateway = AzureSpeechStt/Tts + SDK transport }
 *
 * 契约:
 *   - 本函数 **不发起任何真实 network call**。它只装配对象。
 *   - Health preflight 由调用方在 mode='AZURE_SDK' 时另行触发。
 *   - 若 mode !== 'AZURE_SDK', LIVE_CALL_COUNT 永远 = 0。
 */

import type { RealtimeServerEvent, SpeechChunkEvent, TranscriptEvent } from '@family/fpai-multimodal-contracts';

import { FakeSpeechToTextGateway, FakeTextToSpeechGateway, type SpeechToTextGateway, type TextToSpeechGateway } from '../../index';
import { AzureSpeechSttAdapter, type AzureRealtimeSttTransport } from '../azure/azureSpeechStt';
import { AzureSpeechTtsAdapter, type AzureRealtimeTtsTransport } from '../azure/azureSpeechTts';
import { readAzureSpeechCredential } from '../azure/secretReader';
import { AzureSpeechSdkSttTransport } from '../azure/sdk/azureSpeechSdkSttTransport';
import { AzureSpeechSdkTtsTransport } from '../azure/sdk/azureSpeechSdkTtsTransport';

export type SpeechCompositionMode =
  | 'FAKE'
  | 'FAKE_FALLBACK'
  | 'AZURE_SDK'
  | 'BLOCKED_MISSING_CREDENTIAL'
  | 'BLOCKED_SDK_MISSING';

export interface SpeechCompositionResult {
  mode: SpeechCompositionMode;
  stt: SpeechToTextGateway | null;
  tts: TextToSpeechGateway | null;
  provider_id: {
    stt: string;
    tts: string;
  } | null;
  telemetry: {
    FPAI_REAL_SPEECH_ENABLED: 'YES' | 'NO';
    AZURE_CREDENTIAL_PRESENT: 'YES' | 'NO';
    AZURE_SDK_INSTALLED: 'YES' | 'NO' | 'NOT_CHECKED';
    FALLBACK_PROVIDER_USED: 'YES' | 'NO';
    STT_PROVIDER_MODE: SpeechCompositionMode;
    TTS_PROVIDER_MODE: SpeechCompositionMode;
  };
  reason?: string;
}

export interface SpeechCompositionOptions {
  env?: NodeJS.ProcessEnv;
  /** 允许测试注入替代的 STT/TTS transport 工厂,避免真的 require SDK。 */
  __sttTransportFactory?: () => AzureRealtimeSttTransport;
  __ttsTransportFactory?: () => AzureRealtimeTtsTransport;
}

export function buildSpeechComposition(opts: SpeechCompositionOptions = {}): SpeechCompositionResult {
  const env = opts.env ?? process.env;
  const enabled = (env.FPAI_REAL_SPEECH_ENABLED ?? 'NO').toString().toUpperCase() === 'YES';
  const allowFake = (env.FPAI_ALLOW_DEV_FAKE_FALLBACK ?? 'NO').toString().toUpperCase() === 'YES';
  const cred = readAzureSpeechCredential(env);

  // Path A: real speech OFF → 完全 Fake
  if (!enabled) {
    const stt = new FakeSpeechToTextGateway();
    const tts = new FakeTextToSpeechGateway();
    return {
      mode: 'FAKE',
      stt,
      tts,
      provider_id: { stt: 'stt.fake', tts: 'tts.fake' },
      telemetry: {
        FPAI_REAL_SPEECH_ENABLED: 'NO',
        AZURE_CREDENTIAL_PRESENT: cred.hasKey && cred.hasRegion ? 'YES' : 'NO',
        AZURE_SDK_INSTALLED: 'NOT_CHECKED',
        FALLBACK_PROVIDER_USED: 'NO',
        STT_PROVIDER_MODE: 'FAKE',
        TTS_PROVIDER_MODE: 'FAKE',
      },
    };
  }

  // Path B: real speech ON, 但 credential 缺
  if (!cred.hasKey || !cred.hasRegion) {
    if (allowFake) {
      const stt = new FakeSpeechToTextGateway();
      const tts = new FakeTextToSpeechGateway();
      return {
        mode: 'FAKE_FALLBACK',
        stt,
        tts,
        provider_id: { stt: 'stt.fake', tts: 'tts.fake' },
        telemetry: {
          FPAI_REAL_SPEECH_ENABLED: 'YES',
          AZURE_CREDENTIAL_PRESENT: 'NO',
          AZURE_SDK_INSTALLED: 'NOT_CHECKED',
          FALLBACK_PROVIDER_USED: 'YES',
          STT_PROVIDER_MODE: 'FAKE_FALLBACK',
          TTS_PROVIDER_MODE: 'FAKE_FALLBACK',
        },
        reason: 'FPAI_ALLOW_DEV_FAKE_FALLBACK=YES; credential missing',
      };
    }
    return {
      mode: 'BLOCKED_MISSING_CREDENTIAL',
      stt: null,
      tts: null,
      provider_id: null,
      telemetry: {
        FPAI_REAL_SPEECH_ENABLED: 'YES',
        AZURE_CREDENTIAL_PRESENT: 'NO',
        AZURE_SDK_INSTALLED: 'NOT_CHECKED',
        FALLBACK_PROVIDER_USED: 'NO',
        STT_PROVIDER_MODE: 'BLOCKED_MISSING_CREDENTIAL',
        TTS_PROVIDER_MODE: 'BLOCKED_MISSING_CREDENTIAL',
      },
      reason: 'BLOCKED_MISSING_CREDENTIAL',
    };
  }

  // Path C: real speech ON, credential OK → 尝试 SDK transport
  let sttTransport: AzureRealtimeSttTransport;
  let ttsTransport: AzureRealtimeTtsTransport;
  try {
    sttTransport = opts.__sttTransportFactory ? opts.__sttTransportFactory() : new AzureSpeechSdkSttTransport();
    ttsTransport = opts.__ttsTransportFactory ? opts.__ttsTransportFactory() : new AzureSpeechSdkTtsTransport();
  } catch (err) {
    return {
      mode: 'BLOCKED_SDK_MISSING',
      stt: null,
      tts: null,
      provider_id: null,
      telemetry: {
        FPAI_REAL_SPEECH_ENABLED: 'YES',
        AZURE_CREDENTIAL_PRESENT: 'YES',
        AZURE_SDK_INSTALLED: 'NO',
        FALLBACK_PROVIDER_USED: 'NO',
        STT_PROVIDER_MODE: 'BLOCKED_SDK_MISSING',
        TTS_PROVIDER_MODE: 'BLOCKED_SDK_MISSING',
      },
      reason: `AZURE_SDK_NOT_INSTALLED:${String(err)}`,
    };
  }
  const stt = new AzureSpeechSttAdapter({ transport: sttTransport, env });
  const tts = new AzureSpeechTtsAdapter({ transport: ttsTransport, env });
  return {
    mode: 'AZURE_SDK',
    stt,
    tts,
    provider_id: {
      stt: AzureSpeechSttAdapter.providerId,
      tts: AzureSpeechTtsAdapter.providerId,
    },
    telemetry: {
      FPAI_REAL_SPEECH_ENABLED: 'YES',
      AZURE_CREDENTIAL_PRESENT: 'YES',
      AZURE_SDK_INSTALLED: 'YES',
      FALLBACK_PROVIDER_USED: 'NO',
      STT_PROVIDER_MODE: 'AZURE_SDK',
      TTS_PROVIDER_MODE: 'AZURE_SDK',
    },
  };
}

// 事件类型 re-export, 便于 composition root 消费方无需再从 gateway root 拉。
export type SpeechEvent = RealtimeServerEvent | TranscriptEvent | SpeechChunkEvent;
