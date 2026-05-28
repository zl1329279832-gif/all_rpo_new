import type { GameState } from '../../types';
import { ShipType, ShipState, TechType } from '../../types';
import { getTechBonus } from '../tech/TechTree';

export function consumeEnergy(state: GameState, dt: number): number {
  const { techs, ships } = state;

  const nonIdleCount = ships.filter(s => s.state !== ShipState.Idle).length;
  const baseConsumption = nonIdleCount * 0.5 * dt;
  const efficiencyMultiplier =
    1 / (1 + getTechBonus(TechType.EnergyEfficiency, techs) * 0.2);
  const consumption = baseConsumption * efficiencyMultiplier;

  const regen = 2 * dt;

  state.energy = state.energy - consumption + regen;

  const isLowEnergy = state.energy <= 0;
  for (const ship of ships) {
    const isMothership = ship.type === ShipType.Mothership;
    ship.speedMultiplier = isLowEnergy && !isMothership ? 0.5 : 1;
  }

  return consumption;
}

export function getEnergyRate(state: GameState): number {
  const { techs, ships } = state;

  const nonIdleCount = ships.filter(s => s.state !== ShipState.Idle).length;
  const consumptionPerSec =
    nonIdleCount * 0.5 / (1 + getTechBonus(TechType.EnergyEfficiency, techs) * 0.2);
  const regenPerSec = 2;

  return regenPerSec - consumptionPerSec;
}
