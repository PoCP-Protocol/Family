-- FELS-0 schema contract.
-- REFERENCE_IMPLEMENTATION = TRUE
-- REAL_BANGYANG_SOURCE = FALSE
-- Target database: family_legacy, configured by LEGACY_DATABASE_URL.

CREATE SCHEMA IF NOT EXISTS fels;

CREATE TABLE IF NOT EXISTS fels.customer (id uuid PRIMARY KEY, external_ref text, name text NOT NULL, phone text, customer_level text, created_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS fels.contact (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), name text NOT NULL, phone text, relationship_hint text, is_buyer boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS fels.customer_tag (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), tag text NOT NULL, semantic_boundary text DEFAULT 'LEGACY_DERIVED');
CREATE TABLE IF NOT EXISTS fels.student (id uuid PRIMARY KEY, display_name text NOT NULL, birth_year int, student_level text, family_type text, created_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS fels.student_guardian (id uuid PRIMARY KEY, student_id uuid REFERENCES fels.student(id), customer_id uuid REFERENCES fels.customer(id), contact_id uuid REFERENCES fels.contact(id), guardian_role text, proof_status text);
CREATE TABLE IF NOT EXISTS fels.assessment_template (id uuid PRIMARY KEY, code text NOT NULL, title text NOT NULL, version text);
CREATE TABLE IF NOT EXISTS fels.assessment_session (id uuid PRIMARY KEY, template_id uuid REFERENCES fels.assessment_template(id), student_id uuid REFERENCES fels.student(id), customer_id uuid REFERENCES fels.customer(id), started_at timestamptz, submitted_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.assessment_answer (id uuid PRIMARY KEY, session_id uuid REFERENCES fels.assessment_session(id), question_code text NOT NULL, answer_value text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.assessment_score (id uuid PRIMARY KEY, session_id uuid REFERENCES fels.assessment_session(id), dimension text NOT NULL, assessment_score numeric, risk_score numeric, semantic_boundary text DEFAULT 'LEGACY_DERIVED');
CREATE TABLE IF NOT EXISTS fels.assessment_report (id uuid PRIMARY KEY, session_id uuid REFERENCES fels.assessment_session(id), label text, report_text text, generated_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.course (id uuid PRIMARY KEY, title text NOT NULL, status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.lesson (id uuid PRIMARY KEY, course_id uuid REFERENCES fels.course(id), title text NOT NULL, sort_order int NOT NULL);
CREATE TABLE IF NOT EXISTS fels.class (id uuid PRIMARY KEY, course_id uuid REFERENCES fels.course(id), title text NOT NULL, starts_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.enrollment (id uuid PRIMARY KEY, class_id uuid REFERENCES fels.class(id), student_id uuid REFERENCES fels.student(id), customer_id uuid REFERENCES fels.customer(id), status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.attendance (id uuid PRIMARY KEY, enrollment_id uuid REFERENCES fels.enrollment(id), lesson_id uuid REFERENCES fels.lesson(id), attended_at timestamptz, status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.training_program (id uuid PRIMARY KEY, code text NOT NULL, title text NOT NULL, duration_days int NOT NULL);
CREATE TABLE IF NOT EXISTS fels.program_enrollment (id uuid PRIMARY KEY, program_id uuid REFERENCES fels.training_program(id), student_id uuid REFERENCES fels.student(id), customer_id uuid REFERENCES fels.customer(id), status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.legacy_task (id uuid PRIMARY KEY, program_id uuid REFERENCES fels.training_program(id), title text NOT NULL, day_index int NOT NULL);
CREATE TABLE IF NOT EXISTS fels.legacy_checkin (id uuid PRIMARY KEY, task_id uuid REFERENCES fels.legacy_task(id), student_id uuid REFERENCES fels.student(id), checked_in_at timestamptz, content text);
CREATE TABLE IF NOT EXISTS fels.homework (id uuid PRIMARY KEY, task_id uuid REFERENCES fels.legacy_task(id), student_id uuid REFERENCES fels.student(id), submitted_at timestamptz, content text);
CREATE TABLE IF NOT EXISTS fels.homework_review (id uuid PRIMARY KEY, homework_id uuid REFERENCES fels.homework(id), staff_id uuid, review_text text, reviewed_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.staff (id uuid PRIMARY KEY, name text NOT NULL, legacy_role text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.service_case (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), student_id uuid REFERENCES fels.student(id), owner_staff_id uuid REFERENCES fels.staff(id), case_type text NOT NULL, status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.advisor_session (id uuid PRIMARY KEY, service_case_id uuid REFERENCES fels.service_case(id), advisor_id uuid REFERENCES fels.staff(id), session_at timestamptz, summary text);
CREATE TABLE IF NOT EXISTS fels.advisor_note (id uuid PRIMARY KEY, service_case_id uuid REFERENCES fels.service_case(id), staff_id uuid REFERENCES fels.staff(id), note_text text, perspective_boundary text DEFAULT 'PERSPECTIVE_NOT_FACT');
CREATE TABLE IF NOT EXISTS fels.community (id uuid PRIMARY KEY, name text NOT NULL, platform text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.community_member (id uuid PRIMARY KEY, community_id uuid REFERENCES fels.community(id), customer_id uuid REFERENCES fels.customer(id), joined_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.activity (id uuid PRIMARY KEY, title text NOT NULL, community_id uuid REFERENCES fels.community(id), starts_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.product (id uuid PRIMARY KEY, sku text NOT NULL, title text NOT NULL, product_type text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.legacy_order (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), status text NOT NULL, total_amount numeric NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS fels.order_item (id uuid PRIMARY KEY, order_id uuid REFERENCES fels.legacy_order(id), product_id uuid REFERENCES fels.product(id), quantity int NOT NULL, amount numeric NOT NULL);
CREATE TABLE IF NOT EXISTS fels.payment (id uuid PRIMARY KEY, order_id uuid REFERENCES fels.legacy_order(id), status text NOT NULL, amount numeric NOT NULL, paid_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.membership (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), level text NOT NULL, starts_at timestamptz, ends_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.legacy_profile (id uuid PRIMARY KEY, student_id uuid REFERENCES fels.student(id), family_score numeric, ranking int, tags text[], semantic_boundary text DEFAULT 'LEGACY_DERIVED');
CREATE TABLE IF NOT EXISTS fels.legacy_ai_report (id uuid PRIMARY KEY, student_id uuid REFERENCES fels.student(id), assessment_id uuid REFERENCES fels.assessment_session(id), model_name text, prompt_version text, labels text[], risk_score numeric, family_score numeric, conclusion text, recommendation text, semantic_boundary text DEFAULT 'LEGACY_AI_HYPOTHESIS_NOT_FACT', generated_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.legacy_alert (id uuid PRIMARY KEY, student_id uuid REFERENCES fels.student(id), alert_type text NOT NULL, risk_score numeric, status text NOT NULL);
CREATE TABLE IF NOT EXISTS fels.legacy_agreement (id uuid PRIMARY KEY, code text NOT NULL, title text NOT NULL, version text);
CREATE TABLE IF NOT EXISTS fels.legacy_consent (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), student_id uuid REFERENCES fels.student(id), agreement_id uuid REFERENCES fels.legacy_agreement(id), purpose text, guardian_proof text, policy_version text, accepted_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.legacy_growth_report (id uuid PRIMARY KEY, student_id uuid REFERENCES fels.student(id), report_text text, stage text, generated_at timestamptz);
CREATE TABLE IF NOT EXISTS fels.legacy_success_case (id uuid PRIMARY KEY, customer_id uuid REFERENCES fels.customer(id), student_id uuid REFERENCES fels.student(id), story_text text, authorization_status text);
CREATE TABLE IF NOT EXISTS fels.audit_log (id uuid PRIMARY KEY, actor_id text, action text NOT NULL, target_table text NOT NULL, target_id text, created_at timestamptz NOT NULL);