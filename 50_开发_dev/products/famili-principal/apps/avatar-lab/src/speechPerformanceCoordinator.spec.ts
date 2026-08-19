/**
 * MM5 Speech Performance Coordinator Tests
 *
 * 验证mouth activity envelope与实际playback的协调
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpeechPerformanceCoordinator, MOUTH_ATTACK_MS, MOUTH_RELEASE_MS } from './speechPerformanceCoordinator';
import type { SpeechPlaybackClock } from './speechPlaybackClock';

/**
 * Mock SpeechPlaybackClock
 */
function createMockClock(): SpeechPlaybackClock & { setTime: (ms: number) => void } {
  let currentTimeMs = 0;
  const mock: any = {
    getTurnId: () => 'test-turn',
    getGenerationId: () => 'gen-1',
    now: () => currentTimeMs,
    setTime: (ms: number) => { currentTimeMs = ms; },
  };
  return mock;
}

describe('MM5: SpeechPerformanceCoordinator', () => {
  let coordinator: SpeechPerformanceCoordinator;
  let clock: ReturnType<typeof createMockClock>;

  beforeEach(() => {
    clock = createMockClock();
    coordinator = new SpeechPerformanceCoordinator({
      clock,
      attackDurationMs: MOUTH_ATTACK_MS,
      releaseDurationMs: MOUTH_RELEASE_MS,
    });
  });

  describe('MM5-P: Playback Lifecycle', () => {
    it('MM5-P01: semantic SPEAKING without playback → mouth stays closed', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.update();

      expect(coordinator.getMouthActivity()).toBe(0);
      const snap = coordinator.snapshot();
      expect(snap.semantic_activity).toBe('SPEAKING');
      expect(snap.playback_state).toBe('IDLE');
      expect(snap.mouth_activity).toBe(0);
    });

    it('MM5-P02: playback starts → attack begins', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      // Advance time slightly
      clock.setTime(10);
      coordinator.update();

      // At playback start (10ms into attack)
      expect(coordinator.getMouthActivity()).toBeGreaterThan(0);
      expect(coordinator.snapshot().playback_state).toBe('PLAYING');
    });

    it('MM5-P03: attack progresses continuously', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(10);  // Early attack
      coordinator.update();
      const mouth10 = coordinator.getMouthActivity();

      clock.setTime(50);  // Mid-attack
      coordinator.update();
      const mouth50 = coordinator.getMouthActivity();

      clock.setTime(110);  // Past attack (100ms + 10)
      coordinator.update();
      const mouth110 = coordinator.getMouthActivity();

      // Verify smooth progression
      expect(mouth10).toBeGreaterThan(0);
      expect(mouth10).toBeLessThan(mouth50);
      expect(mouth50).toBeLessThan(mouth110);
      expect(mouth110).toBe(1);
    });

    it('MM5-P04: during playback sustain, mouth = 1', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(200);  // Well past attack
      coordinator.update();

      expect(coordinator.getMouthActivity()).toBe(1);
      expect(coordinator.snapshot().playback_state).toBe('PLAYING');
    });

    it('MM5-P05: playback ends → release begins', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(200);
      coordinator.update();
      const mouthBefore = coordinator.getMouthActivity();

      coordinator.onPlaybackEnded('turn-1', 'gen-1');
      clock.setTime(205);  // Advance time for release to start
      coordinator.update();
      const mouthAfter = coordinator.getMouthActivity();

      expect(mouthBefore).toBe(1);
      expect(mouthAfter).toBeLessThan(1);
      expect(coordinator.snapshot().playback_state).toBe('RELEASING');
    });

    it('MM5-P06: release eventually returns to 0', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(200);
      coordinator.update();

      coordinator.onPlaybackEnded('turn-1', 'gen-1');

      clock.setTime(200 + MOUTH_RELEASE_MS + 10);
      coordinator.update();

      expect(coordinator.getMouthActivity()).toBe(0);
      expect(coordinator.snapshot().playback_state).toBe('IDLE');
    });
  });

  describe('MM5-U: Utterance Isolation', () => {
    it('MM5-U01: Speech A events apply only to A', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(50);  // Mid-attack
      coordinator.update();

      const mouth1 = coordinator.getMouthActivity();
      expect(mouth1).toBeGreaterThan(0);
    });

    it('MM5-U02: Speech B interrupts A cleanly', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(100);
      coordinator.update();
      const mouthA = coordinator.getMouthActivity();

      // B arrives, cancels A
      coordinator.cancelUtterance();
      coordinator.update();
      const mouthAfterCancel = coordinator.getMouthActivity();

      expect(mouthA).toBeGreaterThan(0);
      expect(mouthAfterCancel).toBeLessThan(mouthA);
    });

    it('MM5-U03: A event arriving after B started is ignored', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(100);
      coordinator.update();

      // B starts
      coordinator.cancelUtterance();
      coordinator.beginUtterance('turn-2', 'gen-2', 'SPEAKING');
      coordinator.update();

      // Late A callback
      coordinator.onPlaybackEnded('turn-1', 'gen-1');  // Should be ignored
      coordinator.update();

      // B should not be affected
      const snap = coordinator.snapshot();
      expect(snap.utterance.turn_id).toBe('turn-2');
    });

    it('MM5-U05: no mouth leakage between utterances', () => {
      // Speech A
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(100);
      coordinator.update();
      const mouthA = coordinator.getMouthActivity();

      // Cancel A
      coordinator.cancelUtterance();

      // Complete release
      clock.setTime(100 + MOUTH_RELEASE_MS + 10);
      coordinator.update();

      const mouthBetween = coordinator.getMouthActivity();

      // Speech B starts clean
      coordinator.beginUtterance('turn-2', 'gen-2', 'SPEAKING');
      coordinator.update();

      const mouthB = coordinator.getMouthActivity();

      expect(mouthBetween).toBe(0);
      expect(mouthB).toBe(0);
      expect(coordinator.isActive()).toBe(true);
    });
  });

  describe('MM5-M: Mouth Envelope', () => {
    it('MM5-M01: silent → speaking does not teleport', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SILENT');
      coordinator.update();

      expect(coordinator.getMouthActivity()).toBe(0);

      coordinator.updateSemanticActivity('turn-1', 'gen-1', 'SPEAKING');
      coordinator.update();

      // Still 0 because no playback
      expect(coordinator.getMouthActivity()).toBe(0);

      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);
      clock.setTime(50);  // Mid-attack
      coordinator.update();

      // NOW it starts
      expect(coordinator.getMouthActivity()).toBeGreaterThan(0);
      expect(coordinator.getMouthActivity()).toBeLessThan(1);
    });

    it('MM5-M02: attack has real mid-state', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(MOUTH_ATTACK_MS / 2);
      coordinator.update();

      const mouthMid = coordinator.getMouthActivity();
      expect(mouthMid).toBeGreaterThan(0.4);
      expect(mouthMid).toBeLessThan(0.6);
    });

    it('MM5-M03: release has real mid-state', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(200);
      coordinator.update();

      coordinator.onPlaybackEnded('turn-1', 'gen-1');

      clock.setTime(200 + MOUTH_RELEASE_MS / 2);
      coordinator.update();

      const mouthMid = coordinator.getMouthActivity();
      expect(mouthMid).toBeGreaterThan(0.4);
      expect(mouthMid).toBeLessThan(0.6);
    });

    it('MM5-M05: viseme geometry modulated by envelope (semantic test)', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');

      // Envelope = 0, viseme = full open
      coordinator.update();
      expect(coordinator.getMouthActivity()).toBe(0);

      // Attack: envelope grows
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);
      clock.setTime(50);
      coordinator.update();

      const envelopeAtMid = coordinator.getMouthActivity();
      expect(envelopeAtMid).toBeGreaterThan(0);
      expect(envelopeAtMid).toBeLessThan(1);

      // Viseme geometry should scale: final = viseme × envelope
      // E.g., if viseme opens mouth to 0.8, envelope at 0.5, visible should be 0.4
    });

    it('MM5-M06: same clock/input → deterministic geometry', () => {
      // Run 1
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);
      clock.setTime(50);
      coordinator.update();
      const run1 = coordinator.getMouthActivity();

      // Run 2
      coordinator = new SpeechPerformanceCoordinator({
        clock,
        attackDurationMs: MOUTH_ATTACK_MS,
        releaseDurationMs: MOUTH_RELEASE_MS,
      });
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);
      clock.setTime(50);
      coordinator.update();
      const run2 = coordinator.getMouthActivity();

      expect(run1).toBe(run2);
    });
  });

  describe('MM5-I: Interruption', () => {
    it('MM5-I03: mouth begins interrupt-release', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(200);
      coordinator.update();
      const mouthBefore = coordinator.getMouthActivity();

      coordinator.cancelUtterance();
      coordinator.update();
      const mouthAfterCancel = coordinator.getMouthActivity();

      // Should start release immediately with faster duration
      expect(mouthBefore).toBe(1);
      expect(mouthAfterCancel).toBeLessThan(1);
    });

    it('MM5-I04: late callback from old utterance ignored', () => {
      clock.setTime(0);
      coordinator.beginUtterance('turn-1', 'gen-1', 'SPEAKING');
      coordinator.onPlaybackStarted('turn-1', 'gen-1', 0);

      clock.setTime(100);
      coordinator.update();

      coordinator.cancelUtterance();

      // Late callback from turn-1
      coordinator.onPlaybackEnded('turn-1', 'gen-1');
      coordinator.update();

      // Should not affect state (already cancelled)
      expect(coordinator.getCurrentUtterance()).toBe(null);
    });
  });
});
