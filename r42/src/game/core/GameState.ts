import {
  ResourceType,
  SectorType,
  ShipType,
  ShipState,
  TechType,
  GamePhase,
} from '../../types';
import type {
  Tech,
  GameState,
  LevelConfig,
} from '../../types';

const TECH_DEFINITIONS: Omit<Tech, 'level'>[] = [
  {
    type: TechType.MiningEfficiency,
    maxLevel: 5,
    costs: [
      { type: ResourceType.Iron, amount: 50 },
      { type: ResourceType.Crystal, amount: 30 },
    ],
    description: 'Increases mining rate by 20% per level',
  },
  {
    type: TechType.TransportCapacity,
    maxLevel: 5,
    costs: [
      { type: ResourceType.Iron, amount: 40 },
      { type: ResourceType.Deuterium, amount: 20 },
    ],
    description: 'Increases transport cargo capacity by 25% per level',
  },
  {
    type: TechType.DefensePower,
    maxLevel: 5,
    costs: [
      { type: ResourceType.Iron, amount: 60 },
      { type: ResourceType.DarkMatter, amount: 10 },
    ],
    description: 'Increases defense ship attack by 15% per level',
  },
  {
    type: TechType.EnergyEfficiency,
    maxLevel: 5,
    costs: [
      { type: ResourceType.Crystal, amount: 40 },
      { type: ResourceType.Deuterium, amount: 30 },
    ],
    description: 'Reduces energy consumption by 10% per level',
  },
];

function createTechs(): Tech[] {
  return TECH_DEFINITIONS.map((def) => ({
    ...def,
    level: 0,
  }));
}

export function createInitialGameState(config: LevelConfig): GameState {
  return {
    levelId: config.id,
    phase: GamePhase.Playing,
    sectors: [],
    ships: [],
    mothershipId: '',
    warehouse: [],
    warehouseCapacity: 1000,
    energy: 100,
    maxEnergy: 100,
    energyRate: 0.5,
    techs: createTechs(),
    events: [],
    activeEvent: null,
    gameTime: 0,
    losses: 0,
    lastSaveTime: 0,
  };
}
