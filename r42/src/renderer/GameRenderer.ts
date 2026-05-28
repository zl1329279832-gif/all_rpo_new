import type { GameState, Ship, Sector } from '../types';
import { ShipType, ShipState, SectorType } from '../types';

const SECTOR_COLORS: Record<SectorType, string> = {
  [SectorType.Mothership]: '#4ade80',
  [SectorType.Mining]: '#60a5fa',
  [SectorType.Hostile]: '#f87171',
  [SectorType.Neutral]: '#a78bfa',
};

const SHIP_COLORS: Record<ShipType, string> = {
  [ShipType.Mothership]: '#fbbf24',
  [ShipType.MiningShip]: '#38bdf8',
  [ShipType.TransportShip]: '#34d399',
  [ShipType.DefenseShip]: '#fb923c',
};

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.offsetX = width / 2;
    this.offsetY = height / 2;
    this.scale = Math.min(width, height) / 800;
  }

  render(state: GameState, selectedSectorId: string | null, selectedShipId: string | null, dt: number): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawConnections(state.sectors);
    for (const sector of state.sectors) {
      this.drawSector(sector, sector.id === selectedSectorId);
    }
    for (const ship of state.ships) {
      this.drawShip(ship, state, ship.id === selectedShipId);
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, this.width / 2);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#0f0a1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % this.width;
      const y = (i * 89.3) % this.height;
      const r = (i % 3) * 0.5 + 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawConnections(sectors: Sector[]): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    const drawn = new Set<string>();
    for (const sector of sectors) {
      for (const connId of sector.connections) {
        const key = [sector.id, connId].sort().join('-');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const conn = sectors.find(s => s.id === connId);
        if (!conn) continue;
        const x1 = sector.x * this.scale + this.offsetX;
        const y1 = sector.y * this.scale + this.offsetY;
        const x2 = conn.x * this.scale + this.offsetX;
        const y2 = conn.y * this.scale + this.offsetY;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    }
  }

  private drawSector(sector: Sector, selected: boolean): void {
    const x = sector.x * this.scale + this.offsetX;
    const y = sector.y * this.scale + this.offsetY;
    const radius = 20 * this.scale;
    const color = SECTOR_COLORS[sector.type];
    if (selected) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '80');
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `${12 * this.scale}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(sector.name, x, y + radius + 16 * this.scale);
    if (sector.resourceAmount > 0 && sector.resourceType) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = `${10 * this.scale}px sans-serif`;
      this.ctx.fillText(`${sector.resourceAmount}`, x, y + radius + 30 * this.scale);
    }
  }

  private drawShip(ship: Ship, state: GameState, selected: boolean): void {
    const pos = this.getShipPosition(ship, state);
    const size = ship.type === ShipType.Mothership ? 14 : 8;
    const color = SHIP_COLORS[ship.type];
    if (selected) {
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size + 6, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    this.ctx.beginPath();
    if (ship.type === ShipType.Mothership) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = pos.x + Math.cos(angle) * size * this.scale;
        const py = pos.y + Math.sin(angle) * size * this.scale;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
    } else {
      this.ctx.arc(pos.x, pos.y, size * this.scale, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = color;
    this.ctx.fill();
    if (ship.state === ShipState.Mining) {
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, (size + 4) * this.scale, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  getShipPosition(ship: Ship, state: GameState): { x: number; y: number } {
    const fromSector = state.sectors.find(s => s.id === ship.sectorId);
    const toSector = ship.targetSectorId ? state.sectors.find(s => s.id === ship.targetSectorId) : null;
    if (!fromSector) return { x: this.offsetX, y: this.offsetY };
    if (!toSector || ship.moveProgress === 0) {
      return {
        x: fromSector.x * this.scale + this.offsetX,
        y: fromSector.y * this.scale + this.offsetY,
      };
    }
    const t = ship.moveProgress;
    const x = fromSector.x + (toSector.x - fromSector.x) * t;
    const y = fromSector.y + (toSector.y - fromSector.y) * t;
    return { x: x * this.scale + this.offsetX, y: y * this.scale + this.offsetY };
  }

  getSectorAt(px: number, py: number, state: GameState): string | null {
    for (const sector of state.sectors) {
      const x = sector.x * this.scale + this.offsetX;
      const y = sector.y * this.scale + this.offsetY;
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy <= 25 * 25 * this.scale * this.scale) {
        return sector.id;
      }
    }
    return null;
  }

  getShipAt(px: number, py: number, state: GameState): string | null {
    for (const ship of state.ships) {
      const pos = this.getShipPosition(ship, state);
      const size = ship.type === ShipType.Mothership ? 14 : 8;
      const dx = px - pos.x;
      const dy = py - pos.y;
      if (dx * dx + dy * dy <= (size + 4) * (size + 4) * this.scale * this.scale) {
        return ship.id;
      }
    }
    return null;
  }
}
