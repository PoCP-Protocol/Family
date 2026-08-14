import {
  Fels1Runtime,
  classifyMigrationMatrixForFels1,
  createCleanSmallDataset,
  createDirtyCoreDataset,
  createLegacySourceSnapshot,
  discoverFelsReadOnly,
  felsApiBoundary,
  getFels1Gate,
  getFelsHealth,
  runFelsVerticalSliceE2E,
  runLegacyAmbiguityE2E,
  summarizeMigrationMatrixForFels1,
} from './main';

describe('FELS API executable foundation', () => {
  it('exposes FELS truth without claiming real Bangyang source', () => {
    expect(getFelsHealth()).toMatchObject({
      status: 'ok',
      service: 'fels-api',
      referenceImplementation: true,
      realBangyangSource: false,
      domains: 12,
    });
  });

  it('uses the independent legacy database contract', () => {
    expect(felsApiBoundary.database.databaseName).toBe('family_legacy');
    expect(felsApiBoundary.database.urlEnvironmentVariable).toBe('LEGACY_DATABASE_URL');
    expect(felsApiBoundary.database.forbiddenSilentFallback).toBe('DATABASE_URL');
  });

  it('provides a source snapshot contract for future FLM batches', () => {
    const snapshot = createLegacySourceSnapshot();
    expect(snapshot.source_system).toBe('FELS');
    expect(snapshot.source_schema_version).toBe('fels-ref-0004');
    expect(snapshot.record_counts.customer).toBe(0);
    expect(snapshot.record_counts.legacy_ai_report).toBe(0);
  });
});

describe('FELS-1 core education business', () => {
  it('runs the customer to export vertical slice without Family database writes', () => {
    const result = runFelsVerticalSliceE2E();
    expect(result.status).toBe('PASS');
    expect(result.customer.customer_id).toMatch(/^cus_/);
    expect(result.report.semantic_classification).toBe('LEGACY_DERIVED');
    expect(result.enrollment.semantic_classification).toBe('COURSE_STATUS_NOT_OUTCOME');
    expect(result.exportedCustomer.source_system).toBe('FELS');
    expect(result.exportedCustomer.source_kind).toBe('REFERENCE_IMPLEMENTATION');
    expect(result.familyDbWriteCount).toBe(0);
  });

  it('supports CRUD-like core paths and legacy export pagination', () => {
    const runtime = new Fels1Runtime();
    const customer = runtime.createCustomer({ display_name: 'Pagination Customer', phone: '13500000001' });
    runtime.createCustomer({ display_name: 'Pagination Customer 2', phone: '13500000002' });
    const contact = runtime.addContact(customer.customer_id, { name: '妈妈', relationship_text: '妈妈', is_primary_contact: true });
    const student = runtime.createStudent({ customer_id: customer.customer_id, name: 'Student P' });
    const guardian = runtime.addGuardian(student.student_id, { customer_id: customer.customer_id, contact_id: contact.contact_id, proof_status: 'VERIFIED', is_primary: true });
    const page = runtime.exportEntity('customers', 'legacy_customers', { limit: 1 });
    expect(runtime.getCustomer(customer.customer_id)?.display_name).toBe('Pagination Customer');
    expect(runtime.getStudent(student.student_id)?.semantic_classification).toBe('CHILD_CANDIDATE');
    expect(guardian.semantic_classification).toBe('LEGACY_GUARDIAN_EVIDENCE');
    expect(page.items).toHaveLength(1);
    expect(page.pagination.has_more).toBe(true);
    expect(page.pagination.cursor).toBe('1');
  });

  it('creates clean and dirty synthetic datasets inside the FELS boundary', () => {
    const clean = createCleanSmallDataset();
    const dirty = createDirtyCoreDataset();
    expect(clean.records.customers.length).toBeGreaterThanOrEqual(10);
    expect(clean.records.assessments.length).toBeGreaterThanOrEqual(12);
    expect(dirty.records.customers.filter((customer) => customer.phone === '13800000001')).toHaveLength(2);
    expect(dirty.records.legacyConsents.some((consent) => !consent.purpose_text && !consent.agreement_version)).toBe(true);
  });

  it('flags legacy ambiguity for FLM read-only discovery without creating canonical targets', () => {
    const result = runLegacyAmbiguityE2E();
    expect(result.status).toBe('PASS');
    expect(result.familyCreated).toBe(false);
    expect(result.requiredFlags).toContain('IDENTITY_REVIEW_REQUIRED');
    expect(result.requiredFlags).toContain('CONSENT_REVIEW_REQUIRED');
    expect(result.discovery.mode).toBe('READ_ONLY');
  });

  it('lets FLM discover FELS as a reference source, not real Bangyang production data', () => {
    const discovery = discoverFelsReadOnly(createDirtyCoreDataset());
    expect(discovery.source_kind).toBe('REFERENCE_IMPLEMENTATION');
    expect(discovery.source_system).toBe('FELS');
    expect(discovery.real_bangyang_source).toBe(false);
    expect(discovery.schema_inventory.legacy_customers).toBeGreaterThan(0);
  });

  it('preserves all M001-M055 rows with FELS-1 coverage classifications', () => {
    const rows = classifyMigrationMatrixForFels1();
    const summary = summarizeMigrationMatrixForFels1(rows);
    expect(rows).toHaveLength(55);
    expect(rows.every((row) => row.classification)).toBe(true);
    expect(rows.find((row) => row.id === 'M001')?.classification).toBe('IMPLEMENTED_FELS1');
    expect(rows.find((row) => row.id === 'M035')?.classification).toBe('RETIRED');
    expect(summary.IMPLEMENTED_FELS1).toBe(10);
    expect(Object.values(summary).reduce((total, count) => total + count, 0)).toBe(55);
  });

  it('reports FELS-1 as code-validated without overstating real system gates', () => {
    const gate = getFels1Gate();
    expect(gate.fels0).toBe('PASS');
    expect(gate.fels1).toBe('PASS_CODE_VALIDATED');
    expect(gate.legacyDatabase).toBe('family_legacy');
    expect(gate.coreDomainRuntime).toBe('PASS');
    expect(gate.exportDomainRuntime).toBe('PASS');
    expect(gate.coreRealHttpApi).toBe('NOT_YET_PASS');
    expect(gate.exportRealHttpApi).toBe('NOT_YET_PASS');
    expect(gate.freshDbMigration).toBe('PENDING_NO_LEGACY_DATABASE_URL');
    expect(gate.cleanSeedDomainRuntime).toBe('PASS');
    expect(gate.dirtySeedDomainRuntime).toBe('PASS');
    expect(gate.cleanSeedDb).toBe('NOT_YET_PASS');
    expect(gate.dirtySeedDb).toBe('NOT_YET_PASS');
    expect(gate.flmReferenceDiscoveryStatic).toBe('PASS');
    expect(gate.flmReferenceDiscoveryDb).toBe('NOT_YET_PASS');
    expect(gate.familyDbMutations).toBe(0);
    expect(gate.migrationMatrixClassified).toBe('55/55');
    expect(gate.fels1RuntimeImplemented).toBe('10/55');
    expect(gate.blockers).toHaveLength(0);
    expect(gate.readyForFels2).toBe('NO');
  });
});