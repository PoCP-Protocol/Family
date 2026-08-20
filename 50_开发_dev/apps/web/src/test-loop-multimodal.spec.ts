import { describe, expect, it } from 'vitest';
import {
  MULTIMODAL_POLICY,
  SYNTHETIC_MULTIMODAL_SCENARIOS,
  getSyntheticMultimodalScenario,
  multimodalSafeStop,
  simulateStructuredMaterialResult,
} from './test-loop-multimodal.js';

describe('DEV governed multimodal synthetic contract', () => {
  it('exposes synthetic text, audio visualization and image scene only', () => {
    expect(SYNTHETIC_MULTIMODAL_SCENARIOS.map((scenario) => scenario.modality)).toEqual(['TEXT', 'AUDIO', 'IMAGE']);
    expect(MULTIMODAL_POLICY.prohibited_sources).toEqual(expect.arrayContaining(['LIVE_MICROPHONE', 'FILE_UPLOAD', 'CAMERA_CAPTURE', 'REAL_FAMILY_MEDIA', 'EXTERNAL_MODEL']));
  });

  it('returns only read-only explanation for a synthetic scenario', () => {
    const scenario = getSyntheticMultimodalScenario('synthetic-image-scene');
    const result = simulateStructuredMaterialResult(scenario);
    expect(result).toMatchObject({
      safe_stop: false,
      source_label: 'SYNTHETIC_IMAGE',
      allowed_state_upper_bound: 'READ_ONLY_SYNTHETIC_EXPLANATION',
      training_used: false,
      external_model_called: false,
    });
    expect(result.text_equivalent).toContain('不识别人物');
    expect(JSON.stringify(result)).not.toContain('decision_id');
    expect(JSON.stringify(result)).not.toContain('plan_id');
    expect(JSON.stringify(result)).not.toContain('case_id');
  });

  it('fails closed for microphone, upload, camera and external-model paths', () => {
    for (const kind of ['LIVE_MICROPHONE', 'FILE_UPLOAD', 'CAMERA_CAPTURE', 'EXTERNAL_MODEL']) {
      expect(multimodalSafeStop(kind)).toMatchObject({ safe_stop: true, allowed_state_upper_bound: 'NONE' });
    }
    expect(multimodalSafeStop('CAMERA_CAPTURE').human_gate_required).toBe(true);
  });

  it('does not create a synthetic result for an unknown or prohibited source', () => {
    expect(getSyntheticMultimodalScenario('unknown')).toBeNull();
    expect(simulateStructuredMaterialResult(null)).toMatchObject({ safe_stop: true, template_id: 'REF-MULTIMODAL-SOURCE-NOT-ALLOWED' });
  });
});
