/**
 * WEB-ARCH-001 · Session 状态层。
 * 存 Bearer 令牌(不透明,IAM-101 签发),支持恢复 / 过期 / 撤销后清除。
 * 唯一令牌来源:登录/注册流程;URL 永不作为身份信任来源。
 */
export interface StoredSession {
  token: string;
  personId: string;
  familyId: string;
  expiresAt: string; // ISO
}

const KEY = 'family.session.v1';

export interface SessionStore {
  get(): StoredSession | null;
  set(s: StoredSession): void;
  clear(): void;
  isExpired(now?: number): boolean;
}

/** 基于 Web Storage 的实现;测试可注入内存 Map。 */
export function createSessionStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): SessionStore {
  return {
    get() {
      const raw = storage.getItem(KEY);
      if (!raw) return null;
      try { return JSON.parse(raw) as StoredSession; } catch { return null; }
    },
    set(s) { storage.setItem(KEY, JSON.stringify(s)); },
    clear() { storage.removeItem(KEY); },
    isExpired(now = Date.now()) {
      const s = this.get();
      if (!s) return true;
      return new Date(s.expiresAt).getTime() <= now;
    },
  };
}

/** 简易内存 storage(测试/SSR 用)。 */
export function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => { m.set(k, v); },
    removeItem: (k) => { m.delete(k); },
  };
}
