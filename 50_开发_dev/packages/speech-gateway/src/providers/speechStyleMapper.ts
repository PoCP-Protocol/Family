/**
 * MM1-B1 · Speech Style Mapper (§12)
 *
 * Family-neutral SpeechStyle ← PrincipalPerformancePlan.speech
 *                            → Azure TTS SSML `<mstts:express-as style="…">`
 *
 * 硬约束(§12):
 *   Performance Planner **不得**直接生成 Azure-specific SSML。
 *   依赖方向:
 *     Performance Planner → Family SpeechStyle → Azure TTS Adapter → Provider SSML/config
 *
 * 换 TTS 只换 style-map 表,不改 Planner。
 */

import type { SpeechPlan } from '@family/fpai-multimodal-contracts';

/**
 * Family-owned SpeechStyle 抽象。
 * 来源: SpeechPlan.tone (contract 定义 5 种) + PerformancePlan.speech.pace / pauses 综合。
 */
export type FamilySpeechStyle =
  | 'CALM_WARM'
  | 'CALM_CAUTIOUS'
  | 'CALM_SERIOUS'
  | 'GENTLE_ENCOURAGING'
  | 'WARM_FIRM';

/**
 * Family style → Azure `<mstts:express-as>` style。
 *
 * evidence_ref:
 *   https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup-voice#voice-styles-and-roles
 *   (Azure zh-CN neural voice 支持的 style: general/assistant/chat/customerservice/newscast/
 *    affectionate/calm/cheerful/gentle/lyrical/sad/serious/angry/disgruntled/embarrassed/
 *    fearful/depressed/envious/... 具体每 voice 支持子集不同,官方文档为准)
 *
 * 未在本任务活体校验时效。人类接手时必须点开当前 Azure 官方文档校对。
 */
export const FAMILY_TO_AZURE_STYLE: Readonly<Record<FamilySpeechStyle, string>> = Object.freeze({
  CALM_WARM: 'gentle',
  CALM_CAUTIOUS: 'calm',
  CALM_SERIOUS: 'serious',
  GENTLE_ENCOURAGING: 'affectionate',
  WARM_FIRM: 'assistant',
});

/**
 * Family style → Azure `<prosody rate="…">` (百分比或 x-slow/slow/medium/fast)。
 */
export const FAMILY_TO_AZURE_RATE: Readonly<Record<'SLOW' | 'MEDIUM' | 'FAST', string>> = Object.freeze({
  SLOW: '-10%',
  MEDIUM: '0%',
  FAST: '+8%',
});

/**
 * 从 Principal Performance Plan.speech 派生一个 Family-owned SpeechStyle。
 * 若 tone 已经是 5 类之一,直接透传;否则按 pace/emphasis 兜底。
 */
export function deriveFamilySpeechStyle(speech: SpeechPlan): FamilySpeechStyle {
  const tone = speech.tone;
  switch (tone) {
    case 'CALM_WARM':
      return 'CALM_WARM';
    case 'WARM_FIRM':
      return 'WARM_FIRM';
    case 'CLEAR_TEACHING':
      return 'GENTLE_ENCOURAGING';
    case 'CALM_SERIOUS':
      return 'CALM_SERIOUS';
    case 'CALM_CAUTIOUS':
      return 'CALM_CAUTIOUS';
    default:
      // 未知 tone → 兜底 CALM_WARM,不假造
      return 'CALM_WARM';
  }
}

/**
 * Family style + rate + optional voice + optional pauses → Azure SSML string。
 * Azure SDK 里 SpeakSsmlAsync 接受这类 SSML。
 *
 * 说明:
 *   - 本函数只在 **Azure TTS Adapter 内部** 使用
 *   - Family-owned 层看不到 SSML
 *   - 若某 style 在当前 voice 不受支持,Azure 会 fallback 到 general,不 throw
 *
 * @param text 要合成的纯文本(**必须**已去 SSML,不含 `<` / `>`,以免注入)
 * @param voice Azure voice name (e.g. `zh-CN-XiaoxiaoNeural`)
 * @param style FamilySpeechStyle
 * @param pace SpeechPlan.pace
 * @param pausesMs 可选停顿,毫秒
 */
export function buildAzureSsml(opts: {
  text: string;
  voice: string;
  style: FamilySpeechStyle;
  pace: 'SLOW' | 'MEDIUM' | 'FAST';
  pausesMs?: number[];
}): string {
  const { text, voice, style, pace, pausesMs } = opts;
  const azureStyle = FAMILY_TO_AZURE_STYLE[style];
  const rate = FAMILY_TO_AZURE_RATE[pace];

  // 极简 escape: 去掉 SSML 危险字符(不引入 xml 编码依赖)。
  const safeText = text.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return c;
    }
  });

  const pauseTags =
    pausesMs && pausesMs.length > 0
      ? pausesMs.map((ms) => `<break time="${Math.max(0, Math.floor(ms))}ms"/>`).join('')
      : '';

  // xmlns:mstts 与 xmlns 是 Azure 官方 SSML 命名空间, 未在本任务活体校验。
  return [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">`,
    `<voice name="${voice}">`,
    `<mstts:express-as style="${azureStyle}">`,
    `<prosody rate="${rate}">`,
    safeText,
    pauseTags,
    `</prosody>`,
    `</mstts:express-as>`,
    `</voice>`,
    `</speak>`,
  ].join('');
}
