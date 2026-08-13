/**
 * MM1-B1.1 · SpeechStyle Fallback (§14)
 *
 * 目的:
 *   若某个 Family SpeechStyle → 目标 provider(voice) 的 style 不受支持,
 *   降级到 neutral,只保留 Family rate/pause,不整体拒绝合成。
 *
 * 契约:
 *   - 不改 FAMILY_TO_AZURE_STYLE 表 (那是"最佳映射候选")。
 *   - 本模块基于 voice 支持列表 (来自 AzureVoiceCatalogProvider 返回的 VoiceInfoNeutral.styles)
 *     决定是否 downgrade。
 *   - unsupportedStyleFallback 永远返回可用的 SSML string, 不 throw。
 *   - 严格记录 STYLE_FALLBACK_USED = 'YES' | 'NO' 供 telemetry。
 *
 * 语义:
 *   - style 支持 → 直接沿用 buildAzureSsml 逻辑。
 *   - style 不支持 → 输出 `<voice>` + `<prosody rate="…">`, 不含 `<mstts:express-as>`。
 */

import type { FamilySpeechStyle } from './speechStyleMapper';
import { FAMILY_TO_AZURE_RATE, FAMILY_TO_AZURE_STYLE } from './speechStyleMapper';

export interface ResolveStyleInput {
  voice_id: string;
  /** provider 返回的该 voice 支持的 style 列表 (小写字符串, 未做规范化)。 */
  supportedStyles?: string[];
  family_style: FamilySpeechStyle;
  pace: 'SLOW' | 'MEDIUM' | 'FAST';
  text: string;
  pausesMs?: number[];
  locale?: string;
}

export interface ResolveStyleOutput {
  ssml: string;
  azure_style: string | null;
  style_fallback_used: boolean;
  telemetry: {
    STYLE_FALLBACK_USED: 'YES' | 'NO';
    family_style: FamilySpeechStyle;
    voice_id: string;
    /** 实际写到 SSML 的 style,若 downgrade 则 null。 */
    applied_style: string | null;
  };
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

function pauseTags(pausesMs?: number[]): string {
  if (!pausesMs || pausesMs.length === 0) return '';
  return pausesMs.map((ms) => `<break time="${Math.max(0, Math.floor(ms))}ms"/>`).join('');
}

/**
 * 判断某 provider style 是否被该 voice 支持。
 * supportedStyles 为空数组或 undefined → 视为"未知,保守走 downgrade"。
 */
export function isStyleSupported(azureStyle: string, supportedStyles?: string[]): boolean {
  if (!supportedStyles || supportedStyles.length === 0) return false;
  const normalized = azureStyle.trim().toLowerCase();
  return supportedStyles.some((s) => typeof s === 'string' && s.trim().toLowerCase() === normalized);
}

export function resolveStyleWithFallback(input: ResolveStyleInput): ResolveStyleOutput {
  const {
    voice_id,
    supportedStyles,
    family_style,
    pace,
    text,
    pausesMs,
    locale,
  } = input;

  const desiredAzureStyle = FAMILY_TO_AZURE_STYLE[family_style];
  const rate = FAMILY_TO_AZURE_RATE[pace];
  const supported = isStyleSupported(desiredAzureStyle, supportedStyles);
  const safe = escapeXml(text);
  const xmlLang = locale && /^[a-z]{2,3}-[A-Z]{2}$/i.test(locale) ? locale : 'zh-CN';

  if (supported) {
    const ssml = [
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${xmlLang}">`,
      `<voice name="${voice_id}">`,
      `<mstts:express-as style="${desiredAzureStyle}">`,
      `<prosody rate="${rate}">`,
      safe,
      pauseTags(pausesMs),
      `</prosody>`,
      `</mstts:express-as>`,
      `</voice>`,
      `</speak>`,
    ].join('');
    return {
      ssml,
      azure_style: desiredAzureStyle,
      style_fallback_used: false,
      telemetry: {
        STYLE_FALLBACK_USED: 'NO',
        family_style,
        voice_id,
        applied_style: desiredAzureStyle,
      },
    };
  }

  // Fallback: 只保留 rate + 停顿, 不写 express-as。
  const ssml = [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}">`,
    `<voice name="${voice_id}">`,
    `<prosody rate="${rate}">`,
    safe,
    pauseTags(pausesMs),
    `</prosody>`,
    `</voice>`,
    `</speak>`,
  ].join('');
  return {
    ssml,
    azure_style: null,
    style_fallback_used: true,
    telemetry: {
      STYLE_FALLBACK_USED: 'YES',
      family_style,
      voice_id,
      applied_style: null,
    },
  };
}
