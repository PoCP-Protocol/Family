import { BadRequestException } from '@nestjs/common';
import type { CreateFamilyDataLifecycleRequest, FamilyDataLifecycleRequestType } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_TYPES = new Set<FamilyDataLifecycleRequestType>(['EXPORT_REQUEST', 'RETENTION_REVIEW', 'DELETE_REQUEST']);

type JsonObject = Record<string, unknown>;

export function validateCreateFamilyDataLifecycleRequest(
  familyId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): CreateFamilyDataLifecycleRequest {
  if (!UUID_PATTERN.test(familyId)) throw new BadRequestException('Invalid schema');
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid schema');

  const input = body as JsonObject;
  const allowedFields = new Set(['requestType', 'reasonText']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) throw new BadRequestException('Invalid schema');
  }
  if (typeof input.requestType !== 'string' || !REQUEST_TYPES.has(input.requestType as FamilyDataLifecycleRequestType)) {
    throw new BadRequestException('Invalid schema');
  }
  if (input.reasonText !== undefined && (typeof input.reasonText !== 'string' || input.reasonText.trim().length < 3 || input.reasonText.trim().length > 500)) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    request_type: input.requestType as FamilyDataLifecycleRequestType,
    reason_text: typeof input.reasonText === 'string' ? input.reasonText.trim() : undefined,
    idempotency_key: idempotencyKey,
  };
}
