/**
 * WEB-ARCH-001 · 路由表类型。真实路由,认证守卫;非 URL-参数产品选择。
 * 主导航收敛为 Today / Growth / Principal / Family(内部工程术语 Wave/M3/WAF 退出消费者 UI)。
 */
export type NavKey = 'today' | 'growth' | 'principal' | 'family';

export interface RouteDef {
  path: string;
  nav: NavKey | null;   // 出现在主导航的哪一项(null=非主导航,如 onboarding/auth)
  requiresAuth: boolean;
  requiresOnboarding: boolean; // 需先完成 onboarding
  legacyAdapter?: string;      // 渐进迁移:临时挂载的旧模块名
}

export const ROUTES: Record<string, RouteDef> = {
  login:      { path: '/login', nav: null, requiresAuth: false, requiresOnboarding: false },
  register:   { path: '/register', nav: null, requiresAuth: false, requiresOnboarding: false },
  onboarding: { path: '/onboarding', nav: null, requiresAuth: true, requiresOnboarding: false },
  today:      { path: '/today', nav: 'today', requiresAuth: true, requiresOnboarding: true },
  growth:     { path: '/growth', nav: 'growth', requiresAuth: true, requiresOnboarding: true, legacyAdapter: 'growth' },
  principal:  { path: '/principal', nav: 'principal', requiresAuth: true, requiresOnboarding: true, legacyAdapter: 'principal' },
  family:     { path: '/family', nav: 'family', requiresAuth: true, requiresOnboarding: true },
};

export const PRIMARY_NAV: NavKey[] = ['today', 'growth', 'principal', 'family'];
