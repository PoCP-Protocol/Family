import { BadRequestException } from '@nestjs/common';
import type { CreateFamilyRequest } from '@family/contracts';

type JsonObject = Record<string, unknown>;

export function validateCreateFamilyRequest(body: unknown): CreateFamilyRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  if ('family_id' in input) {
    throw new BadRequestException('family_id is server generated');
  }

  const allowedFields = new Set(['display_name', 'primary_contact_account_id', 'idempotency_key']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.display_name !== 'string' || input.display_name.trim().length < 1 || input.display_name.length > 100) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.idempotency_key !== 'string' || input.idempotency_key.trim().length < 1 || input.idempotency_key.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (
    input.primary_contact_account_id !== undefined &&
    (typeof input.primary_contact_account_id !== 'string' || input.primary_contact_account_id.trim().length < 1 || input.primary_contact_account_id.length > 128)
  ) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    display_name: input.display_name,
    idempotency_key: input.idempotency_key,
    ...(input.primary_contact_account_id ? { primary_contact_account_id: input.primary_contact_account_id } : {}),
  };
}