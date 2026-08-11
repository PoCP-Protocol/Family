import pg from 'pg';
import type {
  FelsRecords,
  LegacyAdvisorNote,
  LegacyAssessmentReport,
  LegacyAssessmentScore,
  LegacyAssessmentSession,
  LegacyAssessmentTemplate,
  LegacyCampEnrollment,
  LegacyConsentRecord,
  LegacyContact,
  LegacyCourse,
  LegacyCustomer,
  LegacyDailyTask,
  LegacyEnrollment,
  LegacyMembership,
  LegacyOrder,
  LegacyOrderItem,
  LegacyPaymentRecord,
  LegacyProduct,
  LegacySourceSnapshot,
  LegacyStudent,
  LegacyStudentGuardian,
  LegacyTaskCheckin,
  LegacyTrainingCamp,
} from './fels1-core';

const { Client } = pg;

export interface FelsRepository {
  seedRecords(records: FelsRecords): Promise<Record<string, number>>;
  close(): Promise<void>;
}

export function getRequiredLegacyDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const url = env.LEGACY_DATABASE_URL;
  if (!url) {
    throw new Error('LEGACY_DATABASE_URL is required for DB-backed FELS runtime. No DATABASE_URL or TEST_DATABASE_URL fallback is allowed.');
  }
  if (url === env.DATABASE_URL || url === env.TEST_DATABASE_URL) {
    throw new Error('LEGACY_DATABASE_URL must be physically separate from DATABASE_URL and TEST_DATABASE_URL.');
  }
  return url;
}

export class PgFelsRepository implements FelsRepository {
  private readonly client: pg.Client;

  constructor(connectionString = getRequiredLegacyDatabaseUrl()) {
    this.client = new Client({ connectionString });
  }

  async connect() {
    await this.client.connect();
    return this;
  }

  async close() {
    await this.client.end();
  }

  async seedRecords(records: FelsRecords) {
    await this.client.query('BEGIN');
    try {
      await this.clearFels1RuntimeTables();
      await this.insertAssessmentTemplates(records.assessmentTemplates);
      await this.insertCustomers(records.customers);
      await this.insertContacts(records.contacts);
      await this.insertStudents(records.students);
      await this.insertStudentGuardians(records.studentGuardians);
      await this.insertAssessmentSessions(records.assessments);
      await this.insertAssessmentScores(records.assessmentScores);
      await this.insertAssessmentReports(records.assessmentReports);
      await this.insertCourses(records.courses);
      await this.insertProducts(records.products);
      await this.insertOrders(records.orders);
      await this.insertOrderItems(records.orderItems);
      await this.insertPayments(records.payments);
      await this.insertEnrollments(records.enrollments);
      await this.insertConsentRecords(records.legacyConsents);
      await this.insertTrainingCamps(records.trainingCamps);
      await this.insertCampEnrollments(records.campEnrollments);
      await this.insertDailyTasks(records.dailyTasks);
      await this.insertTaskCheckins(records.taskCheckins);
      await this.insertAdvisorNotes(records.advisorNotes);
      await this.insertMemberships(records.memberships);
      await this.insertSourceSnapshots(records.snapshots);
      await this.client.query('COMMIT');
      return countRecords(records);
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  private async clearFels1RuntimeTables() {
    await this.client.query(`TRUNCATE TABLE
      fels.legacy_source_snapshots,
      fels.legacy_memberships,
      fels.legacy_advisor_notes,
      fels.legacy_task_checkins,
      fels.legacy_daily_tasks,
      fels.legacy_camp_enrollments,
      fels.legacy_training_camps,
      fels.legacy_consent_records,
      fels.legacy_enrollments,
      fels.legacy_payments,
      fels.legacy_order_items,
      fels.legacy_orders,
      fels.legacy_products,
      fels.legacy_courses,
      fels.legacy_assessment_reports,
      fels.legacy_assessment_scores,
      fels.legacy_assessment_sessions,
      fels.legacy_assessment_templates,
      fels.legacy_student_guardians,
      fels.legacy_students,
      fels.legacy_contacts,
      fels.legacy_customers
      RESTART IDENTITY CASCADE`);
  }

  private async insertCustomers(rows: LegacyCustomer[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_customers(customer_id, customer_no, display_name, phone, email, customer_level, source_channel, status, semantic_classification, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [row.customer_id, row.customer_no, row.display_name, row.phone, row.email ?? null, row.customer_level ?? null, row.source_channel ?? null, row.status, row.semantic_classification, row.created_at, row.updated_at],
    );
  }

  private async insertContacts(rows: LegacyContact[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_contacts(contact_id, customer_id, name, phone, email, relationship_text, is_primary_contact, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [row.contact_id, row.customer_id ?? null, row.name, row.phone ?? null, row.email ?? null, row.relationship_text ?? null, row.is_primary_contact, row.semantic_classification, row.created_at],
    );
  }

  private async insertStudents(rows: LegacyStudent[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_students(student_id, student_no, customer_id, name, birth_date, gender, student_level, status, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.student_id, row.student_no, row.customer_id ?? null, row.name, row.birth_date ?? null, row.gender ?? null, row.student_level ?? null, row.status, row.semantic_classification, row.created_at],
    );
  }

  private async insertStudentGuardians(rows: LegacyStudentGuardian[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_student_guardians(student_guardian_id, student_id, contact_id, customer_id, relationship_text, is_primary, proof_status, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [row.student_guardian_id, row.student_id, row.contact_id ?? null, row.customer_id ?? null, row.relationship_text ?? null, row.is_primary, row.proof_status ?? null, row.semantic_classification, row.created_at],
    );
  }

  private async insertAssessmentTemplates(rows: LegacyAssessmentTemplate[]) {
    for (const row of rows) await this.client.query('INSERT INTO fels.legacy_assessment_templates(assessment_template_id, name, version, status, created_at) VALUES ($1,$2,$3,$4,$5)', [row.assessment_template_id, row.name, row.version, row.status, row.created_at]);
  }

  private async insertAssessmentSessions(rows: LegacyAssessmentSession[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_assessment_sessions(assessment_id, assessment_template_id, student_id, customer_id, status, started_at, completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.assessment_id, row.assessment_template_id, row.student_id, row.customer_id ?? null, row.status, row.started_at, row.completed_at ?? null],
    );
  }

  private async insertAssessmentScores(rows: LegacyAssessmentScore[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_assessment_scores(assessment_score_id, assessment_id, dimension_code, score, level, label, semantic_classification) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.assessment_score_id, row.assessment_id, row.dimension_code, row.score, row.level ?? null, row.label ?? null, row.semantic_classification],
    );
  }

  private async insertAssessmentReports(rows: LegacyAssessmentReport[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_assessment_reports(assessment_report_id, assessment_id, summary, legacy_family_type, legacy_risk_score, report_status, semantic_classification, generated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.assessment_report_id, row.assessment_id, row.summary, row.legacy_family_type ?? null, row.legacy_risk_score ?? null, row.report_status, row.semantic_classification, row.generated_at],
    );
  }

  private async insertCourses(rows: LegacyCourse[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_courses(course_id, course_code, title, description, category, status, total_lessons, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.course_id, row.course_code, row.title, row.description, row.category, row.status, row.total_lessons ?? null, row.created_at],
    );
  }

  private async insertProducts(rows: LegacyProduct[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_products(product_id, product_code, title, product_type, course_id, price, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.product_id, row.product_code, row.title, row.product_type, row.course_id ?? null, row.price, row.status, row.created_at],
    );
  }

  private async insertOrders(rows: LegacyOrder[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_orders(order_id, customer_id, buyer_contact_id, order_status, total_amount, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.order_id, row.customer_id, row.buyer_contact_id ?? null, row.order_status, row.total_amount, row.created_at],
    );
  }

  private async insertOrderItems(rows: LegacyOrderItem[]) {
    for (const row of rows) await this.client.query('INSERT INTO fels.legacy_order_items(order_item_id, order_id, product_id, quantity, amount) VALUES ($1,$2,$3,$4,$5)', [row.order_item_id, row.order_id, row.product_id, row.quantity, row.amount]);
  }

  private async insertPayments(rows: LegacyPaymentRecord[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_payments(payment_id, order_id, payment_status, paid_amount, paid_at, payment_method) VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.payment_id, row.order_id, row.payment_status, row.paid_amount, row.paid_at ?? null, row.payment_method],
    );
  }

  private async insertEnrollments(rows: LegacyEnrollment[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_enrollments(enrollment_id, student_id, course_id, order_item_id, status, semantic_classification, enrolled_at, completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.enrollment_id, row.student_id, row.course_id, row.order_item_id ?? null, row.status, row.semantic_classification, row.enrolled_at, row.completed_at ?? null],
    );
  }

  private async insertConsentRecords(rows: LegacyConsentRecord[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_consent_records(consent_record_id, customer_id, student_id, contact_id, agreement_code, agreement_version, accepted_at, guardian_proof_status, purpose_text, revoked_at, source, semantic_classification) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [row.consent_record_id, row.customer_id ?? null, row.student_id ?? null, row.contact_id ?? null, row.agreement_code, row.agreement_version ?? null, row.accepted_at, row.guardian_proof_status ?? null, row.purpose_text ?? null, row.revoked_at ?? null, row.source, row.semantic_classification],
    );
  }

  private async insertTrainingCamps(rows: LegacyTrainingCamp[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_training_camps(training_camp_id, camp_code, title, course_id, duration_days, status, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.training_camp_id, row.camp_code, row.title, row.course_id ?? null, row.duration_days, row.status, row.semantic_classification, row.created_at],
    );
  }

  private async insertCampEnrollments(rows: LegacyCampEnrollment[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_camp_enrollments(camp_enrollment_id, training_camp_id, student_id, enrollment_id, status, semantic_classification, joined_at, finished_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.camp_enrollment_id, row.training_camp_id, row.student_id, row.enrollment_id ?? null, row.status, row.semantic_classification, row.joined_at, row.finished_at ?? null],
    );
  }

  private async insertDailyTasks(rows: LegacyDailyTask[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_daily_tasks(daily_task_id, training_camp_id, day_index, title, instruction_text, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.daily_task_id, row.training_camp_id, row.day_index, row.title, row.instruction_text ?? null, row.semantic_classification, row.created_at],
    );
  }

  private async insertTaskCheckins(rows: LegacyTaskCheckin[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_task_checkins(task_checkin_id, daily_task_id, camp_enrollment_id, student_id, checkin_status, legacy_completion_text, semantic_classification, checked_in_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [row.task_checkin_id, row.daily_task_id, row.camp_enrollment_id, row.student_id, row.checkin_status, row.legacy_completion_text ?? null, row.semantic_classification, row.checked_in_at],
    );
  }

  private async insertAdvisorNotes(rows: LegacyAdvisorNote[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_advisor_notes(advisor_note_id, customer_id, student_id, training_camp_id, advisor_name, note_type, note_text, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [row.advisor_note_id, row.customer_id ?? null, row.student_id ?? null, row.training_camp_id ?? null, row.advisor_name, row.note_type, row.note_text, row.semantic_classification, row.created_at],
    );
  }

  private async insertMemberships(rows: LegacyMembership[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_memberships(membership_id, customer_id, membership_level, status, started_at, expires_at, renewal_count, last_renewed_at, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.membership_id, row.customer_id, row.membership_level, row.status, row.started_at, row.expires_at ?? null, row.renewal_count, row.last_renewed_at ?? null, row.semantic_classification, row.created_at],
    );
  }

  private async insertSourceSnapshots(rows: LegacySourceSnapshot[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_source_snapshots(snapshot_id, source_system, schema_version, created_at, record_counts, checksum_metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.snapshot_id, row.source_system, row.schema_version, row.created_at, row.record_counts, row.checksum_metadata ?? null],
    );
  }
}

export async function seedDatasetToPostgres(records: FelsRecords) {
  const repository = await new PgFelsRepository().connect();
  try {
    return await repository.seedRecords(records);
  } finally {
    await repository.close();
  }
}

export interface LegacyExportEnvelope<T> {
  source_system: 'FELS';
  source_kind: 'REFERENCE_IMPLEMENTATION';
  entity_type: string;
  schema_version: 'fels-1';
  snapshot_id?: string;
  items: T[];
  pagination: { cursor?: string; has_more: boolean };
}

const EXPORT_QUERIES = {
  customers: 'SELECT customer_id, customer_no, display_name, phone, email, customer_level, source_channel, status, semantic_classification, created_at, updated_at FROM fels.legacy_customers ORDER BY customer_id',
  students: 'SELECT student_id, student_no, customer_id, name, birth_date, gender, student_level, status, semantic_classification, created_at FROM fels.legacy_students ORDER BY student_id',
  assessments: 'SELECT assessment_id, assessment_template_id, student_id, customer_id, status, started_at, completed_at FROM fels.legacy_assessment_sessions ORDER BY assessment_id',
  orders: 'SELECT order_id, customer_id, buyer_contact_id, order_status, total_amount, created_at FROM fels.legacy_orders ORDER BY order_id',
  consents: 'SELECT consent_record_id, customer_id, student_id, contact_id, agreement_code, agreement_version, accepted_at, guardian_proof_status, purpose_text, revoked_at, source, semantic_classification FROM fels.legacy_consent_records ORDER BY consent_record_id',
  programs: 'SELECT training_camp_id, camp_code, title, course_id, duration_days, status, semantic_classification, created_at FROM fels.legacy_training_camps ORDER BY training_camp_id',
  tasks: 'SELECT daily_task_id, training_camp_id, day_index, title, instruction_text, semantic_classification, created_at FROM fels.legacy_daily_tasks ORDER BY daily_task_id',
  checkins: 'SELECT task_checkin_id, daily_task_id, camp_enrollment_id, student_id, checkin_status, legacy_completion_text, semantic_classification, checked_in_at FROM fels.legacy_task_checkins ORDER BY task_checkin_id',
  'advisor-notes': 'SELECT advisor_note_id, customer_id, student_id, training_camp_id, advisor_name, note_type, note_text, semantic_classification, created_at FROM fels.legacy_advisor_notes ORDER BY advisor_note_id',
  memberships: 'SELECT membership_id, customer_id, membership_level, status, started_at, expires_at, renewal_count, last_renewed_at, semantic_classification, created_at FROM fels.legacy_memberships ORDER BY membership_id',
} as const;

export type LegacyExportEntity = keyof typeof EXPORT_QUERIES;

export const LEGACY_EXPORT_ENTITIES = Object.keys(EXPORT_QUERIES) as LegacyExportEntity[];

export class PgFelsReadRepository {
  private readonly client: pg.Client;

  constructor(connectionString = getRequiredLegacyDatabaseUrl()) {
    this.client = new Client({ connectionString });
  }

  async connect() {
    await this.client.connect();
    return this;
  }

  async close() {
    await this.client.end();
  }

  private async readOnly<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
    await this.client.query('BEGIN READ ONLY');
    try {
      const result = await fn(this.client);
      await this.client.query('COMMIT');
      return result;
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  async latestSnapshotId(): Promise<string | undefined> {
    const result = await this.readOnly((client) =>
      client.query<{ snapshot_id: string }>('SELECT snapshot_id FROM fels.legacy_source_snapshots ORDER BY created_at DESC, snapshot_id DESC LIMIT 1'),
    );
    return result.rows[0]?.snapshot_id;
  }

  async exportEntity<T extends Record<string, unknown> = Record<string, unknown>>(entity: LegacyExportEntity): Promise<LegacyExportEnvelope<T>> {
    const sql = EXPORT_QUERIES[entity];
    if (!sql) throw new Error(`unknown legacy export entity: ${entity}`);
    const [rows, snapshotId] = await Promise.all([
      this.readOnly((client) => client.query<T>(sql)),
      this.latestSnapshotId(),
    ]);
    return {
      source_system: 'FELS',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      entity_type: entity,
      schema_version: 'fels-1',
      snapshot_id: snapshotId,
      items: rows.rows,
      pagination: { has_more: false },
    };
  }

  async schemaInventory(): Promise<Record<string, number>> {
    const tables = [
      'legacy_customers',
      'legacy_contacts',
      'legacy_students',
      'legacy_student_guardians',
      'legacy_assessment_sessions',
      'legacy_assessment_scores',
      'legacy_assessment_reports',
      'legacy_orders',
      'legacy_consent_records',
      'legacy_training_camps',
      'legacy_camp_enrollments',
      'legacy_daily_tasks',
      'legacy_task_checkins',
      'legacy_advisor_notes',
      'legacy_memberships',
      'legacy_source_snapshots',
    ];
    return this.readOnly(async (client) => {
      const out: Record<string, number> = {};
      for (const table of tables) {
        const result = await client.query<{ count: string }>(`SELECT count(*)::int AS count FROM fels.${table}`);
        out[table] = Number(result.rows[0]?.count ?? 0);
      }
      return out;
    });
  }
}

function countRecords(records: FelsRecords) {
  return {
    legacy_customers: records.customers.length,
    legacy_contacts: records.contacts.length,
    legacy_students: records.students.length,
    legacy_student_guardians: records.studentGuardians.length,
    legacy_assessment_templates: records.assessmentTemplates.length,
    legacy_assessment_sessions: records.assessments.length,
    legacy_assessment_scores: records.assessmentScores.length,
    legacy_assessment_reports: records.assessmentReports.length,
    legacy_courses: records.courses.length,
    legacy_products: records.products.length,
    legacy_orders: records.orders.length,
    legacy_order_items: records.orderItems.length,
    legacy_payments: records.payments.length,
    legacy_enrollments: records.enrollments.length,
    legacy_consent_records: records.legacyConsents.length,
    legacy_source_snapshots: records.snapshots.length,
  };
}