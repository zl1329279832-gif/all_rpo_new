import type { Ship, Sector, Tech } from '../../types';
import { ResourceType, ShipState, TechType } from '../../types';
import { getTechBonus } from '../tech/TechTree';

export interface MiningEvent {
  shipId: string;
  resourceType: ResourceType;
  amount: number;
}

export function processMining(
  ships: Ship[],
  sectors: Sector[],
  techs: Tech[],
  dt: number
): MiningEvent[] {
  const events: MiningEvent[] = [];
  const bonus = getTechBonus(TechType.MiningEfficiency, techs);

  for (const ship of ships) {
    if (ship.state !== ShipState.Mining) continue;

    const sector = sectors.find(s => s.id === ship.sectorId);
    if (!sector || sector.resourceType === null) continue;

    const cargoTotal = ship.cargo.reduce((sum, s) => sum + s.amount, 0);
    if (cargoTotal >= ship.cargoCapacity) continue;

    if (sector.resourceAmount <= 0) continue;

    const speedFactor = ship.speedMultiplier ?? 1;
    ship.miningProgress +=
      ship.miningRate * (1 + bonus * 0.25) * speedFactor * dt;

    if (ship.miningProgress >= 10) {
      const rawAmount = Math.ceil(ship.miningRate * 0.5 * (1 + bonus));
      const cargoSpace = ship.cargoCapacity - cargoTotal;
      const actualAmount = Math.min(rawAmount, cargoSpace, sector.resourceAmount);

      if (actualAmount <= 0) continue;

      ship.miningProgress -= 10;
      sector.resourceAmount -= actualAmount;

      const existingStack = ship.cargo.find(s => s.type === sector.resourceType);
      if (existingStack) {
        existingStack.amount += actualAmount;
      } else {
        ship.cargo.push({ type: sector.resourceType, amount: actualAmount });
      }

      events.push({
        shipId: ship.id,
        resourceType: sector.resourceType,
        amount: actualAmount,
      });
    }
  }

  return events;
}
