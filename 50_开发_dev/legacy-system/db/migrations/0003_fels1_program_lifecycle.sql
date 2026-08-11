-- FELS-1 program lifecycle: 训练营 -> 每日任务 -> 打卡 -> 顾问服务 -> 会员/续费
-- Legacy semantics only. These are NOT Family canonical growth objects.
-- LEGACY_PROGRAM_NOT_JOURNEY / LEGACY_TASK_NOT_GROWTH_ACTION / LEGACY_CHECKIN_NOT_OUTCOME
-- LEGACY_ADVISOR_TEXT_NOT_FACT / LEGACY_MEMBERSHIP_STATE

CREATE TABLE IF NOT EXISTS fels.legacy_training_camps (
  training_camp_id text PRIMARY KEY,
  camp_code text NOT NULL,
  title text NOT NULL,
  course_id text REFERENCES fels.legacy_courses(course_id),
  duration_days integer NOT NULL,
  status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_PROGRAM_NOT_JOURNEY',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_camp_enrollments (
  camp_enrollment_id text PRIMARY KEY,
  training_camp_id text NOT NULL REFERENCES fels.legacy_training_camps(training_camp_id),
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  enrollment_id text REFERENCES fels.legacy_enrollments(enrollment_id),
  status text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_PROGRAM_STATUS_NOT_OUTCOME',
  joined_at timestamptz NOT NULL,
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS fels.legacy_daily_tasks (
  daily_task_id text PRIMARY KEY,
  training_camp_id text NOT NULL REFERENCES fels.legacy_training_camps(training_camp_id),
  day_index integer NOT NULL,
  title text NOT NULL,
  instruction_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_TASK_NOT_GROWTH_ACTION',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_task_checkins (
  task_checkin_id text PRIMARY KEY,
  daily_task_id text NOT NULL REFERENCES fels.legacy_daily_tasks(daily_task_id),
  camp_enrollment_id text NOT NULL REFERENCES fels.legacy_camp_enrollments(camp_enrollment_id),
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  checkin_status text NOT NULL,
  legacy_completion_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_CHECKIN_NOT_OUTCOME',
  checked_in_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_advisor_notes (
  advisor_note_id text PRIMARY KEY,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  training_camp_id text REFERENCES fels.legacy_training_camps(training_camp_id),
  advisor_name text NOT NULL,
  note_type text NOT NULL,
  note_text text NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_ADVISOR_TEXT_NOT_FACT',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_memberships (
  membership_id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES fels.legacy_customers(customer_id),
  membership_level text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  expires_at timestamptz,
  renewal_count integer NOT NULL DEFAULT 0,
  last_renewed_at timestamptz,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_MEMBERSHIP_STATE',
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legacy_camp_enrollments_camp ON fels.legacy_camp_enrollments(training_camp_id);
CREATE INDEX IF NOT EXISTS idx_legacy_camp_enrollments_student ON fels.legacy_camp_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_legacy_daily_tasks_camp ON fels.legacy_daily_tasks(training_camp_id);
CREATE INDEX IF NOT EXISTS idx_legacy_task_checkins_task ON fels.legacy_task_checkins(daily_task_id);
CREATE INDEX IF NOT EXISTS idx_legacy_task_checkins_enrollment ON fels.legacy_task_checkins(camp_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_legacy_advisor_notes_customer ON fels.legacy_advisor_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_memberships_customer ON fels.legacy_memberships(customer_id);
