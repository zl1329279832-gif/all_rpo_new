export enum ResourceType {
  Iron = 'iron',
  Crystal = 'crystal',
  Deuterium = 'deuterium',
  DarkMatter = 'dark_matter',
}

export enum ShipType {
  Mothership = 'mothership',
  MiningShip = 'mining_ship',
  TransportShip = 'transport_ship',
  DefenseShip = 'defense_ship',
}

export enum ShipState {
  Idle = 'idle',
  Moving = 'moving',
  Mining = 'mining',
  Transporting = 'transporting',
  Fighting = 'fighting',
}

export enum SectorType {
  Mothership = 'mothership',
  Mining = 'mining',
  Hostile = 'hostile',
  Neutral = 'neutral',
}

export enum EventType {
  Asteroid = 'asteroid',
  EnergyCrisis = 'energy_crisis',
  HostileRaid = 'hostile_raid',
}

export enum TechType {
  MiningEfficiency = 'mining_efficiency',
  TransportCapacity = 'transport_capacity',
  DefensePower = 'defense_power',
  EnergyEfficiency = 'energy_efficiency',
}

export enum GamePhase {
  Playing = 'playing',
  Paused = 'paused',
  Completed = 'completed',
  Event = 'event',
}

export interface ResourceStack {
  type: ResourceType;
  amount: number;
}

export interface Sector {
  id: string;
  name: string;
  x: number;
  y: number;
  type: SectorType;
  resourceType?: ResourceType;
  resourceAmount: number;
  connections: string[];
  hasAsteroid: boolean;
}

export interface Ship {
  id: string;
  name: string;
  type: ShipType;
  state: ShipState;
  sectorId: string;
  targetSectorId: string | null;
  speed: number;
  speedMultiplier: number;
  moveProgress: number;
  cargo: ResourceStack[];
  cargoCapacity: number;
  health: number;
  maxHealth: number;
  attack: number;
  miningRate: number;
  miningProgress: number;
}

export interface Tech {
  type: TechType;
  level: number;
  maxLevel: number;
  costs: ResourceStack[];
  description: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  sectorId: string;
  description: string;
  timestamp: number;
  resolved: boolean;
  choices?: EventChoice[];
}

export interface EventChoice {
  label: string;
  effect: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  sectorCount: number;
  initialShips: { type: ShipType; count: number }[];
  objectives: ResourceStack[];
  guaranteedResources: ResourceType[];
  eventFrequency: number;
  unlockCost?: ResourceStack[];
}

export interface GameState {
  levelId: string;
  phase: GamePhase;
  sectors: Sector[];
  ships: Ship[];
  mothershipId: string;
  warehouse: ResourceStack[];
  warehouseCapacity: number;
  energy: number;
  maxEnergy: number;
  energyRate: number;
  techs: Tech[];
  events: GameEvent[];
  activeEvent: GameEvent | null;
  gameTime: number;
  losses: number;
  lastSaveTime: number;
}

export interface ScoreResult {
  grade: 'S' | 'A' | 'B' | 'C';
  resourceScore: number;
  timeScore: number;
  lossScore: number;
  totalScore: number;
  stats: {
    totalResources: number;
    timeSeconds: number;
    shipsLost: number;
  };
}
