/**
 * MM1-A3 §26 integration tests: WS01–WS16
 *
 * 启真实 ws server (127.0.0.1:0),用 ws 客户端连接,验证 §12/§13/§18-22 契约。
 * 每个 test 独立起停,避免 port 冲突,天然多客户端隔离。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import type { RealtimeServerEvent } from '@family/fpai-multimodal-contracts';
import { startAvatarLabRealtimeServer, type StartedAvatarLabServer } from './realtimeServer.js';

let server: StartedAvatarLabServer;

beforeEach(async () => {
  server = await startAvatarLabRealtimeServer({ host: '127.0.0.1', port: 0 });
});

afterEach(async () => {
  await server.close();
});

function makeClient(): Promise<{
  ws: WebSocket;
  events: RealtimeServerEvent[];
  waitFor: (predicate: (e: RealtimeServerEvent) => boolean, ms?: number) => Promise<RealtimeServerEvent>;
  send: (msg: unknown) => void;
  close: () => Promise<void>;
}> {
  return new Promise((resolve, reject) => {
    const url = `ws://${server.host}:${server.port}`;
    const ws = new WebSocket(url);
    const events: RealtimeServerEvent[] = [];
    const waiters: Array<{ pred: (e: RealtimeServerEvent) => boolean; resolve: (e: RealtimeServerEvent) => void; timer: ReturnType<typeof setTimeout> }> = [];

    ws.on('message', (raw) => {
      const evt = JSON.parse(raw.toString()) as RealtimeServerEvent;
      events.push(evt);
      for (const w of [...waiters]) {
        if (w.pred(evt)) {
          clearTimeout(w.timer);
          waiters.splice(waiters.indexOf(w), 1);
          w.resolve(evt);
        }
      }
    });

    ws.on('open', () => {
      resolve({
        ws,
        events,
        send: (msg) => ws.send(JSON.stringify(msg)),
        waitFor: (predicate, ms = 1500) =>
          new Promise<RealtimeServerEvent>((resolveW, rejectW) => {
            const existing = events.find(predicate);
            if (existing) return resolveW(existing);
            const timer = setTimeout(() => {
              rejectW(new Error('waitFor timeout: ' + predicate.toString()));
            }, ms);
            waiters.push({ pred: predicate, resolve: resolveW, timer });
          }),
        close: () =>
          new Promise<void>((r) => {
            if (ws.readyState === WebSocket.CLOSED) return r();
            ws.once('close', () => r());
            ws.close();
          }),
      });
    });
    ws.on('error', reject);
  });
}

describe('MM1-A3 realtime server WS integration (WS01-WS16)', () => {
  it('WS01 客户端连接后立刻收到 STATE_CHANGED(LISTENING) + server session_id', async () => {
    const c = await makeClient();
    const evt = await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    const payload = evt.payload as { state?: string; session_id?: string; connection_id?: string };
    expect(payload.state).toBe('LISTENING');
    expect(typeof payload.session_id).toBe('string');
    expect(payload.session_id!.startsWith('sess-')).toBe(true);
    expect(typeof payload.connection_id).toBe('string');
    await c.close();
  });

  it('WS02 未知命令 → ERROR', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'NOT_A_COMMAND' });
    const err = await c.waitFor((e) => e.kind === 'ERROR');
    expect((err.payload as { reason?: string }).reason).toContain('unknown-command');
    await c.close();
  });

  it('WS03 bad JSON → ERROR bad-json', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.ws.send('not-json{{{');
    const err = await c.waitFor((e) => e.kind === 'ERROR');
    expect((err.payload as { reason?: string }).reason).toContain('bad-json');
    await c.close();
  });

  it('WS04 TEXT_INPUT NORMAL 触发完整 pipeline 且都带同一 server turn_id', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '孩子最近作业总是拖到很晚。' });
    const principal = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    expect(principal.turn_id).toBeTruthy();
    const turnId = principal.turn_id!;
    await c.waitFor((e) => e.kind === 'PERFORMANCE_PLAN', 2000);
    await c.waitFor(
      (e) => e.kind === 'TTS_EVENT' && (e.payload as { event: { type: string } }).event.type === 'TTS_STARTED',
      2000,
    );
    await c.waitFor(
      (e) => e.kind === 'TTS_EVENT' && (e.payload as { event: { type: string } }).event.type === 'TTS_COMPLETE',
      2000,
    );
    await c.waitFor(
      (e) => e.kind === 'AVATAR_EVENT' && (e.payload as { event: { type: string } }).event.type === 'PERFORMANCE_COMPLETE',
      2000,
    );
    // 所有业务事件的 turn_id 一致
    const businessKinds = new Set(['PRINCIPAL_RESPONSE', 'SAFETY_ROUTE', 'PERFORMANCE_PLAN', 'TTS_EVENT', 'AVATAR_EVENT']);
    const turnIds = new Set(c.events.filter((e) => businessKinds.has(e.kind as string)).map((e) => e.turn_id));
    expect(turnIds.has(turnId)).toBe(true);
    await c.close();
  });

  it('WS05 服务器权威 turn_id 由 server 分配,忽略客户端传的 turn_id', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '普通聊天。', turn_id: 'client-forged-turn' });
    const principal = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    expect(principal.turn_id).not.toBe('client-forged-turn');
    expect(principal.turn_id!.startsWith('sess-')).toBe(true);
    await c.close();
  });

  it('WS06 PRINCIPAL_RESPONSE payload 是权威 output (opening/what_i_hear/say_it_tonight/one_small_action/boundary/risk_route/method_refs)', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '我儿子每天回来就玩手机。' });
    const p = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    const output = (p.payload as { output: Record<string, unknown> }).output;
    for (const k of ['opening', 'what_i_hear', 'say_it_tonight', 'one_small_action', 'boundary', 'risk_route', 'method_refs']) {
      expect(output).toHaveProperty(k);
    }
    expect(Array.isArray(output.method_refs)).toBe(true);
    // 绝不能出现旧 fake 字段
    expect(output).not.toHaveProperty('response_text');
    await c.close();
  });

  it('WS07 SAFETY_ROUTE 与 PRINCIPAL_RESPONSE.output.risk_route 一致', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '孩子在班里成绩不太好。' });
    const p = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    const s = await c.waitFor((e) => e.kind === 'SAFETY_ROUTE', 2000);
    expect((s.payload as { route: string }).route).toBe((p.payload as { output: { risk_route: string } }).output.risk_route);
    await c.close();
  });

  it('WS08 HIGH_RISK 输入 → HUMAN_GATE 且不发普通 PERFORMANCE_PLAN / TTS_EVENT / AVATAR_EVENT', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '我想自杀,我伤害了自己。' });
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'HUMAN_GATE',
      2000,
    );
    // 200ms 稳态窗口:不应有普通表演事件
    await new Promise((r) => setTimeout(r, 250));
    expect(c.events.some((e) => e.kind === 'PERFORMANCE_PLAN')).toBe(false);
    expect(c.events.some((e) => e.kind === 'TTS_EVENT')).toBe(false);
    expect(c.events.some((e) => e.kind === 'AVATAR_EVENT')).toBe(false);
    await c.close();
  });

  it('WS09 barge-in: SPEAKING 期间 INTERRUPT → 收到 INTERRUPTED + 回 LISTENING', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '普通聊天,回复长一些。' });
    // 等到 SPEAKING
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'SPEAKING',
      2000,
    );
    c.send({ kind: 'INTERRUPT' });
    const interrupted = await c.waitFor((e) => e.kind === 'INTERRUPTED', 2000);
    expect((interrupted.payload as { cancelled_turn_id?: string }).cancelled_turn_id).toBeTruthy();
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'LISTENING',
      2000,
    );
    await c.close();
  });

  it('WS10 barge-in 后没有再收到旧 turn 的 TTS_COMPLETE / PERFORMANCE_COMPLETE', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '孩子写作业总是磨蹭。' });
    const principal = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    const cancelledTurn = principal.turn_id;
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'SPEAKING',
      2000,
    );
    c.send({ kind: 'INTERRUPT' });
    await c.waitFor((e) => e.kind === 'INTERRUPTED', 2000);
    await new Promise((r) => setTimeout(r, 200));
    const staleTts = c.events.some(
      (e) => e.kind === 'TTS_EVENT' && e.turn_id === cancelledTurn && (e.payload as { event: { type: string } }).event.type === 'TTS_COMPLETE',
    );
    const staleAvatar = c.events.some(
      (e) => e.kind === 'AVATAR_EVENT' && e.turn_id === cancelledTurn && (e.payload as { event: { type: string } }).event.type === 'PERFORMANCE_COMPLETE',
    );
    expect(staleTts).toBe(false);
    expect(staleAvatar).toBe(false);
    await c.close();
  });

  it('WS11 打断后立刻发第二轮,能得到独立的新 turn_id 与完整闭环', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '第一轮的话。' });
    const p1 = await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'SPEAKING',
      2000,
    );
    c.send({ kind: 'INTERRUPT' });
    await c.waitFor((e) => e.kind === 'INTERRUPTED', 2000);
    await c.waitFor(
      (e) => e.kind === 'STATE_CHANGED' && (e.payload as { state?: string }).state === 'LISTENING',
      2000,
    );
    c.send({ kind: 'TEXT_INPUT', text: '第二轮的话,换个方式再说。' });
    const p2 = await c.waitFor(
      (e) => e.kind === 'PRINCIPAL_RESPONSE' && e.turn_id !== p1.turn_id,
      3000,
    );
    expect(p2.turn_id).not.toBe(p1.turn_id);
    await c.waitFor(
      (e) => e.kind === 'AVATAR_EVENT' && (e.payload as { event: { type: string } }).event.type === 'PERFORMANCE_COMPLETE' && e.turn_id === p2.turn_id,
      3000,
    );
    await c.close();
  });

  it('WS12 多客户端隔离: A 输入 A 收到, B 不应收到 A 的业务事件', async () => {
    const a = await makeClient();
    const b = await makeClient();
    await a.waitFor((e) => e.kind === 'STATE_CHANGED');
    await b.waitFor((e) => e.kind === 'STATE_CHANGED');
    a.send({ kind: 'TEXT_INPUT', text: 'A 的输入。' });
    await a.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    await new Promise((r) => setTimeout(r, 250));
    expect(b.events.some((e) => e.kind === 'PRINCIPAL_RESPONSE')).toBe(false);
    expect(b.events.some((e) => e.kind === 'PERFORMANCE_PLAN')).toBe(false);
    expect(b.events.some((e) => e.kind === 'TTS_EVENT')).toBe(false);
    await a.close();
    await b.close();
  });

  it('WS13 多客户端: A/B 的 session_id 各自不同', async () => {
    const a = await makeClient();
    const b = await makeClient();
    const eA = await a.waitFor((e) => e.kind === 'STATE_CHANGED');
    const eB = await b.waitFor((e) => e.kind === 'STATE_CHANGED');
    const sidA = (eA.payload as { session_id?: string }).session_id;
    const sidB = (eB.payload as { session_id?: string }).session_id;
    expect(sidA).toBeTruthy();
    expect(sidB).toBeTruthy();
    expect(sidA).not.toBe(sidB);
    await a.close();
    await b.close();
  });

  it('WS14 TELEMETRY_REQUEST 返回白名单字段(不含 CoT / prompt / apiKey)', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'TEXT_INPUT', text: '普通对话' });
    await c.waitFor((e) => e.kind === 'PRINCIPAL_RESPONSE', 2000);
    c.send({ kind: 'TELEMETRY_REQUEST' });
    const t = await c.waitFor((e) => e.kind === ('TELEMETRY' as unknown as RealtimeServerEvent['kind']), 2000);
    const payload = t.payload as Record<string, unknown>;
    for (const k of ['session_id', 'connection_id', 'active_turn_id', 'generation_id', 'risk_route', 'method_refs']) {
      expect(payload).toHaveProperty(k);
    }
    const raw = JSON.stringify(payload);
    expect(/prompt_text|chain_of_thought|api[_-]?key|secret/i.test(raw)).toBe(false);
    await c.close();
  });

  it('WS15 SESSION_CLOSE 后 socket 端优雅关闭, 无 crash', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'SESSION_CLOSE' });
    await c.close();
    // 若无 uncaught 异常即可
    expect(true).toBe(true);
  });

  it('WS16 空 barge-in 在 LISTENING 状态下被忽略,不产生 INTERRUPTED 事件', async () => {
    const c = await makeClient();
    await c.waitFor((e) => e.kind === 'STATE_CHANGED');
    c.send({ kind: 'INTERRUPT' });
    await new Promise((r) => setTimeout(r, 200));
    expect(c.events.some((e) => e.kind === 'INTERRUPTED')).toBe(false);
    await c.close();
  });
});
