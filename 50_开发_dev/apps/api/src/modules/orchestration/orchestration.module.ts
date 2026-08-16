/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · OrchestrationModule。
 * 依赖方向:Orchestration → Auth(严格鉴权)+ Principal(窄 AI_COACH 资源);
 * 【不】让 FamilyModule 依赖 Orchestration,避免环依赖(PrincipalModule 已依赖 FamilyModule)。
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrincipalModule } from '../principal/principal.module';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';
import { OrchestrationRepository } from './orchestration.repository';
import { OrchestrationAuthGuard } from './orchestration-auth.guard';

@Module({
  imports: [AuthModule, PrincipalModule],
  controllers: [OrchestrationController],
  providers: [OrchestrationService, OrchestrationRepository, OrchestrationAuthGuard],
})
export class OrchestrationModule {}
