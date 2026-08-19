import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';   // PLATFORM-IAM-104:FamilyPlatformAuthGuard 依赖 AuthService
import { FamilyAggregateRepository } from './family-aggregate.repository';
import { EvidenceSynthesisService } from './evidence-synthesis.service';
import { FamilyController } from './family.controller';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';
import { GrowthActionService } from './growth-action.service';
import { GrowthPriorityService } from './growth-priority.service';
import { GrowthReviewService } from './growth-review.service';
import { GrowthSubjectResolver } from './growth-subject.resolver';
import { InterventionService } from './intervention.service';
import { JourneyPlanService } from './journey-plan.service';
import { OnboardingService } from './onboarding.service';
import { TodayService } from './today.service';
import { DevCoreGrowthService } from './dev-core-growth.service';
import { DevPlatformSurfacesService } from './dev-platform-surfaces.service';
import { DevFlowReceiptService } from './dev-flow-receipt.service';

/**
 * Family 模块占位(TASK-001)。
 * 业务 Named Action(CreateFamily 等)在 Sprint 1 的 TASK-101… 落地,
 * 严格依据 ../../../../specs/actions/*.action.yaml 与 ../../../../specs/ontology/*.schema.yaml。
 * bootstrap 阶段不实现任何业务写操作。
 */
@Module({
	imports: [AuthModule],
	controllers: [FamilyController],
	providers: [
		FamilyRepository,
		FamilyAggregateRepository,
		EvidenceSynthesisService,
		FamilyService,
		GrowthSubjectResolver,
		GrowthPriorityService,
		InterventionService,
		JourneyPlanService,
		GrowthActionService,
		GrowthReviewService,
		OnboardingService,
		    TodayService,
    DevCoreGrowthService,
    DevPlatformSurfacesService,
    DevFlowReceiptService,

		],
	// M3-101A-C:导出 InterventionService,供 Principal Action Bridge 调用既有 StartIntervention Named Action(不复制其 canonical 门)。
	exports: [InterventionService],
})
export class FamilyModule {}
