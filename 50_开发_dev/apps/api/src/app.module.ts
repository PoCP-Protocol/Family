import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AuditModule } from './audit/audit.module';
import { FamilyModule } from './modules/family/family.module';

@Module({
  imports: [AuditModule, FamilyModule],
  controllers: [HealthController],
})
export class AppModule {}
