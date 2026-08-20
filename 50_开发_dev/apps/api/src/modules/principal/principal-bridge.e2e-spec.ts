import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// M3-101A-C Action Bridge E2E(真实 PostgreSQL)。
// 验证:被采纳的 NORMAL proposal → 既有 StartIntervention Named Action;桥接不绕任何 canonical 门;
// 缺前置时 Growth 零写、proposal 保持 PROPOSED;proposal 单次可用。Provider 仍 Fake,REAL_MODEL_CALLS=0。

let app: INestApplication;
let baseUrl = '';
let pool: pg.Pool;

beforeAll(async () => {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { await cleanFamilyCoreTables(pool); });
afterAll(async () => { await app.close(); await pool.end(); });

describe('Principal Action Bridge E2E (M3-101A-C, real PostgreSQL)', () => {
  it('POSITIVE: accepting a NORMAL proposal starts the canonical intervention (episode + 7 actions); proposal is single-use', async () => {
    const setup = await seedConfirmedProfile('corr-bridge-happy');
    const insight = await (await getPriorityInsight(setup.familyId, setup.onboardingId)).json() as PriorityInsight;
    const confirm = await (await confirmPriority(setup.familyId, setup.onboardingId, insight.draft.draft_id, 'R03', 'corr-bridge-happy', 'idem-bridge-confirm')).json() as ConfirmPriority;
    expect(confirm.priority?.status).toBe('ACTIVE');

    const consumer = await issueConsumerSession(setup.familyId);
    const proposal = await createNormalProposal(setup.familyId, consumer.token);
    expect(proposal.action_proposal_id).toBeTruthy();

    const acceptRes = await accept(setup.familyId, proposal.action_proposal_id!, {
      onboarding_id: setup.onboardingId, priority_id: confirm.priority!.priority_id, idempotency_key: 'idem-bridge-accept',
    }, 'corr-bridge-happy', consumer.token);
    expect(acceptRes.status).toBe(201);
    const accepted = await acceptRes.json() as BridgeResult;
    expect(accepted.episode.status).toBe('ACTIVE');
    expect(accepted.episode.priority_id).toBe(confirm.priority!.priority_id);
    expect(accepted.actions).toHaveLength(7);
    expect(accepted.actions.every((a) => a.boundary === 'ACTION_IS_NOT_OUTCOME')).toBe(true);

    // canonical 落库
    await expectCount('intervention_episodes', 1);
    await expectCount('growth_actions', 7);
    // proposal 溯源:ACCEPTED + 关联 episode + 记桥接权限人
    const p = await pool.query(`select status, accepted_episode_id, accepted_by_actor_id, canonical from principal_action_proposals where proposal_id=$1`, [proposal.action_proposal_id]);
    expect(p.rows[0].status).toBe('ACCEPTED');
    expect(p.rows[0].accepted_episode_id).toBe(accepted.episode.episode_id);
    expect(p.rows[0].accepted_by_actor_id).toBe(consumer.personId);
    expect(p.rows[0].canonical).toBe(false);
    // 产品事件
    const ev = (await pool.query(`select event_name from product_events where family_id=$1`, [setup.familyId])).rows.map((r) => r.event_name);
    expect(ev).toContain('principal_proposal_accepted');
    expect(ev).toContain('principal_action_bridged');

    // 单次可用:再次 accept 同一 proposal → 409,且不产生第二个 episode
    const again = await accept(setup.familyId, proposal.action_proposal_id!, {
      onboarding_id: setup.onboardingId, priority_id: confirm.priority!.priority_id, idempotency_key: 'idem-bridge-accept-2',
    }, 'corr-bridge-happy', consumer.token);
    expect(again.status).toBe(409);
    await expectCount('intervention_episodes', 1);
  });

  it('NEGATIVE: unknown / cross-family proposal -> 404', async () => {
    // 未知 proposal
    const bare = await createBareFamily();
    const bareConsumer = await issueConsumerSession(bare);
    const p = await createNormalProposal(bare, bareConsumer.token);
    const unknown = await accept(bare, randomUUID(), { onboarding_id: randomUUID(), priority_id: randomUUID(), idempotency_key: 'idem-unknown' }, 'corr-unknown', bareConsumer.token);
    expect(unknown.status).toBe(404);
    // 跨家庭:proposal 属 bare,却用另一个 family 的 URL → 404(防跨家庭枚举)
    const other = await createBareFamily();
    const otherConsumer = await issueConsumerSession(other);
    const cross = await accept(other, p.action_proposal_id!, { onboarding_id: randomUUID(), priority_id: randomUUID(), idempotency_key: 'idem-cross' }, 'corr-cross', otherConsumer.token);
    expect(cross.status).toBe(404);
  });

  it('NEGATIVE: non-bridgeable intervention -> 409, no growth writes', async () => {
    const bare = await createBareFamily();
    const consumer = await issueConsumerSession(bare);
    const p = await createNormalProposal(bare, consumer.token);
    await pool.query(`update principal_action_proposals set recommended_intervention_id='UNKNOWN_INTERVENTION' where proposal_id=$1`, [p.action_proposal_id]);
    const res = await accept(bare, p.action_proposal_id!, { onboarding_id: randomUUID(), priority_id: randomUUID(), idempotency_key: 'idem-nonbridge' }, 'corr-nonbridge', consumer.token);
    expect(res.status).toBe(409);
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);
    const status = (await pool.query(`select status from principal_action_proposals where proposal_id=$1`, [p.action_proposal_id])).rows[0].status;
    expect(status).toBe('PROPOSED');
  });

  it('NEGATIVE: missing canonical permission (bare family) -> 403, Growth zero writes, proposal stays PROPOSED', async () => {
    const bare = await createBareFamily();
    const creator = await issueConsumerSession(bare);
    const p = await createNormalProposal(bare, creator.token);
    const unauthorized = await issueConsumerSession(bare, false);
    const res = await accept(bare, p.action_proposal_id!, { onboarding_id: randomUUID(), priority_id: randomUUID(), idempotency_key: 'idem-noperm' }, 'corr-noperm', unauthorized.token);
    expect(res.status).toBe(403); // assertFamilyManagePermission fires (no CreateFamily audit)
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);
    const status = (await pool.query(`select status from principal_action_proposals where proposal_id=$1`, [p.action_proposal_id])).rows[0].status;
    expect(status).toBe('PROPOSED');
  });

  it('NEGATIVE: no active growth priority (canonical family, priority not confirmed) -> 404, zero episodes', async () => {
    const setup = await seedConfirmedProfile('corr-bridge-nopriority'); // has CreateFamily audit + consents, but NO confirmPriority
    const consumer = await issueConsumerSession(setup.familyId);
    const proposal = await createNormalProposal(setup.familyId, consumer.token);
    const res = await accept(setup.familyId, proposal.action_proposal_id!, {
      onboarding_id: setup.onboardingId, priority_id: randomUUID(), idempotency_key: 'idem-nopriority',
    }, 'corr-bridge-nopriority', consumer.token);
    expect(res.status).toBe(404); // active_growth_priority_not_found
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);
  });
});

// ---- Principal helpers ----
async function createBareFamily(): Promise<string> {
  const r = await pool.query(`insert into families(display_name) values ('bridge-bare') returning family_id`);
  return r.rows[0].family_id;
}

async function createNormalProposal(familyId: string, token: string): Promise<{ action_proposal_id: string | null; session_id: string }> {
  const sRes = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, {
    method: 'POST', headers: principalHeaders('corr-proposal', token), body: JSON.stringify({ subject_ref: 'child-1' }),
  });
  expect(sRes.status).toBe(201);
  const sid = (await sRes.json() as { session_id: string }).session_id;
  const mRes = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, {
    method: 'POST', headers: principalHeaders('corr-proposal', token), body: JSON.stringify({ subject_ref: 'child-1', message: '孩子写作业总是拖拉磨蹭，我该怎么办' }),
  });
  expect(mRes.status).toBe(201);
  const body = await mRes.json() as { action_proposal_id: string | null };
  return { action_proposal_id: body.action_proposal_id, session_id: sid };
}

function accept(familyId: string, proposalId: string, body: Record<string, unknown>, correlationId: string, token: string): Promise<Response> {
  return fetch(`${baseUrl}/families/${familyId}/principal/proposals/${proposalId}/accept`, {
    method: 'POST', headers: principalHeaders(correlationId, token), body: JSON.stringify(body),
  });
}

function principalHeaders(correlationId: string, token: string): Record<string, string> {
  return { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-correlation-id': correlationId };
}

async function issueConsumerSession(familyId: string, canManage = true): Promise<{ token: string; personId: string }> {
  const account = await pool.query(
    `insert into accounts(external_ref, status) values ($1, 'ACTIVE') returning account_id`,
    [`bridge-consumer-${randomUUID()}`],
  );
  const person = canManage
    ? await pool.query(
      `insert into persons(family_id, person_type, parent_role, display_name)
       values ($1, 'PARENT', 'GUARDIAN', 'Bridge监护人') returning person_id`,
      [familyId],
    )
    : await pool.query(
      `insert into persons(family_id, person_type, display_name, birth_date)
       values ($1, 'CHILD', 'Bridge孩子', '2013-05-01') returning person_id`,
      [familyId],
    );
  const accountId = account.rows[0].account_id as string;
  const personId = person.rows[0].person_id as string;
  await pool.query(
    `insert into account_person_bindings(account_id, person_id, status) values ($1, $2, 'ACTIVE')`,
    [accountId, personId],
  );
  await pool.query(
    `insert into family_memberships(family_id, person_id, role, status, joined_at)
     values ($1, $2, $3, 'ACTIVE', now())`,
    [familyId, personId, canManage ? 'OWNER_GUARDIAN' : 'CHILD_SUBJECT'],
  );
  const token = `fam_${randomUUID()}`;
  await pool.query(
    `insert into identity_sessions(token_hash, account_ref, expires_at)
     values ($1, $2, now() + interval '1 day')`,
    [createHash('sha256').update(token).digest('hex'), accountId],
  );
  return { token, personId };
}

// ---- Canonical fixture helpers (self-contained; mirrors family-wave2.e2e-spec setup) ----
async function seedConfirmedProfile(correlationId: string): Promise<SeededState> {
  const family = await postJson('/families', { display_name: 'Bridge E2E 家庭', idempotency_key: `idem-${correlationId}-family` }, correlationId, `idem-${correlationId}-family`);
  const familyBody = await family.json() as { family: { family_id: string } };
  expect(family.status).toBe(201);
  const fid = familyBody.family.family_id;

  const parent = await postJsonExpect<{ parent: { person_id: string } }>(`/families/${fid}/parents`, {
    role: 'GUARDIAN', display_name: '监护人', account_id: 'architect-1', idempotency_key: `idem-${correlationId}-parent`,
  }, correlationId);
  const child = await postJsonExpect<{ child: { person_id: string } }>(`/families/${fid}/children`, {
    display_name: '孩子', birth_date: '2012-06-01', idempotency_key: `idem-${correlationId}-child`,
  }, correlationId);
  await postJsonExpect(`/families/${fid}/relationships`, {
    person_a_id: parent.parent.person_id, person_b_id: child.child.person_id,
    relationship_type: 'GUARDIAN_CHILD', idempotency_key: `idem-${correlationId}-relationship`,
  }, correlationId);
  await postJsonExpect(`/families/${fid}/life-stages`, {
    child_id: child.child.person_id, life_stage_code: 'EARLY_ADOLESCENCE_12_15',
    effective_from: '2026-08-10T00:00:00.000Z', idempotency_key: `idem-${correlationId}-life-stage`,
  }, correlationId);

  for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING']) {
    await postJsonExpect(`/families/${fid}/consents`, {
      subjectPersonId: child.child.person_id, guardianPersonId: parent.parent.person_id,
      purpose, policyVersion: `policy-${correlationId}`,
    }, correlationId, `idem-${correlationId}-consent-${purpose}`);
  }

  const onboarding = await postJsonExpect<{ onboarding: { onboarding_id: string } }>(`/families/${fid}/growth/onboarding`, {
    childId: child.child.person_id, guardianPersonId: parent.parent.person_id, structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-onboarding`);
  const oid = onboarding.onboarding.onboarding_id;

  await seedPerspectivePair(fid, oid, parent.parent.person_id, child.child.person_id, correlationId);
  const drafts = await postJsonExpect<{ drafts: Array<{ draft_id: string; dimension_id: string }> }>(`/families/${fid}/growth/onboardings/${oid}/profile-drafts`, {}, correlationId, `idem-${correlationId}-profile-drafts`);
  const r03 = drafts.drafts.find((d) => d.dimension_id === 'R03');
  expect(r03).toBeDefined();
  const profile = await postJsonExpect<{ profile: { profile_id: string } }>(`/families/${fid}/growth/profile-drafts/${r03!.draft_id}/confirm`, {}, correlationId, `idem-${correlationId}-confirm-profile`);

  return { familyId: fid, parentId: parent.parent.person_id, childId: child.child.person_id, onboardingId: oid, profileId: profile.profile.profile_id };
}

async function seedPerspectivePair(familyId: string, onboardingId: string, parentId: string, childId: string, correlationId: string): Promise<void> {
  const parentResponse = await postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId, authorPersonId: parentId, perspectiveType: 'PARENT_PERSPECTIVE', captureMode: 'DIRECT_SELF_REPORT',
    relatedDimensionIds: ['P03', 'R03'], content: { promptId: 'wave2-parent-v1', responseText: '我经常还没听完就开始讲道理。', selectedSignals: ['interrupts'] },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-parent-perspective`);
  const childResponse = await postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId, authorPersonId: childId, perspectiveType: 'CHILD_PERSPECTIVE', captureMode: 'FACILITATED_ENTRY',
    relatedDimensionIds: ['R03', 'R04'], content: { promptId: 'wave2-child-v1', responseText: '我希望大人先听我说完再回应。', selectedSignals: ['wants-to-be-heard'] },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-child-perspective`);
  expect(parentResponse.status).toBe(201);
  expect(childResponse.status).toBe(201);
}

function getPriorityInsight(familyId: string, onboardingId: string): Promise<Response> {
  return fetch(`${baseUrl}/families/${familyId}/growth/onboardings/${onboardingId}/priority`, { method: 'GET', headers: baseHeaders('corr-get-insight') });
}
function confirmPriority(familyId: string, onboardingId: string, draftId: string, decision: string, correlationId: string, idempotencyKey: string): Promise<Response> {
  return postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/priority/confirm`, { draft_id: draftId, decision }, correlationId, idempotencyKey);
}
function postJson(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers: baseHeaders(correlationId, idempotencyKey), body: JSON.stringify(body) });
}
async function postJsonExpect<TBody>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<TBody> {
  const response = await postJson(path, body, correlationId, idempotencyKey);
  expect(response.status).toBe(201);
  return await response.json() as TBody;
}
function baseHeaders(correlationId: string, idempotencyKey?: string): Record<string, string> {
  return {
    authorization: 'Bearer test-token', 'content-type': 'application/json', 'x-actor-id': 'architect-1',
    'x-correlation-id': correlationId, 'x-source': 'vitest-e2e', ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  };
}
async function expectCount(tableName: string, expected: number): Promise<void> {
  const result = await pool.query(`select count(*)::int as count from ${tableName}`);
  expect(result.rows[0].count).toBe(expected);
}

interface SeededState { familyId: string; parentId: string; childId: string; onboardingId: string; profileId: string }
interface PriorityInsight { draft: { draft_id: string; candidate: null | { dimension_id: string } } }
interface ConfirmPriority { priority: null | { priority_id: string; status: string } }
interface BridgeResult {
  proposal_id: string;
  episode: { episode_id: string; priority_id: string; status: string };
  actions: Array<{ action_id: string; day_index: number; boundary: string }>;
}
