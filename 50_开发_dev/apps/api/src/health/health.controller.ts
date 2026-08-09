import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@family/contracts';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'family-api',
      version: '0.1.0',
      time: new Date().toISOString(),
    };
  }
}
