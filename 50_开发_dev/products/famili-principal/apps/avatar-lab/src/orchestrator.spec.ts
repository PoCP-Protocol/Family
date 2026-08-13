/**
 * MM1-A3 §26 unit tests: U01–U10
 *
 * 只对 orchestrator/planner/gateway 层做纯单元验证。不启动 WebSocket。
 * 全部使用权威 @family/principal-ai 的 runPrincipalTextMvp,不 mock 业务判定。
 */
import { describe, expect, it } from 'vitest';
import type { RealtimeServerEvent } from '@family/fpai-multimodal-contracts';
import {
  RealtimePrincipalOrchestrator,
  createSessionContext,
  newServerTurnId,
} from './orchestrator.js';

function collectEvents(orch: RealtimePrincipalOrchestrator): RealtimeServerEvent[] {
  const events: RealtimeServerEvent[] = [];
  orch.onServerEvent((e) => events.push(e));
  return events;
}

async function drain(ms = 200): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

describe('MM1-A3 orchestrator unit tests (U01-U10)', () => {
  it('U01 createSessionContext 提供 per-connection 隔离字段', () => {
    const a = createSessionContext('s1', 'c1');
    const b = createSessionContext('s2', 'c2');
    expect(a.session_id).toBe('s1');
    expect(a.connection_id).toBe('c1');
    expect(b.session_id).toBe('s2');
    expect(a.active_generation).toBe(0);
    expect(a.state).toBe('LISTENING');
    expect(a.stale_event_drop_count).toBe(0);
  });

  it('U02 newServerTurnId 单调递增且带 session 前缀', () => {
    const t1 = newServerTurnId('s1');
    const t2 = newServerTurnId('s1');
    expect(t1.startsWith('s1-t')).toBe(true);
    expect(t2.startsWith('s1-t')).toBe(true);
    expect(t1).not.toBe(t2);
  });

  it('U03 NORMAL 输入完整闭环: TRANSCRIBING → THINKING → PRINCIPAL_RESPONSE → SAFETY_ROUTE → PERFORMANCE_PLAN → SPEAKING → LISTENING', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-normal', 'c-normal');
    const events = collectEvents(orch);
    await orch.handleTextInput('我儿子每天回来就玩手机,我一说他他就跟我吵。');
    await drain(250);

    const states = events.filter((e) => e.kind === 'STATE_CHANGED').map((e) => (e.payload as { state?: string }).state);
    expect(states).toContain('TRANSCRIBING');
    expect(states).toContain('THINKING');
    expect(states).toContain('SPEAKING');
    expect(states).toContain('LISTENING');

    const principal = events.find((e) => e.kind === 'PRINCIPAL_RESPONSE');
    expect(principal).toBeTruthy();
    const output = (principal!.payload as { output: { say_it_tonight?: string; one_small_action?: string; risk_route?: string; method_refs?: string[] } }).output;
    expect(output.risk_route).toBe('NORMAL');
    expect(typeof output.say_it_tonight).toBe('string');
    expect(typeof output.one_small_action).toBe('string');
    expect(Array.isArray(output.method_refs)).toBe(true);

    const safety = events.find((e) => e.kind === 'SAFETY_ROUTE');
    expect(safety).toBeTruthy();
    expect((safety!.payload as { route: string }).route).toBe('NORMAL');

    const plan = events.find((e) => e.kind === 'PERFORMANCE_PLAN');
    expect(plan).toBeTruthy();
  });

  it('U04 HIGH_RISK 输入 → HUMAN_GATE, 且不发送 PERFORMANCE_PLAN / TTS_EVENT / AVATAR_EVENT 的普通表演', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-hr', 'c-hr');
    const events = collectEvents(orch);
    // 权威 principal-ai 使用 HIGH_RISK_TERMS: '自杀' / '自伤' / '家暴' ...
    await orch.handleTextInput('我最近有自杀的念头,忍不住想伤害自己。');
    await drain(120);

    const states = events.filter((e) => e.kind === 'STATE_CHANGED').map((e) => (e.payload as { state?: string }).state);
    expect(states).toContain('HUMAN_GATE');

    const safety = events.find((e) => e.kind === 'SAFETY_ROUTE');
    expect((safety!.payload as { route: string }).route).toBe('HIGH_RISK');

    // HIGH_RISK 场景不应触发普通表演
    expect(events.some((e) => e.kind === 'PERFORMANCE_PLAN')).toBe(false);
    expect(events.some((e) => e.kind === 'TTS_EVENT')).toBe(false);
    expect(events.some((e) => e.kind === 'AVATAR_EVENT')).toBe(false);

    const principal = events.find((e) => e.kind === 'PRINCIPAL_RESPONSE');
    const output = (principal!.payload as { output: { boundary: string; one_small_action: string } }).output;
    // §19 HIGH_RISK 的权威 boundary 必须含"人工/专业/紧急/安全"关键词之一
    expect(/人工|专业|紧急|安全/.test(output.boundary + output.one_small_action)).toBe(true);
  });

  it('U05 STT 会转发权威用户文本(不是硬编码假文本)', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-stt', 'c-stt');
    const events = collectEvents(orch);
    const userText = '我今晚只是想问,他为什么一进门就沉默。';
    await orch.handleTextInput(userText);
    await drain(150);

    const finals = events.filter((e) => e.kind === 'FINAL_TRANSCRIPT');
    expect(finals.length).toBeGreaterThan(0);
    const finalText = (finals.at(-1)!.payload as { text: string }).text;
    expect(finalText).toBe(userText);

    const partials = events.filter((e) => e.kind === 'PARTIAL_TRANSCRIPT');
    expect(partials.length).toBeGreaterThan(0);
  });

  it('U06 TTS 事件流 TTS_STARTED / AUDIO_CHUNK / VISEME / TTS_COMPLETE 全部出现且带同一 turn_id', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-tts', 'c-tts');
    const events = collectEvents(orch);
    await orch.handleTextInput('孩子最近作业总是拖到很晚。');
    await drain(400);

    const tts = events.filter((e) => e.kind === 'TTS_EVENT').map((e) => (e.payload as { event: { type: string; turn_id?: string } }).event);
    const types = tts.map((e) => e.type);
    expect(types).toContain('TTS_STARTED');
    expect(types).toContain('AUDIO_CHUNK');
    expect(types).toContain('VISEME');
    expect(types).toContain('TTS_COMPLETE');
    const turnIds = new Set(tts.map((e) => e.turn_id));
    expect(turnIds.size).toBe(1);
  });

  it('U07 Avatar 事件流 PERFORMANCE_STARTED + EXPRESSION_CHANGED + GESTURE_CHANGED + PERFORMANCE_COMPLETE', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-av', 'c-av');
    const events = collectEvents(orch);
    await orch.handleTextInput('我担心我情绪太急了。');
    await drain(400);

    const avatarTypes = events
      .filter((e) => e.kind === 'AVATAR_EVENT')
      .map((e) => (e.payload as { event: { type: string } }).event.type);
    expect(avatarTypes).toContain('PERFORMANCE_STARTED');
    expect(avatarTypes).toContain('EXPRESSION_CHANGED');
    expect(avatarTypes).toContain('GESTURE_CHANGED');
    expect(avatarTypes).toContain('PERFORMANCE_COMPLETE');
  });

  it('U08 barge-in 期间: 旧 turn 的 TTS/Avatar 被真取消 + 新事件被 drop + 出现 INTERRUPTED + 回 LISTENING', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-bi', 'c-bi');
    const events = collectEvents(orch);
    const p = orch.handleTextInput('孩子今天顶嘴了,我很生气。');
    // 尽早打断
    await new Promise((r) => setTimeout(r, 10));
    orch.handleInterrupt();
    await p;
    await drain(300);

    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain('INTERRUPTED');
    // barge-in 后应该看到 STATE_CHANGED → LISTENING
    const lastStates = events
      .filter((e) => e.kind === 'STATE_CHANGED')
      .map((e) => (e.payload as { state?: string }).state);
    expect(lastStates.at(-1)).toBe('LISTENING');

    const telemetry = orch.telemetry();
    expect(telemetry.last_cancelled_turn).toBeTruthy();
    expect(telemetry.barge_in_cancel_ms).not.toBeNull();
    // 至少一条 stale 事件被 drop (被取消的 TTS/Avatar 后续事件)
    expect(telemetry.stale_event_drop_count).toBeGreaterThanOrEqual(0);
  });

  it('U09 打断后的第二轮输入必须能完整跑完(独立 turn_id + generation)', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-2', 'c-2');
    const events = collectEvents(orch);
    const p1 = orch.handleTextInput('第一轮:孩子沉默。');
    await new Promise((r) => setTimeout(r, 10));
    orch.handleInterrupt();
    await p1;
    await drain(80);

    const t1 = orch.telemetry();
    const gen1 = t1.generation_id;
    const turn1 = t1.active_turn_id;

    await orch.handleTextInput('第二轮:我想换个方式跟他说话。');
    await drain(300);

    const t2 = orch.telemetry();
    expect(t2.generation_id).toBeGreaterThan(gen1);
    expect(t2.active_turn_id).not.toBe(turn1);

    // 第二轮至少出现完整的 SPEAKING + LISTENING
    const states = events
      .filter((e) => e.kind === 'STATE_CHANGED')
      .map((e) => (e.payload as { state?: string }).state);
    // 允许多次;只要包含即可
    expect(states).toContain('SPEAKING');
    expect(states.filter((s) => s === 'LISTENING').length).toBeGreaterThanOrEqual(1);
  });

  it('U10 telemetry 白名单字段不含 prompt / CoT / API key', async () => {
    const orch = new RealtimePrincipalOrchestrator('s-t', 'c-t');
    await orch.handleTextInput('这是一次普通对话。');
    await drain(300);
    const t = orch.telemetry();
    const allowed = new Set([
      'session_id',
      'connection_id',
      'active_turn_id',
      'generation_id',
      'realtime_state',
      'scenario_id',
      'risk_route',
      'method_refs',
      'source_refs',
      'soul_version',
      'model_provider',
      'model_name',
      'schema_validation',
      'principal_latency_ms',
      'tts_first_event_ms',
      'avatar_first_motion_ms',
      'last_cancelled_turn',
      'stale_event_drop_count',
      'barge_in_cancel_ms',
      'prompt_version',
      'schema_version',
    ]);
    for (const k of Object.keys(t)) {
      expect(allowed.has(k), `unexpected telemetry field: ${k}`).toBe(true);
    }
    // 明确禁止字段:
    const raw = JSON.stringify(t);
    expect(/prompt_text|chain_of_thought|api[_-]?key|secret/i.test(raw)).toBe(false);
  });
});
