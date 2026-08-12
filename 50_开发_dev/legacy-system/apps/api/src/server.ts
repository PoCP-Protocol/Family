import { startFelsHttpServer } from './http-server';

async function main() {
  const started = await startFelsHttpServer(Number(process.env.FELS_API_PORT ?? 3010));
  process.stdout.write(`FELS reference HTTP API listening on ${started.port} (read-only, family_legacy)\n`);
  const shutdown = () => {
    started.close().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  process.stderr.write(`FELS HTTP API failed to start: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
