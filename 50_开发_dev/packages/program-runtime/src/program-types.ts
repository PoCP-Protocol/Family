/**
 * @family/program-runtime · Program Runtime 类型(节奏/交付/进度编排)。
 * Program 是一种【可被平台编排的成长资源(PROGRAM_RESOURCE)】,不是商业 Product,也不是平台中心。
 * 铁律:本域只管【内容引用 + 节奏 + 交付检查点 + 进度投影】,绝不复制 Growth OS 的家庭真实事实。
 * 一切教研/用户可见内容(主题/课件/练习/陪练/反思提示)只保存 *_ref,由 Content Engine 持有内容真相,本域不内联文本。
 */
export type DeliveryCheckpoint = 'NONE' | 'WEEKLY_REVIEW' | 'GROWTH_REPORT' | 'COACH_REVIEW' | 'EXPERT';

export interface LearningActivity { asset_ref: string; est_minutes: number; }   // 短视频/图文课件(Content Engine)
export interface PracticeActivity { instruction_ref: string; }                  // 具体练习动作
export interface CoachActivity { scenario_ref: string; }                        // AI 场景陪练脚本(Principal 作能力)
export interface ReflectActivity { prompt_ref: string; }                        // 反思提示(内容走 Content Engine,不内联)

export interface ProgramDay {
  day_index: number;
  theme_ref: string;                       // 当日主题(内容标识,由 Content Engine 提供家长可读文案)
  learn?: LearningActivity;
  practice?: PracticeActivity;
  coach?: CoachActivity;
  reflect: ReflectActivity;
  // 默认 null=本域不臆造干预。仅经产品/证据契约明确设计并通过 Growth contract 的 Day 才显式绑定既有 Named Action。
  growth_action_binding: string | null;
  delivery_checkpoint: DeliveryCheckpoint;  // 何时真人介入 / 出报告
}

export interface Program {
  program_id: string;                      // Program 身份(≠商业 Product;商业产品未来可 reference 本 program_id)
  version: string;                         // Program 版本(内容/编排演进可追溯)
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
  is_report_day: boolean;      // 报告节奏(结构),非完成
  reached_final_day: boolean;  // 日程走到最后一天,非完成
}
