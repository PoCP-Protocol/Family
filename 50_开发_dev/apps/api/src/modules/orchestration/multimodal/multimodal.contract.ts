export const MULTIMODAL_PURPOSES = [
  'PAGE_ACCESSIBILITY',
  'MATERIAL_STRUCTURE_ASSIST',
  'GUARDIAN_VOICE_TO_TEXT',
] as const;

export type MultimodalPurpose = (typeof MULTIMODAL_PURPOSES)[number];
export type MultimodalModality = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'SCREENSHOT' | 'OCR' | 'ASR';
export type MultimodalStateUpperBound = 'DERIVED_DRAFT_PRIVATE';

export const MULTIMODAL_ALLOWED_PAGES = new Set([
  'home',
  'growth-checkup',
  'growth-report',
  'growth-plan',
  'service-journey',
  'family-archive',
  'family-records',
]);

export const MULTIMODAL_FORBIDDEN_WRITE_TARGETS = new Set([
  'Need',
  'Intent',
  'Decision',
  'Plan',
  'Case',
  'Outcome',
  'GrowthProfile',
  'Diagnosis',
  'RiskLevel',
  'PermanentLabel',
  'PublicProfile',
]);

export interface MultimodalAssistRequest {
  readonly pageId: string;
  readonly assetRef: string;
  readonly purpose: MultimodalPurpose;
  readonly idempotencyKey: string;
}

export interface MultimodalContextSnapshot {
  readonly tenantPolicyVersion: string;
  readonly pageId: string;
  readonly purpose: MultimodalPurpose;
  readonly modality: MultimodalModality;
  readonly capabilityRef: string;
  readonly policyRef: string;
  readonly outputSchemaRef: string;
  readonly consentStatus: 'GRANTED';
  readonly allowedStateUpperBound: MultimodalStateUpperBound;
  readonly externalEffect: 'NONE';
  readonly familyFacts: ReadonlyArray<{ ref: string; kind: string; text: string }>;
}

export interface MultimodalAssistResponse {
  readonly status: 'DERIVED_DRAFT_PRIVATE' | 'BLOCKED' | 'UNAVAILABLE';
  readonly textEquivalent: string;
  readonly artifactRef?: string;
  readonly blockCode?: string;
}

export function validateMultimodalRequest(input: MultimodalAssistRequest): void {
  if (!MULTIMODAL_ALLOWED_PAGES.has(input.pageId)) {
    throw new Error('MULTIMODAL_PAGE_NOT_ALLOWED');
  }
  if (!input.assetRef || !input.idempotencyKey) {
    throw new Error('MULTIMODAL_REQUEST_INCOMPLETE');
  }
  if (!MULTIMODAL_PURPOSES.includes(input.purpose)) {
    throw new Error('MULTIMODAL_PURPOSE_NOT_ALLOWED');
  }
}

export function validateMultimodalOutput(output: Record<string, unknown>): void {
  const writeBackTarget = output.writeBackTarget;
  if (typeof writeBackTarget === 'string' && MULTIMODAL_FORBIDDEN_WRITE_TARGETS.has(writeBackTarget)) {
    throw new Error('MULTIMODAL_FORBIDDEN_WRITE_BACK');
  }
  if (output.stateUpperBound !== 'DERIVED_DRAFT_PRIVATE') {
    throw new Error('MULTIMODAL_STATE_UPPER_BOUND_EXCEEDED');
  }
  if (output.externalEffect !== 'NONE') {
    throw new Error('MULTIMODAL_EXTERNAL_EFFECT_FORBIDDEN');
  }
}
