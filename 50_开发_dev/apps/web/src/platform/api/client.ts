/**
 * WEB-ARCH-001 · 统一 API data client(唯一出网口)。
 * 自动附 Authorization: Bearer;401 → 触发登出回调(重新登录);错误规范化。
 * 消费端不再手拼 x-actor-id / familyId 查询串作为信任来源。
 */
import type { SessionStore } from '../session/session';

export interface ApiError { status: number; code: string; message: string; }
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface ApiClientDeps {
  baseUrl: string;
  session: SessionStore;
  fetchImpl?: typeof fetch;
  onUnauthorized?: () => void; // 401/过期 → 跳登录
}

export function createApiClient(deps: ApiClientDeps) {
  const f = deps.fetchImpl ?? fetch;
  async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    const s = deps.session.get();
    if (!s || deps.session.isExpired()) {
      deps.session.clear();
      deps.onUnauthorized?.();
      return { ok: false, error: { status: 401, code: 'no_session', message: 'not authenticated' } };
    }
    const headers: Record<string, string> = { authorization: `Bearer ${s.token}` };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await f(`${deps.baseUrl}${path}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      deps.session.clear();
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
