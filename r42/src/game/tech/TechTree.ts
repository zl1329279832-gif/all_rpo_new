import type { Tech, ResourceStack } from '../../types';
import { TechType, ResourceType } from '../../types';

function computeTechCosts(type: TechType, level: number): ResourceStack[] {
  const l = level + 1;
  switch (type) {
    case TechType.MiningEfficiency:
      return [
        { type: ResourceType.Iron, amount: 30 * l },
        { type: ResourceType.Crystal, amount: 20 * l },
      ];
    case TechType.TransportCapacity:
      return [
        { type: ResourceType.Iron, amount: 25 * l },
        { type: ResourceType.Crystal, amount: 25 * l },
      ];
    case TechType.DefensePower:
      return [
        { type: ResourceType.Iron, amount: 20 * l },
        { type: ResourceType.Deuterium, amount: 15 * l },
      ];
    case TechType.EnergyEfficiency:
      return [
        { type: ResourceType.Crystal, amount: 20 * l },
        { type: ResourceType.Deuterium, amount: 20 * l },
      ];
  }
}

export function getTechBonus(type: TechType, techs: Tech[]): number {
  const tech = techs.find(t => t.type === type);
  return tech ? tech.level : 0;
}

export function createDefaultTechs(): Tech[] {
  const defs: { type: TechType; description: string }[] = [
    {
      type: TechType.MiningEfficiency,
      description: 'Increases mining speed by 25% per level',
    },
    {
      type: TechType.TransportCapacity,
      description: 'Increases warehouse capacity by 30% per level',
    },
    {
      type: TechType.DefensePower,
      description: 'Increases defense ship attack by 20% per level',
    },
    {
      type: TechType.EnergyEfficiency,
      description: 'Reduces energy consumption by 20% per level',
    },
  ];

  return defs.map(d => ({
    type: d.type,
    level: 0,
    maxLevel: 5,
    costs: computeTechCosts(d.type, 0),
    description: d.description,
  }));
}

export function canUpgradeTech(tech: Tech, warehouse: ResourceStack[]): boolean {
  if (tech.level >= tech.maxLevel) return false;
  return tech.costs.every(cost => {
    const stack = warehouse.find(s => s.type === cost.type);
    return stack !== undefined && stack.amount >= cost.amount;
  });
}

export function upgradeTech(tech: Tech, warehouse: ResourceStack[]): ResourceStack[] {
  if (!canUpgradeTech(tech, warehouse)) return warehouse;

  const newWarehouse = warehouse.map(s => ({ ...s }));

  for (const cost of tech.costs) {
    const stack = newWarehouse.find(s => s.type === cost.type);
    if (stack) {
      stack.amount -= cost.amount;
    }
  }

  tech.level += 1;
  tech.costs = computeTechCosts(tech.type, tech.level);

  return newWarehouse.filter(s => s.amount > 0);
}
