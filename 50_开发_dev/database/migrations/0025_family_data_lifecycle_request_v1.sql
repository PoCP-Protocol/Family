-- FAMILY_PHASE10_DATA_RETENTION_EXPORT_DELETE_REQUEST_001
-- 仅记录家庭私有请求和后续人工治理所需审计锚点；本迁移不执行导出、保留清理或删除。

DO $$ BEGIN
  CREATE TYPE family_data_lifecycle_request_type AS ENUM ('EXPORT_REQUEST', 'RETENTION_REVIEW', 'DELETE_REQUEST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE family_data_lifecycle_request_status AS ENUM ('REQUESTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS family_data_lifecycle_requests (
  family_data_lifecycle_request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  request_type family_data_lifecycle_request_type NOT NULL,
  request_scope varchar(64) NOT NULL DEFAULT 'FAMILY_PRIVATE_DATA',
  status family_data_lifecycle_request_status NOT NULL DEFAULT 'REQUESTED',
  requested_by_person_id uuid NOT NULL REFERENCES persons(person_id),
  reason_text varchar(500) NULL,
  idempotency_key varchar(128) NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_data_lifecycle_request_scope CHECK (request_scope = 'FAMILY_PRIVATE_DATA'),
  CONSTRAINT family_data_lifecycle_request_reason_length CHECK (reason_text IS NULL OR char_length(reason_text) BETWEEN 3 AND 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_family_data_lifecycle_request_idempotency
  ON family_data_lifecycle_requests(family_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_family_data_lifecycle_requests_family_requested_at
  ON family_data_lifecycle_requests(family_id, requested_at DESC);

CREATE OR REPLACE FUNCTION assert_family_data_lifecycle_request_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE requester_family_id uuid;
BEGIN
  SELECT family_id INTO requester_family_id FROM persons WHERE person_id = NEW.requested_by_person_id;
  IF requester_family_id IS NULL OR requester_family_id <> NEW.family_id THEN
    RAISE EXCEPTION 'family_data_lifecycle_request_actor_not_in_family';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_family_data_lifecycle_request_scope ON family_data_lifecycle_requests;
CREATE TRIGGER trg_family_data_lifecycle_request_scope
  BEFORE INSERT OR UPDATE OF family_id, requested_by_person_id
  ON family_data_lifecycle_requests
  FOR EACH ROW EXECUTE FUNCTION assert_family_data_lifecycle_request_scope();
