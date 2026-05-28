import type { GameEvent, Sector } from '../types';
import { EventType } from '../types';

export class EffectRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(events: GameEvent[], sectors: Sector[], time: number): void {
    for (const event of events) {
      if (event.resolved) continue;
      const sector = sectors.find(s => s.id === event.sectorId);
      if (!sector) continue;

      if (event.type === EventType.Asteroid) {
        this.renderAsteroidField(sector, time);
      } else if (event.type === EventType.HostileRaid) {
        this.renderHostileIndicator(sector, time);
      } else if (event.type === EventType.EnergyCrisis) {
        this.renderEnergyCrisis(time);
      }
    }
  }

  private renderAsteroidField(sector: Sector, time: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (time * 0.5 + i * Math.PI / 4) % (Math.PI * 2);
      const dist = 50 + Math.sin(time * 2 + i) * 10;
      const x = sector.x + Math.cos(angle) * dist;
      const y = sector.y + Math.sin(angle) * dist;
      const size = 4 + (i % 3) * 2;
      this.ctx.fillStyle = '#6b7280';
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#9ca3af';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  private renderHostileIndicator(sector: Sector, time: number): void {
    const pulse = Math.sin(time * 6) * 0.5 + 0.5;
    this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(sector.x, sector.y, 45 + pulse * 10, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚔', sector.x, sector.y + 8);
  }

  private renderEnergyCrisis(time: number): void {
    const alpha = Math.sin(time * 4) * 0.15 + 0.15;
    this.ctx.fillStyle = `rgba(234, 179, 8, ${alpha})`;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
}
