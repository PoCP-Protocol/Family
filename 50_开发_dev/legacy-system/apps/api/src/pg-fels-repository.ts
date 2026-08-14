import pg from 'pg';
import { FELS_REFERENCE_SCHEMA_VERSION, type FelsAcceptanceSurface } from '@family/fels-contracts';
import type {
  FelsRecords,
  LegacyAiReport,
  LegacyAlert,
  LegacyProfile,
  LegacyTag,
  LegacyAssessmentReport,
  LegacyAssessmentScore,
  LegacyAssessmentSession,
  LegacyAssessmentTemplate,
  LegacyConsentRecord,
  LegacyContact,
  LegacyCourse,
  LegacyCustomer,
  LegacyEnrollment,
  LegacyOrder,
  LegacyOrderItem,
  LegacyPaymentRecord,
  LegacyProduct,
  LegacySourceSnapshot,
  LegacyStudent,
  LegacyStudentGuardian,
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
      await this.insertLegacyProfiles(records.profiles);
      await this.insertLegacyTags(records.tags);
      await this.insertLegacyAiReports(records.aiReports);
      await this.insertLegacyAlerts(records.alerts);
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
      fels.legacy_alerts,
      fels.legacy_ai_reports,
      fels.legacy_tags,
      fels.legacy_profiles,
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

  private async insertLegacyProfiles(rows: LegacyProfile[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_profiles(legacy_profile_id, customer_id, student_id, family_type, family_score, ranking, customer_level, student_level, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.legacy_profile_id, row.customer_id, row.student_id ?? null, row.family_type ?? null, row.family_score ?? null, row.ranking ?? null, row.customer_level ?? null, row.student_level ?? null, row.semantic_classification, row.created_at],
    );
  }

  private async insertLegacyTags(rows: LegacyTag[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_tags(legacy_tag_id, customer_id, student_id, tag_category, tag_value, semantic_classification, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.legacy_tag_id, row.customer_id ?? null, row.student_id ?? null, row.tag_category, row.tag_value, row.semantic_classification, row.created_at],
    );
  }

  private async insertLegacyAiReports(rows: LegacyAiReport[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_ai_reports(legacy_ai_report_id, customer_id, student_id, assessment_id, report_type, ai_conclusion, recommended_action, has_supporting_evidence, semantic_classification, generated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.legacy_ai_report_id, row.customer_id, row.student_id ?? null, row.assessment_id ?? null, row.report_type, row.ai_conclusion, row.recommended_action ?? null, row.has_supporting_evidence, row.semantic_classification, row.generated_at],
    );
  }

  private async insertLegacyAlerts(rows: LegacyAlert[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_alerts(legacy_alert_id, customer_id, student_id, alert_type, risk_score, severity_label, legacy_disposition, semantic_classification, triggered_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [row.legacy_alert_id, row.customer_id, row.student_id ?? null, row.alert_type, row.risk_score ?? null, row.severity_label ?? null, row.legacy_disposition ?? null, row.semantic_classification, row.triggered_at],
    );
  }

  private async insertSourceSnapshots(rows: LegacySourceSnapshot[]) {
    for (const row of rows) await this.client.query(
      `INSERT INTO fels.legacy_source_snapshots(snapshot_id, source_system, schema_version, created_at, record_counts, checksum_metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [row.snapshot_id, row.source_system, row.source_schema_version, row.created_at, row.record_counts, row.checksum_metadata ?? null],
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
  source_schema_version: typeof FELS_REFERENCE_SCHEMA_VERSION;
  acceptance_surface: FelsAcceptanceSurface;
  entity_type: string;
  snapshot_id?: string;
  items: T[];
  pagination: { cursor?: string; has_more: boolean };
}

// Clean master export surface: FELS1 core + FLM dirty-world only. No early FELS2/3 routes.
const EXPORT_QUERIES = {
  customers: 'SELECT customer_id, customer_no, display_name, phone, email, customer_level, source_channel, status, semantic_classification, created_at, updated_at FROM fels.legacy_customers ORDER BY customer_id',
  students: 'SELECT student_id, student_no, customer_id, name, birth_date, gender, student_level, status, semantic_classification, created_at FROM fels.legacy_students ORDER BY student_id',
  assessments: 'SELECT assessment_id, assessment_template_id, student_id, customer_id, status, started_at, completed_at FROM fels.legacy_assessment_sessions ORDER BY assessment_id',
  orders: 'SELECT order_id, customer_id, buyer_contact_id, order_status, total_amount, created_at FROM fels.legacy_orders ORDER BY order_id',
  consents: 'SELECT consent_record_id, customer_id, student_id, contact_id, agreement_code, agreement_version, accepted_at, guardian_proof_status, purpose_text, revoked_at, source, semantic_classification FROM fels.legacy_consent_records ORDER BY consent_record_id',
  profiles: 'SELECT legacy_profile_id, customer_id, student_id, family_type, family_score, ranking, customer_level, student_level, semantic_classification, created_at FROM fels.legacy_profiles ORDER BY legacy_profile_id',
  tags: 'SELECT legacy_tag_id, customer_id, student_id, tag_category, tag_value, semantic_classification, created_at FROM fels.legacy_tags ORDER BY legacy_tag_id',
  'ai-reports': 'SELECT legacy_ai_report_id, customer_id, student_id, assessment_id, report_type, ai_conclusion, recommended_action, has_supporting_evidence, semantic_classification, generated_at FROM fels.legacy_ai_reports ORDER BY legacy_ai_report_id',
  alerts: 'SELECT legacy_alert_id, customer_id, student_id, alert_type, risk_score, severity_label, legacy_disposition, semantic_classification, triggered_at FROM fels.legacy_alerts ORDER BY legacy_alert_id',
} as const;

export type LegacyExportEntity = keyof typeof EXPORT_QUERIES;

export const LEGACY_EXPORT_ENTITIES = Object.keys(EXPORT_QUERIES) as LegacyExportEntity[];

const FLM_DIRTY_EXPORT_ENTITIES: LegacyExportEntity[] = ['profiles', 'tags', 'ai-reports', 'alerts'];

function acceptanceSurfaceForEntity(entity: LegacyExportEntity): FelsAcceptanceSurface {
  return FLM_DIRTY_EXPORT_ENTITIES.includes(entity) ? 'FLM_DIRTY_WORLD' : 'FELS1';
}

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
      source_schema_version: FELS_REFERENCE_SCHEMA_VERSION,
      acceptance_surface: acceptanceSurfaceForEntity(entity),
      entity_type: entity,
      snapshot_id: snapshotId,
      items: rows.rows,
      pagination: { has_more: false },
    };
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
    legacy_profiles: records.profiles.length,
    legacy_tags: records.tags.length,
    legacy_ai_reports: records.aiReports.length,
    legacy_alerts: records.alerts.length,
    legacy_source_snapshots: records.snapshots.length,
  };
}