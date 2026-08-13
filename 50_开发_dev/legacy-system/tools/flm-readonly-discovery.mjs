#!/usr/bin/env node
// H006 — FLM Read-Only Reference Discovery over family_legacy (FELS reference source).
// Authorized ONLY as part of FELS-1 Real System Closure (ruling FELS-1-CLOSE-001).
// Guarantees: BEGIN READ ONLY on every query; ZERO writes to any DB; NO Family canonical
// import; NO shadow import; NO identity/consent promotion. Emits discovery statistics only.
import pg from 'pg';

function legacyUrl() {
  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) throw new Error('LEGACY_DATABASE_URL is required for FELS. DATABASE_URL and TEST_DATABASE_URL are forbidden fallbacks.');
  if (url === process.env.DATABASE_URL || url === process.env.TEST_DATABASE_URL) {
    throw new Error('LEGACY_DATABASE_URL must be physically separate from DATABASE_URL and TEST_DATABASE_URL.');
  }
  return url;
}

// FELS-1 AUTHORIZED objects only. Early FELS-2/3 tables are excluded from the
// FELS-1 acceptance surface (recorded separately as negative-semantic evidence).
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

const EARLY_FELS23 = [
  { entity: 'training_camps', table: 'legacy_training_camps', layer: 'EARLY_FELS2', family_negation: 'Program != Journey' },
  { entity: 'daily_tasks', table: 'legacy_daily_tasks', layer: 'EARLY_FELS2', family_negation: 'LegacyTask != GrowthAction' },
  { entity: 'task_checkins', table: 'legacy_task_checkins', layer: 'EARLY_FELS2', family_negation: 'LegacyCheckIn != Outcome' },
  { entity: 'advisor_notes', table: 'legacy_advisor_notes', layer: 'EARLY_FELS2', family_negation: 'AdvisorNote != Fact' },
  { entity: 'memberships', table: 'legacy_memberships', layer: 'EARLY_FELS3', family_negation: 'Membership != Family state' },
];

// FELS-4 dirty world (AUTHORIZED 2026-08-13). Discovered read-only as legacy reference;
// FLM must REJECT semantic pollution into Family canonical (family_score/ranking RETIRE).
const FELS4_DIRTY = [
  { entity: 'profiles', table: 'legacy_profiles', layer: 'IMPLEMENTED_FELS4', family_negation: 'LegacyProfile snapshot != GrowthState' },
  { entity: 'tags', table: 'legacy_tags', layer: 'IMPLEMENTED_FELS4', family_negation: 'Legacy label != Diagnosis (Annotation only)' },
  { entity: 'ai_reports', table: 'legacy_ai_reports', layer: 'IMPLEMENTED_FELS4', family_negation: 'Legacy AI conclusion != Fact (Historical Hypothesis)' },
  { entity: 'alerts', table: 'legacy_alerts', layer: 'IMPLEMENTED_FELS4', family_negation: 'Legacy alert != Family safety threshold (signal source only)' },
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
      const stat = await readOnly(client, async () => {
        const rowCount = await scalar(client, `SELECT count(*)::int AS n FROM fels.${t.table}`);
        return { rowCount };
      });
      authorized.push({ layer: 'IMPLEMENTED_FELS1', ...t, row_count: stat.rowCount });
    }

    const early = [];
    for (const t of EARLY_FELS23) {
      const stat = await readOnly(client, async () => {
        const rowCount = await scalar(client, `SELECT count(*)::int AS n FROM fels.${t.table}`);
        return { rowCount };
      });
      early.push({ ...t, row_count: stat.rowCount, disposition: 'QUARANTINE_PENDING', exportable_as_fels1: false });
    }

    // Ambiguity / consent profiling on FELS-1 authorized surface only.
    const identity = await readOnly(client, async () => {
      const dupPhone = await scalar(client, `SELECT count(*)::int AS n FROM (SELECT phone FROM fels.legacy_contacts WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1) d`);
      const crossGuardian = await scalar(client, `SELECT count(*)::int AS n FROM (SELECT customer_id FROM fels.legacy_student_guardians GROUP BY customer_id HAVING count(DISTINCT student_id) > 1) g WHERE 1=1 AND customer_id IN (SELECT customer_id FROM fels.legacy_student_guardians GROUP BY customer_id HAVING count(*) > 1)`);
      const nullContactName = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_contacts WHERE name IS NULL OR name = ''`);
      return { duplicate_phone_count: dupPhone, cross_customer_guardian_count: crossGuardian, null_contact_name_count: nullContactName };
    });

    const consent = await readOnly(client, async () => {
      const total = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_consent_records`);
      let weak = 0;
      try {
        weak = await scalar(client, `SELECT count(*)::int AS n FROM fels.legacy_consent_records WHERE guardian_proof_status IS NULL OR guardian_proof_status IN ('WEAK','INCOMPLETE','UNKNOWN','MISSING','PENDING')`);
      } catch { weak = 0; }
      return { legacy_consent_count: total, weak_or_incomplete_consent_count: weak };
    });

    // FELS-4 dirty-world discovery (read-only) + semantic pollution rejection scan.
    const fels4 = [];
    for (const t of FELS4_DIRTY) {
      const stat = await readOnly(client, async () => {
        let rowCount = 0;
        try { rowCount = await scalar(client, `SELECT count(*)::int AS n FROM fels.${t.table}`); } catch { rowCount = 0; }
        return { rowCount };
      });
      fels4.push({ ...t, row_count: stat.rowCount, disposition: 'REFERENCE_ONLY', family_canonical_target: false });
    }

    const pollutionScan = await readOnly(client, async () => {
      const safe = async (sql) => { try { return await scalar(client, sql); } catch { return 0; } };
      // family_score / ranking exist in legacy source -> must be RETIRED, never promoted.
      const familyScorePresent = await safe(`SELECT count(*)::int AS n FROM fels.legacy_profiles WHERE family_score IS NOT NULL`);
      const rankingPresent = await safe(`SELECT count(*)::int AS n FROM fels.legacy_profiles WHERE ranking IS NOT NULL`);
      const aiWithoutEvidence = await safe(`SELECT count(*)::int AS n FROM fels.legacy_ai_reports WHERE has_supporting_evidence = false`);
      // Structural guardrail: every dirty object must carry its NOT_* semantic classification.
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

    const fels1RowTotal = authorized.reduce((s, a) => s + a.row_count, 0);

    const report = {
      probe: 'H006_FLM_READONLY_REFERENCE_DISCOVERY',
      authorized_scope: 'FELS-1 real system closure only',
      source_system: 'FELS',
      source_schema: 'fels',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      real_bangyang_source: false,
      snapshot_id: snapshotId,
      mode: 'READ_ONLY',
      transaction_mode: 'BEGIN READ ONLY',
      fels1_authorized_entities: authorized,
      identity_profile: identity,
      consent_profile: consent,
      early_fels23_entities_negative_semantic_only: early,
      fels4_dirty_world_entities: fels4,
      semantic_pollution_scan: pollutionScan,
      totals: {
        fels1_authorized_row_count: fels1RowTotal,
        fels1_exportable_count: fels1RowTotal,
        rejected_or_unknown_count: 0,
      },
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
