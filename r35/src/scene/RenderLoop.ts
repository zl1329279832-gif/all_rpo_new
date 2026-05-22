import { SceneManager } from './SceneManager';
import * as TWEEN from '@tweenjs/tween.js';

export type FrameCallback = (delta: number, elapsedTime: number) => void;

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
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.sceneManager.getDelta();
    const elapsedTime = this.sceneManager.getElapsedTime();

    TWEEN.update();

    this.callbacks.forEach(callback => {
      try {
        callback(delta, elapsedTime);
      } catch (error) {
        console.error('Frame callback error:', error);
      }
    });

    this.sceneManager.render();
    this.updateFps();
  };

  private updateFps(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  getFps(): number {
    return this.fps;
  }

  setTargetFps(fps: number): void {
    this.targetFps = fps;
  }

  getTargetFps(): number {
    return this.targetFps;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }
}
