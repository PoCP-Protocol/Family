-- FAMILY_PHASE10_DATA_GOVERNANCE_APPROVAL_001
-- 仅建立家庭内人工审批记录与状态历史；不生成导出包，不执行保留清理或删除。

ALTER TYPE family_data_lifecycle_request_status ADD VALUE IF NOT EXISTS 'PENDING_HUMAN_REVIEW';
ALTER TYPE family_data_lifecycle_request_status ADD VALUE IF NOT EXISTS 'APPROVED_FOR_SYNTHETIC_VALIDATION';
ALTER TYPE family_data_lifecycle_request_status ADD VALUE IF NOT EXISTS 'REJECTED';

DO $$ BEGIN
  CREATE TYPE family_data_lifecycle_review_decision AS ENUM ('APPROVED_FOR_SYNTHETIC_VALIDATION', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS family_data_lifecycle_request_reviews (
  family_data_lifecycle_request_review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  family_data_lifecycle_request_id uuid NOT NULL REFERENCES family_data_lifecycle_requests(family_data_lifecycle_request_id),
  reviewer_person_id uuid NOT NULL REFERENCES persons(person_id),
  decision family_data_lifecycle_review_decision NOT NULL,
  reason_code varchar(64) NOT NULL,
  policy_version varchar(64) NOT NULL,
  idempotency_key varchar(128) NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_data_lifecycle_review_reason_code CHECK (reason_code IN ('SYNTHETIC_ONLY_POLICY_PASS', 'INSUFFICIENT_SCOPE_OR_CONSENT', 'FAMILY_REQUEST_WITHDRAWN', 'POLICY_NOT_SATISFIED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_family_data_lifecycle_review_request
  ON family_data_lifecycle_request_reviews(family_data_lifecycle_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_family_data_lifecycle_review_idempotency
  ON family_data_lifecycle_request_reviews(family_id, idempotency_key);

CREATE OR REPLACE FUNCTION assert_family_data_lifecycle_review_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE request_family_id uuid;
DECLARE reviewer_family_id uuid;
DECLARE request_actor_id uuid;
BEGIN
  SELECT family_id, requested_by_person_id INTO request_family_id, request_actor_id
  FROM family_data_lifecycle_requests WHERE family_data_lifecycle_request_id = NEW.family_data_lifecycle_request_id;
  SELECT family_id INTO reviewer_family_id FROM persons WHERE person_id = NEW.reviewer_person_id;
  IF request_family_id IS NULL OR request_family_id <> NEW.family_id OR reviewer_family_id IS NULL OR reviewer_family_id <> NEW.family_id THEN
    RAISE EXCEPTION 'family_data_lifecycle_review_scope_mismatch';
  END IF;
  IF request_actor_id = NEW.reviewer_person_id THEN
    RAISE EXCEPTION 'family_data_lifecycle_review_requires_distinct_guardian';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_family_data_lifecycle_review_scope ON family_data_lifecycle_request_reviews;
CREATE TRIGGER trg_family_data_lifecycle_review_scope
  BEFORE INSERT OR UPDATE OF family_id, family_data_lifecycle_request_id, reviewer_person_id
  ON family_data_lifecycle_request_reviews
  FOR EACH ROW EXECUTE FUNCTION assert_family_data_lifecycle_review_scope();
