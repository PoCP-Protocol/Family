/**
 * MM1-B1.1 · Real Mic UI (§I)
 *
 * 契约:
 *   - 默认 (FPAI_REAL_SPEECH_ENABLED=NO) 下**不主动**请求 mic 权限, 只呈现 disabled 按钮。
 *   - "开始说话" 触发 requestPermission → startCapture; "停止说话" 触发 stopCapture。
 *   - 状态严格枚举 MicUiState。
 *   - 不修改 frozen client.ts / index.html。挂载点由 addon entry (mm1b1AddonEntry.ts) 注入。
 *   - 不直接调用真实 RealMicClient 里的 AudioWorklet, 而是通过 caller 传入的
 *     start/stop 抽象函数(实际由 addon entry 组装出真实实现)。
 */

export type MicUiState =
  | 'MIC_DISABLED'
  | 'MIC_REQUESTING'
  | 'MIC_READY'
  | 'MIC_STREAMING'
  | 'MIC_STOPPING'
  | 'MIC_ERROR';

export interface MicUiHost {
  /** 状态变化回调, 由 host 反映到 DOM。 */
  onStateChange(handler: (state: MicUiState, meta?: { reason?: string }) => void): void;
  /** UI-side 请求开始 capture, 由 addon entry 组装出的 startFn 执行。 */
  requestStart(): Promise<void>;
  requestStop(): Promise<void>;
}

export interface RealMicUiOptions {
  featureFlag: 'YES' | 'NO';
  startFn: () => Promise<void>;
  stopFn: () => Promise<void>;
}

export class RealMicUi implements MicUiHost {
  private state: MicUiState;
  private readonly featureEnabled: boolean;
  private readonly startFn: () => Promise<void>;
  private readonly stopFn: () => Promise<void>;
  private handlers: Array<(s: MicUiState, m?: { reason?: string }) => void> = [];

  public constructor(opts: RealMicUiOptions) {
    this.featureEnabled = opts.featureFlag === 'YES';
    this.state = this.featureEnabled ? 'MIC_READY' : 'MIC_DISABLED';
    this.startFn = opts.startFn;
    this.stopFn = opts.stopFn;
  }

  public getState(): MicUiState { return this.state; }

  public onStateChange(handler: (state: MicUiState, meta?: { reason?: string }) => void): void {
    this.handlers.push(handler);
  }

  public async requestStart(): Promise<void> {
    if (!this.featureEnabled) {
      this.transition('MIC_DISABLED', { reason: 'FPAI_REAL_SPEECH_ENABLED=NO' });
      return;
    }
    if (this.state === 'MIC_STREAMING' || this.state === 'MIC_REQUESTING') return;
    this.transition('MIC_REQUESTING');
    try {
      await this.startFn();
      this.transition('MIC_STREAMING');
    } catch (err) {
      this.transition('MIC_ERROR', { reason: String(err) });
    }
  }

  public async requestStop(): Promise<void> {
    if (this.state !== 'MIC_STREAMING') return;
    this.transition('MIC_STOPPING');
    try {
      await this.stopFn();
      this.transition('MIC_READY');
    } catch (err) {
      this.transition('MIC_ERROR', { reason: String(err) });
    }
  }

  private transition(next: MicUiState, meta?: { reason?: string }): void {
    this.state = next;
    for (const h of this.handlers) h(next, meta);
  }
}
