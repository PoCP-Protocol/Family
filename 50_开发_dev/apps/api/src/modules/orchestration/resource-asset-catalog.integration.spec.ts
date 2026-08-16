import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { OrchestrationRepository } from './orchestration.repository';
import { OrchestrationService } from './orchestration.service';
import { VERTICAL_POLICY_VERSION } from './orchestration.types';

describe('FAMILY_RESOURCE_ASSET_CATALOG_001 real PostgreSQL integration', () => {
  let pool: pg.Pool;
  let repository: OrchestrationRepository;
  let service: OrchestrationService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new OrchestrationRepository();
    service = new OrchestrationService(repository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
    await seedApprovedBangyangPractice();
  });

  afterAll(async () => {
    await repository.onModuleDestroy();
    await pool.end();
  });

  it('includes an ADMITTED Bangyang Practice only after Family SERVICE consent and capability mapping', async () => {
    const seed = await seedFamilyWithServiceConsent('catalog-admitted');
    const intent = await service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '我们想用一次已经审核的家庭沟通练习。',
      goalText: '今晚在不强迫孩子表达的前提下重新开启沟通。',
      idempotencyKey: 'catalog-intent-001',
    }, auditFor(seed.meta));

    const recommendation = await service.requestRecommendation({
      familyId: seed.familyId,
      growthIntentId: intent.growth_intent_id,
      idempotencyKey: 'catalog-recommendation-001',
    }, auditFor(seed.meta));

    expect(recommendation.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ resource_code: 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE', resource_type: 'PRACTICE' }),
    ]));

    const catalog = await pool.query(
      `select a.asset_code, v.version_label, v.primary_evidence_source_class, ad.status, o.resource_code, o.resource_asset_version_id
       from resource_assets a
       join resource_asset_versions v on v.resource_asset_id=a.resource_asset_id
       join resource_asset_admissions ad on ad.resource_asset_version_id=v.resource_asset_version_id
       join resource_offers o on o.resource_asset_version_id=v.resource_asset_version_id
       where a.asset_code='BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE'`,
    );
    expect(catalog.rows).toEqual([expect.objectContaining({
      asset_code: 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE',
      version_label: '2026.08-v1',
      status: 'ADMITTED',
      primary_evidence_source_class: 'FIRST_PARTY_MATERIAL',
      resource_code: 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE',
    })]);
  });

  it('rejects first-party effectiveness self-proof and pending copyright at the admission gate', async () => {
    const version = await pool.query<{ resource_asset_version_id: string }>(
      `select v.resource_asset_version_id from resource_asset_versions v join resource_assets a on a.resource_asset_id=v.resource_asset_id
       where a.asset_code='BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE' and v.version_label='2026.08-v1'`,
    );
    const versionId = version.rows[0].resource_asset_version_id;
    await expect(pool.query(
      `insert into resource_asset_evidence(resource_asset_version_id,evidence_source_class,claim_scope,source_title,source_locator,supports_effectiveness,evidence_summary)
       values ($1,'FIRST_PARTY_MATERIAL','EFFECTIVENESS_CLAIM','内部效果判断','bangyang://invalid-effect',true,'不得以自家材料自证效果。')`, [versionId],
    )).rejects.toThrow('first_party_cannot_self_prove_effectiveness');

    await pool.query(`update resource_asset_admissions set status='SUSPENDED',suspended_at=now() where resource_asset_version_id=$1`, [versionId]);
    await pool.query(`update resource_assets set copyright_status='PENDING_REVIEW' where asset_code='BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE'`);
    await expect(pool.query(
      `update resource_asset_admissions set status='ADMITTED',admitted_at=now() where resource_asset_version_id=$1`, [versionId],
    )).rejects.toThrow('admitted_asset_requires_owned_or_licensed_copyright');
  });

  it('fails closed if an otherwise admitted asset is reclassified as unverified or inferred', async () => {
    const seed = await seedFamilyWithServiceConsent('catalog-unverified');
    await pool.query(
      `update resource_asset_versions set primary_evidence_source_class='UNVERIFIED_OR_INFERRED'
       where resource_asset_version_id=(
         select v.resource_asset_version_id from resource_asset_versions v
         join resource_assets a on a.resource_asset_id=v.resource_asset_id
         where a.asset_code='BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE' and v.version_label='2026.08-v1'
       )`,
    );
    const intent = await service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '未经核验来源不能继续成为候选。',
      goalText: '家庭需要安全边界。',
      idempotencyKey: 'catalog-unverified-intent-001',
    }, auditFor(seed.meta));
    await expect(service.requestRecommendation({
      familyId: seed.familyId,
      growthIntentId: intent.growth_intent_id,
      idempotencyKey: 'catalog-unverified-recommendation-001',
    }, auditFor(seed.meta))).rejects.toThrow('no_eligible_resource_offer');
    const writes = await pool.query(`select count(*)::int as count from resource_recommendations where family_id=$1`, [seed.familyId]);
    expect(writes.rows[0].count).toBe(0);
  });

  it('fails closed when the linked asset version is SUSPENDED without mutating the family intent', async () => {
    const seed = await seedFamilyWithServiceConsent('catalog-suspended');
    await pool.query(
      `update resource_asset_admissions set status='SUSPENDED', suspended_at=now()
       where resource_asset_version_id=(
         select v.resource_asset_version_id from resource_asset_versions v
         join resource_assets a on a.resource_asset_id=v.resource_asset_id
         where a.asset_code='BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE' and v.version_label='2026.08-v1'
       )`,
    );
    const intent = await service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '已暂停的内容不应进入候选。',
      goalText: '保留家庭未来选择。',
      idempotencyKey: 'catalog-suspended-intent-001',
    }, auditFor(seed.meta));

    await expect(service.requestRecommendation({
      familyId: seed.familyId,
      growthIntentId: intent.growth_intent_id,
      idempotencyKey: 'catalog-suspended-recommendation-001',
    }, auditFor(seed.meta))).rejects.toThrow('no_eligible_resource_offer');

    const writes = await pool.query(
      `select
         (select count(*)::int from resource_recommendations where family_id=$1) as recommendations,
         (select count(*)::int from service_cases where family_id=$1) as cases`,
      [seed.familyId],
    );
    expect(writes.rows[0]).toMatchObject({ recommendations: 0, cases: 0 });
  });

  function auditFor(meta: { actor: string; correlationId: string; source: string; occurredAt: string }) {
    return { actorId: meta.actor, correlationId: meta.correlationId, source: meta.source, occurredAt: meta.occurredAt };
  }

  async function seedApprovedBangyangPractice(): Promise<void> {
    const asset = await pool.query<{ resource_asset_id: string }>(
      `insert into resource_assets(asset_code,origin,asset_kind,title,summary,source_attribution,copyright_status)
       values ('BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE','BANGYANG_EDUCATION','PRACTICE_TEMPLATE','亲子沟通：稳定、倾听与重新开启对话','低风险、可暂停的沟通练习。','榜样教育内部资产目录','OWNED')
       on conflict (asset_code) do update set updated_at=now()
       returning resource_asset_id`,
    );
    const version = await pool.query<{ resource_asset_version_id: string }>(
      `insert into resource_asset_versions(resource_asset_id,version_label,source_locator,content_checksum,age_scope,age_min_months,age_max_months,life_stage_scope,evidence_level,primary_evidence_source_class,risk_boundary,privacy_boundary,version_notes)
       values ($1,'2026.08-v1','bangyang://practice/stabilize-reopen-dialogue/2026.08-v1','bangyang-practice-stabilize-reopen-dialogue-2026-08-v1','EARLY_ADOLESCENCE_CONTEXTUAL',144,191,array['EARLY_ADOLESCENCE_12_15'],'E0_FIRST_PARTY_PROVENANCE_ONLY','FIRST_PARTY_MATERIAL','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','仅内部确定性验证；不作为效果证明')
       on conflict (resource_asset_id,version_label) do update set version_notes=excluded.version_notes
       returning resource_asset_version_id`,
      [asset.rows[0].resource_asset_id],
    );
    await pool.query(
      `insert into resource_asset_evidence(resource_asset_version_id,evidence_source_class,claim_scope,source_title,source_locator,source_publisher,supports_effectiveness,evidence_summary,limitations,reviewed_at)
       values ($1,'FIRST_PARTY_MATERIAL','PROVENANCE_ONLY','榜样教育练习资产归属与版本记录','bangyang://practice/stabilize-reopen-dialogue/2026.08-v1','榜样教育',false,'只证明来源、版权与内容归属。','不证明教育效果、儿童成长结果或因果关系。',now())
       on conflict do nothing`,
      [version.rows[0].resource_asset_version_id],
    );
    await pool.query(
      `insert into resource_asset_admissions(resource_asset_version_id,status,policy_version,safety_review_note,admission_rationale,admitted_at)
       values ($1,'ADMITTED','FAMILY_RESOURCE_ASSET_CATALOG_001','低风险、非临床、无儿童个人数据。','作为首条纵切 Practice 引用。',now())
       on conflict (resource_asset_version_id) do update set status='ADMITTED',suspended_at=null,retired_at=null,admitted_at=coalesce(resource_asset_admissions.admitted_at,now()),updated_at=now()`,
      [version.rows[0].resource_asset_version_id],
    );
    const capability = await pool.query<{ growth_capability_id: string }>(
      `insert into growth_capabilities(capability_code,display_name,description,need_type,policy_version)
       values ('DE_ESCALATION','降温与重新开启对话','低风险沟通能力。','PARENT_CHILD_COMMUNICATION_CONFLICT',$1)
       on conflict (capability_code) do update set updated_at=now()
       returning growth_capability_id`,
      [VERTICAL_POLICY_VERSION],
    );
    const offer = await pool.query<{ resource_offer_id: string }>(
      `insert into resource_offers(resource_code,resource_type,title,description,age_scope,age_min_months,age_max_months,life_stage_scope,need_type,evidence_level,risk_boundary,privacy_boundary,effort_class,duration_class,cost_class,requires_consent,content_ref,provider_qualification,availability_status,policy_version,resource_asset_version_id)
       values ('BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE','PRACTICE','一次亲子沟通重新开启练习','已审核的榜样教育低风险 Practice。','EARLY_ADOLESCENCE_CONTEXTUAL',144,191,array['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_INTERNAL_CURATED','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','MOMENT','FREE',true,'bangyang://practice/stabilize-reopen-dialogue/2026.08-v1','INTERNAL_DETERMINISTIC','ACTIVE',$1,$2)
       on conflict (resource_code) do update set availability_status='ACTIVE',resource_asset_version_id=excluded.resource_asset_version_id,content_ref=excluded.content_ref,updated_at=now()
       returning resource_offer_id`,
      [VERTICAL_POLICY_VERSION, version.rows[0].resource_asset_version_id],
    );
    await pool.query(`insert into resource_offer_capabilities(resource_offer_id,growth_capability_id) values ($1,$2) on conflict do nothing`, [offer.rows[0].resource_offer_id, capability.rows[0].growth_capability_id]);
  }

  async function seedFamilyWithServiceConsent(suffix: string) {
    const trusted = await seedTrustedFamilyGuardian(pool, `resource-catalog-${suffix}`, { displayName: '资源目录家庭', guardianName: '监护人', parentRole: 'GUARDIAN' });
    const child = await pool.query<{ person_id: string }>(
      `insert into persons(family_id,person_type,display_name,birth_date) values ($1,'CHILD','孩子','2012-08-16') returning person_id`,
      [trusted.familyId],
    );
    await pool.query(`insert into family_memberships(family_id,person_id,role,status,joined_at) values ($1,$2,'CHILD_SUBJECT','ACTIVE',now())`, [trusted.familyId, child.rows[0].person_id]);
    await pool.query(
      `insert into consents(family_id,subject_person_id,guardian_person_id,purpose,status,policy_version,granted_at)
       values ($1,$2,$3,'SERVICE','GRANTED',$4,now())`,
      [trusted.familyId, child.rows[0].person_id, trusted.guardianId, VERTICAL_POLICY_VERSION],
    );
    return { familyId: trusted.familyId, childId: child.rows[0].person_id, meta: trusted.meta };
  }
});
