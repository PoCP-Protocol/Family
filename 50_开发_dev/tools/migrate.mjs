#!/usr/bin/env node
/**
 * 轻量迁移器:按序应用 database/migrations/*.sql,进度记入 schema_migrations 表。
 * 用法:
 *   node tools/migrate.mjs up       应用全部未应用的迁移
 *   node tools/migrate.mjs status   列出已应用 / 待应用
 *
 * up/down 策略(AC5):
 *   - up:前向迁移,每个文件在单事务内执行,成功后登记文件名(幂等:已登记则跳过)。
 *   - down:V0 采用「前向修复」策略 —— 不做自动逆向;回滚通过新增一支反向迁移文件完成,
 *           并配合 database/schema_v0_1.sql 的 IF NOT EXISTS/DO$$ 幂等写法可安全重放。
 *     (需要真正 down 脚本时,在 migrations/ 增加 NNNN_rollback_*.sql 显式提供。)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations');
const cmd = process.argv[2] ?? 'status';
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL 未设置(见 .env.example)');
  process.exit(1);
}

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  const applied = new Set(
    (await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename),
  );
  const files = migrationFiles();

  if (cmd === 'status') {
    for (const f of files) {
      console.log(`${applied.has(f) ? '[applied]' : '[pending]'} ${f}`);
    }
    await client.end();
    return;
  }

  if (cmd === 'up') {
    let count = 0;
    for (const f of files) {
      if (applied.has(f)) continue;
      const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [f]);
        await client.query('COMMIT');
        console.log(`[applied] ${f}`);
        count++;
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`[failed] ${f}: ${e.message}`);
        await client.end();
        process.exit(1);
      }
    }
    console.log(count ? `已应用 ${count} 个迁移` : '无待应用迁移');
    await client.end();
    return;
  }

  console.error(`未知命令: ${cmd}(可用:up | status)`);
  await client.end();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
