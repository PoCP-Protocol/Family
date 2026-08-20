import { Inject, Injectable } from '@nestjs/common';
import { OrchestrationRepository } from './orchestration.repository';
import { requireDevSyntheticTestLoop } from './test-env.policy';
import type {
  FamilyActivityCatalogDto,
  FamilyAdmittedCatalogItemDto,
  FamilyCommerceObjectProjectionDto,
  FamilyCustomerAssetProjectionDto,
  FamilyServiceProviderCatalogDto,
} from './family-commerce-objects.contract';

@Injectable()
export class FamilyCommerceObjectsService {
  constructor(@Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository) {}

  private environment(): 'DEV' | 'TEST' {
    return requireDevSyntheticTestLoop().environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV';
  }

  async projection(familyId: string): Promise<FamilyCommerceObjectProjectionDto> {
    requireDevSyntheticTestLoop();
    const [catalog, providers, activities, assets] = await Promise.all([
      this.repo.query<FamilyAdmittedCatalogItemDto>(
        `select catalog_item_id, item_ref, item_kind, title, version, admission_status, evidence_level,
                source_ref, risk_flags, qualification_ref, price_ref, fixture_only
         from family_admitted_catalog_items
         where admission_status='ADMITTED' and fixture_only=true
         order by item_kind, item_ref, version desc`, [],
      ),
      this.repo.query<FamilyServiceProviderCatalogDto>(
        `select provider_catalog_id, provider_ref, display_name, provider_kind, qualification_ref,
                qualification_status, admission_status, source_ref, fixture_only
         from family_service_provider_catalog
         where admission_status='ADMITTED' and qualification_status='ACTIVE' and fixture_only=true
         order by provider_kind, provider_ref`, [],
      ),
      this.repo.query<FamilyActivityCatalogDto>(
        `select activity_catalog_id, activity_ref, title, activity_kind, starts_at, ends_at,
                admission_status, qualification_ref, source_ref, fixture_only
         from family_activity_catalog
         where admission_status='ADMITTED' and fixture_only=true
         order by starts_at, activity_ref`, [],
      ),
      this.repo.query<FamilyCustomerAssetProjectionDto>(
        `select asset_id, family_id, page_id, asset_kind, source_ref, fixture_version, status,
                environment, source, external_effect, created_at, cancelled_at
         from family_customer_asset_projection
         where family_id=$1
         order by created_at desc, asset_id desc`, [familyId],
      ),
    ]);

    return {
      environment: this.environment(),
      catalog_items: catalog.rows.map((row) => ({ ...row, fixture_only: true, risk_flags: row.risk_flags ?? [] })),
      providers: providers.rows.map((row) => ({ ...row, fixture_only: true })),
      activities: activities.rows.map((row) => ({ ...row, fixture_only: true })),
      customer_assets: assets.rows.map((row) => ({ ...row, external_effect: false, source: 'TEST_FIXTURE' as const })),
      allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CATALOG_AND_PRIVATE_ASSETS',
      text_equivalent: '以下是当前已准入的家庭成长候选和当前家庭私有体验回执，由家庭决定是否继续。',
    };
  }
}
