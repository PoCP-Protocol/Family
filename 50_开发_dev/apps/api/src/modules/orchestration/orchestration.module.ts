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
import { AuditReplayService } from './llm-gateway/audit-replay.service';
import { ContextAssemblerService } from './llm-gateway/context-assembler.service';
import { FamilyLlmGatewayService } from './llm-gateway/family-llm-gateway.service';
import { FamilyLlmOutputValidator } from './llm-gateway/output-validator';
import { TestExperienceService } from './test-experience.service';
import { FamilyPageObjectsService } from './family-page-objects.service';
import { FamilyProductEventService } from './family-product-event.service';
import { FamilyCommerceIntentService } from './family-commerce-intent.service';
import { FamilyServiceBookingService } from './family-service-booking.service';
import { FamilyMembershipEntitlementService } from './family-membership-entitlement.service';

@Module({
  imports: [AuthModule, PrincipalModule],
  controllers: [OrchestrationController],
  providers: [
    OrchestrationService,
    OrchestrationRepository,
    OrchestrationAuthGuard,
    ContextAssemblerService,
    FamilyLlmOutputValidator,
    AuditReplayService,
    FamilyLlmGatewayService,
    TestExperienceService,
    FamilyPageObjectsService,
    FamilyProductEventService,
    FamilyCommerceIntentService,
    FamilyServiceBookingService,
    FamilyMembershipEntitlementService,
  ],
})
export class OrchestrationModule {}
