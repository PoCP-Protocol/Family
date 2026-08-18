/**
 * MM1-B1.1 · Non-destructive Addon Entry
 *
 * 独立入口 (mm1b1.html), 完全不 import 或修改 frozen client.ts / realtimeServer.ts。
 *
 * 用途:
 *   - offline browser gate: 无 Azure credential 也能看到 Avatar2DRenderer + 嘴型运动 +
 *     StreamingAudioPlayer + Mic UI(默认 disabled)。
 *   - 用 fake driver 驱动一个假 TTS 流: PCM 静音 + 定时 viseme, 验证 lipsync 时钟。
 *
 * 严禁:
 *   - 引入 Azure SDK。
 *   - 主动请求 mic permission (feature flag = NO 时)。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Avatar2DRenderer, type FamilyMouthShape } from './avatar2DRenderer';
import { StreamingAudioPlayer } from './streamingAudioPlayer';
import { SpeechPlaybackClock } from './speechPlaybackClock';
import { VisemeScheduler } from './visemeScheduler';
import { RealMicUi } from './realMicUi';
import { getIdentityResolver } from '@family/fpai-multimodal-runtime'; // MM2: Runtime identity binding (PATCH-003)
import type { CharacterIdentity } from '@family/fpai-multimodal-contracts';

interface AddonQueryFlags {
  real_speech: 'YES' | 'NO';
}

function readFlags(): AddonQueryFlags {
  try {
    const p = new URLSearchParams(window.location.search);
    const rs = (p.get('real_speech') ?? 'NO').toUpperCase();
    return { real_speech: rs === 'YES' ? 'YES' : 'NO' };
  } catch {
    return { real_speech: 'NO' };
  }
}

function makeSilencePcm(nSamples: number): Uint8Array {
  return new Uint8Array(nSamples * 2); // 全 0 = 静音
}

function mountAddon(): void {
  const flags = readFlags();
  const canvas = document.getElementById('mm1b1-canvas') as HTMLCanvasElement | null;
  const stateOut = document.getElementById('mm1b1-state') as HTMLDivElement | null;
  const micState = document.getElementById('mm1b1-mic-state') as HTMLDivElement | null;
  const startBtn = document.getElementById('mm1b1-mic-start') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('mm1b1-mic-stop') as HTMLButtonElement | null;
  const fakeSpeakBtn = document.getElementById('mm1b1-fake-speak') as HTMLButtonElement | null;
  const interruptBtn = document.getElementById('mm1b1-interrupt') as HTMLButtonElement | null;
  const stateLine = document.getElementById('mm1b1-status') as HTMLDivElement | null;

  if (!canvas || !stateOut || !stateLine) {
    console.warn('mm1b1 addon: DOM anchors missing');
    return;
  }

  // MM2: Establish runtime identity binding
  const resolver = getIdentityResolver();
  const authorizedIdentity: CharacterIdentity = {
    version: 'character_v1.0',
    frozen_date: '2026-08-17',
    character_name: '法咪莉校长',
    persona: '知性邻家姐姐',
    ownership: 'Family-owned IP',
    visual_dna: [
      'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
      'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
    ],
    ip_alignment: {
      bobo_method_inheritance: true,
      bobo_identity_clone: false,
      bobo_face_clone: false,
      bobo_voice_clone: false,
      real_person_likeness_clone: false,
    },
  };
  const profile = resolver.resolve(authorizedIdentity); // Runtime validation → RendererProfile

  const renderer = new Avatar2DRenderer({ canvas, profile });
  const player = new StreamingAudioPlayer();
  const clock = new SpeechPlaybackClock({ provider: player });
  const scheduler = new VisemeScheduler({ clock });
  scheduler.onApply((shape) => {
    renderer.setMouthShape(shape);
  });

  // 状态渲染循环
  const rafLoop = () => {
    renderer.render();
    if (stateOut) {
      const snap = renderer.snapshot();
      stateOut.textContent = `state=${snap.state} · mouth=${snap.mouth_shape} · gesture=${snap.gesture} · frame=${snap.frame_index}`;
    }
    if (stateLine) {
      const s = clock.snapshot();
      stateLine.textContent = `clock: ${s.state} · pos=${s.playback_position_ms.toFixed(0)}ms · turn=${s.turn_id ?? '-'} · gen=${s.generation_id ?? '-'} · flushed=${scheduler.getMetrics().viseme_stale_drop_count} · late=${scheduler.getMetrics().viseme_late_drop_count}`;
    }
    requestAnimationFrame(rafLoop);
  };
  requestAnimationFrame(rafLoop);

  // 状态默认 RESTING
  renderer.setState('RESTING');
  renderer.setExpression('CALM_WARM');

  // Mic UI (默认 disabled)
  const mic = new RealMicUi({
    featureFlag: flags.real_speech,
    startFn: async () => {
      // 真实 wiring 将在 credential 到位后接入; 本 offline gate 中仅演示 UI 状态。
      throw new Error('BLOCKED_MISSING_CREDENTIAL_OR_REAL_SPEECH_DISABLED');
    },
    stopFn: async () => {},
  });
  mic.onStateChange((s, meta) => {
    if (micState) micState.textContent = `mic: ${s}${meta?.reason ? ' (' + meta.reason + ')' : ''}`;
  });
  if (micState) micState.textContent = `mic: ${mic.getState()}`;

  startBtn?.addEventListener('click', () => { void mic.requestStart(); });
  stopBtn?.addEventListener('click', () => { void mic.requestStop(); });

  // Fake TTS driver: 使用假的 PCM 静音 + 定时 viseme, 全部离线
  let fakeTurnCounter = 0;
  fakeSpeakBtn?.addEventListener('click', () => {
    const turn_id = `t-${++fakeTurnCounter}`;
    const generation_id = `g-${fakeTurnCounter}-0`;
    renderer.setState('SPEAKING');
    renderer.triggerNod();
    player.beginTurn(turn_id, generation_id);
    clock.beginTurn(turn_id, generation_id);

    // 3 秒静音 chunk (每 200ms 一块, 16kHz)
    const chunkSamples = Math.floor(16000 * 0.2);
    for (let i = 0; i < 15; i++) {
      player.enqueueChunk({
        turn_id, generation_id,
        chunkIndex: i,
        pcmBytes: makeSilencePcm(chunkSamples),
        sampleRate: 16000,
      });
    }

    // 15 个 viseme 事件, 按 200ms 均匀分布
    const shapes: FamilyMouthShape[] = [
      'REST', 'OPEN_MEDIUM', 'OPEN_WIDE', 'ROUND', 'SMILE_SPEECH',
      'OPEN_SMALL', 'ROUND', 'OPEN_MEDIUM', 'OPEN_WIDE', 'SMILE_SPEECH',
      'CLOSED', 'ROUND', 'OPEN_MEDIUM', 'CLOSED', 'REST',
    ];
    shapes.forEach((s, i) => {
      scheduler.schedule({
        turn_id, generation_id,
        mouth_shape: s,
        audio_offset_ms: i * 200,
      });
    });

    // 结束
    setTimeout(() => {
      renderer.setState('RESTING');
      renderer.setMouthShape('REST');
      player.endTurn();
      clock.endTurn();
    }, 3200);
  });

  interruptBtn?.addEventListener('click', () => {
    renderer.setState('INTERRUPTED');
    renderer.setMouthShape('REST');
    scheduler.flushAll();
    player.flush('user-interrupt');
    clock.flush();
    setTimeout(() => renderer.setState('RESTING'), 400);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    mountAddon();
  } else {
    document.addEventListener('DOMContentLoaded', mountAddon);
  }
}

export { mountAddon };
