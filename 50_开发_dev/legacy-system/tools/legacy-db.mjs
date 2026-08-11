#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyRoot = join(__dirname, '..');
const migrationsDir = join(legacyRoot, 'db', 'migrations');
const command = process.argv[2] ?? 'status';

function legacyUrl() {
  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) throw new Error('LEGACY_DATABASE_URL is required for FELS. DATABASE_URL and TEST_DATABASE_URL are forbidden fallbacks.');
  if (url === process.env.DATABASE_URL || url === process.env.TEST_DATABASE_URL) {
    throw new Error('LEGACY_DATABASE_URL must be physically separate from DATABASE_URL and TEST_DATABASE_URL.');
  }
  return url;
}

function migrationFiles() {
  return readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
}

async function withClient(run) {
  const client = new pg.Client({ connectionString: legacyUrl() });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function ensureMigrationTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS fels_schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
}

async function status() {
  await withClient(async (client) => {
    await ensureMigrationTable(client);
    const applied = new Set((await client.query('SELECT filename FROM fels_schema_migrations')).rows.map((row) => row.filename));
    for (const file of migrationFiles()) console.log(`${applied.has(file) ? '[applied]' : '[pending]'} ${file}`);
  });
}

async function migrate() {
  await withClient(async (client) => {
    await ensureMigrationTable(client);
    const applied = new Set((await client.query('SELECT filename FROM fels_schema_migrations')).rows.map((row) => row.filename));
    let count = 0;
    for (const file of migrationFiles()) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO fels_schema_migrations(filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[applied] ${file}`);
        count++;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log(count ? `applied ${count} FELS migrations` : 'no pending FELS migrations');
  });
}

async function reset() {
  await withClient(async (client) => {
    await client.query('DROP SCHEMA IF EXISTS fels CASCADE');
    await client.query('DROP TABLE IF EXISTS fels_schema_migrations');
  });
  await migrate();
}

if (command === 'status') await status();
else if (command === 'migrate' || command === 'up') await migrate();
else if (command === 'reset') await reset();
else throw new Error(`unknown FELS DB command: ${command}`);