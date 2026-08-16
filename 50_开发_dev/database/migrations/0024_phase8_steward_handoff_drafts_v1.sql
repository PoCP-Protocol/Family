-- 0024_phase8_steward_handoff_drafts_v1
-- Phase 8：家庭私有、内部确定性 Steward handoff 草案。
-- 不创建顾问账户/组织访问/Enrollment/Delivery，不发送外部，不写 Growth OS canonical。

DO $$ BEGIN
  CREATE TYPE steward_handoff_draft_status AS ENUM ('DRAFT','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS steward_handoff_drafts (
  steward_handoff_draft_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  service_case_id uuid NOT NULL REFERENCES service_cases(service_case_id),
  subject_person_id uuid NOT NULL REFERENCES persons(person_id),
  source_follow_up_response_id uuid NULL REFERENCES follow_up_responses(follow_up_response_id),
  status steward_handoff_draft_status NOT NULL DEFAULT 'DRAFT',
  summary_text varchar(4000) NOT NULL,
  limitation_text varchar(2000) NOT NULL DEFAULT 'INTERNAL_DRAFT_NOT_ADVISOR_ASSIGNMENT_NOT_GROWTH_OUTCOME',
  created_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  updated_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  idempotency_key varchar(128) NOT NULL,
  policy_version varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_steward_handoff_draft_idempotency UNIQUE (family_id, idempotency_key),
  CONSTRAINT steward_handoff_draft_summary_nonempty CHECK (length(btrim(summary_text)) >= 3)
);
CREATE INDEX IF NOT EXISTS idx_steward_handoff_drafts_family_case
  ON steward_handoff_drafts(family_id, service_case_id, updated_at DESC);

CREATE OR REPLACE FUNCTION assert_phase8_steward_handoff_family_scope() RETURNS trigger AS $$
DECLARE
  case_family uuid;
  case_subject uuid;
  followup_family uuid;
  followup_case uuid;
BEGIN
  SELECT family_id, subject_person_id INTO case_family, case_subject
    FROM service_cases WHERE service_case_id = NEW.service_case_id;
  IF case_family IS NULL OR case_family <> NEW.family_id OR case_subject <> NEW.subject_person_id THEN
    RAISE EXCEPTION 'phase8_steward_handoff_family_scope_violation';
  END IF;
  IF NEW.source_follow_up_response_id IS NOT NULL THEN
    SELECT family_id, service_case_id INTO followup_family, followup_case
      FROM follow_up_responses WHERE follow_up_response_id = NEW.source_follow_up_response_id;
    IF followup_family IS NULL OR followup_family <> NEW.family_id OR followup_case <> NEW.service_case_id THEN
      RAISE EXCEPTION 'phase8_steward_handoff_follow_up_scope_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_phase8_steward_handoff_family_scope ON steward_handoff_drafts;
CREATE TRIGGER trg_phase8_steward_handoff_family_scope
BEFORE INSERT OR UPDATE ON steward_handoff_drafts
FOR EACH ROW EXECUTE FUNCTION assert_phase8_steward_handoff_family_scope();
