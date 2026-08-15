import { ForbiddenException } from '@nestjs/common';
import type pg from 'pg';

export const CREATE_FAMILY_ACTION = 'CreateFamily';

/**
 * TENANCY-V2 桥接:Family 管理权限判定。
 * 通过条件(任一):
 *  (legacy) actor 是该家庭 CreateFamily 的成功审计主体(家庭创建者);
 *  (tenancy) actor(= 可信 personId,来自 FamilyScopeGuard)持有该家庭 ACTIVE 的
 *            OWNER_GUARDIAN / GUARDIAN family_membership。
 * 否则 → 403。(family_memberships 由迁移 0018 建立,master 恒在。)
 */
export async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  const audit = await client.query(
    `select audit_id from audit_logs where family_id = $1 and actor_id = $2 and action_name = $3 and result = 'SUCCESS' limit 1`,
    [familyId, actorId, CREATE_FAMILY_ACTION],
  );
  if ((audit.rowCount ?? 0) >= 1) return;

  // person_id::text 比较:actorId(可信 personId 为 uuid;legacy 为任意字符串)非 UUID 时不匹配而非报错。
  const membership = await client.query(
    `select 1 from family_memberships
      where family_id = $1 and person_id::text = $2 and status = 'ACTIVE'
        and role in ('OWNER_GUARDIAN','GUARDIAN')
      limit 1`,
    [familyId, actorId],
  );
  if ((membership.rowCount ?? 0) >= 1) return;

  throw new ForbiddenException('actor_has_family_manage_permission');
}
