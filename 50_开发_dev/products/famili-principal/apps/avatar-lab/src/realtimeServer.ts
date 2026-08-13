/**
 * Avatar Lab authoritative realtime server (MM1-A3).
 *
 * 硬约束:
 *   §4  服务器不做 fake principal 输出 / 本地 risk 判定 / broadcast 业务事件 / setTimeout 捏造事件。
 *   §6  业务判定由 @family/principal-ai 的 runPrincipalTextMvp 提供,途经 orchestrator。
 *   §11 每个 WS 连接一个 RealtimePrincipalOrchestrator + RealtimeSessionContext。
 *   §12 session_id / turn_id / generation_id 由服务器权威分配。
 *   §22 服务器只对当前 socket send,不 broadcast 到其他连接。
 *
 * NON-DESTRUCTIVE:
 *   本文件是新增的权威 runtime。旧 `server.mjs` / `main.ts` / `runtime.ts` / `server.spec.ts` / `server.ts`
 *   在 SAFE_TO_REMOVE=YES 之前一律不删除,也不由本文件引用。
 */
import { createServer, type Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { RealtimePrincipalOrchestrator, type OrchestratorOptions } from './orchestrator.js';

export interface AvatarLabServerOptions {
  host?: string;
  port?: number;
  /** 允许注入,便于测试(如替换 gateway 的假实现)。 */
  orchestratorOptions?: OrchestratorOptions;
  /** 允许提供覆盖工厂,主要给单元测试用。 */
  createOrchestrator?: (sessionId: string, connectionId: string) => RealtimePrincipalOrchestrator;
}

export interface StartedAvatarLabServer {
  http: HttpServer;
  wss: WebSocketServer;
  host: string;
  port: number;
  close(): Promise<void>;
}

/**
 * 构建 HTTP+WS 服务器实例但不 listen(方便测试注入)。
 */
export function createAvatarLabRealtimeServer(opts: AvatarLabServerOptions = {}): {
  http: HttpServer;
  wss: WebSocketServer;
  orchestratorOptions: OrchestratorOptions | undefined;
} {
  const http = createServer();
  const wss = new WebSocketServer({ server: http });
  const orchestratorFactory =
    opts.createOrchestrator ??
    ((sessionId: string, connectionId: string) =>
      new RealtimePrincipalOrchestrator(sessionId, connectionId, opts.orchestratorOptions));

  wss.on('connection', (socket) => {
    const sessionId = `sess-${randomUUID()}`;
    const connectionId = `conn-${randomUUID()}`;
    const orch = orchestratorFactory(sessionId, connectionId);

    // §22 只回给当前 socket
    orch.onServerEvent((evt) => {
      if (socket.readyState === socket.OPEN) {
        try {
          socket.send(JSON.stringify(evt));
        } catch {
          /* 忽略 socket 关闭态下的写入 */
        }
      }
    });

    // 立刻告诉客户端 session 已就绪(server-authoritative session_id)
    safeSend(socket, {
      kind: 'STATE_CHANGED',
      session_id: sessionId,
      payload: { state: 'LISTENING', session_id: sessionId, connection_id: connectionId },
    });

    socket.on('message', async (raw) => {
      let command: { kind?: string; text?: string; turn_id?: string };
      try {
        command = JSON.parse(raw.toString());
      } catch (err) {
        safeSend(socket, {
          kind: 'ERROR',
          session_id: sessionId,
          payload: { reason: `bad-json: ${(err as Error).message}` },
        });
        return;
      }

      try {
        switch (command.kind) {
          case 'SESSION_START':
            await orch.handleSessionStart();
            return;
          case 'TEXT_INPUT':
          case 'SIMULATED_VOICE':
            await orch.handleTextInput(String(command.text ?? ''));
            return;
          case 'INTERRUPT':
            orch.handleInterrupt(command.turn_id);
            return;
          case 'SESSION_CLOSE':
            orch.handleSessionClose();
            return;
          case 'TELEMETRY_REQUEST':
            safeSend(socket, {
              kind: 'TELEMETRY',
              session_id: sessionId,
              payload: orch.telemetry(),
            });
            return;
          default:
            safeSend(socket, {
              kind: 'ERROR',
              session_id: sessionId,
              payload: { reason: `unknown-command: ${command.kind}` },
            });
        }
      } catch (err) {
        safeSend(socket, {
          kind: 'ERROR',
          session_id: sessionId,
          payload: { reason: (err as Error)?.message ?? String(err) },
        });
      }
    });

    socket.on('close', () => {
      orch.handleSessionClose();
    });
  });

  return { http, wss, orchestratorOptions: opts.orchestratorOptions };
}

export async function startAvatarLabRealtimeServer(
  opts: AvatarLabServerOptions = {},
): Promise<StartedAvatarLabServer> {
  const { http, wss } = createAvatarLabRealtimeServer(opts);
  const host = opts.host ?? '127.0.0.1';
  const port = opts.port ?? 8765;

  await new Promise<void>((resolve, reject) => {
    http.once('error', reject);
    http.listen(port, host, () => {
      http.off('error', reject);
      resolve();
    });
  });

  const boundPort = (http.address() as { port: number } | null)?.port ?? port;

  return {
    http,
    wss,
    host,
    port: boundPort,
    close: () =>
      new Promise<void>((resolve) => {
        wss.close(() => {
          http.close(() => resolve());
        });
      }),
  };
}

function safeSend(socket: WebSocket, payload: unknown): void {
  if (socket.readyState !== socket.OPEN) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch {
    /* 忽略 */
  }
}
