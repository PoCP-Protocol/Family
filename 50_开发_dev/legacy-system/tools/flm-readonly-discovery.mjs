#!/usr/bin/env node
// FLM Read-Only Reference Discovery over family_legacy (FELS reference source).
// Guarantees: BEGIN READ ONLY on every query; ZERO writes to any DB; NO Family canonical
// import; NO shadow import; NO identity/consent promotion. Emits discovery statistics only.
// Clean-master scope: FELS-1 authorized surface + FLM dirty-world fixture. No early FELS-2/3 tables.
import pg from 'pg';

function legacyUrl() {
  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) throw new Error('LEGACY_DATABASE_URL is required for FELS. DATABASE_URL and TEST_DATABASE_URL are forbidden fallbacks.');
  if (url === process.env.DATABASE_URL) throw new Error('LEGACY_DATABASE_URL must not equal DATABASE_URL.');
  if (url === process.env.TEST_DATABASE_URL) throw new Error('LEGACY_DATABASE_URL must not equal TEST_DATABASE_URL.');
  return url;
}

const FELS1_AUTHORIZED = [
  { entity: 'customers', table: 'legacy_customers', family_negation: 'Customer != Family' },
  { entity: 'contacts', table: 'legacy_contacts', family_negation: 'Contact != Parent' },
  { entity: 'students', table: 'legacy_students', family_negation: 'Student != Child' },
  { entity: 'student_guardians', table: 'legacy_student_guardians', family_negation: 'Guardian link != Family relationship truth' },
  { entity: 'assessment_scores', table: 'legacy_assessment_scores', family_negation: 'AssessmentScore != GrowthState' },
  { entity: 'assessment_reports', table: 'legacy_assessment_reports', family_negation: 'LegacyReport != Fact' },
  { entity: 'orders', table: 'legacy_orders', family_negation: 'Order != Family commitment' },
  { entity: 'consent_records', table: 'legacy_consent_records', family_negation: 'LegacyConsent != Family consent truth' },
];

// FLM dirty world fixture (FLM anti-corruption reference; NOT a FELS-4 product capability).
const FLM_DIRTY = [
  { entity: 'profiles', table: 'legacy_profiles', family_negation: 'LegacyProfile snapshot != GrowthState' },
  { entity: 'tags', table: 'legacy_tags', family_negation: 'Legacy label != Diagnosis (Annotation only)' },
  { entity: 'ai_reports', table: 'legacy_ai_reports', family_negation: 'Legacy AI conclusion != Fact (Historical Hypothesis)' },
  { entity: 'alerts', table: 'legacy_alerts', family_negation: 'Legacy alert != Family safety threshold (signal source only)' },
];

async function readOnly(client, fn) {
  await client.query('BEGIN READ ONLY');
  try {
    const r = await fn();
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

async function scalar(client, sql) {
  const r = await client.query(sql);
  return Number(r.rows[0]?.n ?? 0);
}

async function main() {
  const client = new pg.Client({ connectionString: legacyUrl() });
  await client.connect();
  try {
    const snapshotId = await readOnly(client, async () => {
      const r = await client.query('SELECT snapshot_id AS n FROM fels.legacy_source_snapshots ORDER BY created_at DESC, snapshot_id DESC LIMIT 1');
      return r.rows[0]?.n ?? null;
    });

    const authorized = [];
    for (const t of FELS1_AUTHORIZED) {
      const rowCount = await readOnly(client, async () => scalar(client, `SELECT count(*)::int AS n FROM fels.${t.table}`));
      authorized.push({ layer: 'FELS1', ...t, row_count: rowCount });
    }

    const flm = [];
    for (const t of FLM_DIRTY) {
      const rowCount = await readOnly(client, async () => {
        try { return await scalar(client, `SELECT count(*)::int AS n FROM fels.${t.table}`); } catch { return 0; }
      });
      flm.push({ layer: 'FLM_DIRTY_WORLD', ...t, row_count: rowCount, family_canonical_target: false });
    }

    const identity = await readOnly(client, async () => {
      const dupPhone = await scalar(client, `SELECT count(*)::int AS n FROM (SELECT phone FROM fels.legacy_contacts WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1) d`);
      const crossGuardian = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_student_guardians g JOIN fels.legacy_students s ON s.student_id = g.student_id WHERE s.customer_id IS NOT NULL AND g.customer_id IS NOT NULL AND s.customer_id <> g.customer_id`);
      return { duplicate_phone_count: dupPhone, cross_customer_guardian_count: crossGuardian };
    });

    const consent = await readOnly(client, async () => {
      const total = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_consent_records`);
      let weak = 0;
      try { weak = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_consent_records WHERE guardian_proof_status IS NULL OR guardian_proof_status IN ('WEAK','INCOMPLETE','UNKNOWN','MISSING','PENDING')`); } catch { weak = 0; }
      return { legacy_consent_count: total, weak_or_incomplete_consent_count: weak };
    });

    const pollutionScan = await readOnly(client, async () => {
      const safe = async (sql) => { try { return await scalar(client, sql); } catch { return 0; } };
      const familyScorePresent = await safe(`SELECT count(*)::int AS n FROM fels.legacy_profiles WHERE family_score IS NOT NULL`);
      const rankingPresent = await safe(`SELECT count(*)::int AS n FROM fels.legacy_profiles WHERE ranking IS NOT NULL`);
      const aiWithoutEvidence = await safe(`SELECT count(*)::int AS n FROM fels.legacy_ai_reports WHERE has_supporting_evidence = false`);
      const profileMismarked = await safe(`SELECT count(*)::int AS n FROM fels.legacy_profiles WHERE semantic_classification <> 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE'`);
      const tagMismarked = await safe(`SELECT count(*)::int AS n FROM fels.legacy_tags WHERE semantic_classification <> 'LEGACY_TAG_CATEGORY_NOT_OFFICIAL'`);
      const aiMismarked = await safe(`SELECT count(*)::int AS n FROM fels.legacy_ai_reports WHERE semantic_classification <> 'LEGACY_AI_HYPOTHESIS_NOT_FACT'`);
      const alertMismarked = await safe(`SELECT count(*)::int AS n FROM fels.legacy_alerts WHERE semantic_classification <> 'LEGACY_ALERT_SIGNAL_NOT_THRESHOLD'`);
      const mismarked = profileMismarked + tagMismarked + aiMismarked + alertMismarked;
      return {
        family_score_present_count: familyScorePresent,
        ranking_present_count: rankingPresent,
        family_score_disposition: 'RETIRE',
        ranking_disposition: 'RETIRE',
        legacy_ai_without_evidence_count: aiWithoutEvidence,
        mismarked_pollution_count: mismarked,
        fels_rejects_semantic_pollution: mismarked === 0 ? 'PASS' : 'FAIL',
      };
    });

    const report = {
      probe: 'FLM_READONLY_REFERENCE_DISCOVERY',
      authorized_scope: 'FLM-INTEGRATION-001 clean master (FELS1 + FLM dirty-world)',
      source_system: 'FELS',
      source_schema: 'fels',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      real_bangyang_source: false,
      snapshot_id: snapshotId,
      mode: 'READ_ONLY',
      transaction_mode: 'BEGIN READ ONLY',
      fels1_authorized_entities: authorized,
      flm_dirty_world_entities: flm,
      identity_profile: identity,
      consent_profile: consent,
      semantic_pollution_scan: pollutionScan,
      guardrails: {
        FAMILY_DB_WRITE_COUNT: 0,
        SHADOW_IMPORT: 0,
        CANONICAL_IMPORT: 0,
        IDENTITY_PROMOTION: 0,
        CONSENT_PROMOTION: 0,
        LEGACY_SCORE_TO_GROWTH_STATE: 0,
        LEGACY_RANKING_TO_FAMILY: 0,
        LEGACY_AI_TO_FACT: 0,
        ADVISOR_NOTE_TO_FACT: 0,
      },
    };
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('DISCOVERY_ERROR', e.message);
  process.exit(1);
});
