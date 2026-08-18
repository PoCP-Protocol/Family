/**
 * Family Growth OS architecture map.
 *
 * This is a product-architecture boundary, not an effectiveness claim. It
 * maps every supplied UI to one of the six supplied business-loop families so
 * API projections, UI shells, audit events and future AI adapters share a
 * stable vocabulary rather than becoming 34 isolated implementations.
 */
export const FAMILY_BUSINESS_LOOPS = [
  'CORE_LOOP',
  'GROWTH_LOOP',
  'COMMERCE_LOOP',
  'TEACHER_SALON_LOOP',
  'COMMUNITY_LOOP',
  'CUSTOMER_BACKEND_LOOP',
] as const;

export type FamilyBusinessLoop = typeof FAMILY_BUSINESS_LOOPS[number];
export type FamilyUiId = `UI-${string}`;

export type FactPerspectiveRecommendationAction = 'FACT' | 'PERSPECTIVE' | 'RECOMMENDATION' | 'NAMED_ACTION';
export type ExternalEffectBoundary = 'READ_ONLY' | 'CONTROLLED_DRAFT' | 'NAMED_ACTION' | 'NOOP_ADAPTER';

export interface FamilyUiArchitectureBinding {
  ui_id: FamilyUiId;
  route: string;
  loop: FamilyBusinessLoop;
  business_capability: string;
  primary_objects: readonly string[];
  state_boundary: ExternalEffectBoundary;
  ai_boundary: 'NO_MODEL_CALL' | 'MODEL_GATEWAY_NOOP' | 'FUTURE_MODEL_GATEWAY';
  evidence_boundary: FactPerspectiveRecommendationAction;
}

/** Six supplied business-loop families cover all 34 visual screens exactly once. */
export const FAMILY_UI_ARCHITECTURE_BINDINGS: readonly FamilyUiArchitectureBinding[] = [
  { ui_id: 'UI-01', route: 'home', loop: 'CORE_LOOP', business_capability: 'Family context and today entry', primary_objects: ['Family', 'Person', 'ConsentGrant', 'FamilyTodayProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-02', route: 'growth-assessment', loop: 'GROWTH_LOOP', business_capability: 'Growth assessment intake', primary_objects: ['AssessmentDraft', 'Perspective'], state_boundary: 'CONTROLLED_DRAFT', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'PERSPECTIVE' },
  { ui_id: 'UI-03', route: 'assessment', loop: 'GROWTH_LOOP', business_capability: 'Assessment evidence review', primary_objects: ['AssessmentDraft', 'EvidenceRef'], state_boundary: 'CONTROLLED_DRAFT', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'PERSPECTIVE' },
  { ui_id: 'UI-04', route: 'core-report', loop: 'GROWTH_LOOP', business_capability: 'Growth report projection', primary_objects: ['GrowthProfile', 'ReportProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-05', route: 'core-plan', loop: 'GROWTH_LOOP', business_capability: '90-day plan draft', primary_objects: ['GrowthPlanDraft', 'GrowthTask'], state_boundary: 'CONTROLLED_DRAFT', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-06', route: 'core-community', loop: 'GROWTH_LOOP', business_capability: 'Growth co-learning entry', primary_objects: ['GrowthPlan', 'CommunityProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-07', route: 'core-mine', loop: 'GROWTH_LOOP', business_capability: 'Growth profile and plan progress', primary_objects: ['GrowthProfile', 'GrowthPlan'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-08', route: 'growth-report', loop: 'GROWTH_LOOP', business_capability: 'Growth milestone report', primary_objects: ['Reflection', 'ReportProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-09', route: 'growth-daily-task', loop: 'GROWTH_LOOP', business_capability: 'Daily task check-in', primary_objects: ['GrowthTask', 'GrowthActionCompletion', 'Reflection'], state_boundary: 'NAMED_ACTION', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'NAMED_ACTION' },
  { ui_id: 'UI-10', route: 'growth-child', loop: 'GROWTH_LOOP', business_capability: 'Child growth assistant projection', primary_objects: ['ChildGrowthProfile', 'RecommendationProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-11', route: 'growth-ranking', loop: 'GROWTH_LOOP', business_capability: 'Personal progress display', primary_objects: ['GrowthProgressProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-12', route: 'growth-poster', loop: 'GROWTH_LOOP', business_capability: 'Growth poster projection', primary_objects: ['GrowthMilestone', 'PosterProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-13', route: 'commerce-mall', loop: 'COMMERCE_LOOP', business_capability: 'Catalog projection', primary_objects: ['CatalogOffer', 'Entitlement'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-14', route: 'commerce-product', loop: 'COMMERCE_LOOP', business_capability: 'Product and order-intent draft', primary_objects: ['CatalogOffer', 'OrderIntentDraft'], state_boundary: 'CONTROLLED_DRAFT', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-15', route: 'commerce-invite', loop: 'COMMERCE_LOOP', business_capability: 'Invitation draft', primary_objects: ['CampaignProjection', 'InviteDraft'], state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-16', route: 'commerce-group', loop: 'COMMERCE_LOOP', business_capability: 'Group purchase draft', primary_objects: ['CampaignProjection', 'GroupDraft'], state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'RECOMMENDATION' },
  { ui_id: 'UI-17', route: 'commerce-points', loop: 'COMMERCE_LOOP', business_capability: 'Points ledger projection', primary_objects: ['PointLedger', 'Entitlement'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-18', route: 'commerce-mine', loop: 'COMMERCE_LOOP', business_capability: 'Membership entitlement projection', primary_objects: ['Membership', 'Entitlement'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-19', route: 'teacher-zone', loop: 'TEACHER_SALON_LOOP', business_capability: 'Teacher supply projection', primary_objects: ['TeacherSupply', 'ServiceOffering'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-20', route: 'teacher-detail', loop: 'TEACHER_SALON_LOOP', business_capability: 'Teacher offering detail', primary_objects: ['TeacherSupply', 'ServiceOffering'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-21', route: 'consultation-booking', loop: 'TEACHER_SALON_LOOP', business_capability: 'Consultation booking draft', primary_objects: ['ServiceOffering', 'BookingDraft'], state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'NAMED_ACTION' },
  { ui_id: 'UI-22', route: 'salon-list', loop: 'TEACHER_SALON_LOOP', business_capability: 'Salon listing projection', primary_objects: ['ActivityOffering', 'EventRegistrationDraft'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-23', route: 'activity-detail', loop: 'TEACHER_SALON_LOOP', business_capability: 'Activity registration draft', primary_objects: ['ActivityOffering', 'EventRegistrationDraft'], state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'NAMED_ACTION' },
  { ui_id: 'UI-24', route: 'service-mine', loop: 'TEACHER_SALON_LOOP', business_capability: 'Service request projection', primary_objects: ['BookingDraft', 'ServiceCase'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-25', route: 'parent-community', loop: 'COMMUNITY_LOOP', business_capability: 'Community feed projection', primary_objects: ['CommunityThread', 'CommunityPost'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-26', route: 'publish-dynamic', loop: 'COMMUNITY_LOOP', business_capability: 'Post draft and moderation preview', primary_objects: ['CommunityPostDraft', 'ModerationPreview'], state_boundary: 'NOOP_ADAPTER', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'PERSPECTIVE' },
  { ui_id: 'UI-27', route: 'dynamic-detail', loop: 'COMMUNITY_LOOP', business_capability: 'Post detail projection', primary_objects: ['CommunityPost', 'CommentProjection'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-28', route: 'my-community', loop: 'COMMUNITY_LOOP', business_capability: 'Private community record projection', primary_objects: ['CommunityPost', 'VisibilityRule'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-29', route: 'growth-outcomes', loop: 'GROWTH_LOOP', business_capability: 'Outcome evidence projection', primary_objects: ['OutcomeEvidence', 'Reflection', 'GrowthReview'], state_boundary: 'READ_ONLY', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'FACT' },
  { ui_id: 'UI-30', route: 'annual-member-mine', loop: 'COMMERCE_LOOP', business_capability: 'Annual membership projection', primary_objects: ['Membership', 'Entitlement'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-31', route: 'my-services', loop: 'TEACHER_SALON_LOOP', business_capability: 'Service case projection', primary_objects: ['ServiceCase', 'ServiceRecord'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-32', route: 'orders-assets', loop: 'COMMERCE_LOOP', business_capability: 'Orders and assets projection', primary_objects: ['OrderIntent', 'Entitlement'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-33', route: 'family-profile', loop: 'CUSTOMER_BACKEND_LOOP', business_capability: 'Family profile and consent projection', primary_objects: ['Family', 'Person', 'ConsentGrant'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
  { ui_id: 'UI-34', route: 'service-records', loop: 'TEACHER_SALON_LOOP', business_capability: 'Service and growth record projection', primary_objects: ['ServiceRecord', 'Reflection', 'EvidenceRef'], state_boundary: 'READ_ONLY', ai_boundary: 'NO_MODEL_CALL', evidence_boundary: 'FACT' },
] as const;

export function getFamilyUiArchitectureBinding(uiId: FamilyUiId): FamilyUiArchitectureBinding {
  const binding = FAMILY_UI_ARCHITECTURE_BINDINGS.find((item) => item.ui_id === uiId);
  if (!binding) throw new Error(`unknown_family_ui_binding:${uiId}`);
  return binding;
}

export function assertFamilyUiArchitectureCoverage(): void {
  if (FAMILY_UI_ARCHITECTURE_BINDINGS.length !== 34) throw new Error('family_ui_architecture_coverage_must_be_34');
  const unique = new Set(FAMILY_UI_ARCHITECTURE_BINDINGS.map((item) => item.ui_id));
  if (unique.size !== 34) throw new Error('family_ui_architecture_bindings_must_be_unique');
}


export interface FamilyBusinessScenario {
  scenario_id: string;
  loop: FamilyBusinessLoop;
  name: string;
  ui_ids: readonly FamilyUiId[];
  trigger: string;
  read_objects: readonly string[];
  dev_commands: readonly string[];
  expected_terminal_state: string;
  no_effect_statement: string;
}

/**
 * PDCA verification scenarios. These describe DEV test-flow behaviour only;
 * they neither claim education outcomes nor authorize real world side effects.
 */
export const FAMILY_BUSINESS_SCENARIOS: readonly FamilyBusinessScenario[] = [
  {
    scenario_id: 'SCN-CORE-01', loop: 'CORE_LOOP', name: '家庭进入与今日行动',
    ui_ids: ['UI-01'], trigger: 'Guardian opens the family home.',
    read_objects: ['Family', 'ConsentGrant', 'FamilyTodayProjection'],
    dev_commands: ['READ_FAMILY_TODAY'], expected_terminal_state: 'TODAY_READY_OR_EMPTY',
    no_effect_statement: 'Reading today does not create a plan, outcome, notification, or model call.',
  },
  {
    scenario_id: 'SCN-GROWTH-01', loop: 'GROWTH_LOOP', name: '评估到计划到任务回顾',
    ui_ids: ['UI-02', 'UI-03', 'UI-04', 'UI-05', 'UI-06', 'UI-07', 'UI-08', 'UI-09', 'UI-10', 'UI-11', 'UI-12', 'UI-29'],
    trigger: 'Family starts a growth intake or continues a current practice cycle.',
    read_objects: ['Perspective', 'GrowthProfileDraft', 'GrowthPriority', 'GrowthPlanDraft', 'GrowthTask', 'Reflection', 'OutcomeEvidence'],
    dev_commands: ['START_SYNTHETIC_ASSESSMENT_DRAFT', 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', 'CompleteGrowthAction', 'READ_SYNTHETIC_OUTCOME_EVIDENCE'],
    expected_terminal_state: 'CHECKIN_RECORDED_OR_DEV_RECEIPT_CONFIRMED',
    no_effect_statement: 'Check-in is an action record; reflection is a perspective; no diagnosis, causal outcome, ranking, or total score is produced.',
  },
  {
    scenario_id: 'SCN-COMMERCE-01', loop: 'COMMERCE_LOOP', name: '目录到意向到权益查看',
    ui_ids: ['UI-13', 'UI-14', 'UI-15', 'UI-16', 'UI-17', 'UI-18', 'UI-30', 'UI-32'],
    trigger: 'Family explores a catalog, campaign, membership or asset.',
    read_objects: ['CatalogOffer', 'OrderIntentDraft', 'Membership', 'Entitlement', 'PointLedger'],
    dev_commands: ['PREVIEW_SYNTHETIC_PURCHASE_INTENT', 'ACK_SYNTHETIC_INVITE', 'ACK_SYNTHETIC_GROUP_INTENT'],
    expected_terminal_state: 'DEV_RECEIPT_CONFIRMED',
    no_effect_statement: 'No order, payment, refund, points grant, entitlement change, notification, or export occurs.',
  },
  {
    scenario_id: 'SCN-TEACHER-01', loop: 'TEACHER_SALON_LOOP', name: '供给浏览到咨询活动与服务记录',
    ui_ids: ['UI-19', 'UI-20', 'UI-21', 'UI-22', 'UI-23', 'UI-24', 'UI-31', 'UI-34'],
    trigger: 'Family views teacher supply, consultation or salon activity.',
    read_objects: ['TeacherSupply', 'ServiceOffering', 'BookingDraft', 'ActivityOffering', 'EventRegistrationDraft', 'ServiceCase', 'ServiceRecord'],
    dev_commands: ['PREVIEW_SYNTHETIC_BOOKING_DRAFT', 'PREVIEW_SYNTHETIC_BOOKING', 'PREVIEW_SYNTHETIC_REGISTRATION'],
    expected_terminal_state: 'DEV_RECEIPT_CONFIRMED',
    no_effect_statement: 'No slot reservation, real-world service, calendar write, video call, payment, or notification occurs.',
  },
  {
    scenario_id: 'SCN-COMMUNITY-01', loop: 'COMMUNITY_LOOP', name: '社区浏览到动态草稿与个人可见性',
    ui_ids: ['UI-25', 'UI-26', 'UI-27', 'UI-28'],
    trigger: 'Family reads a moderated community fixture or drafts a post.',
    read_objects: ['CommunityThread', 'CommunityPost', 'CommunityPostDraft', 'VisibilityRule'],
    dev_commands: ['ACK_SYNTHETIC_POST_DRAFT', 'READ_SYNTHETIC_MY_COMMUNITY'],
    expected_terminal_state: 'DEV_RECEIPT_CONFIRMED_OR_READ_ONLY',
    no_effect_statement: 'No public post, media upload, comment, reaction, report, or external sharing occurs.',
  },
  {
    scenario_id: 'SCN-CUSTOMER-01', loop: 'CUSTOMER_BACKEND_LOOP', name: '家庭档案与同意状态查看',
    ui_ids: ['UI-33'], trigger: 'Guardian views the family profile and consent context.',
    read_objects: ['Family', 'Person', 'ConsentGrant'], dev_commands: ['READ_SYNTHETIC_FAMILY_PROFILE'],
    expected_terminal_state: 'PROFILE_READ_ONLY',
    no_effect_statement: 'No identity, consent, child-sensitive data, or external-system synchronization change occurs.',
  },
] as const;

export function assertFamilyBusinessScenarioCoverage(): void {
  if (FAMILY_BUSINESS_SCENARIOS.length !== FAMILY_BUSINESS_LOOPS.length) {
    throw new Error('family_business_scenarios_must_cover_six_loops');
  }
  const scenarioUis = new Set(FAMILY_BUSINESS_SCENARIOS.flatMap((scenario) => scenario.ui_ids));
  const bindings = new Set(FAMILY_UI_ARCHITECTURE_BINDINGS.map((binding) => binding.ui_id));
  for (const uiId of bindings) {
    if (!scenarioUis.has(uiId)) throw new Error(`family_business_scenario_missing_ui:${uiId}`);
  }
}
