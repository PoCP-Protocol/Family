-- FAMILY_RESOURCE_ASSET_CATALOG_001
-- 榜样教育内容/练习的内部资源资产目录与准入基础。
-- 只扩展既有 ResourceOffer/GrowthCapability 主链；不引入 Organization、AccessGrant、Payment、Entitlement、Enrollment/Delivery、外部模型或公开内容能力。

DO $$ BEGIN
  CREATE TYPE resource_asset_origin AS ENUM ('BANGYANG_EDUCATION','FAMILY_INTERNAL','LICENSED_THIRD_PARTY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE resource_asset_kind AS ENUM ('CONTENT','PRACTICE_TEMPLATE','CURRICULUM_REFERENCE','SERVICE_SOP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE resource_asset_admission_status AS ENUM ('DRAFT','UNDER_REVIEW','ADMITTED','SUSPENDED','RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS resource_assets (
  resource_asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code varchar(100) NOT NULL UNIQUE,
  origin resource_asset_origin NOT NULL,
  asset_kind resource_asset_kind NOT NULL,
  title varchar(200) NOT NULL,
  summary varchar(2000) NOT NULL,
  -- 目录对象只记录供给元数据，不记录孩子、家庭或服务案例数据。
  contains_child_personal_data boolean NOT NULL DEFAULT false CHECK (contains_child_personal_data = false),
  source_attribution varchar(500) NOT NULL,
  copyright_status varchar(64) NOT NULL CHECK (copyright_status IN ('OWNED','LICENSED','PENDING_REVIEW','RESTRICTED')),
  canonical_asset boolean NOT NULL DEFAULT false CHECK (canonical_asset = false),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_asset_versions (
  resource_asset_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_asset_id uuid NOT NULL REFERENCES resource_assets(resource_asset_id) ON DELETE CASCADE,
  version_label varchar(64) NOT NULL,
  source_locator varchar(500) NOT NULL,
  content_checksum varchar(128) NOT NULL,
  age_scope varchar(100) NOT NULL DEFAULT 'LIFECYCLE_CONTEXTUAL',
  age_min_months integer NULL CHECK (age_min_months IS NULL OR age_min_months >= 0),
  age_max_months integer NULL CHECK (age_max_months IS NULL OR age_max_months >= age_min_months),
  life_stage_scope text[] NOT NULL DEFAULT ARRAY['ALL_LIFE_STAGES'],
  evidence_level varchar(64) NOT NULL,
  risk_boundary varchar(100) NOT NULL DEFAULT 'LOW_RISK_NON_CLINICAL',
  privacy_boundary varchar(100) NOT NULL DEFAULT 'FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE',
  version_notes varchar(2000) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(resource_asset_id, version_label)
);

CREATE TABLE IF NOT EXISTS resource_asset_admissions (
  resource_asset_admission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_asset_version_id uuid NOT NULL UNIQUE REFERENCES resource_asset_versions(resource_asset_version_id) ON DELETE CASCADE,
  status resource_asset_admission_status NOT NULL DEFAULT 'DRAFT',
  policy_version varchar(64) NOT NULL,
  safety_review_note varchar(2000) NOT NULL DEFAULT '',
  admission_rationale varchar(2000) NOT NULL DEFAULT '',
  admitted_at timestamptz NULL,
  suspended_at timestamptz NULL,
  retired_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admitted_asset_requires_timestamp CHECK (status <> 'ADMITTED' OR admitted_at IS NOT NULL),
  CONSTRAINT suspended_asset_requires_timestamp CHECK (status <> 'SUSPENDED' OR suspended_at IS NOT NULL),
  CONSTRAINT retired_asset_requires_timestamp CHECK (status <> 'RETIRED' OR retired_at IS NOT NULL)
);

ALTER TABLE resource_offers
  ADD COLUMN IF NOT EXISTS resource_asset_version_id uuid NULL REFERENCES resource_asset_versions(resource_asset_version_id);

CREATE INDEX IF NOT EXISTS idx_resource_asset_versions_asset ON resource_asset_versions(resource_asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_asset_admissions_status ON resource_asset_admissions(status, resource_asset_version_id);
CREATE INDEX IF NOT EXISTS idx_resource_offers_asset_version ON resource_offers(resource_asset_version_id) WHERE resource_asset_version_id IS NOT NULL;

-- 已审核的榜样教育低风险“稳定—倾听—重新开启对话”练习。它仅是 Practice 内容引用；
-- 不代表 Program Enrollment、真人顾问服务、儿童诊断或成长结果承诺。
WITH asset AS (
  INSERT INTO resource_assets(asset_code, origin, asset_kind, title, summary, source_attribution, copyright_status)
  VALUES (
    'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE',
    'BANGYANG_EDUCATION',
    'PRACTICE_TEMPLATE',
    '亲子沟通：稳定、倾听与重新开启对话',
    '为家庭提供一次低风险、可暂停、非诊断性的亲子沟通重新开启练习。',
    '榜样教育既有亲子沟通练习资产；Family 内部验证目录',
    'OWNED'
  )
  ON CONFLICT (asset_code) DO UPDATE SET updated_at = now()
  RETURNING resource_asset_id
), version_row AS (
  INSERT INTO resource_asset_versions(resource_asset_id, version_label, source_locator, content_checksum, age_scope, age_min_months, age_max_months, life_stage_scope, evidence_level, risk_boundary, privacy_boundary, version_notes)
  SELECT resource_asset_id, '2026.08-v1', 'bangyang://practice/stabilize-reopen-dialogue/2026.08-v1', 'bangyang-practice-stabilize-reopen-dialogue-2026-08-v1', 'EARLY_ADOLESCENCE_CONTEXTUAL', 144, 191, ARRAY['EARLY_ADOLESCENCE_12_15'], 'E0_INTERNAL_CURATED', 'LOW_RISK_NON_CLINICAL', 'FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE', '当前仅用于 Family 内部确定性验证；家庭可不行动、暂停或选择外部支持。'
  FROM asset
  ON CONFLICT (resource_asset_id, version_label) DO UPDATE SET version_notes = EXCLUDED.version_notes
  RETURNING resource_asset_version_id
)
INSERT INTO resource_asset_admissions(resource_asset_version_id, status, policy_version, safety_review_note, admission_rationale, admitted_at)
SELECT resource_asset_version_id, 'ADMITTED', 'FAMILY_RESOURCE_ASSET_CATALOG_001', '低风险、非临床、可停止；不含儿童个人数据，不外发。', '作为首条亲子沟通纵切的 approved-content reference。', now()
FROM version_row
ON CONFLICT (resource_asset_version_id) DO UPDATE SET
  status = 'ADMITTED', policy_version = EXCLUDED.policy_version,
  safety_review_note = EXCLUDED.safety_review_note, admission_rationale = EXCLUDED.admission_rationale,
  admitted_at = COALESCE(resource_asset_admissions.admitted_at, now()), updated_at = now();

WITH capability AS (
  INSERT INTO growth_capabilities(capability_code, display_name, description, need_type, policy_version)
  VALUES ('DE_ESCALATION','降温与重新开启对话','帮助家庭以低风险方式暂停、倾听并重新开启沟通。','PARENT_CHILD_COMMUNICATION_CONFLICT','FAMILY_RESOURCE_ASSET_CATALOG_001')
  ON CONFLICT (capability_code) DO UPDATE SET updated_at = now()
  RETURNING growth_capability_id
), asset_version AS (
  SELECT v.resource_asset_version_id
  FROM resource_asset_versions v
  JOIN resource_assets a ON a.resource_asset_id = v.resource_asset_id
  WHERE a.asset_code = 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE' AND v.version_label = '2026.08-v1'
), offer AS (
  INSERT INTO resource_offers(resource_code, resource_type, title, description, age_scope, age_min_months, age_max_months, life_stage_scope, need_type, evidence_level, risk_boundary, privacy_boundary, effort_class, duration_class, cost_class, requires_consent, content_ref, provider_qualification, availability_status, policy_version, resource_asset_version_id)
  SELECT 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE', 'PRACTICE', '一次亲子沟通重新开启练习', '已审核的榜样教育低风险练习；只记录服务过程与家庭主观帮助感。', 'EARLY_ADOLESCENCE_CONTEXTUAL', 144, 191, ARRAY['EARLY_ADOLESCENCE_12_15'], 'PARENT_CHILD_COMMUNICATION_CONFLICT', 'E0_INTERNAL_CURATED', 'LOW_RISK_NON_CLINICAL', 'FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE', 'LOW', 'MOMENT', 'FREE', true, 'bangyang://practice/stabilize-reopen-dialogue/2026.08-v1', 'INTERNAL_DETERMINISTIC', 'ACTIVE', 'FAMILY_RESOURCE_ASSET_CATALOG_001', asset_version.resource_asset_version_id
  FROM asset_version
  ON CONFLICT (resource_code) DO UPDATE SET
    resource_asset_version_id = EXCLUDED.resource_asset_version_id,
    content_ref = EXCLUDED.content_ref,
    availability_status = EXCLUDED.availability_status,
    policy_version = EXCLUDED.policy_version,
    updated_at = now()
  RETURNING resource_offer_id
)
INSERT INTO resource_offer_capabilities(resource_offer_id, growth_capability_id)
SELECT offer.resource_offer_id, capability.growth_capability_id FROM offer CROSS JOIN capability
ON CONFLICT DO NOTHING;
