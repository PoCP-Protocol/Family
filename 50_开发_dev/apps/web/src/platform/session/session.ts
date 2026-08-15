/**
 * PLATFORM-SESSION-001 · 浏览器会话(cookie 模式)。
 * 会话令牌由服务端 HttpOnly cookie 承载,JS 读不到明文 → WebStorage 【绝不】存 raw token。
 * 本地只存【非机密 UI 偏好】(如上次选择的 family_id);它绝不是授权凭据。
 */
export interface SessionPrefs {
  selectedFamilyId?: string;   // 仅 UI 偏好;真正授权由服务端 cookie→AuthContext 决定
  selectedSubjectRef?: string; // 仅 UI 偏好,须服务端校验属活动家庭
}

const KEY = 'family.prefs.v1';

export interface SessionPrefsStore {
  get(): SessionPrefs;
  setSelectedFamily(familyId: string | undefined): void;
  setSelectedSubject(subjectRef: string | undefined): void;
  clear(): void;
}

/** 基于 Web Storage 的偏好存储。【不变量】:绝不写入任何会话令牌/机密。 */
export function createSessionPrefsStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): SessionPrefsStore {
  const read = (): SessionPrefs => {
    const raw = storage.getItem(KEY);
    if (!raw) return {};
    try { return JSON.parse(raw) as SessionPrefs; } catch { return {}; }
  };
  const write = (p: SessionPrefs) => storage.setItem(KEY, JSON.stringify(p));
  return {
    get: read,
    setSelectedFamily(familyId) { const p = read(); p.selectedFamilyId = familyId; write(p); },
    setSelectedSubject(subjectRef) { const p = read(); p.selectedSubjectRef = subjectRef; write(p); },
    clear() { storage.removeItem(KEY); },
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
