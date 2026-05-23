import { SceneManager } from './SceneManager';
import * as TWEEN from '@tweenjs/tween.js';

export type FrameCallback = (delta: number, elapsedTime: number) => void;

export interface RenderStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory?: number;
}

export class RenderLoop {
  private static instance: RenderLoop;
  private sceneManager: SceneManager;
  private callbacks: Set<FrameCallback> = new Set();
  private isRunning: boolean = false;
  private animationId: number | null = null;
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private targetFps: number = 60;
  private frameInterval: number = 1000 / 60;
  private lastFrameTime: number = 0;
  private frameTime: number = 0;
  private stats: RenderStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
  };
  private isPaused: boolean = false;
  private needsRender: boolean = true;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
  }

  static getInstance(): RenderLoop {
    if (!RenderLoop.instance) {
      RenderLoop.instance = new RenderLoop();
    }
    return RenderLoop.instance;
  }

  addCallback(callback: FrameCallback): void {
    this.callbacks.add(callback);
  }

  removeCallback(callback: FrameCallback): void {
    this.callbacks.delete(callback);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.needsRender = true;
  }

  setNeedsRender(): void {
    this.needsRender = true;
  }

  setTargetFps(fps: number): void {
    this.targetFps = fps;
    this.frameInterval = 1000 / fps;
  }

  getTargetFps(): number {
    return this.targetFps;
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (this.isPaused) {
      if (this.needsRender) {
        this.renderFrame(now);
        this.needsRender = false;
      }
      return;
    }

    if (elapsed >= this.frameInterval) {
      this.frameTime = elapsed;
      this.lastFrameTime = now - (elapsed % this.frameInterval);
      this.renderFrame(now);
      this.updateFps();
    }
  };

  private renderFrame(now: number): void {
    const frameStart = performance.now();
    const delta = this.sceneManager.getDelta();
    const elapsedTime = this.sceneManager.getElapsedTime();

    TWEEN.update(now);

    this.callbacks.forEach(callback => {
      try {
        callback(delta, elapsedTime);
      } catch (error) {
        console.error('Frame callback error:', error);
      }
    });

    this.sceneManager.render();

    const renderTime = performance.now() - frameStart;
    this.stats.frameTime = renderTime;

    const info = this.sceneManager.renderer.info;
    this.stats.drawCalls = info.render.calls;
    this.stats.triangles = info.render.triangles;

    if ((performance as any).memory) {
      this.stats.memory = (performance as any).memory.usedJSHeapSize;
    }
  }

  private updateFps(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.stats.fps = this.fps;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  getFps(): number {
    return this.fps;
  }

  getStats(): Readonly<RenderStats> {
    return this.stats;
  }

  getFrameTime(): number {
    return this.frameTime;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }
}
