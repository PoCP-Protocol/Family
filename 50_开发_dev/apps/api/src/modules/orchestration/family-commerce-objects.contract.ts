export interface FamilyAdmittedCatalogItemDto {
  catalog_item_id: string;
  item_ref: string;
  item_kind: 'PRODUCT' | 'PRACTICE' | 'COURSE' | 'COMMUNITY_TEMPLATE';
  title: string;
  version: number;
  admission_status: 'ADMITTED' | 'EXPIRED';
  evidence_level: 'E1' | 'E2' | 'E3' | 'UNVERIFIED';
  source_ref: string;
  risk_flags: string[];
  qualification_ref: string | null;
  price_ref: string | null;
  fixture_only: true;
}

export interface FamilyServiceProviderCatalogDto {
  provider_catalog_id: string;
  provider_ref: string;
  display_name: string;
  provider_kind: 'TEACHER' | 'SALON_HOST' | 'SERVICE_TEAM';
  qualification_ref: string | null;
  qualification_status: 'ACTIVE' | 'MISSING' | 'EXPIRED';
  admission_status: 'ADMITTED' | 'EXPIRED';
  source_ref: string;
  fixture_only: true;
}

export interface FamilyActivityCatalogDto {
  activity_catalog_id: string;
  activity_ref: string;
  title: string;
  activity_kind: 'SALON' | 'WORKSHOP' | 'FAMILY_EVENT';
  starts_at: string;
  ends_at: string | null;
  admission_status: 'ADMITTED' | 'EXPIRED';
  qualification_ref: string | null;
  source_ref: string;
  fixture_only: true;
}

export interface FamilyCustomerAssetProjectionDto {
  asset_id: string;
  family_id: string;
  page_id: string;
  asset_kind: 'COMMERCE_INVITE' | 'COMMERCE_GROUP' | 'SERVICE_BOOKING' | 'EVENT_REGISTRATION' | 'COMMUNITY_TEMPLATE_PUBLICATION';
  source_ref: string;
  fixture_version: string;
  status: 'CREATED' | 'CONFIRMED' | 'CANCELLED';
  environment: 'DEV' | 'TEST';
  source: 'TEST_FIXTURE';
  external_effect: false;
  created_at: string;
  cancelled_at: string | null;
}

export interface FamilyCommerceObjectProjectionDto {
  environment: 'DEV' | 'TEST';
  catalog_items: FamilyAdmittedCatalogItemDto[];
  providers: FamilyServiceProviderCatalogDto[];
  activities: FamilyActivityCatalogDto[];
  customer_assets: FamilyCustomerAssetProjectionDto[];
  allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CATALOG_AND_PRIVATE_ASSETS';
  text_equivalent: string;
}
