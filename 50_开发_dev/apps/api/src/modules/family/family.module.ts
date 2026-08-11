import { Module } from '@nestjs/common';
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

/**
 * Family 模块占位(TASK-001)。
 * 业务 Named Action(CreateFamily 等)在 Sprint 1 的 TASK-101… 落地,
 * 严格依据 ../../../../specs/actions/*.action.yaml 与 ../../../../specs/ontology/*.schema.yaml。
 * bootstrap 阶段不实现任何业务写操作。
 */
@Module({
	controllers: [FamilyController],
	providers: [
		FamilyRepository,
		FamilyAggregateRepository,
		EvidenceSynthesisService,
		FamilyService,
		GrowthSubjectResolver,
		GrowthPriorityService,
		InterventionService,
		GrowthActionService,
		GrowthReviewService,
	],
})
export class FamilyModule {}
