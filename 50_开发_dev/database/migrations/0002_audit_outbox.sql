);

CREATE TABLE IF NOT EXISTS milestones (
  milestone_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  journey_id uuid NULL REFERENCES growth_journeys(journey_id),
  dimension_id varchar(16) NULL,
  milestone_type varchar(64) NOT NULL,
  title varchar(200) NOT NULL,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by_actor_id varchar(128) NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outcomes (
  outcome_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  dimension_id varchar(16) NOT NULL,
  baseline jsonb NULL,
  current_value jsonb NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  source varchar(64) NOT NULL,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  possible_confounders jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outcome_window CHECK (window_end > window_start)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NULL REFERENCES families(family_id),
  actor_type varchar(32) NOT NULL,
  actor_id varchar(128) NOT NULL,
  action_name varchar(128) NOT NULL,
  resource_type varchar(64) NOT NULL,
  resource_id varchar(128) NULL,
  correlation_id varchar(128) NOT NULL,
  idempotency_key varchar(128) NULL,
  result varchar(32) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_family_time ON audit_logs(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_corr ON audit_logs(correlation_id);

CREATE TABLE IF NOT EXISTS outbox_events (
  outbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type varchar(64) NOT NULL,
  aggregate_id varchar(128) NOT NULL,
  event_name varchar(128) NOT NULL,
  event_version integer NOT NULL,
  event_id uuid NOT NULL UNIQUE,
  correlation_id varchar(128) NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL,
  published_at timestamptz NULL,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
ON outbox_events(created_at)
WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key varchar(128) PRIMARY KEY,
  action_name varchar(128) NOT NULL,
  request_hash varchar(128) NOT NULL,
  response_code integer NULL,
  response_body jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL
);
