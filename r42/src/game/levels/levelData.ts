import { ShipType, ResourceType } from '../../types';
import type { LevelConfig } from '../../types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'level_1',
    name: '先驱者之路',
    description: '在陌生星域建立采矿前哨站，积累基础资源',
    sectorCount: 5,
    initialShips: [
      { type: ShipType.MiningShip, count: 2 },
      { type: ShipType.TransportShip, count: 1 },
      { type: ShipType.DefenseShip, count: 1 },
    ],
    objectives: [
      { type: ResourceType.Iron, amount: 200 },
      { type: ResourceType.Crystal, amount: 100 },
    ],
    guaranteedResources: [ResourceType.Iron, ResourceType.Crystal],
    eventFrequency: 0.008,
  },
  {
    id: 'level_2',
    name: '星域争夺',
    description: '深入资源富集区，面对更强的威胁夺取珍稀矿物',
    sectorCount: 7,
    initialShips: [
      { type: ShipType.MiningShip, count: 3 },
      { type: ShipType.TransportShip, count: 2 },
      { type: ShipType.DefenseShip, count: 2 },
    ],
    objectives: [
      { type: ResourceType.Iron, amount: 300 },
      { type: ResourceType.Crystal, amount: 200 },
      { type: ResourceType.Deuterium, amount: 100 },
    ],
    guaranteedResources: [ResourceType.Iron, ResourceType.Crystal, ResourceType.Deuterium],
    eventFrequency: 0.015,
  },
];
