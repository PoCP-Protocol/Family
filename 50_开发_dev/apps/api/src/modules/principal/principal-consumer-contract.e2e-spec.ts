import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// W2-102 消费契约 E2E:锁定 apps/web 的法咪莉校长章节(principal.js)依赖的 API 响应字段契约。
// 若后端改名/丢字段导致消费 UI 静默失效,此测试即挂。默认 internal profile(确定性,零外呼)。

let app: INestApplication; let baseUrl = ''; let pool: pg.Pool; let familyId: string;

beforeAll(async () => {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  delete process.env.FPAI_PRINCIPAL_PROVIDER; delete process.env.FPAI_RUNTIME_PROFILE; // 确定性
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => {
  await cleanFamilyCoreTables(pool);
  familyId = (await pool.query(`insert into families(display_name) values ('consumer-contract') returning family_id`)).rows[0].family_id;
});
afterAll(async () => { await app.close(); await pool.end(); });

const H = { 'content-type': 'application/json', 'x-actor-id': 'child-1' };
async function ask(message: string) {
  const s = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1' }) });
  const sid = (await s.json() as { session_id: string }).session_id;
  const m = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message }) });
  return { status: m.status, body: await m.json() as Record<string, any> };
}

describe('W2-102 consumer contract: fields the 校长 chapter renders', () => {
  it('NORMAL: response carries the exact fields principal.js renders', async () => {
    const { status, body } = await ask('孩子一回家就玩手机,一说就顶嘴');
    expect(status).toBe(201);
    expect(body.risk_route).toBe('NORMAL');
    expect(body.human_handoff).toBe(false);
    expect(body.action_proposal_id).toBeTruthy();
    // principal.js answerCard 读取的字段必须存在且非空
    for (const f of ['opening', 'what_i_hear', 'possible_pattern', 'one_small_action']) {
      expect(typeof body.response?.[f]).toBe('string');
      expect(body.response[f].length).toBeGreaterThan(0);
    }
  });

  it('HIGH_RISK: safety-card contract (handoff, no coaching response, no proposal)', async () => {
    const { body } = await ask('孩子说不想活了');
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    expect(body.response_id).toBeNull();
    expect(body.action_proposal_id).toBeNull();
  });

  it('confirm without active priority -> non-2xx (drives honest "还差一步" guidance, not false success)', async () => {
    const { body } = await ask('孩子作业拖拉磨蹭');
    const accept = await fetch(`${baseUrl}/families/${familyId}/principal/proposals/${body.action_proposal_id}/accept`, {
      method: 'POST', headers: H, body: JSON.stringify({ onboarding_id: '00000000-0000-0000-0000-000000000000', priority_id: '00000000-0000-0000-0000-000000000000', idempotency_key: 'wf1c-contract-1' }),
    });
    expect(accept.ok).toBe(false); // 无活动优先级 → 后端拒;UI 走"还差一步"引导
    expect(accept.status).toBeGreaterThanOrEqual(400);
  });
});
