-- FAMILY_RESOURCE_ASSET_CATALOG_001 · runtime admission guard
-- Gate boundary: 未验证/推断来源可留在目录中等待研究，但不得成为家庭可选资源。

CREATE OR REPLACE FUNCTION enforce_resource_asset_admission_evidence()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  asset_copyright varchar(64);
  primary_source resource_evidence_source_class;
BEGIN
  IF NEW.status = 'ADMITTED' THEN
    SELECT a.copyright_status, v.primary_evidence_source_class
      INTO asset_copyright, primary_source
      FROM resource_asset_versions v
      JOIN resource_assets a ON a.resource_asset_id = v.resource_asset_id
      WHERE v.resource_asset_version_id = NEW.resource_asset_version_id;

    IF asset_copyright IS NULL OR asset_copyright NOT IN ('OWNED', 'LICENSED') THEN
      RAISE EXCEPTION 'admitted_asset_requires_owned_or_licensed_copyright';
    END IF;

    IF primary_source = 'UNVERIFIED_OR_INFERRED' THEN
      RAISE EXCEPTION 'unverified_or_inferred_asset_cannot_be_admitted';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM resource_asset_evidence e
      WHERE e.resource_asset_version_id = NEW.resource_asset_version_id
        AND e.evidence_source_class <> 'UNVERIFIED_OR_INFERRED'
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

-- 若资产版权状态被调为待审/受限，拒绝继续以旧 ADMITTED 状态供给家庭推荐；
-- 必须先由目录流程显式 SUSPEND，再重新完成版权与准入审查。
CREATE OR REPLACE FUNCTION prevent_ineligible_admitted_asset_copyright_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.copyright_status NOT IN ('OWNED', 'LICENSED') AND EXISTS (
    SELECT 1
    FROM resource_asset_versions v
    JOIN resource_asset_admissions aa ON aa.resource_asset_version_id = v.resource_asset_version_id
    WHERE v.resource_asset_id = NEW.resource_asset_id AND aa.status = 'ADMITTED'
  ) THEN
    RAISE EXCEPTION 'must_suspend_admitted_asset_before_restricting_copyright';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_resource_asset_copyright_runtime_guard ON resource_assets;
CREATE TRIGGER trg_resource_asset_copyright_runtime_guard
  BEFORE UPDATE OF copyright_status ON resource_assets
  FOR EACH ROW EXECUTE FUNCTION prevent_ineligible_admitted_asset_copyright_change();

COMMENT ON FUNCTION enforce_resource_asset_admission_evidence() IS
  '目录准入 Gate：只允许版权清晰、来源可追溯且非未验证推断的资源版本成为家庭候选输入；不产生任何成长结论。';
