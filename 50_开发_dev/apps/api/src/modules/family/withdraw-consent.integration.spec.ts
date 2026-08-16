import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService WithdrawConsent integration', () => {
  let pool: pg.Pool;
  let repository: FamilyRepository;
  let service: FamilyService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new FamilyRepository();
    service = new FamilyService(repository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await repository?.onModuleDestroy();
    await pool?.end();
  });

  it('withdraws only the active consent, preserves history, writes audit/event, and hides it from active aggregate', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('withdraw-positive');
    const granted = await grantServiceConsent(seed, 'idem-withdraw-grant');

    const withdrawn = await service.withdrawConsent({
      family_id: seed.familyId,
      consent_id: granted.consent.consent_id,
      idempotency_key: 'idem-withdraw-positive',
    }, seed.meta);

    expect(withdrawn.consent).toMatchObject({
      consent_id: granted.consent.consent_id,
      family_id: seed.familyId,
      purpose: 'SERVICE',
      status: 'WITHDRAWN',
    });
    expect(withdrawn.consent.withdrawn_at).toEqual(expect.any(String));

    const rows = await pool.query('select status, withdrawn_at from consents where consent_id = $1', [granted.consent.consent_id]);
    expect(rows.rows[0].status).toBe('WITHDRAWN');
    expect(rows.rows[0].withdrawn_at).not.toBeNull();

    const activeRows = await pool.query('select consent_id from consents where family_id = $1 and status = \'GRANTED\'', [seed.familyId]);
    expect(activeRows.rowCount).toBe(0);

    const event = await pool.query('select payload from outbox_events where event_name = $1', ['ConsentWithdrawn']);
    expect(event.rowCount).toBe(1);
    expect(event.rows[0].payload.consent_id).toBe(granted.consent.consent_id);

    await expectCount('audit_logs', 4);
    await expectCount('outbox_events', 4);
  });

  it('replays an identical withdrawal idempotently and rejects a changed request', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('withdraw-idempotency');
    const granted = await grantServiceConsent(seed, 'idem-withdraw-grant');
    const request = { family_id: seed.familyId, consent_id: granted.consent.consent_id, idempotency_key: 'idem-withdraw-replay' };

    const first = await service.withdrawConsent(request, seed.meta);
    const second = await service.withdrawConsent(request, seed.meta);
    expect(second).toEqual(first);

    await expect(service.withdrawConsent({ ...request, consent_id: '00000000-0000-4000-8000-000000000001' }, seed.meta)).rejects.toThrow('Idempotency conflict');
    await expectCount('consents', 1);
    await expectCount('outbox_events', 4);
  });

  it('fails closed for non-guardian and cross-family consent access', async () => {
    const first = await seedFamilyWithAuthorizedGuardian('withdraw-cross-a');
    const second = await seedFamilyWithAuthorizedGuardian('withdraw-cross-b');
    const firstConsent = await grantServiceConsent(first, 'idem-withdraw-cross-grant');

    await expect(service.withdrawConsent({
      family_id: first.familyId,
      consent_id: firstConsent.consent.consent_id,
      idempotency_key: 'idem-withdraw-non-guardian',
    }, { ...first.meta, actor: 'not-the-guardian' })).rejects.toThrow('trusted_family_manage_context_required');

    await expect(service.withdrawConsent({
      family_id: second.familyId,
      consent_id: firstConsent.consent.consent_id,
      idempotency_key: 'idem-withdraw-cross-family',
    }, second.meta)).rejects.toThrow('consent_not_found');

    const row = await pool.query('select status from consents where consent_id = $1', [firstConsent.consent.consent_id]);
    expect(row.rows[0].status).toBe('GRANTED');
  });

  it('does not withdraw another purpose and rejects an already withdrawn consent', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('withdraw-purpose');
    const serviceConsent = await grantServiceConsent(seed, 'idem-withdraw-service-grant');
    const research = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'RESEARCH',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-withdraw-research-grant',
    }, seed.meta);

    await service.withdrawConsent({ family_id: seed.familyId, consent_id: serviceConsent.consent.consent_id, idempotency_key: 'idem-withdraw-service' }, seed.meta);
    const rows = await pool.query('select purpose, status from consents order by purpose');
    expect(rows.rows).toEqual(expect.arrayContaining([
      { purpose: 'RESEARCH', status: 'GRANTED' },
      { purpose: 'SERVICE', status: 'WITHDRAWN' },
    ]));

    await expect(service.withdrawConsent({ family_id: seed.familyId, consent_id: serviceConsent.consent.consent_id, idempotency_key: 'idem-withdraw-service-again' }, seed.meta)).rejects.toThrow('consent_not_active');
    expect(research.consent.status).toBe('GRANTED');
  });

  async function seedFamilyWithAuthorizedGuardian(suffix: string) {
    const seed = await seedTrustedFamilyGuardian(pool, `withdraw-${suffix}`, { displayName: '生命周期家庭', guardianName: '监护人', parentRole: 'GUARDIAN' });
    const child = await service.addChild({ family_id: seed.familyId, display_name: '孩子', idempotency_key: `idem-child-${suffix}` }, seed.meta);
    await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.guardianId,
      person_b_id: child.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: `idem-rel-${suffix}`,
    }, seed.meta);
    return { familyId: seed.familyId, parentId: seed.guardianId, childId: child.child.person_id, meta: seed.meta };
  }

  async function grantServiceConsent(seed: { familyId: string; parentId: string; childId: string; meta: ReturnType<typeof testMeta> }, idempotencyKey: string) {
    return service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: idempotencyKey,
    }, seed.meta);
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

function testMeta(actor: string, correlationId: string) {
  return { actor, correlationId, source: 'vitest', occurredAt: new Date().toISOString() };
}
