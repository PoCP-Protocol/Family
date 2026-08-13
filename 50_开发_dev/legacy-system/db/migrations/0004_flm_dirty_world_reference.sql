-- FLM Dirty-World Reference Fixture: 旧画像 / 旧标签 / 旧AI报告 / 旧预警
-- SOURCE_KIND = FELS_REFERENCE_IMPLEMENTATION
-- PURPOSE = FLM_ANTI_CORRUPTION_FIXTURE
-- FELS4_PRODUCT_CAPABILITY = NO
-- Authorization = FLM_INTEGRATION_001 (clean forward port of FLM-AC-001/002 legal assets).
-- Depends ONLY on 0001_fels0_schema.sql (fels schema) + 0002_fels1_core_business.sql
-- (legacy_customers / legacy_students / legacy_assessment_sessions). It does NOT depend on
-- 0003 (early FELS-2/3 program lifecycle), which is intentionally NOT part of clean master.
--
-- Legacy semantics only. These are NOT Family canonical objects and must never be
-- promoted directly into Family growth ontology by FLM.
--   LEGACY_PROFILE_SNAPSHOT_NOT_STATE  : legacy profile snapshot != GrowthState
--   family_score -> RETIRE (M036)      : 不做 Family Total Score
--   ranking      -> RETIRE (M035)      : 不做家庭排行
--   LEGACY_TAG_CATEGORY_NOT_OFFICIAL   : legacy label = Annotation, != Diagnosis
--   LEGACY_AI_HYPOTHESIS_NOT_FACT      : legacy AI conclusion = Historical Hypothesis, != Fact
--   LEGACY_ALERT_SIGNAL_NOT_THRESHOLD  : legacy alert = raw signal, != Family Safety threshold

CREATE TABLE IF NOT EXISTS fels.legacy_profiles (
  legacy_profile_id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  family_type text,
  family_score numeric,
  ranking integer,
  customer_level text,
  student_level text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_tags (
  legacy_tag_id text PRIMARY KEY,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  tag_category text NOT NULL,
  tag_value text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_TAG_CATEGORY_NOT_OFFICIAL',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_ai_reports (
  legacy_ai_report_id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  assessment_id text REFERENCES fels.legacy_assessment_sessions(assessment_id),
  report_type text NOT NULL,
  ai_conclusion text NOT NULL,
  recommended_action text,
  has_supporting_evidence boolean NOT NULL DEFAULT false,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_AI_HYPOTHESIS_NOT_FACT',
  generated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_alerts (
  legacy_alert_id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  alert_type text NOT NULL,
  risk_score numeric,
  severity_label text,
  legacy_disposition text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_ALERT_SIGNAL_NOT_THRESHOLD',
  triggered_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legacy_profiles_customer ON fels.legacy_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_profiles_student ON fels.legacy_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_legacy_tags_customer ON fels.legacy_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_tags_student ON fels.legacy_tags(student_id);
CREATE INDEX IF NOT EXISTS idx_legacy_ai_reports_customer ON fels.legacy_ai_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_ai_reports_assessment ON fels.legacy_ai_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_legacy_alerts_customer ON fels.legacy_alerts(customer_id);
