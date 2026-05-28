import type { GameState } from '../types';

export class HUDRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(state: GameState, time: number): void {
    // Placeholder - HUD will be rendered by Vue components
    // This can be used for in-canvas text overlays if needed
  }
}
