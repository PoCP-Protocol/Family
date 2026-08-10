-- FELS-1 Core Education Business
-- Target database: family_legacy
-- Required runtime URL: LEGACY_DATABASE_URL
-- This migration is intentionally independent from Family canonical migrations.

CREATE SCHEMA IF NOT EXISTS fels;

CREATE TABLE IF NOT EXISTS fels.legacy_customers (
  customer_id text PRIMARY KEY,
  customer_no text NOT NULL,
  display_name text NOT NULL,
  phone text NOT NULL,
  email text,
  customer_level text,
  source_channel text,
  status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_DERIVED',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_contacts (
  contact_id text PRIMARY KEY,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  name text NOT NULL,
  phone text,
  email text,
  relationship_text text,
  is_primary_contact boolean NOT NULL DEFAULT false,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_RELATIONSHIP_EVIDENCE',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_students (
  student_id text PRIMARY KEY,
  student_no text NOT NULL,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  name text NOT NULL,
  birth_date date,
  gender text,
  student_level text,
  status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'CHILD_CANDIDATE',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_student_guardians (
  student_guardian_id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  contact_id text REFERENCES fels.legacy_contacts(contact_id),
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  relationship_text text,
  is_primary boolean NOT NULL DEFAULT false,
  proof_status text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_GUARDIAN_EVIDENCE',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_assessment_templates (
  assessment_template_id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_assessment_sessions (
  assessment_id text PRIMARY KEY,
  assessment_template_id text NOT NULL REFERENCES fels.legacy_assessment_templates(assessment_template_id),
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS fels.legacy_assessment_scores (
  assessment_score_id text PRIMARY KEY,
  assessment_id text NOT NULL REFERENCES fels.legacy_assessment_sessions(assessment_id),
  dimension_code text NOT NULL,
  score numeric NOT NULL,
  level text,
  label text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_ASSESSMENT_OUTPUT'
);

CREATE TABLE IF NOT EXISTS fels.legacy_assessment_reports (
  assessment_report_id text PRIMARY KEY,
  assessment_id text NOT NULL REFERENCES fels.legacy_assessment_sessions(assessment_id),
  summary text NOT NULL,
  legacy_family_type text,
  legacy_risk_score numeric,
  report_status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_DERIVED',
  generated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_courses (
  course_id text PRIMARY KEY,
  course_code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  total_lessons integer,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_products (
  product_id text PRIMARY KEY,
  product_code text NOT NULL,
  title text NOT NULL,
  product_type text NOT NULL,
  course_id text REFERENCES fels.legacy_courses(course_id),
  price numeric NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_orders (
  order_id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES fels.legacy_customers(customer_id),
  buyer_contact_id text REFERENCES fels.legacy_contacts(contact_id),
  order_status text NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_order_items (
  order_item_id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES fels.legacy_orders(order_id),
  product_id text NOT NULL REFERENCES fels.legacy_products(product_id),
  quantity integer NOT NULL,
  amount numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_payments (
  payment_id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES fels.legacy_orders(order_id),
  payment_status text NOT NULL,
  paid_amount numeric NOT NULL,
  paid_at timestamptz,
  payment_method text NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_enrollments (
  enrollment_id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  course_id text NOT NULL REFERENCES fels.legacy_courses(course_id),
  order_item_id text REFERENCES fels.legacy_order_items(order_item_id),
  status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'COURSE_STATUS_NOT_OUTCOME',
  enrolled_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS fels.legacy_consent_records (
  consent_record_id text PRIMARY KEY,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  contact_id text REFERENCES fels.legacy_contacts(contact_id),
  agreement_code text NOT NULL,
  agreement_version text,
  accepted_at timestamptz NOT NULL,
  guardian_proof_status text,
  purpose_text text,
  revoked_at timestamptz,
  source text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'CONSENT_EVIDENCE_CANDIDATE'
);

CREATE TABLE IF NOT EXISTS fels.legacy_source_snapshots (
  snapshot_id text PRIMARY KEY,
  source_system text NOT NULL DEFAULT 'FELS',
  schema_version text NOT NULL DEFAULT 'fels-1',
  created_at timestamptz NOT NULL,
  record_counts jsonb NOT NULL,
  checksum_metadata jsonb
);

CREATE TABLE IF NOT EXISTS fels.legacy_audit_logs (
  audit_log_id bigserial PRIMARY KEY,
  actor text NOT NULL DEFAULT 'FELS_REFERENCE_SYSTEM',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);