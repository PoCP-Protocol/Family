import { startFelsHttpServer } from './http-server';

async function main() {
  const http = await startFelsHttpServer();
  console.log(`FELS reference HTTP API listening on ${http.port} (read-only, family_legacy)`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
