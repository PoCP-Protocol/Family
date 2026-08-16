/**
 * FAMILY-ONBOARDING-001 (web) · PlatformApp 编排器(把身份根+onboarding+Today 接成可运行流程)。
 * 登录后:GET /auth/contexts → resolveEntry → 零家庭引导 / 单家庭进入 / 多家庭选择;
 * 进入家庭后:GET onboarding/status → 未完成则渲染当前 onboarding 屏(CTA 驱动 submitStep 前进),
 * 完成则渲染 Today。所有 id 由服务端提供,用户不输 UUID;401 → onUnauthorized(重新登录)。
 */
import type { ApiResult } from '../api/client';
import type { SessionPrefsStore } from '../session/session';
import { resolveEntry, screenFor, type FamilyContextSummary, type OnboardingScreen, type OnboardingStatusView } from '../onboarding/onboarding-flow';
import { buildTodayView, type TodayInputs } from '../today/today-view';
import { renderOnboardingScreen, renderFamilySelector, renderToday } from '../render/screens';

export interface PlatformApi {
  get<T>(path: string): Promise<ApiResult<T>>;
  post<T>(path: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<ApiResult<T>>;
}
export interface PlatformAppDeps {
  root: HTMLElement;
  api: PlatformApi;
  prefs: SessionPrefsStore;
  /** 提交某 onboarding 步骤(调用 screen.apiHint 对应端点;由宿主装配真实表单/body)。返回是否成功。 */
  submitStep: (screen: OnboardingScreen) => Promise<boolean>;
  /** Today 输入聚合(宿主用既有端点组合;首版可返回 familyDisplayName + 空态)。 */
  loadToday: (familyId: string) => Promise<TodayInputs>;
  /** 已完成基础 onboarding 后，由宿主以服务端 child_id 打开可信成长旅程。 */
  openGrowthJourney?: (familyId: string, subjectPersonId: string) => Promise<void>;
  /** App Gate：只以服务端家庭聚合确认 child 生命周期与 SERVICE 同意；不把 AI/追踪等未授权同意作为成长旅程前置。 */
  canOpenGrowthJourney?: (familyId: string, subjectPersonId: string, status: OnboardingStatusView) => Promise<boolean>;
  onUnauthorized?: () => void;
}

export class PlatformApp {
  constructor(private readonly d: PlatformAppDeps) {}

  private swap(node: HTMLElement): void {
    this.d.root.innerHTML = '';
    this.d.root.appendChild(node);
  }

  /** 渲染当前应有界面(可重入:每次状态变化后调用)。 */
  async render(): Promise<void> {
    const ctxRes = await this.d.api.get<{ contexts: FamilyContextSummary[] }>('/auth/contexts');
    if (!ctxRes.ok) { if (ctxRes.error.status === 401) this.d.onUnauthorized?.(); return; }
    const entry = resolveEntry(ctxRes.data.contexts, this.d.prefs.get().selectedFamilyId);

    if (entry.kind === 'FIRST_FAMILY_ONBOARDING') {
      const screen = screenFor({ family_id: '', complete: false, current_step: 'create_family', steps: [], child_id: null });
      this.swap(renderOnboardingScreen(screen, async (s) => { if (await this.d.submitStep(s)) await this.render(); }));
      return;
    }
    if (entry.kind === 'FAMILY_SELECTOR') {
      this.swap(renderFamilySelector(entry.families, (fid) => { this.d.prefs.setSelectedFamily(fid); void this.render(); }));
      return;
    }
    // ENTER_FAMILY
    const fid = entry.familyId;
    this.d.prefs.setSelectedFamily(fid);
    const statusRes = await this.d.api.get<OnboardingStatusView>(`/families/${fid}/onboarding/status`);
    if (!statusRes.ok) { if (statusRes.error.status === 401) this.d.onUnauthorized?.(); return; }
    const status = statusRes.data;
    if (!status.complete) {
      // FAMILY_APP_EXPERIENCE_VERTICAL_001：确定性服务链仅需要已存在的孩子、生命周期与 SERVICE 同意。
      // 其他旧 onboarding 步骤（如 AI/成长追踪）仍保留原流程，不能被本路径隐式授予或写入。
      if (status.child_id && this.d.openGrowthJourney && this.d.canOpenGrowthJourney
        && await this.d.canOpenGrowthJourney(fid, status.child_id, status)) {
        await this.d.openGrowthJourney(fid, status.child_id);
        return;
      }
      const screen = screenFor(status);
      this.swap(renderOnboardingScreen(screen, async (s) => { if (await this.d.submitStep(s)) await this.render(); }));
      return;
    }
    const today = buildTodayView(await this.d.loadToday(fid));
    this.swap(renderToday(today, (key) => {
      // 只有 Today/Growth 入口可开启首条 V3 编排纵切；child_id 均来自服务端 onboarding status，用户不输入或伪造主体标识。
      if ((key === 'focus' || key === 'today_action') && status.child_id && this.d.openGrowthJourney) {
        void this.d.openGrowthJourney(fid, status.child_id);
      }
    }));
  }
}
