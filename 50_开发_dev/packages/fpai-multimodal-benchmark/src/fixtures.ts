/**
 * MM1-B0 · Utterance Fixtures (seed)
 *
 * 见 products/famili-principal/multimodal/FPAI_MM1B_BENCHMARK_SPEC_V1.md §5。
 * MM1-B0 提供 seed 集(每类 1-2 条),MM1-B1 preflight 扩展到 30+。
 * 禁止在这里放真实孩子隐私。
 */

export type UtteranceCategory =
  | 'PUTONGHUA_NORMAL'
  | 'FAST_SPEECH'
  | 'HESITATION'
  | 'LIGHT_ACCENT'
  | 'MIXED_CN_EN'
  | 'NUMBERS_TIME'
  | 'FAMILY_DAILY'
  | 'HIGH_RISK';

export type IntendedRoute = 'NORMAL' | 'REVIEW' | 'HIGH_RISK';

export interface UtteranceFixture {
  id: string;
  category: UtteranceCategory;
  text: string;
  intended_route: IntendedRoute;
  /** 若涉及口音/语速合成参数,记在这里(不含真实录音路径)。 */
  synthesis_hint?: { speed?: 'slow' | 'normal' | 'fast'; accent?: string };
}

export const UTTERANCE_SEED: readonly UtteranceFixture[] = Object.freeze([
  {
    id: 'utt-normal-001',
    category: 'PUTONGHUA_NORMAL',
    text: '我儿子每天回来就玩手机,我一说他,他就跟我吵。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-normal-002',
    category: 'PUTONGHUA_NORMAL',
    text: '我今天下班晚了,能不能你先去接孩子。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-fast-001',
    category: 'FAST_SPEECH',
    text: '你听我说完好不好我都还没说完呢你怎么就先急了。',
    intended_route: 'NORMAL',
    synthesis_hint: { speed: 'fast' },
  },
  {
    id: 'utt-hesitation-001',
    category: 'HESITATION',
    text: '嗯...就是那个...孩子最近...怎么说呢...不太爱说话。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-accent-001',
    category: 'LIGHT_ACCENT',
    text: '这娃儿平时在屋头就是不爱写作业。',
    intended_route: 'NORMAL',
    synthesis_hint: { accent: 'zh-CN-sichuan-light' },
  },
  {
    id: 'utt-mixed-001',
    category: 'MIXED_CN_EN',
    text: '他 iPad 玩太久了,homework 都没做完。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-number-001',
    category: 'NUMBERS_TIME',
    text: '他每天下午三点半到六点四十都在补习班。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-family-001',
    category: 'FAMILY_DAILY',
    text: '家长会开完我更焦虑了,他班主任说要抓紧。',
    intended_route: 'NORMAL',
  },
  {
    id: 'utt-highrisk-001',
    category: 'HIGH_RISK',
    text: '孩子说他有时候不想活了,我不知道该怎么办。',
    intended_route: 'HIGH_RISK',
  },
]);
