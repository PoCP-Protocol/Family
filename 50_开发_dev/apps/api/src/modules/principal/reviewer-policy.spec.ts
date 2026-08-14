import { describe, expect, it } from 'vitest';
import { isAuthorizedReviewer } from './reviewer-policy';

describe('IAM-103 · reviewer 授权(§7 缺口)', () => {
  it('flag 关 → 放行(现行为不变,内部 dogfood)', () => {
    expect(isAuthorizedReviewer('anyone', { require: false, allowlist: [] })).toBe(true);
    expect(isAuthorizedReviewer('anyone', { require: false, allowlist: ['r1'] })).toBe(true);
  });
  it('flag 开 + 在 reviewer allowlist → 放行', () => {
    expect(isAuthorizedReviewer('r1', { require: true, allowlist: ['r1', 'r2'] })).toBe(true);
  });
  it('flag 开 + 不在 allowlist → 拒绝(FAIL CLOSED)', () => {
    expect(isAuthorizedReviewer('intruder', { require: true, allowlist: ['r1'] })).toBe(false);
    expect(isAuthorizedReviewer('intruder', { require: true, allowlist: [] })).toBe(false);
  });
});
