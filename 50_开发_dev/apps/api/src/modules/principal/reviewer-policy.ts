/**
 * IAM-103 · Review Queue reviewer 授权(设计见 reports/m3/IAM_103_DESIGN.md §7)。
 * 现状缺口:handoffs list/resolve 仅 requireActor(x-actor-id 字符串),无 reviewer 角色授权。
 * behind flag FPAI_REQUIRE_REVIEWER_AUTH=on(默认关=现行为不变);启用须架构师授权,pilot 前必开。
 * FAIL CLOSED:开启后非 reviewer allowlist 内 → 拒绝。
 */
import { ForbiddenException } from '@nestjs/common';

export function isAuthorizedReviewer(actorId: string, opts: { require: boolean; allowlist: readonly string[] }): boolean {
  if (!opts.require) return true;              // flag 关 = 现行为(仅 requireActor,内部 dogfood)
  return opts.allowlist.includes(actorId);      // flag 开 = 必须在 reviewer 名单内
}

/** 供 controller 调用:reviewer 授权门(env 驱动;flag 关时放行,开时按 allowlist 强制)。 */
export function assertReviewer(actorId: string): void {
  const require = process.env.FPAI_REQUIRE_REVIEWER_AUTH === 'on';
  const allowlist = (process.env.FPAI_REVIEWER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!isAuthorizedReviewer(actorId, { require, allowlist })) {
    throw new ForbiddenException('reviewer authorization required (IAM-103); actor not in FPAI_REVIEWER_IDS');
  }
}
