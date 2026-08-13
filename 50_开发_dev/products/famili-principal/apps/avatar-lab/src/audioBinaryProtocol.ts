/**
 * MM1-B1.1 · Provider-Neutral Audio Binary Protocol (§C / §15)
 *
 * 目的:
 *   浏览器 ↔ 服务端之间的实时音频帧信封,与 provider 完全解耦。
 *   浏览器不出现: Azure key / region / SDK object。
 *
 * 帧结构 (little-endian, 8-byte-aligned header):
 *
 *   [0..3]   magic = 0x46414D31 ("FAM1")  (ASCII 4 bytes)
 *   [4]      version   (uint8) = 1
 *   [5]      encoding  (uint8) 1 = INT16_LE, 2 = PCM_FLOAT32_LE (future)
 *   [6]      channels  (uint8) 1 (mono)
 *   [7]      flags     (uint8) bit0=END_OF_TURN, bit1=INTERRUPT
 *   [8..11]  sample_rate (uint32 LE)  e.g. 16000
 *   [12..15] sequence    (uint32 LE)  per-turn, 0-based
 *   [16..23] timestamp_ms (float64 LE) client wall clock
 *   [24..27] session_id_len (uint32 LE)
 *   [28..31] turn_id_len    (uint32 LE)
 *   [32..35] generation_id_len (uint32 LE)
 *   [36..39] payload_len   (uint32 LE)
 *   [40..]   session_id (utf8), turn_id (utf8), generation_id (utf8), payload_bytes
 *
 * 与真实音频负载严格分离:
 *   - 服务端解析出 metadata 之后, payload 直通 AudioInputNormalizer,
 *     不允许在 WS 层做任何 provider-specific 变形。
 *   - 浏览器序列化时, 生成新的 ArrayBuffer, 不复用 SDK 结构。
 */

export const AUDIO_MAGIC = 0x46414d31; // "FAM1"
export const AUDIO_PROTOCOL_VERSION = 1;

export const AUDIO_FLAG_END_OF_TURN = 0x01;
export const AUDIO_FLAG_INTERRUPT = 0x02;

export type AudioEncoding = 'INT16_LE' | 'PCM_FLOAT32_LE';

export interface AudioFrameEnvelope {
  session_id: string;
  turn_id: string;
  generation_id: string;
  sequence: number;
  timestamp_ms: number;
  sample_rate: number;
  channels: 1;
  encoding: AudioEncoding;
  flags?: {
    end_of_turn?: boolean;
    interrupt?: boolean;
  };
  /** INT16-LE 原始 PCM 字节。空帧亦允许(仅 metadata,例如 END_OF_TURN)。 */
  payload: Uint8Array;
}

const HEADER_BYTES = 40;

function encodingToByte(enc: AudioEncoding): number {
  if (enc === 'INT16_LE') return 1;
  if (enc === 'PCM_FLOAT32_LE') return 2;
  throw new Error(`unsupported encoding: ${enc}`);
}
function encodingFromByte(b: number): AudioEncoding {
  if (b === 1) return 'INT16_LE';
  if (b === 2) return 'PCM_FLOAT32_LE';
  throw new Error(`unsupported encoding byte: ${b}`);
}

function utf8Encode(s: string): Uint8Array {
  // 兼容 Node 与浏览器
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  return new Uint8Array(Buffer.from(s, 'utf8'));
}
function utf8Decode(b: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(b);
  return Buffer.from(b).toString('utf8');
}

export function encodeAudioFrame(env: AudioFrameEnvelope): Uint8Array {
  if (env.channels !== 1) throw new Error('only mono supported');
  if (env.sample_rate <= 0 || env.sample_rate > 96000) throw new Error('invalid sample_rate');
  if (env.sequence < 0 || !Number.isFinite(env.sequence)) throw new Error('invalid sequence');
  const sid = utf8Encode(env.session_id);
  const tid = utf8Encode(env.turn_id);
  const gid = utf8Encode(env.generation_id);
  const payload = env.payload;
  const total = HEADER_BYTES + sid.byteLength + tid.byteLength + gid.byteLength + payload.byteLength;
  const buf = new ArrayBuffer(total);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);

  dv.setUint32(0, AUDIO_MAGIC, true);
  dv.setUint8(4, AUDIO_PROTOCOL_VERSION);
  dv.setUint8(5, encodingToByte(env.encoding));
  dv.setUint8(6, 1);
  let flagByte = 0;
  if (env.flags?.end_of_turn) flagByte |= AUDIO_FLAG_END_OF_TURN;
  if (env.flags?.interrupt) flagByte |= AUDIO_FLAG_INTERRUPT;
  dv.setUint8(7, flagByte);
  dv.setUint32(8, env.sample_rate, true);
  dv.setUint32(12, env.sequence, true);
  dv.setFloat64(16, env.timestamp_ms, true);
  dv.setUint32(24, sid.byteLength, true);
  dv.setUint32(28, tid.byteLength, true);
  dv.setUint32(32, gid.byteLength, true);
  dv.setUint32(36, payload.byteLength, true);

  let off = HEADER_BYTES;
  u8.set(sid, off); off += sid.byteLength;
  u8.set(tid, off); off += tid.byteLength;
  u8.set(gid, off); off += gid.byteLength;
  u8.set(payload, off);

  return u8;
}

export function decodeAudioFrame(bytes: Uint8Array): AudioFrameEnvelope {
  if (bytes.byteLength < HEADER_BYTES) throw new Error('frame too short');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = dv.getUint32(0, true);
  if (magic !== AUDIO_MAGIC) throw new Error('bad magic');
  const version = dv.getUint8(4);
  if (version !== AUDIO_PROTOCOL_VERSION) throw new Error(`unsupported version: ${version}`);
  const encoding = encodingFromByte(dv.getUint8(5));
  const channels = dv.getUint8(6);
  if (channels !== 1) throw new Error('only mono supported');
  const flagByte = dv.getUint8(7);
  const sample_rate = dv.getUint32(8, true);
  const sequence = dv.getUint32(12, true);
  const timestamp_ms = dv.getFloat64(16, true);
  const sidLen = dv.getUint32(24, true);
  const tidLen = dv.getUint32(28, true);
  const gidLen = dv.getUint32(32, true);
  const payloadLen = dv.getUint32(36, true);

  const expectedTotal = HEADER_BYTES + sidLen + tidLen + gidLen + payloadLen;
  if (bytes.byteLength < expectedTotal) throw new Error('frame truncated');

  let off = HEADER_BYTES;
  const sid = utf8Decode(bytes.subarray(off, off + sidLen)); off += sidLen;
  const tid = utf8Decode(bytes.subarray(off, off + tidLen)); off += tidLen;
  const gid = utf8Decode(bytes.subarray(off, off + gidLen)); off += gidLen;
  const payload = bytes.slice(off, off + payloadLen);

  return {
    session_id: sid,
    turn_id: tid,
    generation_id: gid,
    sequence,
    timestamp_ms,
    sample_rate,
    channels: 1,
    encoding,
    flags: {
      end_of_turn: !!(flagByte & AUDIO_FLAG_END_OF_TURN),
      interrupt: !!(flagByte & AUDIO_FLAG_INTERRUPT),
    },
    payload,
  };
}

/**
 * 快速校验: 从字节 buffer 判断是否为 FAM1 帧, 不做完整解码。
 * 用于服务端在 WS 收到 binary message 时决定路由。
 */
export function isAudioFrameBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) return false;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(0, true) === AUDIO_MAGIC;
}
