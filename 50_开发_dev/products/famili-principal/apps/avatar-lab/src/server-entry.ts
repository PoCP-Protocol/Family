/**
 * MM1-A3 权威 realtime 服务入口。
 *
 * 由 pnpm run dev:server 执行(tsx)。
 * 默认监听 ws://127.0.0.1:8765,可通过 AVATAR_LAB_HOST / AVATAR_LAB_PORT 覆盖。
 */
import { startAvatarLabRealtimeServer } from './realtimeServer.js';

const host = process.env.AVATAR_LAB_HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.AVATAR_LAB_PORT ?? '8765', 10);

startAvatarLabRealtimeServer({ host, port })
  .then((srv) => {
    // eslint-disable-next-line no-console
    console.log(`avatar-lab authoritative realtime listening on ws://${srv.host}:${srv.port}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('avatar-lab server failed to start:', err);
    process.exit(1);
  });
