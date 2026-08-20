/**
 * VBF-0: FamiliLayered2DRenderer
 *
 * Real visual body: draws approved Famili master image
 *
 * Constraints:
 *   - VBF-0 = base character only (no dynamic overlays yet)
 *   - Uses real ctx.drawImage() to render master artwork
 *   - Candidate asset: public/famili/famili-master-candidate.png
 *   - Keeps MM2-MM6 runtime ready for future VBF-1 integration
 *   - Fails explicitly on asset load failure (no geometry fallback)
 */

import { assertResolvedRendererProfile } from '@family/fpai-multimodal-runtime';
import type { ResolvedRendererProfile, PerformanceFrame } from '@family/fpai-multimodal-contracts';
import type { FamilyMouthShape } from './avatar2DRenderer';

export interface CanvasLikeContext {
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillStyle: any;
  strokeStyle: any;
  lineWidth: number;
  drawImage(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  fillText(text: string, x: number, y: number): void;
  font: string;
  textAlign: string;
  textBaseline: string;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(kind: '2d'): CanvasLikeContext | null;
}

export interface FamiliLayered2DRendererOptions {
  canvas: CanvasLike;
  profile: ResolvedRendererProfile;
  now?: () => number;
  assetPath?: string;
  mockImage?: (path: string) => HTMLImageElement | null;
}

export interface FamiliLayered2DRendererCapabilities {
  base_character: boolean;
  dynamic_expression: boolean;
  dynamic_gaze: boolean;
  dynamic_mouth: boolean;
  dynamic_blink: boolean;
  dynamic_gesture: boolean;
}

export interface FamiliLayered2DFrameSnapshot {
  asset_loaded: boolean;
  asset_error: string | null;
  canvas_width: number;
  canvas_height: number;
  frame_index: number;
}

/**
 * VBF-0: Real Famili base character via master image
 */
export class FamiliLayered2DRenderer {
  private readonly canvas: CanvasLike;
  private readonly profile: ResolvedRendererProfile;
  private readonly nowFn: () => number;
  private readonly assetPath: string;
  private readonly mockImageFn?: (path: string) => HTMLImageElement | null;

  private masterImage: HTMLImageElement | null = null;
  private assetLoadError: string | null = null;
  private frameIndex = 0;
  private loadPromise: Promise<void> | null = null;

  // VBF-0: No dynamic state tracked (pending VBF-1)
  // MM2-MM6 PerformanceFrame fields accepted but not visualized

  public constructor(opts: FamiliLayered2DRendererOptions) {
    this.canvas = opts.canvas;
    this.profile = assertResolvedRendererProfile(opts.profile);
    this.nowFn = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.assetPath = opts.assetPath ?? '/famili/famili-master-candidate.png';
    this.mockImageFn = opts.mockImage;

    // Start asset load immediately (non-blocking)
    this.preloadAsset();
  }

  /**
   * Preload master image asset
   * Non-blocking; asset may not be ready on first render
   */
  private preloadAsset(): void {
    if (this.loadPromise) return; // Already loading

    this.loadPromise = new Promise<void>((resolve) => {
      // If a mock image loader is provided (tests), use it
      if (this.mockImageFn) {
        const img = this.mockImageFn(this.assetPath);
        if (img) {
          this.masterImage = img;
          this.assetLoadError = null;
        } else {
          this.masterImage = null;
          this.assetLoadError = `Asset load failed: ${this.assetPath}`;
        }
        resolve();
        return;
      }

      // Browser environment: use real Image API
      if (typeof Image === 'undefined') {
        // No Image API available (test environment without mock)
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.masterImage = img;
        this.assetLoadError = null;
        resolve();
      };
      img.onerror = () => {
        this.masterImage = null;
        this.assetLoadError = `Asset load failed: ${this.assetPath}`;
        resolve();
      };
      img.src = this.assetPath;
    });
  }

  /**
   * VBF-0 capabilities: only base character supported
   */
  public getCapabilities(): FamiliLayered2DRendererCapabilities {
    return {
      base_character: true,
      dynamic_expression: false,
      dynamic_gaze: false,
      dynamic_mouth: false,
      dynamic_blink: false,
      dynamic_gesture: false,
    };
  }

  /**
   * MM2-MM6 PerformanceFrame accepted but VBF-0 has no-ops
   * Future VBF-1 will integrate dynamic layers
   */
  public applyPerformanceFrame(frame: PerformanceFrame): void {
    // VBF-0: Accept frame for MM2-MM6 compatibility
    // Visual effects deferred to VBF-1
  }

  public setExpressionOpenY(openY: number): void {
    // VBF-0: no-op
  }

  public setGazeOffset(offset: { x: number; y: number }): void {
    // VBF-0: no-op
  }

  public setMouthActivity(activity: number): void {
    // VBF-0: no-op
  }

  public setMouthShape(shape: FamilyMouthShape): void {
    // VBF-0: no-op
  }

  public triggerBlink(): void {
    // VBF-0: no-op (visual blink deferred to VBF-1)
  }

  public triggerNod(): void {
    // VBF-0: no-op (gesture animation deferred to VBF-1)
  }

  public snapshot(): FamiliLayered2DFrameSnapshot {
    return {
      asset_loaded: this.masterImage !== null,
      asset_error: this.assetLoadError,
      canvas_width: this.canvas.width,
      canvas_height: this.canvas.height,
      frame_index: this.frameIndex,
    };
  }

  public render(): FamiliLayered2DFrameSnapshot {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('FamiliLayered2DRenderer: canvas 2d context unavailable');
    }

    const W = this.canvas.width;
    const H = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#f6f4ff';
    ctx.fillRect(0, 0, W, H);

    if (this.assetLoadError) {
      // Asset failed: show error, NOT fallback to geometry
      ctx.fillStyle = '#d0333a';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FAMILI_ASSET_LOAD_FAILED', W / 2, H / 2);
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(this.assetLoadError, W / 2, H / 2 + 24);
      this.frameIndex += 1;
      return this.snapshot();
    }

    if (this.masterImage) {
      // Draw real master image
      // Center and scale to fit canvas while preserving aspect ratio
      const img = this.masterImage;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = W / H;

      let drawWidth: number;
      let drawHeight: number;
      let drawX: number;
      let drawY: number;

      if (imgAspect > canvasAspect) {
        // Image is wider: fit to canvas width
        drawWidth = W;
        drawHeight = W / imgAspect;
        drawX = 0;
        drawY = (H - drawHeight) / 2;
      } else {
        // Image is taller: fit to canvas height
        drawHeight = H;
        drawWidth = H * imgAspect;
        drawX = (W - drawWidth) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Asset still loading
      ctx.fillStyle = '#8f7bec';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('加载法咪莉...', W / 2, H / 2);
    }

    // Dev telemetry
    if (this.frameIndex % 60 === 0) {
      // Log every ~1 second
      const cap = this.getCapabilities();
      console.debug('[vbf0-renderer]', {
        asset_loaded: this.masterImage !== null,
        asset_error: this.assetLoadError,
        capabilities: cap,
        frame: this.frameIndex,
      });
    }

    this.frameIndex += 1;
    return this.snapshot();
  }

  /**
   * Check if asset is ready (for tests)
   */
  public isAssetReady(): boolean {
    return this.masterImage !== null && !this.assetLoadError;
  }

  /**
   * Get asset load error (for tests)
   */
  public getAssetError(): string | null {
    return this.assetLoadError;
  }
}
