/**
 * PLATFORM-SESSION-001 · 统一 API data client(唯一出网口,cookie 模式)。
 * 浏览器认证走 HttpOnly cookie:每次请求 credentials:'include' 自动带 cookie;
 * JS 不接触 raw token,不再从 WebStorage 附 Authorization。401 → 触发重新登录回调。
 */
export interface ApiError { status: number; code: string; message: string; }
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface ApiClientDeps {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  onUnauthorized?: () => void; // 401 → 跳登录
}

export function createApiClient(deps: ApiClientDeps) {
  const f = deps.fetchImpl ?? fetch;
  async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await f(`${deps.baseUrl}${path}`, {
      method,
      headers,
      credentials: 'include',                    // 带 HttpOnly 会话 cookie(浏览器)
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      deps.onUnauthorized?.();
      return { ok: false, error: { status: 401, code: 'unauthorized', message: 'session invalid or expired' } };
    }
    let payload: unknown = null;
    try { payload = await res.json(); } catch { /* no body */ }
    if (!res.ok) {
      const p = (payload ?? {}) as { message?: string };
      return { ok: false, error: { status: res.status, code: `http_${res.status}`, message: p.message ?? res.statusText } };
    }
    return { ok: true, data: payload as T };
  }
  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  };
}
