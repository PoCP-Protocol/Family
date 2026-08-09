import { BadRequestException } from '@nestjs/common';
import type { M2GrowthDimensionId, PerspectiveCaptureMode, PerspectiveContentDto, PerspectiveType, RecordPerspectiveRequest, StructuredSafetySignal } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERSPECTIVE_TYPES = new Set<PerspectiveType>(['PARENT_PERSPECTIVE', 'CHILD_PERSPECTIVE']);
const CAPTURE_MODES = new Set<PerspectiveCaptureMode>(['DIRECT_SELF_REPORT', 'FACILITATED_ENTRY', 'PROXY_REPORTED']);
const M2_DIMENSIONS = new Set<M2GrowthDimensionId>(['P03', 'R03', 'R04', 'R05']);
const SAFETY_SIGNALS = new Set<StructuredSafetySignal>(['NONE', 'SELF_HARM', 'HARM_TO_OTHERS', 'ABUSE', 'VIOLENCE', 'SEVERE_CRISIS']);
const FORBIDDEN_SAFETY_FIELDS = new Set(['safetySeverity', 'safety_screening_result', 'finalSeverity', 'severity', 'safetyDisposition']);

export function validateRecordPerspectiveRequest(
  familyId: string,
  onboardingId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): RecordPerspectiveRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(onboardingId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set([
    'subjectPersonId',
    'authorPersonId',
    'perspectiveType',
    'captureMode',
    'relatedDimensionIds',
    'content',
    'structuredSafetySignals',
    'expressedAt',
  ]);

  for (const field of Object.keys(input)) {
    if (FORBIDDEN_SAFETY_FIELDS.has(field) || !allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.subjectPersonId !== 'string' || !UUID_PATTERN.test(input.subjectPersonId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.authorPersonId !== 'string' || !UUID_PATTERN.test(input.authorPersonId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.perspectiveType !== 'string' || !PERSPECTIVE_TYPES.has(input.perspectiveType as PerspectiveType)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.captureMode !== 'string' || !CAPTURE_MODES.has(input.captureMode as PerspectiveCaptureMode)) {
    throw new BadRequestException('Invalid schema');
  }

  const perspectiveType = input.perspectiveType as PerspectiveType;
  const captureMode = input.captureMode as PerspectiveCaptureMode;
  if (perspectiveType === 'CHILD_PERSPECTIVE' && captureMode === 'DIRECT_SELF_REPORT') {
    throw new BadRequestException('direct_child_self_report_requires_child_actor');
  }

  const relatedDimensionIds = parseDimensionIds(input.relatedDimensionIds);
  const structuredSafetySignals = parseSafetySignals(input.structuredSafetySignals);
  const content = parseContent(input.content);

  if (input.expressedAt !== undefined && (typeof input.expressedAt !== 'string' || Number.isNaN(Date.parse(input.expressedAt)))) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    onboarding_id: onboardingId,
    subject_person_id: input.subjectPersonId,
    author_person_id: input.authorPersonId,
    perspective_type: perspectiveType,
    capture_mode: captureMode,
    related_dimension_ids: relatedDimensionIds,
    content,
    structured_safety_signals: structuredSafetySignals,
    expressed_at: input.expressedAt,
    idempotency_key: idempotencyKey,
  };
}

function parseDimensionIds(value: unknown): M2GrowthDimensionId[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
    throw new BadRequestException('Invalid schema');
  }

  const dimensions = value.map((item) => {
    if (typeof item !== 'string' || !M2_DIMENSIONS.has(item as M2GrowthDimensionId)) {
      throw new BadRequestException('Invalid schema');
    }
    return item as M2GrowthDimensionId;
  });

  return Array.from(new Set(dimensions));
}

function parseSafetySignals(value: unknown): StructuredSafetySignal[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    throw new BadRequestException('Invalid schema');
  }

  return Array.from(new Set(value.map((item) => {
    if (typeof item !== 'string' || !SAFETY_SIGNALS.has(item as StructuredSafetySignal)) {
      throw new BadRequestException('Invalid schema');
    }
    return item as StructuredSafetySignal;
  })));
}

function parseContent(value: unknown): PerspectiveContentDto {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = value as JsonObject;
  const allowedFields = new Set(['promptId', 'responseText', 'selectedSignals']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.promptId !== 'string' || input.promptId.trim().length < 1 || input.promptId.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.responseText !== 'string' || input.responseText.trim().length < 1 || input.responseText.length > 2000) {
    throw new BadRequestException('Invalid schema');
  }

  if (!Array.isArray(input.selectedSignals) || input.selectedSignals.length > 12 || input.selectedSignals.some((item) => typeof item !== 'string' || item.length > 80)) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    prompt_id: input.promptId,
    response_text: input.responseText.trim(),
    selected_signals: input.selectedSignals,
  };
}