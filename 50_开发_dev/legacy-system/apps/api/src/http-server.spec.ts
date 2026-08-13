import { startFelsHttpServer, type FelsHttpServer } from './http-server';
import { createFels4CleanDataset } from './fels1-core';
import { seedDatasetToPostgres } from './pg-fels-repository';

function legacyDbAvailable() {
  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) return false;
  if (url === process.env.DATABASE_URL || url === process.env.TEST_DATABASE_URL) return false;
  return true;
}

const runRealHttp = legacyDbAvailable() ? describe : describe.skip;

runRealHttp('FELS real HTTP API over family_legacy (read-only)', () => {
  let http: FelsHttpServer;
  let base: string;

  beforeAll(async () => {
    await seedDatasetToPostgres(createFels4CleanDataset().records);
    http = await startFelsHttpServer(0);
    base = `http://127.0.0.1:${http.port}`;
  }, 60_000);

  afterAll(async () => {
    if (http) await http.close();
  });

  it('serves health without claiming real Bangyang source', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toMatchObject({ status: 'ok', service: 'fels-api', realBangyangSource: false });
  });

  it('lists read-only export entities', async () => {
    const res = await fetch(`${base}/legacy-export`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.mode).toBe('READ_ONLY');
    expect(body.source_kind).toBe('REFERENCE_IMPLEMENTATION');
    expect(body.entities).toEqual(
      expect.arrayContaining(['customers', 'students', 'consents', 'programs', 'tasks', 'checkins', 'advisor-notes', 'memberships']),
    );
  });

  it('exports the legacy program lifecycle with preserved legacy semantics', async () => {
    const programs = (await (await fetch(`${base}/legacy-export/programs`)).json()) as any;
    expect(programs.entity_type).toBe('programs');
    expect(programs.items.length).toBeGreaterThanOrEqual(1);
    expect(programs.items[0].semantic_classification).toBe('LEGACY_PROGRAM_NOT_JOURNEY');

    const tasks = (await (await fetch(`${base}/legacy-export/tasks`)).json()) as any;
    expect(tasks.items[0].semantic_classification).toBe('LEGACY_TASK_NOT_GROWTH_ACTION');

    const checkins = (await (await fetch(`${base}/legacy-export/checkins`)).json()) as any;
    expect(checkins.items.length).toBeGreaterThanOrEqual(10);
    expect(checkins.items[0].semantic_classification).toBe('LEGACY_CHECKIN_NOT_OUTCOME');

    const notes = (await (await fetch(`${base}/legacy-export/advisor-notes`)).json()) as any;
    expect(notes.items[0].semantic_classification).toBe('LEGACY_ADVISOR_TEXT_NOT_FACT');

    const memberships = (await (await fetch(`${base}/legacy-export/memberships`)).json()) as any;
    expect(memberships.items.length).toBeGreaterThanOrEqual(10);
    expect(memberships.items[0].semantic_classification).toBe('LEGACY_MEMBERSHIP_STATE');
  });

  it('exports FELS-4 dirty-world entities with preserved non-canonical semantics', async () => {
    const profiles = (await (await fetch(`${base}/legacy-export/profiles`)).json()) as any;
    expect(profiles.entity_type).toBe('profiles');
    expect(profiles.items.length).toBeGreaterThanOrEqual(1);
    expect(profiles.items[0].semantic_classification).toBe('LEGACY_PROFILE_SNAPSHOT_NOT_STATE');

    const tags = (await (await fetch(`${base}/legacy-export/tags`)).json()) as any;
    expect(tags.items[0].semantic_classification).toBe('LEGACY_TAG_CATEGORY_NOT_OFFICIAL');

    const aiReports = (await (await fetch(`${base}/legacy-export/ai-reports`)).json()) as any;
    expect(aiReports.items[0].semantic_classification).toBe('LEGACY_AI_HYPOTHESIS_NOT_FACT');

    const alerts = (await (await fetch(`${base}/legacy-export/alerts`)).json()) as any;
    expect(alerts.items[0].semantic_classification).toBe('LEGACY_ALERT_SIGNAL_NOT_THRESHOLD');
  });

  it('exports customers from real PostgreSQL through HTTP', async () => {
    const res = await fetch(`${base}/legacy-export/customers`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.source_system).toBe('FELS');
    expect(body.entity_type).toBe('customers');
    expect(body.schema_version).toBe('fels-1');
    expect(body.items.length).toBeGreaterThanOrEqual(10);
    expect(body.items[0]).toHaveProperty('customer_id');
    expect(body.items[0].semantic_classification).toBe('LEGACY_DERIVED');
  });

  it('rejects unknown export entities', async () => {
    const res = await fetch(`${base}/legacy-export/family`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error).toBe('unknown_export_entity');
  });

  it('rejects non-GET methods to preserve read-only boundary', async () => {
    const res = await fetch(`${base}/legacy-export/customers`, { method: 'POST' });
    expect(res.status).toBe(405);
    const body = (await res.json()) as any;
    expect(body.boundary).toBe('FELS_READ_ONLY');
  });
});
