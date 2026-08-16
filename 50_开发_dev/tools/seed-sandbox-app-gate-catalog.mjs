import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString || !connectionString.includes('family_test')) {
  throw new Error('sandbox catalog seed is restricted to the isolated family_test database');
}

const policyVersion = 'FAMILY_RESOURCE_ASSET_CATALOG_001';
const pool = new pg.Pool({ connectionString });

try {
  const asset = await pool.query(
    `insert into resource_assets(asset_code,origin,asset_kind,title,summary,source_attribution,copyright_status)
     values ('BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE','BANGYANG_EDUCATION','PRACTICE_TEMPLATE','亲子沟通：稳定、倾听与重新开启对话','低风险、可暂停的沟通练习。','榜样教育内部资产目录；仅沙箱验证','OWNED')
     on conflict (asset_code) do update set updated_at=now()
     returning resource_asset_id`,
  );
  const version = await pool.query(
    `insert into resource_asset_versions(resource_asset_id,version_label,source_locator,content_checksum,age_scope,age_min_months,age_max_months,life_stage_scope,evidence_level,primary_evidence_source_class,risk_boundary,privacy_boundary,version_notes)
     values ($1,'2026.08-v1','bangyang://practice/stabilize-reopen-dialogue/2026.08-v1','bangyang-practice-stabilize-reopen-dialogue-2026-08-v1','EARLY_ADOLESCENCE_CONTEXTUAL',144,191,array['EARLY_ADOLESCENCE_12_15'],'E0_FIRST_PARTY_PROVENANCE_ONLY','FIRST_PARTY_MATERIAL','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','仅用于内部确定性浏览器验证；不作为效果证明。')
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
     values ($1,'ADMITTED',$2,'低风险、非临床、无儿童个人数据。','作为首条纵切 Practice 引用；仅沙箱验证。',now())
     on conflict (resource_asset_version_id) do update set status='ADMITTED',suspended_at=null,retired_at=null,admitted_at=coalesce(resource_asset_admissions.admitted_at,now()),updated_at=now()`,
    [version.rows[0].resource_asset_version_id, policyVersion],
  );
  const capability = await pool.query(
    `insert into growth_capabilities(capability_code,display_name,description,need_type,policy_version)
     values ('DE_ESCALATION','降温与重新开启对话','低风险沟通能力。','PARENT_CHILD_COMMUNICATION_CONFLICT',$1)
     on conflict (capability_code) do update set updated_at=now()
     returning growth_capability_id`,
    [policyVersion],
  );
  const offer = await pool.query(
    `insert into resource_offers(resource_code,resource_type,title,description,age_scope,age_min_months,age_max_months,life_stage_scope,need_type,evidence_level,risk_boundary,privacy_boundary,effort_class,duration_class,cost_class,requires_consent,content_ref,provider_qualification,availability_status,policy_version,resource_asset_version_id)
     values ('BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE','PRACTICE','一次亲子沟通重新开启练习','已审核的榜样教育低风险 Practice。','EARLY_ADOLESCENCE_CONTEXTUAL',144,191,array['EARLY_ADOLESCENCE_12_15'],'PARENT_CHILD_COMMUNICATION_CONFLICT','E0_FIRST_PARTY_PROVENANCE_ONLY','LOW_RISK_NON_CLINICAL','FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE','LOW','MOMENT','FREE',true,'bangyang://practice/stabilize-reopen-dialogue/2026.08-v1','INTERNAL_DETERMINISTIC','ACTIVE',$1,$2)
     on conflict (resource_code) do update set availability_status='ACTIVE',resource_asset_version_id=excluded.resource_asset_version_id,content_ref=excluded.content_ref,updated_at=now()
     returning resource_offer_id`,
    [policyVersion, version.rows[0].resource_asset_version_id],
  );
  await pool.query(
    `insert into resource_offer_capabilities(resource_offer_id,growth_capability_id) values ($1,$2) on conflict do nothing`,
    [offer.rows[0].resource_offer_id, capability.rows[0].growth_capability_id],
  );
  console.log('sandbox_app_gate_catalog_seeded');
} finally {
  await pool.end();
}
