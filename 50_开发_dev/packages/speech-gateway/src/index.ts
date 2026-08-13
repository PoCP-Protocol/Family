import type { RealtimeServerEvent, SpeechChunkEvent, TranscriptEvent } from '@family/fpai-multimodal-contracts';

export interface SpeechToTextGateway {
  startSession(turnId: string): void;
  pushAudioChunk(turnId: string, chunk: Uint8Array): void;
  finishInput(turnId: string): void;
  cancel(turnId: string): void;
  onEvent(handler: (event: RealtimeServerEvent | TranscriptEvent) => void): void;
}

export interface TextToSpeechGateway {
  synthesizeStream(turnId: string, text: string): void;
  cancel(turnId: string): void;
  onEvent(handler: (event: RealtimeServerEvent | SpeechChunkEvent) => void): void;
}

/**
 * Fake STT。不做识别,只对外暴露一个"注入 transcript"的入口:
 * - startSession() → STATE_CHANGED(TRANSCRIBING)
 * - setPendingTranscript(text) 由 orchestrator 传入真实用户文本(TEXT_INPUT/SIMULATED_VOICE)
 * - pushAudioChunk() → 每一块推一次 TRANSCRIPT_PARTIAL(截取前缀)
 * - finishInput() → TRANSCRIPT_FINAL(注入的完整文本)
 * - cancel() → TTS_CANCELLED style ERROR
 * Fake 只负责流式壳,不制造业务假内容。
 */
export class FakeSpeechToTextGateway implements SpeechToTextGateway {
  private handlers: Array<(event: RealtimeServerEvent | TranscriptEvent) => void> = [];
  private pendingByTurn = new Map<string, string>();
  private chunkCountByTurn = new Map<string, number>();

  /** 由 orchestrator 在 TEXT_INPUT/SIMULATED_VOICE 时注入实际用户文本。 */
  public setPendingTranscript(turnId: string, text: string): void {
    this.pendingByTurn.set(turnId, text);
    this.chunkCountByTurn.set(turnId, 0);
  }

  public startSession(turnId: string): void {
    this.emit({ kind: 'STATE_CHANGED', turn_id: turnId, payload: { state: 'TRANSCRIBING' } });
  }

  public pushAudioChunk(turnId: string, chunk: Uint8Array): void {
    void chunk;
    const full = this.pendingByTurn.get(turnId) ?? '';
    const count = (this.chunkCountByTurn.get(turnId) ?? 0) + 1;
    this.chunkCountByTurn.set(turnId, count);
    // 每一次 chunk 揭示更多前缀,直到全文的 80%。
    const total = Math.max(full.length, 1);
    const revealChars = Math.min(full.length, Math.ceil((total * count) / 4));
    const partial = full.slice(0, revealChars) || '（正在听...）';
    this.emit({ type: 'TRANSCRIPT_PARTIAL', turn_id: turnId, text: partial, timestamp_ms: Date.now() });
  }

  public finishInput(turnId: string): void {
    const finalText = this.pendingByTurn.get(turnId) ?? '';
    this.pendingByTurn.delete(turnId);
    this.chunkCountByTurn.delete(turnId);
    this.emit({ type: 'TRANSCRIPT_FINAL', turn_id: turnId, text: finalText, timestamp_ms: Date.now() });
  }

  public cancel(turnId: string): void {
    this.pendingByTurn.delete(turnId);
    this.chunkCountByTurn.delete(turnId);
    this.emit({ kind: 'ERROR', turn_id: turnId, payload: { reason: 'stt-cancelled' } });
  }

  public onEvent(handler: (event: RealtimeServerEvent | TranscriptEvent) => void): void {
    this.handlers.push(handler);
  }

  private emit(event: RealtimeServerEvent | TranscriptEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}

/**
 * Fake TTS。合成为按句分块 + viseme:
 * - TTS_STARTED
 * - AUDIO_CHUNK × N + VISEME × N
 * - TTS_COMPLETE (合成完成)
 * - cancel() → 立刻停止后续 chunk,并发出 TTS_CANCELLED(不是 ERROR)
 */
export class FakeTextToSpeechGateway implements TextToSpeechGateway {
  private handlers: Array<(event: RealtimeServerEvent | SpeechChunkEvent) => void> = [];
  private cancelled = new Set<string>();
  private timers = new Map<string, ReturnType<typeof setTimeout>[]>();

  public synthesizeStream(turnId: string, text: string): void {
    this.cancelled.delete(turnId);
    const now = Date.now();
    this.emit({ type: 'TTS_STARTED', turn_id: turnId, text, timestamp_ms: now });

    const sentences = this.splitSentences(text);
    const chunkTimers: ReturnType<typeof setTimeout>[] = [];
    let offset = 5;
    sentences.forEach((sentence, idx) => {
      const chunkTimer = setTimeout(() => {
        if (this.cancelled.has(turnId)) return;
        this.emit({
          type: 'AUDIO_CHUNK',
          turn_id: turnId,
          chunk_id: `${turnId}-chunk-${idx + 1}`,
          text: sentence,
          timestamp_ms: Date.now(),
        });
        this.emit({
          type: 'VISEME',
          turn_id: turnId,
          chunk_id: `${turnId}-viseme-${idx + 1}`,
          viseme: this.pickViseme(sentence),
          timestamp_ms: Date.now(),
        });
      }, offset);
      offset += 15;
      chunkTimers.push(chunkTimer);
    });

    const completeTimer = setTimeout(() => {
      if (this.cancelled.has(turnId)) return;
      this.emit({ type: 'TTS_COMPLETE', turn_id: turnId, timestamp_ms: Date.now() });
    }, offset + 5);
    chunkTimers.push(completeTimer);

    this.timers.set(turnId, chunkTimers);
  }

  public cancel(turnId: string): void {
    this.cancelled.add(turnId);
    const timers = this.timers.get(turnId);
    if (timers) {
      for (const t of timers) clearTimeout(t);
      this.timers.delete(turnId);
    }
    this.emit({ type: 'TTS_ERROR', turn_id: turnId, text: 'tts-cancelled', timestamp_ms: Date.now() });
  }

  public onEvent(handler: (event: RealtimeServerEvent | SpeechChunkEvent) => void): void {
    this.handlers.push(handler);
  }

  private splitSentences(text: string): string[] {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return ['(空回复)'];
    // 中文句号 / 感叹号 / 问号 / 换行 分句;至少给 1 段。
    const parts = trimmed.split(/(?<=[。!?！？\n])/).map((s) => s.trim()).filter((s) => s.length > 0);
    return parts.length > 0 ? parts : [trimmed];
  }

  private pickViseme(sentence: string): string {
    // 极简的 viseme 采样:根据首字符类别选择一个通用 viseme label。
    const first = sentence.charAt(0);
    if (/[aeiouāáǎàēéěèīíǐìōóǒòūúǔù]/i.test(first)) return 'V_OPEN';
    if (/[mnb]/i.test(first)) return 'V_LIP_CLOSE';
    return 'V_NEUTRAL';
  }

  private emit(event: RealtimeServerEvent | SpeechChunkEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
