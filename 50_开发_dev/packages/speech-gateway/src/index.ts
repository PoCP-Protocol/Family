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

export class FakeSpeechToTextGateway implements SpeechToTextGateway {
  private handlers: Array<(event: RealtimeServerEvent | TranscriptEvent) => void> = [];

  public startSession(turnId: string): void {
    this.emit({ kind: 'STATE_CHANGED', turn_id: turnId, payload: { state: 'TRANSCRIBING' } });
  }

  public pushAudioChunk(turnId: string, chunk: Uint8Array): void {
    void chunk;
    this.emit({ type: 'TRANSCRIPT_PARTIAL', turn_id: turnId, text: '正在听你说...', timestamp_ms: Date.now() });
  }

  public finishInput(turnId: string): void {
    this.emit({ type: 'TRANSCRIPT_FINAL', turn_id: turnId, text: '我儿子每天回来就玩手机。', timestamp_ms: Date.now() });
  }

  public cancel(turnId: string): void {
    this.emit({ kind: 'ERROR', turn_id: turnId, payload: { reason: 'cancelled' } });
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

export class FakeTextToSpeechGateway implements TextToSpeechGateway {
  private handlers: Array<(event: RealtimeServerEvent | SpeechChunkEvent) => void> = [];

  public synthesizeStream(turnId: string, text: string): void {
    this.emit({ type: 'AUDIO_CHUNK', turn_id: turnId, chunk_id: `${turnId}-chunk-1`, text, timestamp_ms: Date.now() });
    this.emit({ type: 'AUDIO_CHUNK', turn_id: turnId, chunk_id: `${turnId}-chunk-2`, text: `${text}（继续）`, timestamp_ms: Date.now() + 10 });
  }

  public cancel(turnId: string): void {
    this.emit({ kind: 'ERROR', turn_id: turnId, payload: { reason: 'tts-cancelled' } });
  }

  public onEvent(handler: (event: RealtimeServerEvent | SpeechChunkEvent) => void): void {
    this.handlers.push(handler);
  }

  private emit(event: RealtimeServerEvent | SpeechChunkEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
