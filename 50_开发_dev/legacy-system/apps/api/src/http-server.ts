import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { FELS_TRUTH } from '@family/fels-contracts';
import { getFelsHealth } from './main';
import {
  LEGACY_EXPORT_ENTITIES,
  PgFelsReadRepository,
  type LegacyExportEntity,
} from './pg-fels-repository';

const EXPORT_PREFIX = '/legacy-export/';

const EXPORT_ENTITY_SET = new Set<LegacyExportEntity>(LEGACY_EXPORT_ENTITIES);

function toExportEntity(route: string): LegacyExportEntity | undefined {
  return EXPORT_ENTITY_SET.has(route as LegacyExportEntity) ? (route as LegacyExportEntity) : undefined;
}

export interface FelsHttpServer {
  server: Server;
  port: number;
  close(): Promise<void>;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(payload);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, repo: PgFelsReadRepository) {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;

  if (method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed', allowed: 'GET', boundary: 'FELS_READ_ONLY' });
    return;
  }

  if (path === '/health') {
    sendJson(res, 200, getFelsHealth());
    return;
  }

  if (path === '/legacy-export') {
    sendJson(res, 200, {
      source_system: 'FELS',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      real_bangyang_source: FELS_TRUTH.realBangyangSource,
      entities: LEGACY_EXPORT_ENTITIES,
      mode: 'READ_ONLY',
    });
    return;
  }

  if (path.startsWith(EXPORT_PREFIX)) {
    const route = path.slice(EXPORT_PREFIX.length);
    const entity = toExportEntity(route);
    if (!entity) {
      sendJson(res, 404, { error: 'unknown_export_entity', route, available: LEGACY_EXPORT_ENTITIES });
      return;
    }
    const envelope = await repo.exportEntity(entity);
    sendJson(res, 200, envelope);
    return;
  }

  sendJson(res, 404, { error: 'not_found', path });
}

export async function startFelsHttpServer(port = Number(process.env.FELS_API_PORT ?? 0)): Promise<FelsHttpServer> {
  const repo = await new PgFelsReadRepository().connect();
  const server = createServer((req, res) => {
    handleRequest(req, res, repo).catch((error) => {
      sendJson(res, 500, { error: 'fels_read_failure', message: error instanceof Error ? error.message : String(error) });
    });
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;

  return {
    server,
    port: boundPort,
    async close() {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
      await repo.close();
    },
  };
}
