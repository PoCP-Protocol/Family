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
  post<T>(path: string, body?: unknown): Promise<ApiResult<T>>;
}
export interface PlatformAppDeps {
  root: HTMLElement;
  api: PlatformApi;
  prefs: SessionPrefsStore;
  /** 提交某 onboarding 步骤(调用 screen.apiHint 对应端点;由宿主装配真实表单/body)。返回是否成功。 */
  submitStep: (screen: OnboardingScreen) => Promise<boolean>;
  /** Today 输入聚合(宿主用既有端点组合;首版可返回 familyDisplayName + 空态)。 */
  loadToday: (familyId: string) => Promise<TodayInputs>;
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
      const screen = screenFor(status);
      this.swap(renderOnboardingScreen(screen, async (s) => { if (await this.d.submitStep(s)) await this.render(); }));
      return;
    }
    const today = buildTodayView(await this.d.loadToday(fid));
    this.swap(renderToday(today, () => { /* 卡片行动由宿主接线(Check-in/Principal/专家) */ }));
  }
}
