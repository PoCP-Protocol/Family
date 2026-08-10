#!/usr/bin/env node
import { spawn } from 'node:child_process';
import pg from 'pg';

const composeArgs = ['compose', '-f', 'docker-compose.test.yml'];
const command = process.argv[2] ?? 'help';
const extraArgs = process.argv.slice(3);
let resolvedTestDatabaseUrl = process.env.TEST_DATABASE_URL;

function run(commandName, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, TEST_DATABASE_URL: getTestDatabaseUrl(), DATABASE_URL: getTestDatabaseUrl(), ...options.env },
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${commandName} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function capture(commandName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${commandName} ${args.join(' ')} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

function getTestDatabaseUrl() {
  return resolvedTestDatabaseUrl ?? 'postgres://family:family@localhost:5432/family_test';
}

async function resolveComposeDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) {
    resolvedTestDatabaseUrl = process.env.TEST_DATABASE_URL;
    return resolvedTestDatabaseUrl;
  }
  const portOutput = await capture('docker', [...composeArgs, 'port', 'postgres-test', '5432']);
  const port = portOutput.split(':').pop();
  if (!port) {
    throw new Error(`could not resolve postgres-test mapped port from: ${portOutput}`);
  }
  resolvedTestDatabaseUrl = `postgres://family:family@localhost:${port}/family_test`;
  return resolvedTestDatabaseUrl;
}

async function waitForDatabase() {
  await resolveComposeDatabaseUrl();
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    const client = new pg.Client({ connectionString: getTestDatabaseUrl() });
    try {
      await client.connect();
      await client.query('select 1');
      await client.end();
      console.log(`test database is ready: ${getTestDatabaseUrl()}`);
      return;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        // Ignore cleanup errors while postgres is still starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`test database did not become ready: ${lastError?.message ?? 'unknown error'}`);
}

async function main() {
  if (command === 'up') {
    await run('docker', [...composeArgs, 'up', '-d']);
    return;
  }
  if (command === 'down') {
    await run('docker', [...composeArgs, 'down']);
    return;
  }
  if (command === 'reset') {
    await run('docker', [...composeArgs, 'down', '-v']);
    await run('docker', [...composeArgs, 'up', '-d']);
    await waitForDatabase();
    await run('node', ['tools/migrate.mjs', 'up']);
    return;
  }
  if (command === 'wait') {
    await waitForDatabase();
    return;
  }
  if (command === 'migrate') {
    await resolveComposeDatabaseUrl();
    await run('node', ['tools/migrate.mjs', 'up']);
    return;
  }
  if (command === 'run') {
    if (extraArgs.length === 0) {
      throw new Error('usage: node tools/testdb.mjs run <pnpm args...>');
    }
    await resolveComposeDatabaseUrl();
    await run('pnpm', extraArgs);
    return;
  }

  console.log(`usage: node tools/testdb.mjs <up|wait|migrate|reset|down|run>

TEST_DATABASE_URL is auto-discovered from docker compose unless explicitly set.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});