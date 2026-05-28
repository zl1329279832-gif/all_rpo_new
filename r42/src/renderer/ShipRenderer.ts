import type { Ship, Sector } from '../types';
import { ShipType, ShipState } from '../types';

const SHIP_COLORS = {
  [ShipType.Mothership]: '#3b82f6',
  [ShipType.MiningShip]: '#f59e0b',
  [ShipType.TransportShip]: '#22c55e',
  [ShipType.DefenseShip]: '#ef4444'
};

const SHIP_SIZES = {
  [ShipType.Mothership]: 16,
  [ShipType.MiningShip]: 8,
  [ShipType.TransportShip]: 10,
  [ShipType.DefenseShip]: 9
};

export class ShipRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(ships: Ship[], sectors: Sector[], time: number, selectedShipId: string | null): void {
    const positions = new Map<string, { x: number; y: number }>();
    for (const ship of ships) {
      const pos = this.getShipPosition(ship, sectors);
      const key = `${pos.x},${pos.y}`;
      const offset = positions.get(key) || { x: 0, y: 0 };
      positions.set(key, { x: offset.x + 14, y: offset.y - 10 });
      const displayPos = { x: pos.x + offset.x, y: pos.y + offset.y };
      this.renderShip(ship, displayPos, time, ship.id === selectedShipId);
    }
  }

  private getShipPosition(ship: Ship, sectors: Sector[]): { x: number; y: number } {
    const current = sectors.find(s => s.id === ship.sectorId);
    if (!current) return { x: 0, y: 0 };
    if (ship.state !== ShipState.Moving || !ship.targetSectorId) {
      return { x: current.x, y: current.y };
    }
    const target = sectors.find(s => s.id === ship.targetSectorId);
    if (!target) return { x: current.x, y: current.y };
    const t = ship.moveProgress;
    return {
      x: current.x + (target.x - current.x) * t,
      y: current.y + (target.y - current.y) * t
    };
  }

  private renderShip(ship: Ship, pos: { x: number; y: number }, time: number, selected: boolean): void {
    const color = SHIP_COLORS[ship.type];
    const size = SHIP_SIZES[ship.type];

    if (ship.state === ShipState.Moving || ship.state === ShipState.Mining) {
      const enginePulse = Math.sin(time * 10) * 0.3 + 0.7;
      const gradient = this.ctx.createRadialGradient(pos.x, pos.y + size, 0, pos.x, pos.y + size, size * 2);
      gradient.addColorStop(0, '#60a5fa' + Math.floor(enginePulse * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, '#60a5fa00');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y + size, size * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = selected ? '#ffffff' : color;
    this.ctx.lineWidth = selected ? 2 : 1;

    if (ship.type === ShipType.Mothership) {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y - size);
      this.ctx.lineTo(pos.x + size, pos.y);
      this.ctx.lineTo(pos.x + size * 0.7, pos.y + size);
      this.ctx.lineTo(pos.x - size * 0.7, pos.y + size);
      this.ctx.lineTo(pos.x - size, pos.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (ship.type === ShipType.MiningShip) {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y - size);
      this.ctx.lineTo(pos.x + size * 0.8, pos.y + size * 0.6);
      this.ctx.lineTo(pos.x - size * 0.8, pos.y + size * 0.6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#d4a847';
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y - 1, size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (ship.type === ShipType.TransportShip) {
      this.ctx.fillRect(pos.x - size, pos.y - size * 0.6, size * 2, size * 1.2);
      this.ctx.strokeRect(pos.x - size, pos.y - size * 0.6, size * 2, size * 1.2);
    } else {
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x + size, pos.y);
      this.ctx.lineTo(pos.x - size, pos.y - size * 0.7);
      this.ctx.lineTo(pos.x - size * 0.5, pos.y);
      this.ctx.lineTo(pos.x - size, pos.y + size * 0.7);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    if (ship.state === ShipState.Mining) {
      const pulse = Math.sin(time * 8) * 0.4 + 0.6;
      this.ctx.strokeStyle = `rgba(212, 168, 71, ${pulse})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size + 4 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    if (ship.health < ship.maxHealth) {
      const barW = size * 2.5;
      const pct = ship.health / ship.maxHealth;
      this.ctx.fillStyle = '#374151';
      this.ctx.fillRect(pos.x - barW / 2, pos.y - size - 8, barW, 3);
      this.ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';
      this.ctx.fillRect(pos.x - barW / 2, pos.y - size - 8, barW * pct, 3);
    }
  }
}
