-- FELS-2 service deepening:把榜样教育"服务体系"补足到完整保真度(依据 architecture/BANGYANG_COURSE_SERVICE_SYSTEM_V1.md)。
-- 建在 0003 之上:0003 已有 training_camps / camp_enrollments / daily_tasks / task_checkins / advisor_notes / memberships。
-- 本迁移补:90天四阶段 + 阶段报告 · Homework/HomeworkReview(助教批改点评)· Staff/AdvisorSession/ServiceCase(顾问/班主任/专家/售后角色化)· content_ref 课程内容挂载位。
-- Legacy semantics only。NOT Family canonical growth objects。红线:阶段≠成长结果 · 打卡/作业≠Outcome · 点评/顾问文本≠Fact。

-- ---------- 1) 90天四阶段(SEE/PARENT_FIRST/CO_CREATE/STABILIZE)+ 阶段报告 ----------
CREATE TABLE IF NOT EXISTS fels.legacy_program_phases (
  program_phase_id text PRIMARY KEY,
  training_camp_id text NOT NULL REFERENCES fels.legacy_training_camps(training_camp_id),
  phase_code text NOT NULL,               -- SEE | PARENT_FIRST | CO_CREATE | STABILIZE
  phase_title text NOT NULL,
  day_from integer NOT NULL,
  day_to integer NOT NULL,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_PHASE_NOT_GROWTH_STAGE',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_program_reports (
  program_report_id text PRIMARY KEY,
  camp_enrollment_id text NOT NULL REFERENCES fels.legacy_camp_enrollments(camp_enrollment_id),
  phase_code text,                        -- 该阶段报告归属;null = 整营综合报告
  report_type text NOT NULL,              -- PHASE | FINAL
  report_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_REPORT_NOT_OUTCOME',
  created_at timestamptz NOT NULL
);

-- ---------- 2) Homework / HomeworkReview(助教批改点评)----------
CREATE TABLE IF NOT EXISTS fels.legacy_homework (
  homework_id text PRIMARY KEY,
  daily_task_id text REFERENCES fels.legacy_daily_tasks(daily_task_id),
  camp_enrollment_id text NOT NULL REFERENCES fels.legacy_camp_enrollments(camp_enrollment_id),
  student_id text NOT NULL REFERENCES fels.legacy_students(student_id),
  submission_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_HOMEWORK_SUBMISSION_NOT_OUTCOME',
  submitted_at timestamptz NOT NULL
);

-- ---------- 3) Staff + AdvisorSession + ServiceCase(角色化:顾问/班主任/助教/专家/售后)----------
CREATE TABLE IF NOT EXISTS fels.legacy_staff (
  staff_id text PRIMARY KEY,
  staff_name text NOT NULL,
  staff_role text NOT NULL,               -- ADVISOR | CLASS_TEACHER | TEACHING_ASSISTANT | EXPERT | SUPPORT
  status text NOT NULL DEFAULT 'ACTIVE',
  semantic_classification text NOT NULL DEFAULT 'LEGACY_STAFF',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_homework_reviews (
  homework_review_id text PRIMARY KEY,
  homework_id text NOT NULL REFERENCES fels.legacy_homework(homework_id),
  reviewer_staff_id text REFERENCES fels.legacy_staff(staff_id),
  review_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_REVIEW_TEXT_NOT_FACT',
  reviewed_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_advisor_sessions (
  advisor_session_id text PRIMARY KEY,
  staff_id text REFERENCES fels.legacy_staff(staff_id),
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  training_camp_id text REFERENCES fels.legacy_training_camps(training_camp_id),
  session_type text NOT NULL,             -- CONSULT | INTERPRET_ASSESSMENT | PHASE_REVIEW | APPOINTMENT
  session_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_ADVISOR_SESSION_TEXT_NOT_FACT',
  occurred_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS fels.legacy_service_cases (
  service_case_id text PRIMARY KEY,
  customer_id text REFERENCES fels.legacy_customers(customer_id),
  student_id text REFERENCES fels.legacy_students(student_id),
  assigned_staff_id text REFERENCES fels.legacy_staff(staff_id),
  case_type text NOT NULL,                -- EXPERT_ESCALATION | AFTER_SALES | SUPPORT
  status text NOT NULL,
  case_text text,
  semantic_classification text NOT NULL DEFAULT 'LEGACY_SERVICE_CASE',
  opened_at timestamptz NOT NULL,
  closed_at timestamptz
);

-- ---------- 4) 把已有 advisor_notes 挂到 staff/session(幂等 ADD COLUMN)----------
ALTER TABLE fels.legacy_advisor_notes
  ADD COLUMN IF NOT EXISTS staff_id text REFERENCES fels.legacy_staff(staff_id),
  ADD COLUMN IF NOT EXISTS advisor_session_id text REFERENCES fels.legacy_advisor_sessions(advisor_session_id);

-- ---------- 5) content_ref:课程内容层挂载位(具体课时/话术待另取教学材料回填,不臆造)----------
ALTER TABLE fels.legacy_courses     ADD COLUMN IF NOT EXISTS content_ref text;   -- 课程内容包引用(external/pending)
ALTER TABLE fels.legacy_daily_tasks ADD COLUMN IF NOT EXISTS content_ref text;   -- 每日任务内容引用

-- ---------- 索引 ----------
CREATE INDEX IF NOT EXISTS idx_legacy_program_phases_camp ON fels.legacy_program_phases(training_camp_id);
CREATE INDEX IF NOT EXISTS idx_legacy_program_reports_enrollment ON fels.legacy_program_reports(camp_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_legacy_homework_enrollment ON fels.legacy_homework(camp_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_legacy_homework_reviews_homework ON fels.legacy_homework_reviews(homework_id);
CREATE INDEX IF NOT EXISTS idx_legacy_advisor_sessions_customer ON fels.legacy_advisor_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_service_cases_customer ON fels.legacy_service_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_legacy_staff_role ON fels.legacy_staff(staff_role);
