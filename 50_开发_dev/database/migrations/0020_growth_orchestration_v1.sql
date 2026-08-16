-- FAMILY-GROWTH-VERTICAL-SLICE-001
-- V3 首条纵切：需求→意图→资源→资格→推荐→家庭决定→计划→服务案例→回访→最小上下文复用。
-- 仅支持确定性内部验证；不引入 Organization、AccessGrant、Enrollment/Delivery、Payment 或外部模型调用。
-- 每个对象以 family_id 为强制范围；触发器确保 subject/plan/recommendation 等关联不跨家庭。

DO $$ BEGIN
  CREATE TYPE orchestration_need_type AS ENUM ('PARENT_CHILD_COMMUNICATION_CONFLICT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE growth_intent_status AS ENUM ('OPEN','CANCELLED','CLOSED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE orchestration_resource_type AS ENUM ('NO_ACTION','CONTENT','PRACTICE','AI_COACH','PROGRAM','HUMAN_COACH','QUALIFIED_EXPERT','EXTERNAL_REFERRAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE resource_offer_status AS ENUM ('ACTIVE','INACTIVE','RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE eligibility_phase AS ENUM ('T1_RECOMMENDATION','T2_EXECUTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE eligibility_result AS ENUM ('ELIGIBLE','INELIGIBLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE recommendation_status AS ENUM ('PROPOSED','DECIDED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE family_service_decision_type AS ENUM ('ACCEPT','SELECT_ALTERNATIVE','DECLINE','NO_ACTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE family_service_decision_status AS ENUM ('ACCEPTED','DECLINED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE orchestration_plan_status AS ENUM ('DRAFT','READY','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE service_case_status AS ENUM ('OPEN','IN_PROGRESS','AWAITING_FOLLOW_UP','CLOSED','CANCELLED','ESCALATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE helpfulness_signal AS ENUM ('HELPFUL','A_LITTLE_HELPFUL','NOT_HELPFUL','NOT_ANSWERED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS growth_need_signals (
  need_signal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  subject_person_id uuid NOT NULL REFERENCES persons(person_id),
  need_type orchestration_need_type NOT NULL,
  source_type varchar(32) NOT NULL DEFAULT 'PARENT_EXPLICIT',
  signal_text varchar(2000) NOT NULL,
  canonical_family_fact boolean NOT NULL DEFAULT false CHECK (canonical_family_fact = false),
  created_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_growth_need_signal_idempotency UNIQUE (family_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_growth_need_signals_family_subject ON growth_need_signals(family_id, subject_person_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_intents (
  growth_intent_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  subject_person_id uuid NOT NULL REFERENCES persons(person_id),
  need_signal_id uuid NOT NULL REFERENCES growth_need_signals(need_signal_id),
  need_type orchestration_need_type NOT NULL,
  goal_text varchar(1000) NOT NULL,
  status growth_intent_status NOT NULL DEFAULT 'OPEN',
  confirmed_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_growth_intent_idempotency UNIQUE (family_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_growth_intents_family_subject_open ON growth_intents(family_id, subject_person_id, created_at DESC) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS growth_capabilities (
  growth_capability_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_code varchar(100) NOT NULL UNIQUE,
  display_name varchar(200) NOT NULL,
  description varchar(2000) NOT NULL,
  need_type orchestration_need_type NOT NULL,
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_intent_capabilities (
  growth_intent_id uuid NOT NULL REFERENCES growth_intents(growth_intent_id) ON DELETE CASCADE,
  growth_capability_id uuid NOT NULL REFERENCES growth_capabilities(growth_capability_id),
  assignment_source varchar(64) NOT NULL DEFAULT 'DETERMINISTIC_VERTICAL_POLICY',
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (growth_intent_id, growth_capability_id)
);
CREATE INDEX IF NOT EXISTS idx_growth_intent_capabilities_capability ON growth_intent_capabilities(growth_capability_id, growth_intent_id);

CREATE TABLE IF NOT EXISTS resource_offers (
  resource_offer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NULL REFERENCES families(family_id), -- NULL = internal platform offer; future tenant/provider offer still has explicit owner boundary
  resource_code varchar(100) NOT NULL UNIQUE,
  resource_type orchestration_resource_type NOT NULL,
  title varchar(200) NOT NULL,
  description varchar(2000) NOT NULL,
  -- 每个资源自行声明资格范围；平台不把 12–15 写为默认年龄上限。
  age_scope varchar(100) NOT NULL DEFAULT 'LIFECYCLE_CONTEXTUAL',
  age_min_months integer NULL CHECK (age_min_months IS NULL OR age_min_months >= 0),
  age_max_months integer NULL CHECK (age_max_months IS NULL OR age_max_months >= age_min_months),
  life_stage_scope text[] NOT NULL DEFAULT ARRAY['ALL_LIFE_STAGES'],
  need_type orchestration_need_type NOT NULL,
  evidence_level varchar(64) NOT NULL DEFAULT 'E0_INTERNAL_CURATED',
  risk_boundary varchar(100) NOT NULL DEFAULT 'LOW_RISK_NON_CLINICAL',
  privacy_boundary varchar(100) NOT NULL DEFAULT 'FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE',
  effort_class varchar(64) NOT NULL DEFAULT 'LOW',
  duration_class varchar(64) NOT NULL DEFAULT 'MOMENT',
  cost_class varchar(64) NOT NULL DEFAULT 'FREE',
  requires_consent boolean NOT NULL DEFAULT true,
  requires_human boolean NOT NULL DEFAULT false,
  content_ref varchar(255) NULL,
  provider_qualification varchar(64) NOT NULL DEFAULT 'INTERNAL_DETERMINISTIC',
  availability_status resource_offer_status NOT NULL DEFAULT 'ACTIVE',
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_requires_content_ref CHECK (resource_type <> 'PRACTICE' OR content_ref IS NOT NULL),
  CONSTRAINT no_action_has_no_content CHECK (resource_type <> 'NO_ACTION' OR content_ref IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_resource_offers_need_active ON resource_offers(need_type, availability_status, resource_type);

CREATE TABLE IF NOT EXISTS resource_offer_capabilities (
  resource_offer_id uuid NOT NULL REFERENCES resource_offers(resource_offer_id) ON DELETE CASCADE,
  growth_capability_id uuid NOT NULL REFERENCES growth_capabilities(growth_capability_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (resource_offer_id, growth_capability_id)
);
CREATE INDEX IF NOT EXISTS idx_resource_offer_capabilities_capability ON resource_offer_capabilities(growth_capability_id, resource_offer_id);

CREATE TABLE IF NOT EXISTS resource_recommendations (
  resource_recommendation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  growth_intent_id uuid NOT NULL REFERENCES growth_intents(growth_intent_id),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  status recommendation_status NOT NULL DEFAULT 'PROPOSED',
  policy_version varchar(64) NOT NULL,
  generated_by varchar(64) NOT NULL DEFAULT 'DETERMINISTIC_ORCHESTRATION_V1',
  idempotency_key varchar(128) NOT NULL,
  created_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_resource_recommendation_idempotency UNIQUE (family_id, idempotency_key),
  CONSTRAINT uq_resource_recommendation_version UNIQUE (growth_intent_id, version)
);

CREATE TABLE IF NOT EXISTS resource_recommendation_candidates (
  recommendation_candidate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_recommendation_id uuid NOT NULL REFERENCES resource_recommendations(resource_recommendation_id) ON DELETE CASCADE,
  resource_offer_id uuid NOT NULL REFERENCES resource_offers(resource_offer_id),
  rank integer NOT NULL CHECK (rank >= 1),
  eligibility_result eligibility_result NOT NULL,
  rationale varchar(2000) NOT NULL,
  limitations varchar(2000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_recommendation_candidate_rank UNIQUE (resource_recommendation_id, rank),
  CONSTRAINT uq_recommendation_candidate_offer UNIQUE (resource_recommendation_id, resource_offer_id)
);

CREATE TABLE IF NOT EXISTS family_service_decisions (
  family_service_decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  resource_recommendation_id uuid NOT NULL REFERENCES resource_recommendations(resource_recommendation_id),
  decision_type family_service_decision_type NOT NULL,
  status family_service_decision_status NOT NULL,
  decided_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  rationale varchar(1000) NULL,
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(64) NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_family_service_decision_idempotency UNIQUE (family_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS family_service_decision_offers (
  family_service_decision_id uuid NOT NULL REFERENCES family_service_decisions(family_service_decision_id) ON DELETE CASCADE,
  resource_offer_id uuid NOT NULL REFERENCES resource_offers(resource_offer_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_service_decision_id, resource_offer_id)
);

CREATE TABLE IF NOT EXISTS orchestration_plans (
  orchestration_plan_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  family_service_decision_id uuid NOT NULL REFERENCES family_service_decisions(family_service_decision_id),
  status orchestration_plan_status NOT NULL DEFAULT 'DRAFT',
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(64) NOT NULL,
  created_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_orchestration_plan_idempotency UNIQUE (family_id, idempotency_key),
  CONSTRAINT uq_orchestration_plan_decision UNIQUE (family_service_decision_id)
);

CREATE TABLE IF NOT EXISTS orchestration_plan_steps (
  orchestration_plan_step_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_plan_id uuid NOT NULL REFERENCES orchestration_plans(orchestration_plan_id) ON DELETE CASCADE,
  resource_offer_id uuid NOT NULL REFERENCES resource_offers(resource_offer_id),
  step_order integer NOT NULL CHECK (step_order >= 1),
  trigger_type varchar(64) NOT NULL DEFAULT 'FAMILY_DECISION',
  status varchar(32) NOT NULL DEFAULT 'PLANNED' CHECK (status = 'PLANNED'), -- plan is declarative, not execution truth
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_orchestration_plan_step_order UNIQUE (orchestration_plan_id, step_order)
);

CREATE TABLE IF NOT EXISTS service_cases (
  service_case_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  subject_person_id uuid NOT NULL REFERENCES persons(person_id),
  orchestration_plan_id uuid NOT NULL REFERENCES orchestration_plans(orchestration_plan_id),
  status service_case_status NOT NULL DEFAULT 'OPEN',
  owner_type varchar(64) NOT NULL DEFAULT 'FAMILY_STEWARD_INTERNAL',
  next_action_at timestamptz NULL,
  sla_class varchar(64) NOT NULL DEFAULT 'LOW_RISK_STANDARD',
  escalation_reason varchar(1000) NULL,
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(64) NOT NULL,
  opened_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NULL,
  CONSTRAINT uq_service_case_idempotency UNIQUE (family_id, idempotency_key),
  CONSTRAINT uq_service_case_plan UNIQUE (orchestration_plan_id),
  CONSTRAINT case_closed_time CHECK ((status IN ('CLOSED','CANCELLED') AND closed_at IS NOT NULL) OR (status NOT IN ('CLOSED','CANCELLED')))
);
CREATE INDEX IF NOT EXISTS idx_service_cases_family_status ON service_cases(family_id, status, opened_at DESC);

CREATE TABLE IF NOT EXISTS service_eligibility_evaluations (
  service_eligibility_evaluation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  resource_offer_id uuid NOT NULL REFERENCES resource_offers(resource_offer_id),
  growth_intent_id uuid NULL REFERENCES growth_intents(growth_intent_id),
  service_case_id uuid NULL REFERENCES service_cases(service_case_id),
  phase eligibility_phase NOT NULL,
  result eligibility_result NOT NULL,
  reason_code varchar(100) NOT NULL,
  detail varchar(1000) NOT NULL,
  policy_version varchar(64) NOT NULL,
  evaluated_by varchar(64) NOT NULL DEFAULT 'DETERMINISTIC_ORCHESTRATION_V1',
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evaluation_has_scope CHECK (growth_intent_id IS NOT NULL OR service_case_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_service_eligibility_family_scope ON service_eligibility_evaluations(family_id, phase, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS follow_up_responses (
  follow_up_response_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  service_case_id uuid NOT NULL REFERENCES service_cases(service_case_id),
  helpfulness helpfulness_signal NOT NULL,
  response_text varchar(2000) NULL,
  truth_class varchar(64) NOT NULL DEFAULT 'USER_PERCEIVED_HELPFULNESS' CHECK (truth_class = 'USER_PERCEIVED_HELPFULNESS'),
  idempotency_key varchar(128) NOT NULL,
  recorded_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  policy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_follow_up_response_idempotency UNIQUE (family_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_follow_up_responses_family_case ON follow_up_responses(family_id, service_case_id, created_at DESC);

-- 所有跨表 family_id/subject 关系的 fail-closed 数据层保护。
CREATE OR REPLACE FUNCTION assert_orchestration_family_scope() RETURNS trigger AS $$
DECLARE
  expected_family uuid;
BEGIN
  IF TG_TABLE_NAME = 'growth_need_signals' THEN
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.subject_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'subject_person_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.created_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'growth_intents' THEN
    SELECT family_id INTO expected_family FROM growth_need_signals WHERE need_signal_id = NEW.need_signal_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'need_signal_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.subject_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'subject_person_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.confirmed_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'resource_recommendations' THEN
    SELECT family_id INTO expected_family FROM growth_intents WHERE growth_intent_id = NEW.growth_intent_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'growth_intent_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.created_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'family_service_decisions' THEN
    SELECT family_id INTO expected_family FROM resource_recommendations WHERE resource_recommendation_id = NEW.resource_recommendation_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'recommendation_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.decided_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'orchestration_plans' THEN
    SELECT family_id INTO expected_family FROM family_service_decisions WHERE family_service_decision_id = NEW.family_service_decision_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'decision_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.created_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'service_cases' THEN
    SELECT family_id INTO expected_family FROM orchestration_plans WHERE orchestration_plan_id = NEW.orchestration_plan_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'plan_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.subject_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'subject_person_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.opened_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  ELSIF TG_TABLE_NAME = 'follow_up_responses' THEN
    SELECT family_id INTO expected_family FROM service_cases WHERE service_case_id = NEW.service_case_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'service_case_not_in_family'; END IF;
    SELECT family_id INTO expected_family FROM persons WHERE person_id = NEW.recorded_by_person_id;
    IF expected_family IS DISTINCT FROM NEW.family_id THEN RAISE EXCEPTION 'actor_person_not_in_family'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_growth_need_signals_family_scope ON growth_need_signals;
CREATE TRIGGER trg_growth_need_signals_family_scope BEFORE INSERT OR UPDATE ON growth_need_signals FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_growth_intents_family_scope ON growth_intents;
CREATE TRIGGER trg_growth_intents_family_scope BEFORE INSERT OR UPDATE ON growth_intents FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_resource_recommendations_family_scope ON resource_recommendations;
CREATE TRIGGER trg_resource_recommendations_family_scope BEFORE INSERT OR UPDATE ON resource_recommendations FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_family_service_decisions_family_scope ON family_service_decisions;
CREATE TRIGGER trg_family_service_decisions_family_scope BEFORE INSERT OR UPDATE ON family_service_decisions FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_orchestration_plans_family_scope ON orchestration_plans;
CREATE TRIGGER trg_orchestration_plans_family_scope BEFORE INSERT OR UPDATE ON orchestration_plans FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_service_cases_family_scope ON service_cases;
CREATE TRIGGER trg_service_cases_family_scope BEFORE INSERT OR UPDATE ON service_cases FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();
DROP TRIGGER IF EXISTS trg_follow_up_responses_family_scope ON follow_up_responses;
CREATE TRIGGER trg_follow_up_responses_family_scope BEFORE INSERT OR UPDATE ON follow_up_responses FOR EACH ROW EXECUTE FUNCTION assert_orchestration_family_scope();

-- 平台内部确定性资源：只为首条亲子沟通纵切服务；AI 不外呼，Practice 必须有已批准内容引用。
INSERT INTO growth_capabilities(capability_code,display_name,description,need_type,policy_version)
VALUES
  ('DE_ESCALATION','即时降温','在非危机、低风险亲子冲突中，帮助家庭降低当下互动张力并保留暂停选择。','PARENT_CHILD_COMMUNICATION_CONFLICT','FAMILY-GROWTH-VERTICAL-SLICE-001'),
  ('COMMUNICATION_REOPENING','沟通重新开启','帮助家庭在尊重边界的前提下，以小而可逆的行动重新打开对话。','PARENT_CHILD_COMMUNICATION_CONFLICT','FAMILY-GROWTH-VERTICAL-SLICE-001')
ON CONFLICT (capability_code) DO NOTHING;

INSERT INTO resource_offers(resource_code,resource_type,title,description,age_scope,age_min_months,age_max_months,life_stage_scope,need_type,evidence_level,risk_boundary,privacy_boundary,effort_class,duration_class,cost_class,requires_consent,requires_human,content_ref,provider_qualification,availability_status,policy_version)
VALUES
  ('V3_NO_ACTION_COMMUNICATION','NO_ACTION','暂不行动，保留支持入口','当家庭明确希望先暂停或尚无合格帮助时，确认不行动也是有效且可复查的选择。','EARLY_ADOLESCENCE_12_15',144,191,ARRAY['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_INTERNAL_CURATED','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','MOMENT','FREE',false,false,NULL,'INTERNAL_DETERMINISTIC','ACTIVE','FAMILY-GROWTH-VERTICAL-SLICE-001'),
  ('V3_AI_COACH_COMMUNICATION','AI_COACH','低风险对话重新开启提示','仅提供稳定情绪、复述感受、开放提问和可逆小行动的结构化提示；不诊断、不替代专业服务。','EARLY_ADOLESCENCE_12_15',144,191,ARRAY['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_INTERNAL_CURATED','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','MOMENT','FREE',true,false,NULL,'INTERNAL_DETERMINISTIC','ACTIVE','FAMILY-GROWTH-VERTICAL-SLICE-001'),
  ('V3_PRACTICE_COMMUNICATION','PRACTICE','亲子沟通重新开启练习','一项由榜样教育既有低风险亲子沟通方法改写、经批准内容引用约束的可选练习。','EARLY_ADOLESCENCE_12_15',144,191,ARRAY['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_INTERNAL_CURATED','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','ONE_EVENING','FREE',true,false,'BANGYANG_APPROVED_PRACTICE_COMMUNICATION_REOPENING_V1','INTERNAL_DETERMINISTIC','ACTIVE','FAMILY-GROWTH-VERTICAL-SLICE-001'),
  ('V3_EXTERNAL_REFERRAL_COMMUNICATION','EXTERNAL_REFERRAL','外部专业支持提示','当需求超出教育性低风险帮助边界时，提示家庭寻求合格本地专业或紧急支持；系统不自动联系第三方。','EARLY_ADOLESCENCE_12_15',144,191,ARRAY['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_INTERNAL_CURATED','REFER_ONLY','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','MOMENT','FREE',true,false,NULL,'INTERNAL_DETERMINISTIC','ACTIVE','FAMILY-GROWTH-VERTICAL-SLICE-001')
ON CONFLICT (resource_code) DO NOTHING;

INSERT INTO resource_offer_capabilities(resource_offer_id,growth_capability_id)
SELECT ro.resource_offer_id,gc.growth_capability_id
FROM resource_offers ro
JOIN growth_capabilities gc ON (ro.resource_code='V3_NO_ACTION_COMMUNICATION' AND gc.capability_code='DE_ESCALATION')
   OR (ro.resource_code IN ('V3_AI_COACH_COMMUNICATION','V3_PRACTICE_COMMUNICATION') AND gc.capability_code='COMMUNICATION_REOPENING')
   OR (ro.resource_code='V3_EXTERNAL_REFERRAL_COMMUNICATION' AND gc.capability_code IN ('DE_ESCALATION','COMMUNICATION_REOPENING'))
ON CONFLICT DO NOTHING;
