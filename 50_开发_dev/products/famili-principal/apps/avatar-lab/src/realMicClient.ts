/**
 * MM1-B1 · Real Microphone Client (§7 / §13)
 *
 * 浏览器侧模块。不导入到 frozen client.ts;后续如需接入 avatar-lab UI,
 * 由新增 UI 模块显式 import 本文件。
 *
 * 输入:  navigator.mediaDevices.getUserMedia({ audio: true })
 * 处理:  AudioContext(16000Hz) + AudioWorkletNode 采样 → INT16_LE mono
 * 输出:  以 20ms 一帧的粒度通过传入的 send(bytes) 回调发出;调用方负责通过 WS 发送。
 *
 * 严禁:
 *   - 上传原始音频文件到服务器持久层 (§29 EPHEMERAL)。
 *   - 在浏览器保留 subscription key / region (§27)。
 *   - 直接 import Azure SDK。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RealMicClientOptions {
  /** 帧粒度,毫秒。默认 20ms。 */
  frameMs?: number;
  /** 目标采样率。参考栈固定 16000。 */
  targetSampleRateHz?: number;
  /** 将一帧 PCM16-LE 字节发到服务端(通常包装成 WS binary)。 */
  send: (bytes: Uint8Array) => void;
  /** 出错时的钩子。 */
  onError?: (reason: string) => void;
}

const DEFAULT_FRAME_MS = 20;

/**
 * NOTE: 本模块被打包时会走前端 tsconfig; vitest 里我们仅测试"帧切分/PCM 转换"这一段可
 * 单独提取的纯函数,避免对 AudioWorklet 依赖。
 */
export function floatToInt16LE(samples: Float32Array): Uint8Array {
  const out = new Uint8Array(samples.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    const v = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
    view.setInt16(i * 2, v, true);
  }
  return out;
}

/**
 * 将一段任意长度 Float32Array 按 samplesPerFrame 大小切帧;剩余不足一帧的样本
 * 通过 stash 保留到下次拼接。此纯函数不依赖浏览器,便于单测。
 */
export interface FrameSlicer {
  push(samples: Float32Array): Uint8Array[];
  flush(): Uint8Array | null;
}

export function createFrameSlicer(samplesPerFrame: number): FrameSlicer {
  let stash: Float32Array = new Float32Array(0);
  return {
    push(samples) {
      const merged = new Float32Array(stash.length + samples.length);
      merged.set(stash, 0);
      merged.set(samples, stash.length);
      const frames: Uint8Array[] = [];
      let off = 0;
      while (merged.length - off >= samplesPerFrame) {
        const slice = merged.subarray(off, off + samplesPerFrame);
        frames.push(floatToInt16LE(slice));
        off += samplesPerFrame;
      }
      stash = merged.slice(off);
      return frames;
    },
    flush() {
      if (stash.length === 0) return null;
      const out = floatToInt16LE(stash);
      stash = new Float32Array(0);
      return out;
    },
  };
}

/**
 * 浏览器端 API 骨架;测试环境不会真的 new AudioContext。
 * 保留此函数以供未来 avatar-lab UI 接入,不在本轮走 e2e。
 */
export async function startRealMicCapture(opts: RealMicClientOptions): Promise<{ stop(): void }> {
  const frameMs = opts.frameMs ?? DEFAULT_FRAME_MS;
  const targetHz = opts.targetSampleRateHz ?? 16000;
  const samplesPerFrame = Math.round((frameMs / 1000) * targetHz);

  if (typeof navigator === 'undefined' || !(navigator as any).mediaDevices) {
    throw new Error('startRealMicCapture: navigator.mediaDevices unavailable');
  }
  const stream: MediaStream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
  const AC: any = (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
  if (!AC) throw new Error('startRealMicCapture: AudioContext unavailable');
  const ctx = new AC({ sampleRate: targetHz });
  const source = ctx.createMediaStreamSource(stream);
  const slicer = createFrameSlicer(samplesPerFrame);

  // ScriptProcessorNode 是 legacy,但作为 AudioWorklet 未部署前的兜底,足以在 avatar-lab
  // dev 环境完成 MM1-B1 打通。真正的商用引入必须迁到 AudioWorklet。
  const bufferSize = 2048;
  const processor: any = ctx.createScriptProcessor(bufferSize, 1, 1);
  processor.onaudioprocess = (e: any) => {
    const ch: Float32Array = e.inputBuffer.getChannelData(0);
    const frames = slicer.push(ch);
    for (const f of frames) opts.send(f);
  };
  source.connect(processor);
  processor.connect(ctx.destination);

  return {
    stop() {
      try {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        const tail = slicer.flush();
        if (tail) opts.send(tail);
      } catch (err: any) {
        opts.onError?.(String(err?.message ?? err));
      }
    },
  };
}
