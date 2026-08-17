import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AuditModule } from './audit/audit.module';
import { FamilyModule } from './modules/family/family.module';
import { PrincipalModule } from './modules/principal/principal.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';

@Module({
  imports: [AuditModule, FamilyModule, PrincipalModule, AuthModule, OrchestrationModule],
  controllers: [HealthController],
})
export class AppModule {}
