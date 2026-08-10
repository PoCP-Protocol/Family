export const FELS_TRUTH = {
  referenceImplementation: true,
  realBangyangSource: false,
  sourceSystem: 'FELS_REFERENCE_IMPLEMENTATION',
  productionBangyangSource: 'NO',
} as const;

export const FELS_DATABASE_CONTRACT = {
  databaseName: 'family_legacy',
  urlEnvironmentVariable: 'LEGACY_DATABASE_URL',
  forbiddenSilentFallback: 'DATABASE_URL',
  schemaOwnership: 'FELS_ONLY',
} as const;

export const FELS_DOMAINS = [
  'CRM',
  'CUSTOMER_CONTACT',
  'STUDENT_GUARDIAN',
  'ASSESSMENT',
  'COURSE_LMS',
  'PROGRAM_COACHING',
  'TASK_CHECKIN_HOMEWORK',
  'HUMAN_SERVICE',
  'COMMUNITY_ACTIVITY',
  'COMMERCE_MEMBERSHIP',
  'LEGACY_AI_ANALYTICS',
  'LEGACY_GOVERNANCE',
] as const;

export const FELS_FORBIDDEN_FAMILY_CANONICAL_OBJECTS = [
  'Family',
  'Parent',
  'Child',
  'FamilyRelationship',
  'GrowthProfile',
  'GrowthJourney',
  'GrowthAction',
  'Outcome',
] as const;

export const FELS_ALLOWED_LEGACY_DERIVED_FIELDS = [
  'customer_level',
  'student_level',
  'family_type',
  'assessment_score',
  'risk_score',
  'family_score',
  'ranking',
  'ai_conclusion',
] as const;

export const FELS_ENTITY_TABLES = [
  'customer',
  'contact',
  'customer_tag',
  'student',
  'student_guardian',
  'assessment_template',
  'assessment_session',
  'assessment_answer',
  'assessment_score',
  'assessment_report',
  'course',
  'lesson',
  'class',
  'enrollment',
  'attendance',
  'training_program',
  'program_enrollment',
  'legacy_task',
  'legacy_checkin',
  'homework',
  'homework_review',
  'staff',
  'service_case',
  'advisor_session',
  'advisor_note',
  'community',
  'community_member',
  'activity',
  'product',
  'legacy_order',
  'order_item',
  'payment',
  'membership',
  'legacy_profile',
  'legacy_ai_report',
  'legacy_alert',
  'legacy_agreement',
  'legacy_consent',
  'legacy_growth_report',
  'legacy_success_case',
  'audit_log',
] as const;

export const FELS_EXPORT_ENDPOINTS = [
  '/legacy-export/customers',
  '/legacy-export/students',
  '/legacy-export/assessments',
  '/legacy-export/programs',
  '/legacy-export/tasks',
  '/legacy-export/checkins',
  '/legacy-export/advisor-notes',
  '/legacy-export/orders',
  '/legacy-export/consents',
] as const;

export const FELS_DIRTY_SCENARIOS = [
  'D001 duplicate phone',
  'D002 duplicate customer',
  'D003 one parent multiple children',
  'D004 two parent accounts same child',
  'D005 buyer != service student',
  'D006 orphan student',
  'D007 missing guardian',
  'D008 orphan assessment',
  'D009 orphan check-in',
  'D010 duplicate check-in',
  'D011 legacy family score',
  'D012 legacy ranking',
  'D013 AI diagnosis without evidence',
  'D014 consent without purpose',
  'D015 consent without guardian proof',
  'D016 missing policy version',
  'D017 old student tag',
  'D018 missing source timestamp',
  'D019 duplicate order',
  'D020 retired course',
] as const;

export type FelsMigrationStrategy =
  | 'TRANSFORM'
  | 'INTEGRATE_REFERENCE'
  | 'RETIRE'
  | 'DEFER_EXTERNAL'
  | 'CREATE_NEW_TARGET';

export interface FelsMigrationCoverageRow {
  readonly id: `M${string}`;
  readonly existingAsset: string;
  readonly felsModule: (typeof FELS_DOMAINS)[number] | 'EXTERNAL_REFERENCE';
  readonly felsEntity: string;
  readonly familyDestination: string;
  readonly migrationStrategy: FelsMigrationStrategy;
}

export const FELS_TO_FAMILY_MAP = [
  ['Customer', 'Family candidate / Parent candidate', 'NOT Family directly'],
  ['Contact', 'Parent candidate / Service contact candidate', 'contact != guardian'],
  ['Student', 'Child candidate', 'NOT Child directly'],
  ['StudentGuardian', 'FamilyRelationship candidate', 'requires identity and guardian proof'],
  ['AssessmentSession', 'Historical Evidence candidate', 'score is not GrowthState'],
  ['AssessmentScore', 'Historical Evidence / Legacy Annotation', 'LEGACY_DERIVED'],
  ['AssessmentReport', 'Growth Onboarding source candidate', 'requires reinterpretation'],
  ['LegacyAIReport', 'Historical AI Hypothesis', 'LEGACY_AI_HYPOTHESIS_NOT_FACT'],
  ['TrainingProgram', 'GrowthJourney candidate', 'not GrowthJourney in FELS'],
  ['LegacyTask', 'GrowthAction history candidate', 'not active Family action'],
  ['LegacyCheckIn', 'Action check-in history', 'check-in != Outcome'],
  ['AdvisorNote', 'HumanObservation / ServiceInteraction candidate', 'Perspective != Fact'],
  ['Course', 'Knowledge / Intervention source candidate', 'requires content decomposition'],
  ['Order', 'OrderRef', 'commerce reference only'],
  ['Payment', 'PaymentRef', 'commerce reference only'],
  ['LegacyConsent', 'Consent Evidence candidate', 'must not auto-promote'],
  ['CommunityMember', 'Engagement event candidate', 'membership != FamilyRelationship'],
  ['family_score', 'RETIRE', 'forbidden in Family'],
  ['ranking', 'RETIRE', 'forbidden in Family'],
] as const;

export const FELS_MIGRATION_MATRIX_COVERAGE: readonly FelsMigrationCoverageRow[] = [
  { id: 'M001', existingAsset: '客户/线索', felsModule: 'CRM', felsEntity: 'customer, lead', familyDestination: 'Family Account / Family candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M002', existingAsset: '家长信息', felsModule: 'CUSTOMER_CONTACT', felsEntity: 'contact', familyDestination: 'Parent candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M003', existingAsset: '孩子信息', felsModule: 'STUDENT_GUARDIAN', felsEntity: 'student', familyDestination: 'Child candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M004', existingAsset: '家庭成员关系', felsModule: 'STUDENT_GUARDIAN', felsEntity: 'student_guardian', familyDestination: 'FamilyRelationship candidate', migrationStrategy: 'CREATE_NEW_TARGET' },
  { id: 'M005', existingAsset: '家庭测评', felsModule: 'ASSESSMENT', felsEntity: 'assessment_session, assessment_report', familyDestination: 'Assessment + Growth Onboarding source', migrationStrategy: 'TRANSFORM' },
  { id: 'M006', existingAsset: 'AI诊断', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report', familyDestination: 'Growth Insight / Recommendation candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M007', existingAsset: '家庭档案', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_profile', familyDestination: 'GrowthProfile + FamilyTimeline source', migrationStrategy: 'TRANSFORM' },
  { id: 'M008', existingAsset: '课程', felsModule: 'COURSE_LMS', felsEntity: 'course, lesson', familyDestination: 'Course + KnowledgeCard + Intervention source', migrationStrategy: 'TRANSFORM' },
  { id: 'M009', existingAsset: '训练营', felsModule: 'PROGRAM_COACHING', felsEntity: 'training_program, program_enrollment', familyDestination: 'GrowthProgram candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M010', existingAsset: '21天挑战', felsModule: 'PROGRAM_COACHING', felsEntity: 'training_program, legacy_task, legacy_checkin', familyDestination: '21-Day GrowthCycle candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M011', existingAsset: '90天陪跑', felsModule: 'PROGRAM_COACHING', felsEntity: 'training_program, advisor_session, legacy_checkin', familyDestination: '90-Day GrowthJourney candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M012', existingAsset: '年度会员', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'membership', familyDestination: 'Family Growth Membership', migrationStrategy: 'TRANSFORM' },
  { id: 'M013', existingAsset: '任务', felsModule: 'TASK_CHECKIN_HOMEWORK', felsEntity: 'legacy_task', familyDestination: 'GrowthAction history candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M014', existingAsset: '打卡', felsModule: 'TASK_CHECKIN_HOMEWORK', felsEntity: 'legacy_checkin', familyDestination: 'ActionCompletion Event candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M015', existingAsset: '作业点评', felsModule: 'TASK_CHECKIN_HOMEWORK', felsEntity: 'homework_review', familyDestination: 'HumanObservation / Feedback candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M016', existingAsset: '助教', felsModule: 'HUMAN_SERVICE', felsEntity: 'staff, homework_review', familyDestination: 'Growth Companion + Human Copilot source', migrationStrategy: 'TRANSFORM' },
  { id: 'M017', existingAsset: '班主任', felsModule: 'HUMAN_SERVICE', felsEntity: 'staff, service_case', familyDestination: 'Growth Advisor / Service Owner candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M018', existingAsset: '顾问', felsModule: 'HUMAN_SERVICE', felsEntity: 'staff, advisor_session, advisor_note', familyDestination: 'Human Growth Advisor candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M019', existingAsset: '专家', felsModule: 'HUMAN_SERVICE', felsEntity: 'staff, service_case', familyDestination: 'Expert + Specialist Intervention candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M020', existingAsset: '社群', felsModule: 'COMMUNITY_ACTIVITY', felsEntity: 'community, community_member', familyDestination: 'GrowthCommunity source', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M021', existingAsset: '沙龙/活动', felsModule: 'COMMUNITY_ACTIVITY', felsEntity: 'activity', familyDestination: 'FamilyActivity candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M022', existingAsset: '城市活动', felsModule: 'COMMUNITY_ACTIVITY', felsEntity: 'activity', familyDestination: 'City Growth Network', migrationStrategy: 'DEFER_EXTERNAL' },
  { id: 'M023', existingAsset: '课程SOP', felsModule: 'COURSE_LMS', felsEntity: 'course, lesson', familyDestination: 'Executable Workflow source', migrationStrategy: 'TRANSFORM' },
  { id: 'M024', existingAsset: '助教SOP', felsModule: 'HUMAN_SERVICE', felsEntity: 'service_case, advisor_note', familyDestination: 'Growth Service Workflow source', migrationStrategy: 'TRANSFORM' },
  { id: 'M025', existingAsset: '运营SOP', felsModule: 'CRM', felsEntity: 'follow_up, opportunity', familyDestination: 'Growth Operations Workflow source', migrationStrategy: 'TRANSFORM' },
  { id: 'M026', existingAsset: '评估SOP', felsModule: 'ASSESSMENT', felsEntity: 'assessment_report, legacy_growth_report', familyDestination: 'Outcome Measurement Workflow source', migrationStrategy: 'TRANSFORM' },
  { id: 'M027', existingAsset: '复购SOP', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'order, membership', familyDestination: 'Next Growth Journey Decision source', migrationStrategy: 'TRANSFORM' },
  { id: 'M028', existingAsset: '质检SOP', felsModule: 'LEGACY_GOVERNANCE', felsEntity: 'audit_log, service_case', familyDestination: 'Quality & Eval Platform source', migrationStrategy: 'TRANSFORM' },
  { id: 'M029', existingAsset: '成长报告', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_growth_report', familyDestination: 'Family Growth Review source', migrationStrategy: 'TRANSFORM' },
  { id: 'M030', existingAsset: '成功案例', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_success_case', familyDestination: 'OutcomeCase candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M031', existingAsset: '内容获客', felsModule: 'CRM', felsEntity: 'lead', familyDestination: 'Growth Discovery Content reference', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M032', existingAsset: '私域运营', felsModule: 'COMMUNITY_ACTIVITY', felsEntity: 'community, community_member', familyDestination: 'Family Engagement source', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M033', existingAsset: '裂变/邀请', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'membership', familyDestination: 'Growth Referral source', migrationStrategy: 'TRANSFORM' },
  { id: 'M034', existingAsset: '积分商城', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'membership', familyDestination: 'Membership Benefit', migrationStrategy: 'TRANSFORM' },
  { id: 'M035', existingAsset: '排行榜', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_profile.ranking', familyDestination: 'N/A', migrationStrategy: 'RETIRE' },
  { id: 'M036', existingAsset: '家庭总分', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_profile.family_score', familyDestination: 'GrowthProfile States source only', migrationStrategy: 'RETIRE' },
  { id: 'M037', existingAsset: '订单', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'order', familyDestination: 'OrderRef', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M038', existingAsset: '支付', felsModule: 'COMMERCE_MEMBERSHIP', felsEntity: 'payment', familyDestination: 'PaymentRef', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M039', existingAsset: '直播', felsModule: 'COURSE_LMS', felsEntity: 'lesson', familyDestination: 'LearningSessionRef', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M040', existingAsset: '教务', felsModule: 'COURSE_LMS', felsEntity: 'class, enrollment, attendance', familyDestination: 'Program/Class Reference', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M041', existingAsset: 'CRM', felsModule: 'CRM', felsEntity: 'lead, opportunity, customer', familyDestination: 'Family CRM View source', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M042', existingAsset: '客服', felsModule: 'HUMAN_SERVICE', felsEntity: 'service_case', familyDestination: 'SupportInteraction source', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M043', existingAsset: '会话记录', felsModule: 'HUMAN_SERVICE', felsEntity: 'advisor_note, service_case', familyDestination: 'ServiceInteraction / Perspective source', migrationStrategy: 'TRANSFORM' },
  { id: 'M044', existingAsset: '用户画像', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_profile', familyDestination: 'GrowthProfile source candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M045', existingAsset: '知识库', felsModule: 'COURSE_LMS', felsEntity: 'course, lesson', familyDestination: 'Knowledge Foundry source', migrationStrategy: 'TRANSFORM' },
  { id: 'M046', existingAsset: '家长顾问Agent', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report', familyDestination: 'Parent Growth Companion source', migrationStrategy: 'TRANSFORM' },
  { id: 'M047', existingAsset: '孩子陪练Agent', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report', familyDestination: 'Child Growth Companion deferred source', migrationStrategy: 'DEFER_EXTERNAL' },
  { id: 'M048', existingAsset: '助教助手', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report, legacy_alert', familyDestination: 'Human Copilot source', migrationStrategy: 'TRANSFORM' },
  { id: 'M049', existingAsset: '成长规划师', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report', familyDestination: 'Growth Planner source', migrationStrategy: 'TRANSFORM' },
  { id: 'M050', existingAsset: '经营助手', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_ai_report', familyDestination: 'Management Copilot source', migrationStrategy: 'INTEGRATE_REFERENCE' },
  { id: 'M051', existingAsset: '预警', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_alert', familyDestination: 'Alert + Safety Gate source', migrationStrategy: 'TRANSFORM' },
  { id: 'M052', existingAsset: '用户数据授权', felsModule: 'LEGACY_GOVERNANCE', felsEntity: 'legacy_consent, legacy_agreement', familyDestination: 'Consent evidence candidate', migrationStrategy: 'TRANSFORM' },
  { id: 'M053', existingAsset: '历史成长数据', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_profile, legacy_growth_report', familyDestination: 'Family Timeline/Event source', migrationStrategy: 'TRANSFORM' },
  { id: 'M054', existingAsset: '研究/实验数据', felsModule: 'LEGACY_GOVERNANCE', felsEntity: 'audit_log', familyDestination: 'Causal Evidence Registry source', migrationStrategy: 'CREATE_NEW_TARGET' },
  { id: 'M055', existingAsset: '真实干预结果', felsModule: 'LEGACY_AI_ANALYTICS', felsEntity: 'legacy_success_case, legacy_growth_report', familyDestination: 'CausalEpisode source candidate', migrationStrategy: 'CREATE_NEW_TARGET' },
];

export function getFels0Gate() {
  return {
    referenceImplementation: FELS_TRUTH.referenceImplementation,
    realBangyangSource: FELS_TRUTH.realBangyangSource,
    domains: FELS_DOMAINS.length,
    entityTables: FELS_ENTITY_TABLES.length,
    dirtyScenarios: FELS_DIRTY_SCENARIOS.length,
    migrationMatrixClassified: FELS_MIGRATION_MATRIX_COVERAGE.length,
    migrationMatrixCoverage: FELS_MIGRATION_MATRIX_COVERAGE.length,
    readyForFels1: true,
    startFels1: false,
  } as const;
}