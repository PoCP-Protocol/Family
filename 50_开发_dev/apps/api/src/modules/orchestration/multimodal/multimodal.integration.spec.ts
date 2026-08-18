import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { cleanFamilyCoreTables, createTestPool } from '../../../test/test-database';

describe('Multimodal + Tenant PostgreSQL foundation', () => {
  let pool: pg.Pool;
  let tenantId: string;
  let accountId: string;
  let familyId: string;

  beforeAll(() => {
    pool = createTestPool();
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
    const tenant = await pool.query(`insert into tenants(tenant_ref, display_name, tenant_type) values ('tenant-mm-fixture', '多模态测试租户', 'INTERNAL_SANDBOX') returning tenant_id`);
    tenantId = tenant.rows[0].tenant_id;
    const account = await pool.query(`insert into accounts(external_ref) values ('mm-account-fixture') returning account_id`);
    accountId = account.rows[0].account_id;
    const family = await pool.query(`insert into families(display_name) values ('多模态测试家庭') returning family_id`);
    familyId = family.rows[0].family_id;
    await pool.query(`insert into tenant_account_memberships(tenant_id, account_id, role, status) values ($1,$2,'TENANT_OWNER','ACTIVE')`, [tenantId, accountId]);
    await pool.query(`insert into tenant_family_bindings(tenant_id, family_id, status) values ($1,$2,'ACTIVE')`, [tenantId, familyId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('persists the tenant-scoped multimodal consent-to-artifact chain without raw output', async () => {
    await pool.query(`insert into multimodal_capability_profiles(capability_ref, version, modality, status) values ('fixture-ocr', 1, 'OCR', 'ACTIVE')`);
    await pool.query(`insert into multimodal_processing_policies(policy_ref, version, purpose, required_consent_purpose, retention_seconds, status) values ('fixture-material', 1, 'MATERIAL_STRUCTURE_ASSIST', 'MATERIAL_STRUCTURE_ASSIST', 86400, 'ACTIVE')`);
    await pool.query(`insert into multimodal_output_schemas(schema_ref, version, validator_ref, status) values ('fixture-derived', 1, 'fixture-validator', 'ACTIVE')`);
    const consent = await pool.query(`insert into multimodal_consents(tenant_id, family_id, purpose, granted_by_account_id, policy_ref, policy_version) values ($1,$2,'MATERIAL_STRUCTURE_ASSIST',$3,'fixture-material',1) returning multimodal_consent_id`, [tenantId, familyId, accountId]);
    const asset = await pool.query(`insert into multimodal_assets(tenant_id, family_id, created_by_account_id, source_kind, media_type, content_hash, size_bytes, storage_ref, purpose, multimodal_consent_id, retention_until) values ($1,$2,$3,'SYNTHETIC_FIXTURE','text/plain','hash-mm-001',12,'fixture://mm-001','MATERIAL_STRUCTURE_ASSIST',$4,now()+interval '1 day') returning multimodal_asset_id`, [tenantId, familyId, accountId, consent.rows[0].multimodal_consent_id]);
    const run = await pool.query(`insert into multimodal_processing_runs(tenant_id, family_id, multimodal_asset_id, capability_ref, capability_version, policy_ref, policy_version, output_schema_ref, request_hash, status) values ($1,$2,$3,'fixture-ocr',1,'fixture-material',1,'fixture-derived','request-mm-001','SUCCEEDED') returning processing_run_id`, [tenantId, familyId, asset.rows[0].multimodal_asset_id]);
    const artifact = await pool.query(`insert into multimodal_derived_artifacts(tenant_id, family_id, processing_run_id, asset_id, artifact_kind, artifact_schema_ref, payload_hash, expires_at) values ($1,$2,$3,$4,'TEXT_DRAFT','fixture-derived','payload-hash-001',now()+interval '1 day') returning derived_artifact_id`, [tenantId, familyId, run.rows[0].processing_run_id, asset.rows[0].multimodal_asset_id]);
    await pool.query(`insert into multimodal_audit_events(tenant_id, family_id, processing_run_id, decision, state_upper_bound, correlation_id, input_hash) values ($1,$2,$3,'ALLOW','DERIVED_DRAFT_PRIVATE','corr-mm-001','hash-mm-001')`, [tenantId, familyId, run.rows[0].processing_run_id]);

    const result = await pool.query(`select a.tenant_id, a.family_id, r.status, d.state_upper_bound, e.decision from multimodal_assets a join multimodal_processing_runs r on r.multimodal_asset_id=a.multimodal_asset_id join multimodal_derived_artifacts d on d.processing_run_id=r.processing_run_id join multimodal_audit_events e on e.processing_run_id=r.processing_run_id where a.tenant_id=$1 and a.family_id=$2`, [tenantId, familyId]);
    expect(result.rows).toEqual([{ tenant_id: tenantId, family_id: familyId, status: 'SUCCEEDED', state_upper_bound: 'DERIVED_DRAFT_PRIVATE', decision: 'ALLOW' }]);
  });

  it('rejects a second active tenant binding for the same family', async () => {
    const secondTenant = await pool.query(`insert into tenants(tenant_ref, display_name, tenant_type) values ('tenant-mm-fixture-2', '第二租户', 'INTERNAL_SANDBOX') returning tenant_id`);
    await expect(pool.query(`insert into tenant_family_bindings(tenant_id, family_id, status) values ($1,$2,'ACTIVE')`, [secondTenant.rows[0].tenant_id, familyId])).rejects.toThrow();
  });

  it('keeps withdrawn consent visible as a stop condition rather than deleting audit history', async () => {
    const consent = await pool.query(`insert into multimodal_consents(tenant_id, family_id, purpose, granted_by_account_id, policy_ref, policy_version, status, withdrawn_at) values ($1,$2,'GUARDIAN_VOICE_TO_TEXT',$3,'fixture-voice',1,'WITHDRAWN',now()) returning multimodal_consent_id`, [tenantId, familyId, accountId]);
    const result = await pool.query(`select status, withdrawn_at from multimodal_consents where multimodal_consent_id=$1`, [consent.rows[0].multimodal_consent_id]);
    expect(result.rows[0].status).toBe('WITHDRAWN');
    expect(result.rows[0].withdrawn_at).not.toBeNull();
  });
});
