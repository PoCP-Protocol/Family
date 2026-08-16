import { ForbiddenException } from '@nestjs/common';
import type pg from 'pg';

/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 Growth Mutator Permission Bridge.
 * 当前可变更 Family/Growth 路径只接受可信 Person：
 * ACTIVE account_person_binding → ACTIVE family_membership → OWNER_GUARDIAN/GUARDIAN。
 * 历史审计事件（包括 CreateFamily）是留痕，不构成当前授权，也不能恢复已撤销成员资格。
 */
export async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  const membership = await client.query(
    `select 1
       from family_memberships m
       join account_person_bindings b on b.person_id=m.person_id and b.status='ACTIVE'
      where m.family_id=$1 and m.person_id::text=$2 and m.status='ACTIVE'
        and m.role in ('OWNER_GUARDIAN','GUARDIAN')
      limit 1`,
    [familyId, actorId],
  );
  if ((membership.rowCount ?? 0) >= 1) return;
  throw new ForbiddenException('trusted_family_manage_context_required');
}
