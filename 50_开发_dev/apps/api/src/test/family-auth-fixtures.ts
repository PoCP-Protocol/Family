import type pg from 'pg';

export interface TrustedFamilyFixture {
  familyId: string;
  accountId: string;
  accountRef: string;
  guardianId: string;
  meta: { actor: string; correlationId: string; source: string; occurredAt: string };
}

/**
 * 为 Family 可变更操作建立真实的可信家庭上下文。
 * 这只是测试夹具，刻意复现 AuthRepository.createFirstFamilyTx 的语义：
 * Account → ACTIVE binding → OWNER_GUARDIAN ACTIVE membership → family scope。
 * 它不借用 audit_log，也不让创建者历史事件成为授权依据。
 */
export async function seedTrustedFamilyGuardian(
  pool: pg.Pool,
  suffix: string,
  options: { displayName?: string; guardianName?: string; parentRole?: 'MOTHER' | 'FATHER' | 'GUARDIAN' } = {},
): Promise<TrustedFamilyFixture> {
  const accountRef = `integration-${suffix}@family.local`;
  const account = await pool.query<{ account_id: string }>(
    `insert into accounts(external_ref) values ($1) returning account_id`,
    [accountRef],
  );
  const family = await pool.query<{ family_id: string }>(
    `insert into families(display_name) values ($1) returning family_id`,
    [options.displayName ?? `测试家庭-${suffix}`],
  );
  const guardian = await pool.query<{ person_id: string }>(
    `insert into persons(family_id,person_type,parent_role,display_name,account_id)
     values ($1,'PARENT',$2,$3,$4) returning person_id`,
    [family.rows[0].family_id, options.parentRole ?? 'GUARDIAN', options.guardianName ?? '监护人', accountRef],
  );
  await pool.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [guardian.rows[0].person_id, family.rows[0].family_id]);
  await pool.query(`insert into account_person_bindings(account_id,person_id,status) values ($1,$2,'ACTIVE')`, [account.rows[0].account_id, guardian.rows[0].person_id]);
  await pool.query(
    `insert into family_memberships(family_id,person_id,role,status,joined_at)
     values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`,
    [family.rows[0].family_id, guardian.rows[0].person_id],
  );
  return {
    familyId: family.rows[0].family_id,
    accountId: account.rows[0].account_id,
    accountRef,
    guardianId: guardian.rows[0].person_id,
    meta: { actor: guardian.rows[0].person_id, correlationId: `corr-${suffix}`, source: 'vitest', occurredAt: new Date().toISOString() },
  };
}

export async function seedChildSubject(pool: pg.Pool, familyId: string, displayName = '孩子', birthDate: string | null = null): Promise<string> {
  const child = await pool.query<{ person_id: string }>(
    `insert into persons(family_id,person_type,display_name,birth_date)
     values ($1,'CHILD',$2,$3) returning person_id`,
    [familyId, displayName, birthDate],
  );
  await pool.query(
    `insert into family_memberships(family_id,person_id,role,status,joined_at)
     values ($1,$2,'CHILD_SUBJECT','ACTIVE',now())`,
    [familyId, child.rows[0].person_id],
  );
  return child.rows[0].person_id;
}
