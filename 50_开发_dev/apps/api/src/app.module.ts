import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AuditModule } from './audit/audit.module';
import { FamilyModule } from './modules/family/family.module';
import { PrincipalModule } from './modules/principal/principal.module';

@Module({
  imports: [AuditModule, FamilyModule, PrincipalModule],
  controllers: [HealthController],
})
export class AppModule {}
