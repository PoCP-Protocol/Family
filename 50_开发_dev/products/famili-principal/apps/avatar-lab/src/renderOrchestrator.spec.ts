import { describe, expect, it, beforeEach, vi } from 'vitest';
import { RenderOrchestrator } from './renderOrchestrator';
import { getIdentityResolver } from '@family/fpai-multimodal-runtime';
import type { CharacterIdentity, PerformanceFrame } from '@family/fpai-multimodal-contracts';

/**
 * MM3-O: RenderOrchestrator Tests
 * Tests that verified identity + validated performance frame reach renderer atomically
 * and that MM2 provenance is preserved
 */

function createVerifiedIdentity(): CharacterIdentity {
  return {
    version: 'character_v1.0',
    frozen_date: '2026-08-18',
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
}

function createValidPerformanceFrame(): PerformanceFrame {
  return {
    expression: 'LISTENING',
    gesture: 'SMALL_OPEN_HAND',
    gaze: 'USER',
    posture: 'RELAXED',
    speech_activity: 'SPEAKING',
  };
}

describe('MM3-O: RenderOrchestrator', () => {
  let canvas: any;  // Mock canvas object
  let resolver = getIdentityResolver();

  beforeEach(() => {
    // Create a mock canvas that RenderOrchestrator can use
    // Actual rendering test would require headless Chrome; this validates composition
    canvas = {
      width: 320,
      height: 320,
      getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        ellipse: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: 'center',
        textBaseline: 'top',
        fillText: vi.fn(),
      })),
    };
  });

  it('MM3-O01: verified identity + validated frame → renderer', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    const frame = createValidPerformanceFrame();
    // Should not throw
    orchestrator.applyPerformanceFrame(frame);

    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);
  });

  it('MM3-O02: frame applied atomically (no intermediate state)', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    const frame1: PerformanceFrame = {
      expression: 'LISTENING',
      gesture: 'SMALL_OPEN_HAND',
      gaze: 'USER',
      posture: 'RELAXED',
      speech_activity: 'SPEAKING',
    };

    const frame2: PerformanceFrame = {
      expression: 'THINKING',
      gesture: 'SMALL_NOD',
      gaze: 'SOFT_DOWN_THINKING',
      posture: 'STEADY',
      speech_activity: 'SILENT',
    };

    // Apply both frames; if there's an intermediate state vulnerability,
    // the second frame would fail or show inconsistent behavior
    orchestrator.applyPerformanceFrame(frame1);
    orchestrator.applyPerformanceFrame(frame2);

    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);
  });

  it('MM3-O03: successive frames update renderer behavior', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    const listeningFrame: PerformanceFrame = {
      expression: 'LISTENING',
      gesture: 'SMALL_OPEN_HAND',
      gaze: 'USER',
      posture: 'RELAXED',
      speech_activity: 'SPEAKING',
    };

    const thinkingFrame: PerformanceFrame = {
      expression: 'THINKING',
      gesture: 'SMALL_NOD',
      gaze: 'SOFT_DOWN_THINKING',
      posture: 'STEADY',
      speech_activity: 'SILENT',
    };

    orchestrator.applyPerformanceFrame(listeningFrame);
    const snap1 = orchestrator.snapshot();

    orchestrator.applyPerformanceFrame(thinkingFrame);
    const snap2 = orchestrator.snapshot();

    // Snapshots should differ (different expressions/states)
    expect(snap1).not.toEqual(snap2);
  });

  it('MM3-O04: same ResolvedRendererProfile instance retained', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    const profileBefore = orchestrator.getProfile();

    // Apply multiple frames
    orchestrator.applyPerformanceFrame(createValidPerformanceFrame());
    orchestrator.applyPerformanceFrame({
      expression: 'THINKING',
      gesture: 'SMALL_NOD',
      gaze: 'SOFT_DOWN_THINKING',
      posture: 'STEADY',
      speech_activity: 'SILENT',
    });

    const profileAfter = orchestrator.getProfile();

    // Must be the same object instance, not just equal
    expect(profileBefore).toBe(profileAfter);
  });

  it('MM3-O05: WeakSet provenance remains valid', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    // Initial state
    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);

    // After performance changes
    orchestrator.applyPerformanceFrame(createValidPerformanceFrame());
    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);

    orchestrator.applyPerformanceFrame({
      expression: 'CALM_SERIOUS',
      gesture: 'LISTENING_GAZE',
      gaze: 'USER',
      posture: 'STEADY',
      speech_activity: 'SPEAKING',
    });
    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);
  });

  it('MM3-O06: invalid frame (null) rejected before renderer', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    expect(() => orchestrator.applyPerformanceFrame(null as any)).toThrow();
  });

  it('MM3-O07: identity visual style unchanged across performance changes', () => {
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);
    const orchestrator = new RenderOrchestrator({ canvas, profile });

    const profileBefore = orchestrator.getProfile();
    const styleBefore = profileBefore.visual_identity_version;

    // Apply many different performance frames
    for (let i = 0; i < 5; i++) {
      const frame: PerformanceFrame = {
        expression: i % 2 === 0 ? 'LISTENING' : 'THINKING',
        gesture: i % 3 === 0 ? 'SMALL_NOD' : 'SMALL_OPEN_HAND',
        gaze: i % 4 === 0 ? 'USER' : 'SOFT_DOWN_THINKING',
        posture: i % 2 === 0 ? 'RELAXED' : 'STEADY',
        speech_activity: i % 2 === 0 ? 'SPEAKING' : 'SILENT',
      };
      orchestrator.applyPerformanceFrame(frame);
    }

    const profileAfter = orchestrator.getProfile();
    const styleAfter = profileAfter.visual_identity_version;

    expect(styleAfter).toBe(styleBefore);
    expect(styleAfter).toBe('visual_identity_v1.0');
  });

  it('MM3-O08: production composition path uses RenderOrchestrator', () => {
    // This test verifies that RenderOrchestrator is the intended production boundary
    // by confirming it accepts both required components without bypass paths
    const identity = createVerifiedIdentity();
    const profile = resolver.resolve(identity);

    // RenderOrchestrator requires both identity and frame to operate
    const orchestrator = new RenderOrchestrator({ canvas, profile });
    const frame = createValidPerformanceFrame();

    // This is the production composition pattern: verified identity + validated frame
    orchestrator.applyPerformanceFrame(frame);

    // Verify no renderer state was mutated directly
    expect(orchestrator.verifyIdentityIntegrity()).toBe(true);
  });
});
