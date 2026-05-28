import type { Sector } from '../types';
import { SectorType, ResourceType } from '../types';

const SECTOR_COLORS = {
  [SectorType.Mothership]: '#3b82f6',
  [SectorType.Mining]: '#d4a847',
  [SectorType.Hostile]: '#ef4444',
  [SectorType.Neutral]: '#6b7280'
};

const RESOURCE_COLORS = {
  [ResourceType.Iron]: '#9ca3af',
  [ResourceType.Crystal]: '#60a5fa',
  [ResourceType.Deuterium]: '#22c55e',
  [ResourceType.DarkMatter]: '#a855f7'
};

export class StarMapRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(sectors: Sector[], time: number, selectedSectorId: string | null): void {
    this.renderConnections(sectors);
    for (const sector of sectors) {
      this.renderSector(sector, time, sector.id === selectedSectorId);
    }
  }

  private renderConnections(sectors: Sector[]): void {
    this.ctx.strokeStyle = 'rgba(100, 120, 160, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 6]);
    for (const sector of sectors) {
      for (const connId of sector.connections) {
        const other = sectors.find(s => s.id === connId);
        if (other && sector.id < connId) {
          this.ctx.beginPath();
          this.ctx.moveTo(sector.x, sector.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.stroke();
        }
      }
    }
    this.ctx.setLineDash([]);
  }

  private renderSector(sector: Sector, time: number, selected: boolean): void {
    const color = SECTOR_COLORS[sector.type] || '#6b7280';
    const pulse = Math.sin(time * 3 + sector.x * 0.05) * 0.15 + 0.85;
    const radius = sector.type === SectorType.Mothership ? 28 : 22;

    const gradient = this.ctx.createRadialGradient(sector.x, sector.y, 0, sector.x, sector.y, radius * 2.2);
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(1, color + '00');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(sector.x, sector.y, radius * 2.2 * pulse, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = selected ? '#ffffff' : color;
    this.ctx.beginPath();
    this.ctx.arc(sector.x, sector.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0a0e1a';
    this.ctx.beginPath();
    this.ctx.arc(sector.x, sector.y, radius - 4, 0, Math.PI * 2);
    this.ctx.fill();

    if (sector.resourceType && sector.type === SectorType.Mining) {
      const rc = RESOURCE_COLORS[sector.resourceType];
      this.ctx.fillStyle = rc;
      this.ctx.beginPath();
      this.ctx.arc(sector.x, sector.y, radius - 8, 0, Math.PI * 2);
      this.ctx.fill();
      const pct = Math.max(0, sector.resourceAmount / 800);
      this.ctx.fillStyle = '#0a0e1a';
      this.ctx.beginPath();
      this.ctx.moveTo(sector.x, sector.y);
      this.ctx.arc(sector.x, sector.y, radius - 8, -Math.PI / 2, -Math.PI / 2 + (1 - pct) * Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.font = '11px Rajdhani, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(sector.name, sector.x, sector.y + radius + 16);

    if (sector.hasAsteroid) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.fillText('⚠', sector.x + radius, sector.y - radius);
    }
  }
}
