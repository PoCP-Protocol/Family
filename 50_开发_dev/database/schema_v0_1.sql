-- Family Database Schema V0.1
-- PostgreSQL 15+
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE family_status AS ENUM ('ACTIVE','INACTIVE','ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE person_type AS ENUM ('PARENT','CHILD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE parent_role AS ENUM ('MOTHER','FATHER','GUARDIAN','OTHER_GUARDIAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE relationship_type AS ENUM ('PARENT_CHILD','SPOUSE','SIBLING','GUARDIAN_CHILD','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE life_stage_code AS ENUM ('EARLY_ADOLESCENCE_12_15');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_purpose AS ENUM (
    'SERVICE','ASSESSMENT','AI_PERSONALIZATION','GROWTH_TRACKING',
    'EXPERT_SERVICE','RESEARCH','MODEL_IMPROVEMENT','CONTENT_PUBLICATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('GRANTED','WITHDRAWN','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE growth_domain AS ENUM ('CHILD','PARENT','RELATIONSHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE growth_state AS ENUM ('EMERGING','DEVELOPING','PRACTICING','STABILIZING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS families (
  family_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name varchar(100) NOT NULL,
  status family_status NOT NULL DEFAULT 'ACTIVE',
  primary_contact_person_id uuid NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS persons (
  person_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  person_type person_type NOT NULL,
  parent_role parent_role NULL,
  display_name varchar(100) NOT NULL,
  birth_date date NULL,
  account_id varchar(128) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parent_role_only_for_parent CHECK (
    (person_type='PARENT' AND parent_role IS NOT NULL) OR
    (person_type='CHILD' AND parent_role IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_persons_family ON persons(family_id);

ALTER TABLE families
  DROP CONSTRAINT IF EXISTS fk_family_primary_contact;
ALTER TABLE families
  ADD CONSTRAINT fk_family_primary_contact
  FOREIGN KEY (primary_contact_person_id) REFERENCES persons(person_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS family_relationships (
  relationship_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  person_a_id uuid NOT NULL REFERENCES persons(person_id),
  person_b_id uuid NOT NULL REFERENCES persons(person_id),
  relationship_type relationship_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relationship_not_self CHECK (person_a_id <> person_b_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_relationship_directional
ON family_relationships(family_id, person_a_id, person_b_id, relationship_type);

CREATE TABLE IF NOT EXISTS life_stage_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  child_id uuid NOT NULL REFERENCES persons(person_id),
  life_stage_code life_stage_code NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  source varchar(64) NOT NULL DEFAULT 'MANUAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_stage_time CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_life_stage
ON life_stage_assignments(child_id)
WHERE effective_to IS NULL;

CREATE TABLE IF NOT EXISTS consents (
  consent_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  subject_person_id uuid NOT NULL REFERENCES persons(person_id),
  guardian_person_id uuid NOT NULL REFERENCES persons(person_id),
  purpose consent_purpose NOT NULL,
  status consent_status NOT NULL,
  policy_version varchar(64) NOT NULL,
  granted_at timestamptz NOT NULL,
  withdrawn_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT withdrawn_time_consistent CHECK (
    (status='WITHDRAWN' AND withdrawn_at IS NOT NULL) OR
    (status<>'WITHDRAWN')
  )
);
CREATE INDEX IF NOT EXISTS idx_consents_subject_purpose
ON consents(subject_person_id, purpose, status);

-- Growth foundation
CREATE TABLE IF NOT EXISTS growth_profiles (
  profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  subject_type growth_domain NOT NULL,
  subject_ref_id varchar(128) NOT NULL,
  life_stage_code life_stage_code NOT NULL,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  growth_opportunities jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  version integer NOT NULL CHECK (version >= 1),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_profile_time CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_growth_profiles_family
ON growth_profiles(family_id, subject_type, effective_from DESC);

CREATE TABLE IF NOT EXISTS growth_profile_dimensions (
  profile_id uuid NOT NULL REFERENCES growth_profiles(profile_id) ON DELETE CASCADE,
  dimension_id varchar(16) NOT NULL,
  state growth_state NOT NULL,
  observable_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  PRIMARY KEY (profile_id, dimension_id)
);

CREATE TABLE IF NOT EXISTS growth_priorities (
  priority_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  profile_id uuid NOT NULL REFERENCES growth_profiles(profile_id),
  dimension_id varchar(16) NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 2),
  confirmed_by_actor_id varchar(128) NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interventions (
  intervention_id varchar(64) PRIMARY KEY,
  name varchar(200) NOT NULL,
  life_stage_code life_stage_code NOT NULL,
  target_dimensions jsonb NOT NULL,
  applicable_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  contraindications jsonb NOT NULL DEFAULT '[]'::jsonb,
  mechanism text NULL,
  action_templates jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_grade varchar(8) NOT NULL,
  risk_level varchar(16) NOT NULL DEFAULT 'LOW',
  human_requirement varchar(32) NOT NULL DEFAULT 'NONE',
  version integer NOT NULL DEFAULT 1,
  status varchar(16) NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_journeys (
  journey_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  journey_type varchar(64) NOT NULL,
  phase varchar(32) NOT NULL,
  status varchar(16) NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  journey_id uuid NULL REFERENCES growth_journeys(journey_id),
  intervention_id varchar(64) NULL REFERENCES interventions(intervention_id),
  dimension_id varchar(16) NOT NULL,
  action_type varchar(64) NOT NULL,
  instruction text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'ASSIGNED',
  assigned_to_person_id uuid NULL REFERENCES persons(person_id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS growth_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  event_type varchar(64) NOT NULL,
  occurred_at timestamptz NOT NULL,
  source varchar(64) NOT NULL,
  action_id uuid NULL REFERENCES growth_actions(action_id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_growth_events_family_time
ON growth_events(family_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS perspectives (
  perspective_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  event_id uuid NULL REFERENCES growth_events(event_id),
  person_id uuid NULL REFERENCES persons(person_id),
  perspective_type varchar(32) NOT NULL,
  statement text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_records (
  evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(family_id),
  evidence_type varchar(32) NOT NULL,
  source_ref varchar(256) NULL,
  payload jsonb NOT NULL,
  observed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
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
