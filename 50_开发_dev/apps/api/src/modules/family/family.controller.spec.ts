import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FamilyController } from './family.controller';
import type { FamilyService } from './family.service';

describe('FamilyController', () => {
  it('requires authenticated actor context', async () => {
    const service = { createFamily: vi.fn() } as unknown as FamilyService;
    const controller = new FamilyController(service);

    await expect(controller.create({ display_name: '王家', idempotency_key: 'idem-1' })).rejects.toThrow(UnauthorizedException);
  });
});