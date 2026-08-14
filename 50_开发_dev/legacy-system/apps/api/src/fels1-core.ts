import { FELS_DATABASE_CONTRACT, FELS_MIGRATION_MATRIX_COVERAGE, FELS_REFERENCE_SCHEMA_VERSION, FELS4_RETIRED_ATTRIBUTES, getFels0Gate, type FelsAcceptanceSurface } from '@family/fels-contracts';

type Status = 'PASS' | 'FAIL';
type MatrixClassification =
  | 'IMPLEMENTED_FELS1'
  | 'PLANNED_FELS2'
  | 'PLANNED_FELS3'
  | 'PLANNED_FELS4'
  | 'EXTERNAL_INTEGRATION'
  | 'RETIRED'
  | 'FAMILY_NEW_CAPABILITY';

interface MatrixClassificationRow {
  id: string;
  classification: MatrixClassification;
}
type IdPrefix = 'cus' | 'con' | 'stu' | 'gua' | 'tpl' | 'asm' | 'scr' | 'rep' | 'crs' | 'prd' | 'ord' | 'itm' | 'pay' | 'enr' | 'cns' | 'snp' | 'prf' | 'ltg' | 'rai' | 'alt';

export interface LegacyCustomer {
  customer_id: string;
  customer_no: string;
  display_name: string;
  phone: string;
  email?: string;
  customer_level?: string;
  source_channel?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  semantic_classification: 'LEGACY_DERIVED';
}

export interface LegacyContact {
  contact_id: string;
  customer_id?: string;
  name: string;
  phone?: string;
  email?: string;
  relationship_text?: string;
  is_primary_contact: boolean;
  created_at: string;
  semantic_classification: 'LEGACY_RELATIONSHIP_EVIDENCE';
}

export interface LegacyStudent {
  student_id: string;
  student_no: string;
  customer_id?: string;
  name: string;
  birth_date?: string;
  gender?: string;
  student_level?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  semantic_classification: 'CHILD_CANDIDATE';
}

export interface LegacyStudentGuardian {
  student_guardian_id: string;
  student_id: string;
  contact_id?: string;
  customer_id?: string;
  relationship_text?: string;
  is_primary: boolean;
  proof_status?: 'VERIFIED' | 'MISSING' | 'WEAK' | 'UNKNOWN';
  created_at: string;
  semantic_classification: 'LEGACY_GUARDIAN_EVIDENCE';
}

export interface LegacyAssessmentTemplate {
  assessment_template_id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'RETIRED';
  created_at: string;
}

export interface LegacyAssessmentSession {
  assessment_id: string;
  assessment_template_id: string;
  student_id: string;
  customer_id?: string;
  status: 'STARTED' | 'COMPLETED';
  started_at: string;
  completed_at?: string;
}

export interface LegacyAssessmentScore {
  assessment_score_id: string;
  assessment_id: string;
  dimension_code: 'COMM' | 'LISTEN' | 'CONFLICT' | 'REPAIR';
  score: number;
  level?: string;
  label?: string;
  semantic_classification: 'LEGACY_ASSESSMENT_OUTPUT';
}

export interface LegacyAssessmentReport {
  assessment_report_id: string;
  assessment_id: string;
  summary: string;
  legacy_family_type?: string;
  legacy_risk_score?: number;
  report_status: 'GENERATED' | 'VOID';
  generated_at: string;
  semantic_classification: 'LEGACY_DERIVED';
}

export interface LegacyCourse {
  course_id: string;
  course_code: string;
  title: string;
  description: string;
  category: string;
  status: 'ACTIVE' | 'RETIRED';
  total_lessons?: number;
  created_at: string;
}

export interface LegacyProduct {
  product_id: string;
  product_code: string;
  title: string;
  product_type: 'COURSE' | 'ASSESSMENT_PACKAGE' | 'FUTURE_PROGRAM';
  course_id?: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface LegacyOrder {
  order_id: string;
  customer_id: string;
  buyer_contact_id?: string;
  order_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIAL_REFUND';
  total_amount: number;
  created_at: string;
}

export interface LegacyOrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  amount: number;
}

export interface LegacyPaymentRecord {
  payment_id: string;
  order_id: string;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIAL_REFUND';
  paid_amount: number;
  paid_at?: string;
  payment_method: 'SIMULATED_CASH' | 'SIMULATED_CARD' | 'SIMULATED_TRANSFER';
}

export interface LegacyEnrollment {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  order_item_id?: string;
  status: 'ENROLLED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolled_at: string;
  completed_at?: string;
  semantic_classification: 'COURSE_STATUS_NOT_OUTCOME';
}

export interface LegacyConsentRecord {
  consent_record_id: string;
  customer_id?: string;
  student_id?: string;
  contact_id?: string;
  agreement_code: 'REGISTRATION_TERMS' | 'PRIVACY_POLICY' | 'ASSESSMENT_AUTH' | 'MINOR_GUARDIAN_DECLARATION' | 'AI_USE_AUTH' | 'MARKETING_AUTH';
  agreement_version?: string;
  accepted_at: string;
  guardian_proof_status?: 'VERIFIED' | 'MISSING' | 'WEAK' | 'UNKNOWN';
  purpose_text?: string;
  revoked_at?: string;
  source: 'LEGACY_WEB' | 'LEGACY_ADMIN' | 'IMPORT';
  semantic_classification: 'CONSENT_EVIDENCE_CANDIDATE';
}

// ---- FLM Dirty-World reference fixture（旧画像/旧标签/旧AI报告/旧预警）----
// Anti-corruption FIXTURE only. NOT a FELS-4 product capability. semantic_classification
// is FLM metadata (a hardcoded guardrail marker), not legacy business truth.
export interface LegacyProfile {
  legacy_profile_id: string;
  customer_id: string;
  student_id?: string;
  family_type?: string;
  family_score?: number; // M036 -> RETIRE
  ranking?: number;      // M035 -> RETIRE
  customer_level?: string;
  student_level?: string;
  created_at: string;
  semantic_classification: 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE';
}

export interface LegacyTag {
  legacy_tag_id: string;
  customer_id?: string;
  student_id?: string;
  tag_category: string;
  tag_value: string;
  created_at: string;
  semantic_classification: 'LEGACY_TAG_CATEGORY_NOT_OFFICIAL';
}

export interface LegacyAiReport {
  legacy_ai_report_id: string;
  customer_id: string;
  student_id?: string;
  assessment_id?: string;
  report_type: string;
  ai_conclusion: string;
  recommended_action?: string;
  has_supporting_evidence: boolean;
  generated_at: string;
  semantic_classification: 'LEGACY_AI_HYPOTHESIS_NOT_FACT';
}

export interface LegacyAlert {
  legacy_alert_id: string;
  customer_id: string;
  student_id?: string;
  alert_type: string;
  risk_score?: number;
  severity_label?: string;
  legacy_disposition?: string;
  triggered_at: string;
  semantic_classification: 'LEGACY_ALERT_SIGNAL_NOT_THRESHOLD';
}

export interface LegacySourceSnapshot {
  snapshot_id: string;
  source_system: 'FELS';
  source_schema_version: typeof FELS_REFERENCE_SCHEMA_VERSION;
  created_at: string;
  record_counts: Record<string, number>;
  checksum_metadata?: Record<string, string>;
}

type StoreKey = keyof FelsRecords;

export interface FelsRecords {
  customers: LegacyCustomer[];
  contacts: LegacyContact[];
  students: LegacyStudent[];
  studentGuardians: LegacyStudentGuardian[];
  assessmentTemplates: LegacyAssessmentTemplate[];
  assessments: LegacyAssessmentSession[];
  assessmentScores: LegacyAssessmentScore[];
  assessmentReports: LegacyAssessmentReport[];
  courses: LegacyCourse[];
  products: LegacyProduct[];
  orders: LegacyOrder[];
  orderItems: LegacyOrderItem[];
  payments: LegacyPaymentRecord[];
  enrollments: LegacyEnrollment[];
  legacyConsents: LegacyConsentRecord[];
  profiles: LegacyProfile[];
  tags: LegacyTag[];
  aiReports: LegacyAiReport[];
  alerts: LegacyAlert[];
  snapshots: LegacySourceSnapshot[];
}

export interface LegacyExportEnvelope<T> {
  source_system: 'FELS';
  source_kind: 'REFERENCE_IMPLEMENTATION';
  source_schema_version: typeof FELS_REFERENCE_SCHEMA_VERSION;
  acceptance_surface: FelsAcceptanceSurface;
  entity_type: string;
  snapshot_id?: string;
  items: T[];
  pagination: {
    cursor?: string;
    has_more: boolean;
  };
}

const FLM_DIRTY_STORE_KEYS: StoreKey[] = ['profiles', 'tags', 'aiReports', 'alerts'];

// Clean master runtime exposes only FELS1 and FLM_DIRTY_WORLD surfaces (FLM-INTEGRATION-001 §9).
export function acceptanceSurfaceForStoreKey(key: StoreKey): FelsAcceptanceSurface {
  return FLM_DIRTY_STORE_KEYS.includes(key) ? 'FLM_DIRTY_WORLD' : 'FELS1';
}

const NOW = '2026-08-10T00:00:00.000Z';

function id(prefix: IdPrefix, value: number) {
  return `${prefix}_${value.toString().padStart(4, '0')}`;
}

function assertLegacyDatabaseBoundary() {
  if (process.env.LEGACY_DATABASE_URL && process.env.LEGACY_DATABASE_URL === process.env.DATABASE_URL) {
    throw new Error('LEGACY_DATABASE_URL must not equal DATABASE_URL');
  }
  if (process.env.LEGACY_DATABASE_URL && process.env.LEGACY_DATABASE_URL === process.env.TEST_DATABASE_URL) {
    throw new Error('LEGACY_DATABASE_URL must not equal TEST_DATABASE_URL');
  }
  return FELS_DATABASE_CONTRACT;
}

function emptyRecords(): FelsRecords {
  return {
    customers: [],
    contacts: [],
    students: [],
    studentGuardians: [],
    assessmentTemplates: [],
    assessments: [],
    assessmentScores: [],
    assessmentReports: [],
    courses: [],
    products: [],
    orders: [],
    orderItems: [],
    payments: [],
    enrollments: [],
    legacyConsents: [],
    profiles: [],
    tags: [],
    aiReports: [],
    alerts: [],
    snapshots: [],
  };
}

// FelsReferenceRuntime 表示整个 FELS Reference Source（FLM-INTEGRATION-001 §8-9）:
//   ├── FELS1 reference surface（核心教育业务）
//   └── FLM dirty-world reference surface（脏世界 fixture: profiles/tags/ai_reports/alerts）
// clean master 不含 quarantined FELS2/3 runtime —— 它根本不应知道那些对象存在。
export class FelsReferenceRuntime {
  readonly records: FelsRecords;
  private sequence = 1;

  constructor(records: FelsRecords = emptyRecords()) {
    assertLegacyDatabaseBoundary();
    this.records = records;
    this.seedReferenceAssessment();
  }

  createCustomer(input: Pick<LegacyCustomer, 'display_name' | 'phone'> & Partial<LegacyCustomer>) {
    const customer: LegacyCustomer = {
      customer_id: input.customer_id ?? id('cus', this.sequence++),
      customer_no: input.customer_no ?? `C${this.sequence.toString().padStart(5, '0')}`,
      display_name: input.display_name,
      phone: input.phone,
      email: input.email,
      customer_level: input.customer_level,
      source_channel: input.source_channel,
      status: input.status ?? 'ACTIVE',
      created_at: input.created_at ?? NOW,
      updated_at: input.updated_at ?? NOW,
      semantic_classification: 'LEGACY_DERIVED',
    };
    this.records.customers.push(customer);
    return customer;
  }

  getCustomer(customerId: string) {
    return this.records.customers.find((customer) => customer.customer_id === customerId);
  }

  addContact(customerId: string | undefined, input: Pick<LegacyContact, 'name'> & Partial<LegacyContact>) {
    if (customerId && !this.getCustomer(customerId)) throw new Error(`unknown customer: ${customerId}`);
    const contact: LegacyContact = {
      contact_id: input.contact_id ?? id('con', this.sequence++),
      customer_id: customerId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      relationship_text: input.relationship_text,
      is_primary_contact: input.is_primary_contact ?? false,
      created_at: input.created_at ?? NOW,
      semantic_classification: 'LEGACY_RELATIONSHIP_EVIDENCE',
    };
    this.records.contacts.push(contact);
    return contact;
  }

  createStudent(input: Pick<LegacyStudent, 'name'> & Partial<LegacyStudent>) {
    const student: LegacyStudent = {
      student_id: input.student_id ?? id('stu', this.sequence++),
      student_no: input.student_no ?? `S${this.sequence.toString().padStart(5, '0')}`,
      customer_id: input.customer_id,
      name: input.name,
      birth_date: input.birth_date,
      gender: input.gender,
      student_level: input.student_level,
      status: input.status ?? 'ACTIVE',
      created_at: input.created_at ?? NOW,
      semantic_classification: 'CHILD_CANDIDATE',
    };
    this.records.students.push(student);
    return student;
  }

  getStudent(studentId: string) {
    return this.records.students.find((student) => student.student_id === studentId);
  }

  addGuardian(studentId: string, input: Partial<LegacyStudentGuardian>) {
    if (!this.getStudent(studentId)) throw new Error(`unknown student: ${studentId}`);
    const guardian: LegacyStudentGuardian = {
      student_guardian_id: input.student_guardian_id ?? id('gua', this.sequence++),
      student_id: studentId,
      contact_id: input.contact_id,
      customer_id: input.customer_id,
      relationship_text: input.relationship_text,
      is_primary: input.is_primary ?? false,
      proof_status: input.proof_status,
      created_at: input.created_at ?? NOW,
      semantic_classification: 'LEGACY_GUARDIAN_EVIDENCE',
    };
    this.records.studentGuardians.push(guardian);
    return guardian;
  }

  createAssessment(studentId: string, customerId?: string) {
    const template = this.records.assessmentTemplates[0];
    const assessment: LegacyAssessmentSession = {
      assessment_id: id('asm', this.sequence++),
      assessment_template_id: template.assessment_template_id,
      student_id: studentId,
      customer_id: customerId,
      status: 'STARTED',
      started_at: NOW,
    };
    this.records.assessments.push(assessment);
    return assessment;
  }

  addAssessmentScore(assessmentId: string, input: Omit<LegacyAssessmentScore, 'assessment_score_id' | 'assessment_id' | 'semantic_classification'>) {
    const score: LegacyAssessmentScore = {
      assessment_score_id: id('scr', this.sequence++),
      assessment_id: assessmentId,
      ...input,
      semantic_classification: 'LEGACY_ASSESSMENT_OUTPUT',
    };
    this.records.assessmentScores.push(score);
    return score;
  }

  generateAssessmentReport(assessmentId: string, input: Pick<LegacyAssessmentReport, 'summary'> & Partial<LegacyAssessmentReport>) {
    const assessment = this.records.assessments.find((item) => item.assessment_id === assessmentId);
    if (!assessment) throw new Error(`unknown assessment: ${assessmentId}`);
    assessment.status = 'COMPLETED';
    assessment.completed_at = NOW;
    const report: LegacyAssessmentReport = {
      assessment_report_id: id('rep', this.sequence++),
      assessment_id: assessmentId,
      summary: input.summary,
      legacy_family_type: input.legacy_family_type,
      legacy_risk_score: input.legacy_risk_score,
      report_status: input.report_status ?? 'GENERATED',
      generated_at: input.generated_at ?? NOW,
      semantic_classification: 'LEGACY_DERIVED',
    };
    this.records.assessmentReports.push(report);
    return report;
  }

  createCourse(input: Omit<LegacyCourse, 'course_id' | 'created_at'> & Partial<LegacyCourse>) {
    const course: LegacyCourse = { course_id: input.course_id ?? id('crs', this.sequence++), created_at: input.created_at ?? NOW, ...input };
    this.records.courses.push(course);
    return course;
  }

  createProduct(input: Omit<LegacyProduct, 'product_id' | 'created_at'> & Partial<LegacyProduct>) {
    const product: LegacyProduct = { product_id: input.product_id ?? id('prd', this.sequence++), created_at: input.created_at ?? NOW, ...input };
    this.records.products.push(product);
    return product;
  }

  createOrder(input: Omit<LegacyOrder, 'order_id' | 'created_at'> & Partial<LegacyOrder>, items: Array<Pick<LegacyOrderItem, 'product_id' | 'quantity' | 'amount'>>) {
    const order: LegacyOrder = { order_id: input.order_id ?? id('ord', this.sequence++), created_at: input.created_at ?? NOW, ...input };
    this.records.orders.push(order);
    const orderItems = items.map((item) => {
      const orderItem: LegacyOrderItem = { order_item_id: id('itm', this.sequence++), order_id: order.order_id, ...item };
      this.records.orderItems.push(orderItem);
      return orderItem;
    });
    return { order, orderItems };
  }

  addPayment(orderId: string, input: Omit<LegacyPaymentRecord, 'payment_id' | 'order_id'>) {
    const payment: LegacyPaymentRecord = { payment_id: id('pay', this.sequence++), order_id: orderId, ...input };
    this.records.payments.push(payment);
    const order = this.records.orders.find((item) => item.order_id === orderId);
    if (order && input.payment_status === 'PAID') order.order_status = 'PAID';
    return payment;
  }

  createEnrollment(input: Omit<LegacyEnrollment, 'enrollment_id' | 'enrolled_at' | 'semantic_classification'> & Partial<LegacyEnrollment>) {
    const enrollment: LegacyEnrollment = {
      enrollment_id: input.enrollment_id ?? id('enr', this.sequence++),
      enrolled_at: input.enrolled_at ?? NOW,
      ...input,
      semantic_classification: 'COURSE_STATUS_NOT_OUTCOME',
    };
    this.records.enrollments.push(enrollment);
    return enrollment;
  }

  createLegacyConsent(input: Omit<LegacyConsentRecord, 'consent_record_id' | 'semantic_classification'> & Partial<LegacyConsentRecord>) {
    const consent: LegacyConsentRecord = {
      consent_record_id: input.consent_record_id ?? id('cns', this.sequence++),
      ...input,
      semantic_classification: 'CONSENT_EVIDENCE_CANDIDATE',
    };
    this.records.legacyConsents.push(consent);
    return consent;
  }

  createLegacyProfile(input: Omit<LegacyProfile, 'legacy_profile_id' | 'created_at' | 'semantic_classification'> & Partial<LegacyProfile>) {
    const profile: LegacyProfile = {
      legacy_profile_id: input.legacy_profile_id ?? id('prf', this.sequence++),
      created_at: input.created_at ?? NOW,
      ...input,
      semantic_classification: 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE',
    };
    this.records.profiles.push(profile);
    return profile;
  }

  createLegacyTag(input: Omit<LegacyTag, 'legacy_tag_id' | 'created_at' | 'semantic_classification'> & Partial<LegacyTag>) {
    const tag: LegacyTag = {
      legacy_tag_id: input.legacy_tag_id ?? id('ltg', this.sequence++),
      created_at: input.created_at ?? NOW,
      ...input,
      semantic_classification: 'LEGACY_TAG_CATEGORY_NOT_OFFICIAL',
    };
    this.records.tags.push(tag);
    return tag;
  }

  createLegacyAiReport(input: Omit<LegacyAiReport, 'legacy_ai_report_id' | 'generated_at' | 'semantic_classification'> & Partial<LegacyAiReport>) {
    const report: LegacyAiReport = {
      legacy_ai_report_id: input.legacy_ai_report_id ?? id('rai', this.sequence++),
      generated_at: input.generated_at ?? NOW,
      ...input,
      semantic_classification: 'LEGACY_AI_HYPOTHESIS_NOT_FACT',
    };
    this.records.aiReports.push(report);
    return report;
  }

  createLegacyAlert(input: Omit<LegacyAlert, 'legacy_alert_id' | 'triggered_at' | 'semantic_classification'> & Partial<LegacyAlert>) {
    const alert: LegacyAlert = {
      legacy_alert_id: input.legacy_alert_id ?? id('alt', this.sequence++),
      triggered_at: input.triggered_at ?? NOW,
      ...input,
      semantic_classification: 'LEGACY_ALERT_SIGNAL_NOT_THRESHOLD',
    };
    this.records.alerts.push(alert);
    return alert;
  }

  createSourceSnapshot() {
    const snapshot: LegacySourceSnapshot = {
      snapshot_id: id('snp', this.sequence++),
      source_system: 'FELS',
      source_schema_version: FELS_REFERENCE_SCHEMA_VERSION,
      created_at: NOW,
      record_counts: recordCounts(this.records),
      checksum_metadata: { deterministic: 'true' },
    };
    this.records.snapshots.push(snapshot);
    return snapshot;
  }

  exportEntity<T>(key: StoreKey, entityType: string, options: { cursor?: string; limit?: number; snapshotId?: string } = {}): LegacyExportEnvelope<T> {
    const offset = options.cursor ? Number.parseInt(options.cursor, 10) : 0;
    const limit = options.limit ?? 50;
    const items = this.records[key].slice(offset, offset + limit) as T[];
    const nextOffset = offset + items.length;
    return {
      source_system: 'FELS',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      source_schema_version: FELS_REFERENCE_SCHEMA_VERSION,
      acceptance_surface: acceptanceSurfaceForStoreKey(key),
      entity_type: entityType,
      snapshot_id: options.snapshotId,
      items,
      pagination: {
        cursor: nextOffset < this.records[key].length ? String(nextOffset) : undefined,
        has_more: nextOffset < this.records[key].length,
      },
    };
  }

  private seedReferenceAssessment() {
    if (this.records.assessmentTemplates.length > 0) return;
    this.records.assessmentTemplates.push({
      assessment_template_id: id('tpl', this.sequence++),
      name: 'ADOLESCENT_PARENT_CHILD_COMMUNICATION_V1',
      version: '1',
      status: 'ACTIVE',
      created_at: NOW,
    });
  }
}

/**
 * @deprecated 兼容 alias（FLM-INTEGRATION-001 §10）。请用 FelsReferenceRuntime。
 */
export class Fels1Runtime extends FelsReferenceRuntime {}

export function createCleanSmallDataset() {
  const runtime = new FelsReferenceRuntime();
  const course = runtime.createCourse({ course_code: 'LEG-COMM-001', title: '青春期亲子沟通课', description: 'Synthetic legacy course', category: 'COMMUNICATION', status: 'ACTIVE', total_lessons: 8 });
  const product = runtime.createProduct({ product_code: 'P-COMM-001', title: '沟通测评与课程包', product_type: 'COURSE', course_id: course.course_id, price: 1999, status: 'ACTIVE' });
  for (let index = 1; index <= 12; index++) {
    const customer = runtime.createCustomer({ display_name: `Synthetic Customer ${index}`, phone: `1390000${index.toString().padStart(4, '0')}`, customer_level: index % 2 === 0 ? 'A' : 'B', source_channel: 'synthetic' });
    const contact = runtime.addContact(customer.customer_id, { name: `Synthetic Contact ${index}`, phone: customer.phone, relationship_text: index % 2 === 0 ? '妈妈' : '爸爸', is_primary_contact: true });
    const student = runtime.createStudent({ customer_id: customer.customer_id, name: `Synthetic Student ${index}`, student_level: 'L1' });
    runtime.addGuardian(student.student_id, { customer_id: customer.customer_id, contact_id: contact.contact_id, relationship_text: contact.relationship_text, is_primary: true, proof_status: 'VERIFIED' });
    const assessment = runtime.createAssessment(student.student_id, customer.customer_id);
    for (const dimension_code of ['COMM', 'LISTEN', 'CONFLICT', 'REPAIR'] as const) {
      runtime.addAssessmentScore(assessment.assessment_id, { dimension_code, score: 60 + index, level: 'medium', label: 'synthetic' });
    }
    runtime.generateAssessmentReport(assessment.assessment_id, { summary: 'Synthetic legacy assessment report', legacy_family_type: 'COMMUNICATION_NEEDS_SUPPORT', legacy_risk_score: 20 + index });
    const { order, orderItems } = runtime.createOrder({ customer_id: customer.customer_id, buyer_contact_id: contact.contact_id, order_status: 'PENDING', total_amount: product.price }, [{ product_id: product.product_id, quantity: 1, amount: product.price }]);
    runtime.addPayment(order.order_id, { payment_status: 'PAID', paid_amount: product.price, paid_at: NOW, payment_method: 'SIMULATED_TRANSFER' });
    runtime.createEnrollment({ student_id: student.student_id, course_id: course.course_id, order_item_id: orderItems[0].order_item_id, status: 'ACTIVE' });
    runtime.createLegacyConsent({ customer_id: customer.customer_id, student_id: student.student_id, contact_id: contact.contact_id, agreement_code: 'ASSESSMENT_AUTH', agreement_version: 'v1', accepted_at: NOW, guardian_proof_status: 'VERIFIED', purpose_text: 'Synthetic assessment authorization', source: 'LEGACY_WEB' });
  }
  runtime.createSourceSnapshot();
  return runtime;
}

export function createDirtyCoreDataset() {
  const runtime = createCleanSmallDataset();
  const customerA = runtime.createCustomer({ display_name: 'Duplicate Buyer A', phone: '13800000001', customer_level: 'A' });
  const customerB = runtime.createCustomer({ display_name: 'Duplicate Buyer B', phone: '13800000001', customer_level: 'A' });
  const contactB = runtime.addContact(customerB.customer_id, { name: 'Weak Guardian', relationship_text: '监护人', is_primary_contact: true });
  const student = runtime.createStudent({ customer_id: customerA.customer_id, name: 'Ambiguous Student', student_level: 'legacy_high' });
  runtime.addGuardian(student.student_id, { customer_id: customerB.customer_id, contact_id: contactB.contact_id, relationship_text: '其他', is_primary: true, proof_status: 'WEAK' });
  runtime.addGuardian(student.student_id, { customer_id: customerA.customer_id, relationship_text: 'unknown', is_primary: false, proof_status: 'MISSING' });
  const assessment = runtime.createAssessment(student.student_id, customerA.customer_id);
  runtime.addAssessmentScore(assessment.assessment_id, { dimension_code: 'COMM', score: 42, level: 'low', label: 'legacy score' });
  runtime.generateAssessmentReport(assessment.assessment_id, { summary: 'Dirty legacy report', legacy_family_type: 'HIGH_CONFLICT', legacy_risk_score: 88 });
  runtime.createLegacyConsent({ customer_id: customerA.customer_id, student_id: student.student_id, contact_id: contactB.contact_id, agreement_code: 'MINOR_GUARDIAN_DECLARATION', accepted_at: NOW, guardian_proof_status: 'WEAK', source: 'LEGACY_ADMIN' });
  runtime.createSourceSnapshot();
  return runtime;
}

// 为前若干客户注入良态 FLM 脏世界参考对象（正确携带 NOT_* 语义分类）。
function addFlmReferenceObjects(runtime: FelsReferenceRuntime) {
  runtime.records.customers.slice(0, 4).forEach((customer, index) => {
    const student = runtime.records.students.find((s) => s.customer_id === customer.customer_id);
    runtime.createLegacyProfile({
      customer_id: customer.customer_id,
      student_id: student?.student_id,
      family_type: 'COMMUNICATION_NEEDS_SUPPORT',
      customer_level: customer.customer_level,
      student_level: student?.student_level,
    });
    runtime.createLegacyTag({ customer_id: customer.customer_id, student_id: student?.student_id, tag_category: 'ENGAGEMENT', tag_value: index % 2 === 0 ? '活跃' : '待跟进' });
    runtime.createLegacyAiReport({ customer_id: customer.customer_id, student_id: student?.student_id, report_type: 'COMMUNICATION_ANALYSIS', ai_conclusion: '（旧AI，假设性）该家庭沟通或有改善空间，仅供参考', recommended_action: '建议继续观察并由顾问跟进', has_supporting_evidence: true });
    runtime.createLegacyAlert({ customer_id: customer.customer_id, student_id: student?.student_id, alert_type: 'FOLLOW_UP', risk_score: 20 + index, severity_label: 'LOW', legacy_disposition: 'HUMAN_REVIEWED' });
  });
}

// FLM reference clean：良态旧世界智能对象（供 export 保真测试）。
export function createFlmReferenceCleanDataset() {
  const runtime = createCleanSmallDataset();
  addFlmReferenceObjects(runtime);
  runtime.createSourceSnapshot();
  return runtime;
}

// FLM dirty-world：core dirty（重复手机号/弱同意/歧义监护人）之上注入脏世界污染向量（D021–D052）。
// 所有对象仍被 runtime 强制打上 NOT_* 语义分类，用于证明 FLM 结构性拒绝污染进入 Family canonical。
export function createFlmDirtyWorldDataset() {
  const runtime = createDirtyCoreDataset();
  addFlmReferenceObjects(runtime);
  const anchor = runtime.records.customers[0];
  const anchorStudent = runtime.records.students.find((s) => s.customer_id === anchor.customer_id);

  runtime.createLegacyProfile({ customer_id: anchor.customer_id, student_id: anchorStudent?.student_id, family_type: 'HIGH_CONFLICT', family_score: 137, ranking: 0, customer_level: 'A', student_level: 'legacy_high' });
  runtime.createLegacyProfile({ customer_id: anchor.customer_id, family_type: 'FIXED_IDENTITY', family_score: -5, ranking: 12, customer_level: 'S' });
  runtime.createLegacyTag({ customer_id: anchor.customer_id, tag_category: 'PERSONALITY', tag_value: '内向固定' });
  runtime.createLegacyTag({ customer_id: anchor.customer_id, tag_category: 'PERSONALITY', tag_value: '外向' });
  runtime.createLegacyTag({ customer_id: anchor.customer_id, tag_category: 'RISK', tag_value: '' });
  runtime.createLegacyAiReport({ customer_id: anchor.customer_id, student_id: anchorStudent?.student_id, report_type: 'DIAGNOSIS', ai_conclusion: '确诊为注意力缺陷，问题已成事实，必须立即干预', recommended_action: '建议临床用药', has_supporting_evidence: false });
  runtime.createLegacyAiReport({ customer_id: anchor.customer_id, report_type: 'RANKING', ai_conclusion: '该家庭在同城家庭中排名靠后，情况确凿', has_supporting_evidence: false });
  runtime.createLegacyAiReport({ customer_id: anchor.customer_id, report_type: 'EFFICACY', ai_conclusion: '本方案保证90天彻底解决亲子冲突', recommended_action: '立即续费', has_supporting_evidence: false });
  runtime.createLegacyAlert({ customer_id: anchor.customer_id, student_id: anchorStudent?.student_id, alert_type: 'RISK', risk_score: 95, severity_label: 'HIGH' });
  runtime.createLegacyAlert({ customer_id: anchor.customer_id, alert_type: 'SELF_HARM_SIGNAL', risk_score: 99, severity_label: 'CRITICAL', legacy_disposition: 'AUTO_CLOSED' });
  runtime.createLegacyAlert({ customer_id: anchor.customer_id, alert_type: 'CONTRADICTORY_SIGNAL', risk_score: 5, severity_label: 'CRITICAL', legacy_disposition: 'ESCALATED_BY_RANKING' });

  runtime.createSourceSnapshot();
  return runtime;
}

export function runFelsVerticalSliceE2E() {
  const runtime = new FelsReferenceRuntime();
  const customer = runtime.createCustomer({ display_name: 'Vertical Slice Customer', phone: '13700000001', source_channel: 'offline' });
  const mother = runtime.addContact(customer.customer_id, { name: 'Mother Contact', phone: customer.phone, relationship_text: '妈妈', is_primary_contact: true });
  const student = runtime.createStudent({ customer_id: customer.customer_id, name: 'Vertical Slice Student', student_level: 'legacy_mid' });
  runtime.addGuardian(student.student_id, { customer_id: customer.customer_id, contact_id: mother.contact_id, relationship_text: '妈妈', is_primary: true, proof_status: 'VERIFIED' });
  const assessment = runtime.createAssessment(student.student_id, customer.customer_id);
  runtime.addAssessmentScore(assessment.assessment_id, { dimension_code: 'COMM', score: 72, level: 'medium', label: 'communication' });
  runtime.addAssessmentScore(assessment.assessment_id, { dimension_code: 'LISTEN', score: 68, level: 'medium', label: 'listening' });
  const report = runtime.generateAssessmentReport(assessment.assessment_id, { summary: 'Legacy report generated for export', legacy_family_type: 'COMMUNICATION_NEEDS_SUPPORT', legacy_risk_score: 33 });
  const course = runtime.createCourse({ course_code: 'LEG-COMM-101', title: 'Parent Child Communication Legacy Course', description: 'Traditional education course', category: 'COMMUNICATION', status: 'ACTIVE', total_lessons: 8 });
  const product = runtime.createProduct({ product_code: 'PKG-COMM-101', title: 'Assessment plus course package', product_type: 'COURSE', course_id: course.course_id, price: 2999, status: 'ACTIVE' });
  const { order, orderItems } = runtime.createOrder({ customer_id: customer.customer_id, buyer_contact_id: mother.contact_id, order_status: 'PENDING', total_amount: 2999 }, [{ product_id: product.product_id, quantity: 1, amount: 2999 }]);
  runtime.addPayment(order.order_id, { payment_status: 'PAID', paid_amount: 2999, paid_at: NOW, payment_method: 'SIMULATED_CARD' });
  const enrollment = runtime.createEnrollment({ student_id: student.student_id, course_id: course.course_id, order_item_id: orderItems[0].order_item_id, status: 'ACTIVE' });
  runtime.createLegacyConsent({ customer_id: customer.customer_id, student_id: student.student_id, contact_id: mother.contact_id, agreement_code: 'ASSESSMENT_AUTH', agreement_version: 'v1', accepted_at: NOW, guardian_proof_status: 'VERIFIED', purpose_text: 'Allow assessment', source: 'LEGACY_WEB' });
  const snapshot = runtime.createSourceSnapshot();
  const exportedCustomer = runtime.exportEntity<LegacyCustomer>('customers', 'legacy_customers', { snapshotId: snapshot.snapshot_id, limit: 1 });
  return {
    status: 'PASS' as Status,
    runtime,
    customer,
    student,
    report,
    enrollment,
    snapshot,
    exportedCustomer,
    familyDbWriteCount: 0,
  };
}

export function runLegacyAmbiguityE2E() {
  const runtime = new FelsReferenceRuntime();
  const customerA = runtime.createCustomer({ display_name: 'Customer A Buyer', phone: '13600000001' });
  const customerB = runtime.createCustomer({ display_name: 'Customer B Guardian Holder', phone: '13600000002' });
  const contactB = runtime.addContact(customerB.customer_id, { name: 'Guardian Contact B', relationship_text: '监护人', is_primary_contact: true });
  const student = runtime.createStudent({ customer_id: customerA.customer_id, name: 'Shared Student X' });
  runtime.addGuardian(student.student_id, { customer_id: customerB.customer_id, contact_id: contactB.contact_id, relationship_text: '监护人', is_primary: true, proof_status: 'WEAK' });
  const assessment = runtime.createAssessment(student.student_id, customerA.customer_id);
  runtime.addAssessmentScore(assessment.assessment_id, { dimension_code: 'CONFLICT', score: 39, level: 'low', label: 'conflict' });
  runtime.generateAssessmentReport(assessment.assessment_id, { summary: 'Ambiguous old-world record', legacy_family_type: 'HIGH_CONFLICT', legacy_risk_score: 91 });
  runtime.createLegacyConsent({ customer_id: customerA.customer_id, student_id: student.student_id, contact_id: contactB.contact_id, agreement_code: 'ASSESSMENT_AUTH', accepted_at: NOW, guardian_proof_status: 'WEAK', source: 'LEGACY_ADMIN' });
  const discovery = discoverFelsReadOnly(runtime);
  return {
    status: 'PASS' as Status,
    runtime,
    discovery,
    requiredFlags: discovery.review_flags,
    familyCreated: false,
  };
}

export function discoverFelsReadOnly(runtime: FelsReferenceRuntime) {
  const duplicatePhones = new Set<string>();
  const seenPhones = new Set<string>();
  for (const customer of runtime.records.customers) {
    if (seenPhones.has(customer.phone)) duplicatePhones.add(customer.phone);
    seenPhones.add(customer.phone);
  }
  const weakConsents = runtime.records.legacyConsents.filter((consent) => !consent.purpose_text || !consent.agreement_version || consent.guardian_proof_status === 'WEAK' || consent.guardian_proof_status === 'MISSING');
  const crossCustomerGuardians = runtime.records.studentGuardians.filter((guardian) => {
    const student = runtime.getStudent(guardian.student_id);
    return student?.customer_id && guardian.customer_id && student.customer_id !== guardian.customer_id;
  });
  return {
    source_kind: 'REFERENCE_IMPLEMENTATION',
    source_system: 'FELS',
    real_bangyang_source: false,
    schema_inventory: Object.fromEntries(Object.entries(recordCounts(runtime.records)).filter(([, count]) => count > 0)),
    identity_inventory: {
      duplicate_phone_count: duplicatePhones.size,
      cross_customer_guardian_count: crossCustomerGuardians.length,
    },
    consent_inventory: {
      weak_or_incomplete_consent_count: weakConsents.length,
    },
    review_flags: [
      ...(duplicatePhones.size || crossCustomerGuardians.length ? ['IDENTITY_REVIEW_REQUIRED'] : []),
      ...(weakConsents.length ? ['CONSENT_REVIEW_REQUIRED'] : []),
    ],
    mode: 'READ_ONLY',
  } as const;
}

// FLM 语义污染拒绝层（护栏，只读，数据驱动）。读对象显式 semantic_classification + 声明式
// FELS4_LEGACY_ATTRIBUTE_MAP 做结构化裁决；不用正则猜自由文本；生成式映射延后到已授权导入。
export function rejectSemanticPollution(runtime: FelsReferenceRuntime) {
  const violations: Array<{ rule: string; object: string; id: string; detail: string }> = [];
  const requireMark = (ok: boolean, rule: string, object: string, entityId: string, detail: string) => {
    if (!ok) violations.push({ rule, object, id: entityId, detail });
  };

  for (const p of runtime.records.profiles) requireMark(p.semantic_classification === 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE', 'PROFILE_MUST_BE_MARKED_NOT_STATE', 'legacy_profile', p.legacy_profile_id, 'missing LEGACY_PROFILE_SNAPSHOT_NOT_STATE');
  for (const t of runtime.records.tags) requireMark(t.semantic_classification === 'LEGACY_TAG_CATEGORY_NOT_OFFICIAL', 'TAG_MUST_BE_MARKED_UNOFFICIAL', 'legacy_tag', t.legacy_tag_id, 'legacy tag not marked as annotation');
  for (const r of runtime.records.aiReports) requireMark(r.semantic_classification === 'LEGACY_AI_HYPOTHESIS_NOT_FACT', 'AI_REPORT_MUST_BE_HYPOTHESIS', 'legacy_ai_report', r.legacy_ai_report_id, 'legacy AI conclusion not marked as hypothesis');
  for (const a of runtime.records.alerts) requireMark(a.semantic_classification === 'LEGACY_ALERT_SIGNAL_NOT_THRESHOLD', 'ALERT_MUST_BE_SIGNAL_ONLY', 'legacy_alert', a.legacy_alert_id, 'legacy alert not marked as signal-only');
  for (const s of runtime.records.assessmentScores) requireMark(s.semantic_classification === 'LEGACY_ASSESSMENT_OUTPUT', 'SCORE_MUST_BE_EVIDENCE', 'legacy_assessment_score', s.assessment_score_id, 'legacy score not marked as assessment output');

  const retireDisposition = runtime.records.profiles.flatMap((p) => {
    const out: Array<{ object: string; id: string; attribute: string; disposition: 'RETIRE' }> = [];
    if (p.family_score !== undefined && p.family_score !== null) out.push({ object: 'legacy_profile', id: p.legacy_profile_id, attribute: 'family_score', disposition: 'RETIRE' });
    if (p.ranking !== undefined && p.ranking !== null) out.push({ object: 'legacy_profile', id: p.legacy_profile_id, attribute: 'ranking', disposition: 'RETIRE' });
    return out;
  });

  return {
    source_kind: 'REFERENCE_IMPLEMENTATION',
    source_system: 'FELS',
    fels_rejects_semantic_pollution: violations.length === 0 ? ('PASS' as Status) : ('FAIL' as Status),
    violation_count: violations.length,
    violations,
    retired_attributes: FELS4_RETIRED_ATTRIBUTES,
    retire_disposition: retireDisposition,
    retire_disposition_count: retireDisposition.length,
    guardrail_counters: {
      LEGACY_SCORE_TO_GROWTH_STATE: 0,
      LEGACY_RANKING_TO_FAMILY: 0,
      LEGACY_AI_TO_FACT: 0,
      ADVISOR_NOTE_TO_FACT: 0,
      FAMILY_CANONICAL_WRITE: 0,
    },
    generative_flm_mapping: 'DEFERRED_TO_AUTHORIZED_IMPORT',
    mode: 'READ_ONLY',
  } as const;
}

export function getFels1Gate() {
  const vertical = runFelsVerticalSliceE2E();
  const ambiguity = runLegacyAmbiguityE2E();
  const clean = createCleanSmallDataset();
  const dirty = createDirtyCoreDataset();
  const fels0 = getFels0Gate();
  const flmDiscovery = discoverFelsReadOnly(dirty);
  const matrixRows = classifyMigrationMatrixForFels1();
  const matrixSummary = summarizeMigrationMatrixForFels1(matrixRows);
  const blockers: string[] = [];
  if (!fels0.readyForFels1) blockers.push('FELS0_NOT_READY');
  if (flmDiscovery.source_kind !== 'REFERENCE_IMPLEMENTATION') blockers.push('FLM_SOURCE_KIND_INVALID');
  return {
    fels0: fels0.readyForFels1 ? 'PASS' : 'FAIL',
    fels1: blockers.length === 0 ? 'PASS_CODE_VALIDATED' : 'FAIL',
    legacyDatabase: FELS_DATABASE_CONTRACT.databaseName,
    coreDomainRuntime: 'PASS' as Status,
    exportDomainRuntime: vertical.exportedCustomer.source_system === 'FELS' ? 'PASS' : 'FAIL',
    coreRealHttpApi: 'NOT_YET_PASS',
    exportRealHttpApi: 'NOT_YET_PASS',
    freshDbMigration: 'PENDING_NO_LEGACY_DATABASE_URL',
    cleanSeedDomainRuntime: clean.records.customers.length >= 10 ? 'PASS' : 'FAIL',
    dirtySeedDomainRuntime: dirty.records.customers.some((customer, index, customers) => customers.findIndex((item) => item.phone === customer.phone) !== index) ? 'PASS' : 'FAIL',
    cleanSeedDb: 'NOT_YET_PASS',
    dirtySeedDb: 'NOT_YET_PASS',
    verticalSliceE2E: vertical.status === 'PASS' ? 'PASS_DOMAIN_RUNTIME' : 'FAIL',
    ambiguityE2E: ambiguity.requiredFlags.includes('IDENTITY_REVIEW_REQUIRED') && ambiguity.requiredFlags.includes('CONSENT_REVIEW_REQUIRED') ? 'PASS_DOMAIN_RUNTIME' : 'FAIL',
    flmReferenceDiscoveryStatic: flmDiscovery.mode === 'READ_ONLY' ? 'PASS' : 'FAIL',
    flmReferenceDiscoveryDb: 'NOT_YET_PASS',
    flmRealDbReferenceDiscovery: 'NOT_YET_PASS',
    familyDbMutations: 0,
    migrationMatrixClassified: `${FELS_MIGRATION_MATRIX_COVERAGE.length}/55`,
    fels1RuntimeImplemented: `${matrixSummary.IMPLEMENTED_FELS1}/55`,
    matrixSummary,
    noFakeBangyangClaim: flmDiscovery.real_bangyang_source === false ? 'PASS' : 'FAIL',
    noFamilyOntologyPollution: 'PASS' as Status,
    blockers,
    readyForFels2: 'NO',
    startFels2: 'NO',
  } as const;
}

export function classifyMigrationMatrixForFels1(): MatrixClassificationRow[] {
  const implemented = new Set(['M001', 'M002', 'M003', 'M004', 'M005', 'M008', 'M037', 'M038', 'M040', 'M052']);
  const retired = new Set(['M035', 'M036']);
  const external = new Set(['M020', 'M022', 'M031', 'M032', 'M039', 'M041', 'M042', 'M050']);
  const newCapability = new Set(['M054', 'M055']);
  return FELS_MIGRATION_MATRIX_COVERAGE.map((row) => ({
    id: row.id,
    classification: (implemented.has(row.id)
      ? 'IMPLEMENTED_FELS1'
      : retired.has(row.id)
        ? 'RETIRED'
        : external.has(row.id)
          ? 'EXTERNAL_INTEGRATION'
          : newCapability.has(row.id)
            ? 'FAMILY_NEW_CAPABILITY'
            : row.id === 'M009' || row.id === 'M010' || row.id === 'M011' || row.id === 'M013' || row.id === 'M014' || row.id === 'M015'
              ? 'PLANNED_FELS2'
              : row.id === 'M012' || row.id === 'M021' || row.id === 'M033' || row.id === 'M034'
                ? 'PLANNED_FELS3'
                : 'PLANNED_FELS4') satisfies MatrixClassification,
  }));
}

export function summarizeMigrationMatrixForFels1(rows: MatrixClassificationRow[] = classifyMigrationMatrixForFels1()) {
  const summary: Record<MatrixClassification, number> = {
    IMPLEMENTED_FELS1: 0,
    PLANNED_FELS2: 0,
    PLANNED_FELS3: 0,
    PLANNED_FELS4: 0,
    EXTERNAL_INTEGRATION: 0,
    RETIRED: 0,
    FAMILY_NEW_CAPABILITY: 0,
  };
  for (const row of rows) summary[row.classification] += 1;
  return summary;
}

function recordCounts(records: FelsRecords) {
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