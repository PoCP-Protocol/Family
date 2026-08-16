-- FAMILY_RESOURCE_ASSET_CATALOG_001 · Evidence / provenance / admission hardening
-- Gate boundary:
-- 1) 资源资产仅作为 ResourceOffer 候选输入；本迁移不创建成长结果、画像、标签或跨家庭数据对象。
-- 2) FIRST_PARTY_MATERIAL 只能证明来源与内容归属，绝不能作为“效果成立”的证据。
-- 3) ADMITTED 版本必须具备可追溯来源、可用版权状态与准入审查；不满足则数据库拒绝准入。

DO $$ BEGIN
  CREATE TYPE resource_evidence_source_class AS ENUM (
    'FIRST_PARTY_MATERIAL',
    'THIRD_PARTY_SOURCE',
    'UNVERIFIED_OR_INFERRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resource_evidence_claim_scope AS ENUM (
    'PROVENANCE_ONLY',
    'SAFETY_CONTEXT',
    'EFFECTIVENESS_CLAIM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE resource_asset_versions
  ADD COLUMN IF NOT EXISTS primary_evidence_source_class resource_evidence_source_class NOT NULL DEFAULT 'UNVERIFIED_OR_INFERRED';

CREATE TABLE IF NOT EXISTS resource_asset_evidence (
  resource_asset_evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_asset_version_id uuid NOT NULL REFERENCES resource_asset_versions(resource_asset_version_id) ON DELETE CASCADE,
  evidence_source_class resource_evidence_source_class NOT NULL,
  claim_scope resource_evidence_claim_scope NOT NULL,
  source_title varchar(300) NOT NULL,
  source_locator varchar(500) NOT NULL,
  source_publisher varchar(300) NOT NULL DEFAULT '',
  source_published_at date NULL,
  supports_effectiveness boolean NOT NULL DEFAULT false,
  evidence_summary varchar(2000) NOT NULL,
  limitations varchar(2000) NOT NULL DEFAULT '',
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- 自家材料只能证明来源、版权、内容与服务流程，不能自证教育效果。
  CONSTRAINT first_party_cannot_self_prove_effectiveness CHECK (
    NOT (evidence_source_class = 'FIRST_PARTY_MATERIAL' AND (claim_scope = 'EFFECTIVENESS_CLAIM' OR supports_effectiveness))
  ),
  -- 未验证/推断来源可以留在目录用于待审研究，但绝不能被标记为效果证据。
  CONSTRAINT unverified_cannot_support_effectiveness CHECK (
    NOT (evidence_source_class = 'UNVERIFIED_OR_INFERRED' AND supports_effectiveness)
  )
);

CREATE INDEX IF NOT EXISTS idx_resource_asset_evidence_version ON resource_asset_evidence(resource_asset_version_id, claim_scope);

CREATE OR REPLACE FUNCTION enforce_resource_asset_admission_evidence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  asset_copyright varchar(64);
BEGIN
  IF NEW.status = 'ADMITTED' THEN
    SELECT a.copyright_status INTO asset_copyright
      FROM resource_asset_versions v
      JOIN resource_assets a ON a.resource_asset_id = v.resource_asset_id
      WHERE v.resource_asset_version_id = NEW.resource_asset_version_id;

    IF asset_copyright IS NULL OR asset_copyright NOT IN ('OWNED', 'LICENSED') THEN
      RAISE EXCEPTION 'admitted_asset_requires_owned_or_licensed_copyright';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM resource_asset_evidence e
      WHERE e.resource_asset_version_id = NEW.resource_asset_version_id
        AND e.claim_scope IN ('PROVENANCE_ONLY', 'SAFETY_CONTEXT')
    ) THEN
      RAISE EXCEPTION 'admitted_asset_requires_traceable_provenance_or_safety_evidence';
    END IF;

    IF EXISTS (
      SELECT 1 FROM resource_asset_evidence e
      WHERE e.resource_asset_version_id = NEW.resource_asset_version_id
        AND e.evidence_source_class = 'FIRST_PARTY_MATERIAL'
        AND (e.claim_scope = 'EFFECTIVENESS_CLAIM' OR e.supports_effectiveness)
    ) THEN
      RAISE EXCEPTION 'first_party_material_cannot_prove_effectiveness_for_admission';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_resource_asset_admission_evidence ON resource_asset_admissions;
CREATE TRIGGER trg_resource_asset_admission_evidence
  BEFORE INSERT OR UPDATE OF status, resource_asset_version_id ON resource_asset_admissions
  FOR EACH ROW EXECUTE FUNCTION enforce_resource_asset_admission_evidence();

-- 将已存在的榜样教育练习明确为“自家来源/来源证明”，而非效果证明。
WITH version_row AS (
  SELECT v.resource_asset_version_id
  FROM resource_asset_versions v
  JOIN resource_assets a ON a.resource_asset_id = v.resource_asset_id
  WHERE a.asset_code = 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE'
    AND v.version_label = '2026.08-v1'
)
INSERT INTO resource_asset_evidence(
  resource_asset_version_id, evidence_source_class, claim_scope, source_title, source_locator,
  source_publisher, supports_effectiveness, evidence_summary, limitations, reviewed_at
)
SELECT resource_asset_version_id, 'FIRST_PARTY_MATERIAL', 'PROVENANCE_ONLY',
       '榜样教育亲子沟通练习资产归属与版本记录',
       'bangyang://practice/stabilize-reopen-dialogue/2026.08-v1',
       '榜样教育', false,
       '证明该版本为榜样教育既有练习资产，并已纳入 Family 内部目录与版权审查。',
       '本记录不证明练习有效性，不构成儿童成长结果、因果关系或临床主张。', now()
FROM version_row
ON CONFLICT DO NOTHING;

UPDATE resource_asset_versions v
SET primary_evidence_source_class = 'FIRST_PARTY_MATERIAL',
    evidence_level = 'E0_FIRST_PARTY_PROVENANCE_ONLY'
FROM resource_assets a
WHERE a.resource_asset_id = v.resource_asset_id
  AND a.asset_code = 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE'
  AND v.version_label = '2026.08-v1';

-- 让既有准入记录经过新的硬门再次校验；若后续资料缺失、版权收回或被暂停，将无法继续保持 ADMITTED。
UPDATE resource_asset_admissions aa
SET status = aa.status, updated_at = now()
FROM resource_asset_versions v
JOIN resource_assets a ON a.resource_asset_id = v.resource_asset_id
WHERE aa.resource_asset_version_id = v.resource_asset_version_id
  AND a.asset_code = 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE'
  AND v.version_label = '2026.08-v1';

COMMENT ON TABLE resource_asset_evidence IS
  '资源来源与证据元数据；只用于候选资源准入，不用于孩子成长推断、永久标签、效果承诺或跨家庭学习。';
COMMENT ON COLUMN resource_asset_versions.primary_evidence_source_class IS
  '版本主要来源分类；FIRST_PARTY_MATERIAL 仅可证明来源与内容归属，不能作为效果证据。';
