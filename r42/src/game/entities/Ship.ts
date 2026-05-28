import type { Ship, Sector } from '../../types';
import { ShipType, ShipState } from '../../types';

const SHIP_STATS: Record<ShipType, { speed: number; cargoCapacity: number; health: number; attack: number; miningRate: number }> = {
  [ShipType.Mothership]: { speed: 0, cargoCapacity: 500, health: 1000, attack: 0, miningRate: 0 },
  [ShipType.MiningShip]: { speed: 2, cargoCapacity: 100, health: 200, attack: 0, miningRate: 5 },
  [ShipType.TransportShip]: { speed: 1.5, cargoCapacity: 300, health: 150, attack: 0, miningRate: 0 },
  [ShipType.DefenseShip]: { speed: 1, cargoCapacity: 50, health: 300, attack: 15, miningRate: 0 },
};

export function getCargoTotal(ship: Ship): number {
  return ship.cargo.reduce((sum, s) => sum + s.amount, 0);
}

export function createShip(type: ShipType, id: string, name: string, sectorId: string): Ship {
  const stats = SHIP_STATS[type];
  return {
    id,
    name,
    type,
    state: ShipState.Idle,
    sectorId,
    targetSectorId: null,
    speed: stats.speed,
    speedMultiplier: 1,
    moveProgress: 0,
    cargo: [],
    cargoCapacity: stats.cargoCapacity,
    health: stats.health,
    maxHealth: stats.health,
    attack: stats.attack,
    miningRate: stats.miningRate,
    miningProgress: 0,
  };
}

export function moveShip(ship: Ship, dt: number, sectors: Sector[]): boolean {
  if (ship.state !== ShipState.Moving && ship.state !== ShipState.Transporting) return false;
  if (!ship.targetSectorId) return false;

  const fromSector = sectors.find(s => s.id === ship.sectorId);
  const toSector = sectors.find(s => s.id === ship.targetSectorId);
  if (!fromSector || !toSector) return false;

  const dx = toSector.x - fromSector.x;
  const dy = toSector.y - fromSector.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const speed = ship.speed * ship.speedMultiplier * 50;
  ship.moveProgress += (speed * dt) / distance;

  if (ship.moveProgress >= 1) {
    ship.sectorId = ship.targetSectorId;
    ship.targetSectorId = null;
    ship.moveProgress = 0;
    ship.state = ShipState.Idle;
    return true;
  }

  return false;
}
