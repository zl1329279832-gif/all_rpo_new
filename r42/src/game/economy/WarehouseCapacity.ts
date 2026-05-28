import type { ResourceStack, Tech } from '../../types';
import { ResourceType, TechType } from '../../types';
import { getTechBonus } from '../tech/TechTree';

export function getEffectiveCapacity(
  baseCapacity: number,
  techs: Tech[]
): number {
  return baseCapacity * (1 + getTechBonus(TechType.TransportCapacity, techs) * 0.3);
}

export function getWarehouseTotal(warehouse: ResourceStack[]): number {
  return warehouse.reduce((sum, s) => sum + s.amount, 0);
}

export function addToWarehouse(
  warehouse: ResourceStack[],
  type: ResourceType,
  amount: number,
  capacity: number,
  techs: Tech[]
): { warehouse: ResourceStack[]; overflow: number } {
  const effectiveCapacity = getEffectiveCapacity(capacity, techs);
  const currentTotal = getWarehouseTotal(warehouse);
  const availableSpace = effectiveCapacity - currentTotal;

  if (availableSpace <= 0) {
    return { warehouse, overflow: amount };
  }

  const toAdd = Math.min(amount, availableSpace);
  const overflow = amount - toAdd;

  const newWarehouse = warehouse.map(s => ({ ...s }));
  const existingStack = newWarehouse.find(s => s.type === type);

  if (existingStack) {
    existingStack.amount += toAdd;
  } else {
    newWarehouse.push({ type, amount: toAdd });
  }

  return { warehouse: newWarehouse, overflow };
}
