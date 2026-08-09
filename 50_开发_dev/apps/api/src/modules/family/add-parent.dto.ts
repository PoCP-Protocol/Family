import { BadRequestException } from '@nestjs/common';
import type { AddParentRequest, ParentRole } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const PARENT_ROLES = new Set<ParentRole>(['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER_GUARDIAN']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateAddParentRequest(familyId: string, body: unknown): AddParentRequest {
  if (!UUID_PATTERN.test(familyId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set(['role', 'display_name', 'account_id', 'idempotency_key']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.role !== 'string' || !PARENT_ROLES.has(input.role as ParentRole)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.display_name !== 'string' || input.display_name.trim().length < 1 || input.display_name.length > 100) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.idempotency_key !== 'string' || input.idempotency_key.trim().length < 1 || input.idempotency_key.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (
    input.account_id !== undefined &&
    (typeof input.account_id !== 'string' || input.account_id.trim().length < 1 || input.account_id.length > 128)
  ) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    role: input.role as ParentRole,
    display_name: input.display_name,
    idempotency_key: input.idempotency_key,
    ...(input.account_id ? { account_id: input.account_id } : {}),
  };
}