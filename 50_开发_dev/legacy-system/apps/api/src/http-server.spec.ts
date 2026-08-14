import { startFelsHttpServer, type FelsHttpServer } from './http-server';
import { createFlmReferenceCleanDataset } from './fels1-core';
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
    await seedDatasetToPostgres(createFlmReferenceCleanDataset().records);
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

  it('lists read-only export entities (FELS1 + FLM dirty-world only, no early FELS2/3 routes)', async () => {
    const res = await fetch(`${base}/legacy-export`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.mode).toBe('READ_ONLY');
    expect(body.entities).toEqual(
      expect.arrayContaining(['customers', 'students', 'consents', 'profiles', 'tags', 'ai-reports', 'alerts']),
    );
    for (const forbidden of ['programs', 'tasks', 'checkins', 'advisor-notes', 'memberships']) {
      expect(body.entities).not.toContain(forbidden);
    }
  });

  it('exports FLM dirty-world entities with preserved non-canonical semantics', async () => {
    const profiles = (await (await fetch(`${base}/legacy-export/profiles`)).json()) as any;
    expect(profiles.entity_type).toBe('profiles');
    expect(profiles.source_schema_version).toBe('fels-ref-0004');
    expect(profiles.acceptance_surface).toBe('FLM_DIRTY_WORLD');
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
    expect(body.source_schema_version).toBe('fels-ref-0004');
    expect(body.acceptance_surface).toBe('FELS1');
    expect(body.items.length).toBeGreaterThanOrEqual(10);
    expect(body.items[0].semantic_classification).toBe('LEGACY_DERIVED');
  });

  it('rejects unknown export entities and non-GET methods', async () => {
    const unknown = await fetch(`${base}/legacy-export/programs`);
    expect(unknown.status).toBe(404);
    const post = await fetch(`${base}/legacy-export/customers`, { method: 'POST' });
    expect(post.status).toBe(405);
    const body = (await post.json()) as any;
    expect(body.boundary).toBe('FELS_READ_ONLY');
  });
});
