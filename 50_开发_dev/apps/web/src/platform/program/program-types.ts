/**
 * FAMILY-PRODUCT-RUNTIME-001 · Program Runtime 类型(产品/节奏/交付/进度编排)。
 * 铁律:本域只管【内容引用 + 节奏 + 交付检查点 + 进度】,绝不复制 Growth OS 的家庭真实事实。
 * 教研内容(课程/练习/陪练脚本)以 *_ref 指向 Content Engine 的循证课件,不在此内联臆造文本。
 */
export type DeliveryCheckpoint = 'NONE' | 'WEEKLY_REVIEW' | 'GROWTH_REPORT' | 'COACH_REVIEW' | 'EXPERT';

export interface LearningActivity { asset_ref: string; est_minutes: number; }   // 短视频/图文课件(Content Engine)
export interface PracticeActivity { instruction_ref: string; }                  // 具体练习动作
export interface CoachActivity { scenario_ref: string; }                        // AI 场景陪练脚本(Principal 作能力)
export interface ReflectPrompt { prompt: string; }                             // 晚间 1 分钟记录提示

export interface ProgramDay {
  day_index: number;
  theme_ref: string;                       // 当日主题(内容标识,由 Content Engine 提供家长可读文案)
  learn?: LearningActivity;
  practice?: PracticeActivity;
  coach?: CoachActivity;
  reflect: ReflectPrompt;
  growth_action_binding: string | null;    // 绑定到既有 Growth OS Named Action(如 LISTEN_BEFORE_RESPOND);null=纯学习日
  delivery_checkpoint: DeliveryCheckpoint;  // 何时真人介入 / 出报告
}

export interface Program {
  product_id: string;
  title: string;
  problem_domain: string;                  // 冻结:仅一个问题域
  life_stage: string;
  total_days: number;
  days: ProgramDay[];
}

/** 运行时视图:某一天该看到什么 + 是否报告日 + 检查点。 */
export interface ProgramDayView {
  day_index: number;
  total_days: number;
  theme_ref: string;
  activities: Array<{ kind: 'LEARN' | 'PRACTICE' | 'COACH' | 'REFLECT'; ref: string; est_minutes?: number }>;
  growth_action_binding: string | null;
  delivery_checkpoint: DeliveryCheckpoint;
  is_report_day: boolean;
  is_final_day: boolean;
}
