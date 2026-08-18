/**
 * MM1-B1.1 · Avatar2DRenderer (§G)
 *
 * Family 自家 Local 2D 数字人的可视化实现。
 *
 * 特性:
 *   - Canvas 2D 或 SVG。当前实现: Canvas 2D。
 *   - 无 Live2D / Three.js / 商业 Avatar SDK / GPU 依赖。
 *   - 支持 8 MouthShape, 6 状态 (RESTING/LISTENING/THINKING/SPEAKING/INTERRUPTED/HUMAN_GATE),
 *     blink, small nod, small open hand, CALM_WARM / CALM_SERIOUS 表情。
 *
 * 视觉风格:
 *   - 简洁矢量: 头(圆) + 眼(两个椭圆) + 嘴(根据 MouthShape 绘制) + 一只手(可选)。
 *   - 用色: --accent 主体, --user-panel 底色。可读性优先, 不追求写实。
 *
 * 契约:
 *   - 每次 setState/setMouthShape/setExpression/triggerNod 等只更新数据模型。
 *   - render() 由外部 rAF 循环调用, 保证真正有像素变化。
 *   - 单元测试中提供 fake canvas / context, 记录 draw call 序列, 断言像素级 op 存在。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type FamilyMouthShape =
  | 'REST'
  | 'OPEN_SMALL'
  | 'OPEN_MEDIUM'
  | 'OPEN_WIDE'
  | 'ROUND'
  | 'NARROW'
  | 'SMILE_SPEECH'
  | 'CLOSED';

export type FamilyAvatarState =
  | 'RESTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'HUMAN_GATE';

export type FamilyExpression =
  | 'CALM_WARM'
  | 'CALM_SERIOUS'
  | 'GENTLE_ENCOURAGING'
  | 'CALM_CAUTIOUS'
  | 'WARM_FIRM';

export type FamilyGesture = 'NONE' | 'SMALL_NOD' | 'SMALL_OPEN_HAND';

export const MOUTH_SHAPES: FamilyMouthShape[] = [
  'REST', 'OPEN_SMALL', 'OPEN_MEDIUM', 'OPEN_WIDE',
  'ROUND', 'NARROW', 'SMILE_SPEECH', 'CLOSED',
];

export interface CanvasLikeContext {
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number, anticlockwise?: boolean): void;
  ellipse?(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number, anticlockwise?: boolean): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(a: number): void;
  fillStyle: any;
  strokeStyle: any;
  lineWidth: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  fillText(text: string, x: number, y: number): void;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(kind: '2d'): CanvasLikeContext | null;
}

export interface Avatar2DRendererOptions {
  canvas: CanvasLike;
  now?: () => number;
  profile?: { character_id?: string; identity_version?: string }; // MM2: Immutable identity reference
}

export interface Avatar2DFrameSnapshot {
  state: FamilyAvatarState;
  expression: FamilyExpression;
  mouth_shape: FamilyMouthShape;
  gesture: FamilyGesture;
  blink_phase: number;    // 0..1, 1 = 完全闭合
  nod_phase: number;      // 0..1
  frame_index: number;
}

/**
 * 状态色板 (基于 --accent 6c4df6 与 --risk-* 系列)。
 */
const STATE_COLORS: Record<FamilyAvatarState, string> = {
  RESTING: '#a89cf5',
  LISTENING: '#6c4df6',
  THINKING: '#8f7bec',
  SPEAKING: '#5a37e3',
  INTERRUPTED: '#d0333a',
  HUMAN_GATE: '#f6a723',
};

const EXPRESSION_EYE: Record<FamilyExpression, { openY: number }> = {
  CALM_WARM: { openY: 0.55 },
  CALM_SERIOUS: { openY: 0.35 },
  GENTLE_ENCOURAGING: { openY: 0.60 },
  CALM_CAUTIOUS: { openY: 0.42 },
  WARM_FIRM: { openY: 0.48 },
};

export class Avatar2DRenderer {
  private readonly canvas: CanvasLike;
  private readonly nowFn: () => number;
  private readonly profile?: { character_id?: string; identity_version?: string }; // MM2: Immutable identity
  private state: FamilyAvatarState = 'RESTING';
  private expression: FamilyExpression = 'CALM_WARM';
  private mouthShape: FamilyMouthShape = 'REST';
  private gesture: FamilyGesture = 'NONE';
  private frameIndex = 0;

  private blinkStartMs = 0;
  private blinkActive = false;
  private nodStartMs = 0;
  private nodActive = false;

  private lastBlinkTriggerMs = 0;
  private readonly blinkDurationMs = 120;
  private readonly nodDurationMs = 400;

  public constructor(opts: Avatar2DRendererOptions) {
    this.canvas = opts.canvas;
    this.nowFn = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.profile = opts.profile; // MM2: Store immutable identity reference
  }

  public setState(s: FamilyAvatarState): void { this.state = s; }
  public setExpression(e: FamilyExpression): void { this.expression = e; }
  public setMouthShape(m: FamilyMouthShape): void { this.mouthShape = m; }
  public setGesture(g: FamilyGesture): void { this.gesture = g; }

  public triggerBlink(): void {
    this.blinkStartMs = this.nowFn();
    this.blinkActive = true;
    this.lastBlinkTriggerMs = this.blinkStartMs;
  }
  public triggerNod(): void {
    this.nodStartMs = this.nowFn();
    this.nodActive = true;
    this.gesture = 'SMALL_NOD';
  }

  public snapshot(): Avatar2DFrameSnapshot {
    return {
      state: this.state,
      expression: this.expression,
      mouth_shape: this.mouthShape,
      gesture: this.gesture,
      blink_phase: this.computeBlinkPhase(),
      nod_phase: this.computeNodPhase(),
      frame_index: this.frameIndex,
    };
  }

  /** 由外部 rAF 循环调用一次。 */
  public render(): Avatar2DFrameSnapshot {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Avatar2DRenderer: canvas 2d context unavailable');
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 自动 blink: 每 ~3s 触发一次(此实现简单化, 供 demo 用)
    const now = this.nowFn();
    if (!this.blinkActive && now - this.lastBlinkTriggerMs > 3000) {
      this.triggerBlink();
    }

    // 结束 blink / nod
    if (this.blinkActive && now - this.blinkStartMs > this.blinkDurationMs) {
      this.blinkActive = false;
    }
    if (this.nodActive && now - this.nodStartMs > this.nodDurationMs) {
      this.nodActive = false;
      // NOD 结束后如果 gesture 还是 SMALL_NOD, 回落到 NONE
      if (this.gesture === 'SMALL_NOD') this.gesture = 'NONE';
    }

    ctx.clearRect(0, 0, W, H);

    // 底色
    ctx.fillStyle = '#f6f4ff';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const headR = Math.min(W, H) * 0.28;

    // Nod 抖动 (点头)
    const nodOffset = this.nodActive ? Math.sin((now - this.nodStartMs) / this.nodDurationMs * Math.PI) * headR * 0.10 : 0;

    // 头
    ctx.save();
    ctx.translate(cx, cy + nodOffset);
    ctx.fillStyle = STATE_COLORS[this.state];
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    const eyeMeta = EXPRESSION_EYE[this.expression];
    const eyeY = -headR * 0.15;
    const eyeDx = headR * 0.35;
    const eyeRx = headR * 0.11;
    const blinkPhase = this.computeBlinkPhase();
    const eyeRy = eyeRx * eyeMeta.openY * (1 - blinkPhase);
    ctx.fillStyle = '#221c3a';
    for (const sx of [-eyeDx, eyeDx]) {
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(sx, eyeY, eyeRx, Math.max(1, eyeRy), 0, 0, Math.PI * 2);
      } else {
        ctx.arc(sx, eyeY, Math.max(1, eyeRy), 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 嘴巴 (根据 MouthShape)
    this.drawMouth(ctx, 0, headR * 0.30, headR);

    ctx.restore();

    // 手 (Small Open Hand, 可选)
    if (this.gesture === 'SMALL_OPEN_HAND') {
      ctx.save();
      ctx.translate(cx + headR * 1.1, cy + headR * 0.30);
      ctx.fillStyle = STATE_COLORS[this.state];
      ctx.beginPath();
      ctx.arc(0, 0, headR * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 状态文字 (dev-friendly, 但也让 user 看到)
    ctx.fillStyle = '#221c3a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`state=${this.state} · mouth=${this.mouthShape}`, cx, H - 22);

    this.frameIndex += 1;
    return this.snapshot();
  }

  private drawMouth(ctx: CanvasLikeContext, x: number, y: number, headR: number): void {
    ctx.fillStyle = '#2a1f4d';
    ctx.strokeStyle = '#2a1f4d';
    ctx.lineWidth = 2;
    switch (this.mouthShape) {
      case 'REST':
      case 'CLOSED': {
        ctx.beginPath();
        ctx.moveTo(x - headR * 0.20, y);
        ctx.quadraticCurveTo(x, y + headR * 0.04, x + headR * 0.20, y);
        ctx.stroke();
        break;
      }
      case 'OPEN_SMALL': {
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, headR * 0.10, headR * 0.06, 0, 0, Math.PI * 2);
        else ctx.arc(x, y, headR * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'OPEN_MEDIUM': {
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, headR * 0.16, headR * 0.10, 0, 0, Math.PI * 2);
        else ctx.arc(x, y, headR * 0.13, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'OPEN_WIDE': {
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, headR * 0.22, headR * 0.16, 0, 0, Math.PI * 2);
        else ctx.arc(x, y, headR * 0.19, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'ROUND': {
        ctx.beginPath();
        ctx.arc(x, y, headR * 0.10, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'NARROW': {
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, headR * 0.06, headR * 0.10, 0, 0, Math.PI * 2);
        else ctx.arc(x, y, headR * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'SMILE_SPEECH': {
        ctx.beginPath();
        ctx.moveTo(x - headR * 0.24, y - headR * 0.02);
        ctx.quadraticCurveTo(x, y + headR * 0.10, x + headR * 0.24, y - headR * 0.02);
        ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath();
        ctx.moveTo(x - headR * 0.20, y);
        ctx.lineTo(x + headR * 0.20, y);
        ctx.stroke();
      }
    }
  }

  private computeBlinkPhase(): number {
    if (!this.blinkActive) return 0;
    const now = this.nowFn();
    const t = (now - this.blinkStartMs) / this.blinkDurationMs;
    if (t <= 0.5) return t * 2;
    if (t >= 1) return 0;
    return (1 - t) * 2;
  }
  private computeNodPhase(): number {
    if (!this.nodActive) return 0;
    const now = this.nowFn();
    const t = (now - this.nodStartMs) / this.nodDurationMs;
    return Math.max(0, Math.min(1, t));
  }
}
