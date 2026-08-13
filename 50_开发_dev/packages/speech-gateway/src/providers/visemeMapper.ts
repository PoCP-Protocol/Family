/**
 * MM1-B1 · Family-owned Viseme Mapper (§16)
 *
 * 目的:
 *   把不同 TTS provider 的 viseme id → Family-owned 抽象 MouthShape 8 类。
 *   Avatar 层**只见 Family MouthShape**,不见 provider-specific id。
 *   以后换 Qwen/其他 TTS,只换 mapper 表,Avatar 不动。
 *
 * SSOT: products/famili-principal/multimodal/FPAI_MM1B_PROVIDER_SELECTION_V1.md §16
 *
 * Azure Speech SDK viseme_id 参考 SAPI viseme set (0-21):
 *   0  = silence
 *   1  = ae, ax, ah
 *   2  = aa
 *   3  = ao
 *   4  = ey, eh, uh
 *   5  = er
 *   6  = y, iy, ih
 *   7  = w, uw
 *   8  = ow
 *   9  = aw
 *   10 = oy
 *   11 = ay
 *   12 = h
 *   13 = r
 *   14 = l
 *   15 = s, z
 *   16 = sh, ch, jh, zh
 *   17 = th, dh
 *   18 = f, v
 *   19 = d, t, n
 *   20 = k, g, ng
 *   21 = p, b, m
 *   (依据: https://learn.microsoft.com/azure/ai-services/speech-service/how-to-speech-synthesis-viseme#viseme-id ,
 *    未在本任务中活体校验)
 */

/**
 * Family-owned MouthShape,provider-neutral。
 *
 * Avatar renderer 只需要认识这 8 类。
 */
export type FamilyMouthShape =
  | 'REST'          // 静默 / 收唇 / turn boundary
  | 'OPEN_SMALL'    // 小张 (i, e, ay)
  | 'OPEN_MEDIUM'   // 中张 (ae, eh, ah)
  | 'OPEN_WIDE'     // 大张 (aa, ao)
  | 'ROUND'         // 圆唇 (ow, oy, w, uw)
  | 'NARROW'        // 收窄 (r, l, er)
  | 'SMILE_SPEECH'  // 齿龈音族/擦音 (s, z, sh, ch)
  | 'CLOSED';       // 完全闭合 (p, b, m, f, v)

/**
 * Azure viseme_id → Family MouthShape。
 *
 * evidence_ref:
 *   https://learn.microsoft.com/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
 *   (映射表未在本任务中活体校验,人类接手时应用最新官方 SAPI viseme 说明校对)
 */
export const AZURE_VISEME_TO_FAMILY: ReadonlyArray<FamilyMouthShape> = Object.freeze([
  /* 0  silence */ 'REST',
  /* 1  ae,ax,ah */ 'OPEN_MEDIUM',
  /* 2  aa */ 'OPEN_WIDE',
  /* 3  ao */ 'OPEN_WIDE',
  /* 4  ey,eh,uh */ 'OPEN_MEDIUM',
  /* 5  er */ 'NARROW',
  /* 6  y,iy,ih */ 'OPEN_SMALL',
  /* 7  w,uw */ 'ROUND',
  /* 8  ow */ 'ROUND',
  /* 9  aw */ 'OPEN_WIDE',
  /* 10 oy */ 'ROUND',
  /* 11 ay */ 'OPEN_SMALL',
  /* 12 h */ 'REST',
  /* 13 r */ 'NARROW',
  /* 14 l */ 'NARROW',
  /* 15 s,z */ 'SMILE_SPEECH',
  /* 16 sh,ch,jh,zh */ 'SMILE_SPEECH',
  /* 17 th,dh */ 'NARROW',
  /* 18 f,v */ 'CLOSED',
  /* 19 d,t,n */ 'NARROW',
  /* 20 k,g,ng */ 'OPEN_SMALL',
  /* 21 p,b,m */ 'CLOSED',
]);

export interface FamilyVisemeFrame {
  turn_id: string;
  /** family-owned viseme,provider-neutral。 */
  shape: FamilyMouthShape;
  /** 相对该 turn TTS 起点的 ms。 */
  audio_offset_ms: number;
  /** 可选,某些 provider 提供 viseme 持续时长。 */
  duration_ms?: number;
}

/**
 * 把 Azure `VisemeReceived` event payload (visemeId + audioOffset) 映射为 Family frame。
 *
 * @param azureVisemeId  Azure SDK 返回的 viseme id (0..21)
 * @param audioOffsetTicks Azure 返回的 `audioOffset`,单位为 100-nanosecond (SAPI convention)
 * @param turnId turn id
 * @param durationMs optional
 */
export function mapAzureVisemeToFamily(
  azureVisemeId: number,
  audioOffsetTicks: number | bigint,
  turnId: string,
  durationMs?: number,
): FamilyVisemeFrame {
  const idx = Math.max(0, Math.min(21, Math.trunc(azureVisemeId)));
  const shape = AZURE_VISEME_TO_FAMILY[idx] ?? 'REST';
  // Azure SDK audioOffset 以 100ns tick 计,除以 10_000 得 ms
  const ticks =
    typeof audioOffsetTicks === 'bigint' ? Number(audioOffsetTicks / 10000n) : Math.floor(audioOffsetTicks / 10000);
  const audio_offset_ms = Math.max(0, ticks);
  return {
    turn_id: turnId,
    shape,
    audio_offset_ms,
    duration_ms: durationMs,
  };
}

/** 未知或缺失 viseme 时用 REST(§17 L1 fallback 由 avatar 层记录 telemetry 处理)。 */
export const DEFAULT_MOUTH_SHAPE: FamilyMouthShape = 'REST';
