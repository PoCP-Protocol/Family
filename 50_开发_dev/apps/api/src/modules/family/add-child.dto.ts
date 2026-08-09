import { BadRequestException } from '@nestjs/common';
import type { AddChildRequest } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateAddChildRequest(familyId: string, body: unknown): AddChildRequest {
  if (!UUID_PATTERN.test(familyId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set(['display_name', 'birth_date', 'idempotency_key']);
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

  if (input.birth_date !== undefined) {
    if (typeof input.birth_date !== 'string' || !DATE_PATTERN.test(input.birth_date) || Number.isNaN(Date.parse(`${input.birth_date}T00:00:00.000Z`))) {
      throw new BadRequestException('Invalid schema');
    }

    const [year, month, day] = input.birth_date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
      throw new BadRequestException('Invalid schema');
    }
  }

  return {
    family_id: familyId,
    display_name: input.display_name,
    idempotency_key: input.idempotency_key,
    ...(input.birth_date ? { birth_date: input.birth_date } : {}),
  };
}