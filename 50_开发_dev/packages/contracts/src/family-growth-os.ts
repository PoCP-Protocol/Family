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

/**
 * Product support surfaces supplement a supplied baseline when research identifies
 * a distinct capability that cannot truthfully be collapsed into an existing UI.
 * They do not change the exact 34-screen baseline coverage invariant.
 */
export const FAMILY_SUPPORT_SURFACE_BINDINGS: readonly FamilyUiArchitectureBinding[] = [
  {
    ui_id: 'UI-35', route: 'growth-camp-21', loop: 'GROWTH_LOOP',
    business_capability: '21-day growth camp experience and daily practice',
    primary_objects: ['GrowthCamp21EnrollmentDraft', 'GrowthCamp21DayTask', 'GrowthActionCompletion', 'Reflection'],
    state_boundary: 'CONTROLLED_DRAFT', ai_boundary: 'MODEL_GATEWAY_NOOP', evidence_boundary: 'RECOMMENDATION',
  },
] as const;

export function getFamilyUiArchitectureBinding(uiId: FamilyUiId): FamilyUiArchitectureBinding {
  const binding = FAMILY_UI_ARCHITECTURE_BINDINGS.find((item) => item.ui_id === uiId);
  if (!binding) throw new Error(`unknown_family_ui_binding:${uiId}`);
  return binding;
}

/** Resolves supplied UI bindings and explicitly registered support surfaces. */
export function getFamilyGrowthSurfaceArchitectureBinding(uiId: FamilyUiId): FamilyUiArchitectureBinding {
  const binding = FAMILY_UI_ARCHITECTURE_BINDINGS.find((item) => item.ui_id === uiId)
    ?? FAMILY_SUPPORT_SURFACE_BINDINGS.find((item) => item.ui_id === uiId);
  if (!binding) throw new Error(`unknown_family_growth_surface_binding:${uiId}`);
  return binding;
}

export function assertFamilyUiArchitectureCoverage(): void {
  if (FAMILY_UI_ARCHITECTURE_BINDINGS.length !== 34) throw new Error('family_ui_architecture_coverage_must_be_34');
  const unique = new Set(FAMILY_UI_ARCHITECTURE_BINDINGS.map((item) => item.ui_id));
  if (unique.size !== 34) throw new Error('family_ui_architecture_bindings_must_be_unique');
}


export interface DevFlowReceiptSummary {
  event_id: string;
  ui_id: FamilyUiId;
  business_loop: FamilyBusinessLoop;
  command: string;
  event_state: 'DEV_CONFIRMED';
  created_at: string;
  replayed: boolean;
  /** Bounded synthetic parent/guardian Perspective selection, not a diagnosis or fact. */
  selection?: string;
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


export type Ui01FeatureMode = 'READ_PROJECTION' | 'NAVIGATION' | 'NAMED_ACTION_ROUTE' | 'CONTROLLED_DRAFT_ROUTE' | 'DEV_NOOP_ROUTE';

export interface Ui01HomeFeature {
  feature_id: string;
  visual_label: string;
  mode: Ui01FeatureMode;
  target_route: string;
  source_objects: readonly string[];
  state_boundary: ExternalEffectBoundary;
  evidence_boundary: FactPerspectiveRecommendationAction;
}

/**
 * UI-01 has a dense supplied home canvas. This catalogue preserves every
 * readable entry as a named feature so its data lineage and interaction
 * behaviour can be verified individually rather than treated as one generic
 * home screen.
 */
export const UI01_HOME_FEATURES: readonly Ui01HomeFeature[] = [
  { feature_id: 'home_identity', visual_label: '家庭成长平台', mode: 'READ_PROJECTION', target_route: 'home', source_objects: ['FamilyTodayProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'header_more', visual_label: '更多', mode: 'NAVIGATION', target_route: 'core-mine', source_objects: ['Family'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'header_context', visual_label: '家庭上下文', mode: 'READ_PROJECTION', target_route: 'home', source_objects: ['Family', 'Person', 'ConsentGrant'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'greeting', visual_label: '今天也一起陪孩子成长', mode: 'READ_PROJECTION', target_route: 'home', source_objects: ['FamilyTodayProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'notification', visual_label: '提醒', mode: 'DEV_NOOP_ROUTE', target_route: 'core-mine', source_objects: ['AuditEvent'], state_boundary: 'NOOP_ADAPTER', evidence_boundary: 'FACT' },
  { feature_id: 'assessment_campaign', visual_label: '免费家庭测评', mode: 'CONTROLLED_DRAFT_ROUTE', target_route: 'growth-assessment', source_objects: ['AssessmentDraft', 'Perspective'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'PERSPECTIVE' },
  { feature_id: 'assessment_cta', visual_label: '立即测评', mode: 'CONTROLLED_DRAFT_ROUTE', target_route: 'growth-assessment', source_objects: ['AssessmentDraft'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'PERSPECTIVE' },
  { feature_id: 'ai_diagnostic', visual_label: 'AI诊断', mode: 'NAVIGATION', target_route: 'assessment', source_objects: ['AssessmentDraft', 'EvidenceRef'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'PERSPECTIVE' },
  { feature_id: 'challenge_21', visual_label: '21天挑战营', mode: 'NAVIGATION', target_route: 'growth-camp-21', source_objects: ['GrowthCamp21EnrollmentDraft', 'GrowthCamp21DayTask'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'RECOMMENDATION' },
  { feature_id: 'plan_90', visual_label: '90天成长计划', mode: 'NAVIGATION', target_route: 'core-plan', source_objects: ['GrowthPlanDraft', 'GrowthTask'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'RECOMMENDATION' },
  { feature_id: 'growth_cases', visual_label: '成长案例', mode: 'NAVIGATION', target_route: 'growth-poster', source_objects: ['GrowthMilestone', 'PosterProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'expert_live', visual_label: '专家直播', mode: 'NAVIGATION', target_route: 'teacher-zone', source_objects: ['TeacherSupply', 'ServiceOffering'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'family_advisor', visual_label: '家庭顾问', mode: 'NAVIGATION', target_route: 'teacher-zone', source_objects: ['TeacherSupply', 'ServiceOffering'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'today_tasks', visual_label: '今日成长任务', mode: 'NAMED_ACTION_ROUTE', target_route: 'growth-daily-task', source_objects: ['GrowthTask', 'GrowthActionCompletion'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
  { feature_id: 'task_communication', visual_label: '亲子沟通小练习', mode: 'NAMED_ACTION_ROUTE', target_route: 'growth-daily-task', source_objects: ['GrowthTask'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
  { feature_id: 'task_reading', visual_label: '完成今日阅读打卡', mode: 'NAMED_ACTION_ROUTE', target_route: 'growth-daily-task', source_objects: ['GrowthTask', 'GrowthActionCompletion'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
  { feature_id: 'task_emotion', visual_label: '情绪记录', mode: 'NAMED_ACTION_ROUTE', target_route: 'growth-daily-task', source_objects: ['Reflection'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'PERSPECTIVE' },
  { feature_id: 'recommended_content', visual_label: '推荐内容/服务', mode: 'NAVIGATION', target_route: 'commerce-mall', source_objects: ['CatalogOffer', 'ServiceOffering'], state_boundary: 'READ_ONLY', evidence_boundary: 'RECOMMENDATION' },
  { feature_id: 'recommended_card_1', visual_label: '推荐内容卡片一', mode: 'NAVIGATION', target_route: 'commerce-product', source_objects: ['CatalogOffer'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'recommended_card_2', visual_label: '推荐内容卡片二', mode: 'NAVIGATION', target_route: 'commerce-product', source_objects: ['CatalogOffer'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'recommended_card_3', visual_label: '推荐内容卡片三', mode: 'NAVIGATION', target_route: 'commerce-product', source_objects: ['CatalogOffer'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'nav_home', visual_label: '首页', mode: 'NAVIGATION', target_route: 'home', source_objects: ['FamilyTodayProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'nav_plan', visual_label: '计划', mode: 'NAVIGATION', target_route: 'core-plan', source_objects: ['GrowthPlanDraft'], state_boundary: 'CONTROLLED_DRAFT', evidence_boundary: 'RECOMMENDATION' },
  { feature_id: 'nav_community', visual_label: '社群', mode: 'NAVIGATION', target_route: 'core-community', source_objects: ['CommunityThread'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'nav_mine', visual_label: '我的', mode: 'NAVIGATION', target_route: 'core-mine', source_objects: ['GrowthProfile'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
] as const;

export function assertUi01HomeFeatureCoverage(): void {
  if (UI01_HOME_FEATURES.length < 16) throw new Error('ui01_home_feature_catalog_must_include_at_least_16_features');
  const identifiers = new Set(UI01_HOME_FEATURES.map((feature) => feature.feature_id));
  if (identifiers.size !== UI01_HOME_FEATURES.length) throw new Error('ui01_home_feature_catalog_must_be_unique');
}


export interface Ui09DailyTaskFeature {
  feature_id: string;
  visual_label: string;
  mode: Ui01FeatureMode;
  source_objects: readonly string[];
  state_boundary: ExternalEffectBoundary;
  evidence_boundary: FactPerspectiveRecommendationAction;
}

/** UI-09 visual task features are descendants of UI-01's daily-task entry. */
export const UI09_DAILY_TASK_FEATURES: readonly Ui09DailyTaskFeature[] = [
  { feature_id: 'back', visual_label: '返回', mode: 'NAVIGATION', source_objects: ['FamilyTodayProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'more', visual_label: '更多', mode: 'DEV_NOOP_ROUTE', source_objects: ['AuditEvent'], state_boundary: 'NOOP_ADAPTER', evidence_boundary: 'FACT' },
  { feature_id: 'ai_reminder', visual_label: 'AI家庭管家提醒', mode: 'READ_PROJECTION', source_objects: ['FamilyTodayProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'RECOMMENDATION' },
  { feature_id: 'task_communication', visual_label: '亲子沟通', mode: 'NAMED_ACTION_ROUTE', source_objects: ['GrowthTask', 'GrowthActionCompletion'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
  { feature_id: 'task_emotion', visual_label: '记录孩子情绪变化', mode: 'NAMED_ACTION_ROUTE', source_objects: ['Reflection'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'PERSPECTIVE' },
  { feature_id: 'task_focus', visual_label: '完成专注力小游戏', mode: 'NAMED_ACTION_ROUTE', source_objects: ['GrowthTask'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
  { feature_id: 'task_reward', visual_label: '成长积分', mode: 'READ_PROJECTION', source_objects: ['GrowthActionCompletion'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'task_duration', visual_label: '任务时长', mode: 'READ_PROJECTION', source_objects: ['GrowthTask'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'weekly_progress', visual_label: '本周完成度', mode: 'READ_PROJECTION', source_objects: ['GrowthProgressProjection'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'streak', visual_label: '连续打卡', mode: 'READ_PROJECTION', source_objects: ['GrowthActionCompletion'], state_boundary: 'READ_ONLY', evidence_boundary: 'FACT' },
  { feature_id: 'complete_today', visual_label: '完成今日任务', mode: 'NAMED_ACTION_ROUTE', source_objects: ['GrowthTask', 'GrowthActionCompletion', 'AuditEvent'], state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION' },
] as const;

export function assertUi09DailyTaskFeatureCoverage(): void {
  if (UI09_DAILY_TASK_FEATURES.length < 11) throw new Error('ui09_daily_task_feature_catalog_must_include_all_visible_regions');
  const identifiers = new Set(UI09_DAILY_TASK_FEATURES.map((feature) => feature.feature_id));
  if (identifiers.size !== UI09_DAILY_TASK_FEATURES.length) throw new Error('ui09_daily_task_feature_catalog_must_be_unique');
}


export interface UiEntryExecutionStep {
  source_ui_id: FamilyUiId;
  source_feature_id: string;
  target_ui_id: FamilyUiId;
  target_route: string;
  /** Support surface means a researched capability outside the immutable 34-screen baseline. */
  target_is_support_surface?: boolean;
  required_before_implementation: readonly ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'];
}

/**
 * UI-01 is the root of the first functional lineage. Each target page must be
 * researched and designed at feature granularity before it is implemented.
 */
export const UI01_ENTRY_EXECUTION_QUEUE: readonly UiEntryExecutionStep[] = [
  { source_ui_id: 'UI-01', source_feature_id: 'assessment_campaign', target_ui_id: 'UI-02', target_route: 'growth-assessment', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'assessment_cta', target_ui_id: 'UI-02', target_route: 'growth-assessment', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'ai_diagnostic', target_ui_id: 'UI-03', target_route: 'assessment', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'challenge_21', target_ui_id: 'UI-35', target_route: 'growth-camp-21', target_is_support_surface: true, required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'plan_90', target_ui_id: 'UI-05', target_route: 'core-plan', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'growth_cases', target_ui_id: 'UI-12', target_route: 'growth-poster', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'expert_live', target_ui_id: 'UI-19', target_route: 'teacher-zone', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'family_advisor', target_ui_id: 'UI-19', target_route: 'teacher-zone', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'today_tasks', target_ui_id: 'UI-09', target_route: 'growth-daily-task', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'recommended_content', target_ui_id: 'UI-13', target_route: 'commerce-mall', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'nav_community', target_ui_id: 'UI-06', target_route: 'core-community', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
  { source_ui_id: 'UI-01', source_feature_id: 'nav_mine', target_ui_id: 'UI-07', target_route: 'core-mine', required_before_implementation: ['WIDE_RESEARCH', 'NEEDS_ANALYSIS', 'FUNCTION_DESIGN', 'CONTRACT_ALIGNMENT'] },
] as const;

export function assertUi01EntryExecutionQueue(): void {
  for (const step of UI01_ENTRY_EXECUTION_QUEUE) {
    if (!UI01_HOME_FEATURES.some((feature) => feature.feature_id === step.source_feature_id)) {
      throw new Error(`ui01_entry_queue_unknown_feature:${step.source_feature_id}`);
    }
    const targetBindings = step.target_is_support_surface ? FAMILY_SUPPORT_SURFACE_BINDINGS : FAMILY_UI_ARCHITECTURE_BINDINGS;
    if (!targetBindings.some((binding) => binding.ui_id === step.target_ui_id && binding.route === step.target_route)) {
      throw new Error(`ui01_entry_queue_unknown_target:${step.target_ui_id}`);
    }
  }
}
