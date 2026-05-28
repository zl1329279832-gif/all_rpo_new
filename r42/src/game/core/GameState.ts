import {
  ResourceType,
  SectorType,
  ShipType,
  ShipState,
  TechType,
  GamePhase,
} from '../../types';
import type {
  Sector,
  Ship,
  Tech,
  GameState,
  LevelConfig,
} from '../../types';

const SECTOR_NAMES: Record<SectorType, string[]> = {
  [SectorType.Mothership]: ['Command Center'],
  [SectorType.Mining]: [
    'Iron Belt',
    'Crystal Vein',
    'Deuterium Well',
    'Dark Rift',
    'Mineral Heights',
    'Ore Fields',
    'Gem Cluster',
    'Fuel Springs',
    'Asteroid Strip',
    'Comet Trail',
  ],
  [SectorType.Hostile]: [
    'Pirate Haven',
    'Raider Outpost',
    'Shadow Base',
    'Corsair Den',
    'Reaver Camp',
  ],
  [SectorType.Neutral]: [
    'Drift Zone',
    'Abandoned Station',
    'Signal Point',
    'Relay Hub',
    'Deep Space',
    'Void Cross',
    'Trade Post',
    'Waystation',
  ],
};

const MINING_RESOURCES: ResourceType[] = [
  ResourceType.Iron,
  ResourceType.Crystal,
  ResourceType.Deuterium,
  ResourceType.DarkMatter,
];

const SHIP_STATS: Record<
  ShipType,
  {
    speed: number;
    cargoCapacity: number;
    health: number;
    attack: number;
    miningRate: number;
    name: string;
  }
> = {
  [ShipType.Mothership]: {
    speed: 0,
    cargoCapacity: 500,
    health: 1000,
    attack: 0,
    miningRate: 0,
    name: 'Mothership',
  },
  [ShipType.MiningShip]: {
    speed: 2,
    cargoCapacity: 100,
    health: 200,
    attack: 0,
    miningRate: 5,
    name: 'Miner',
  },
  [ShipType.TransportShip]: {
    speed: 1.5,
    cargoCapacity: 300,
    health: 150,
    attack: 0,
    miningRate: 0,
    name: 'Transport',
  },
  [ShipType.DefenseShip]: {
    speed: 1,
    cargoCapacity: 50,
    health: 300,
    attack: 15,
    miningRate: 0,
    name: 'Defender',
  },
};

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

function generateSectorId(index: number): string {
  return `sector-${index}`;
}

function generateShipId(index: number): string {
  return `ship-${index}`;
}

function distributeSectorTypes(count: number): SectorType[] {
  const types: SectorType[] = [SectorType.Mothership];
  const remaining = count - 1;

  const miningCount = Math.max(2, Math.ceil(remaining * 0.4));
  const hostileCount = Math.max(1, Math.floor(remaining * 0.2));
  const neutralCount = remaining - miningCount - hostileCount;

  for (let i = 0; i < miningCount; i++) types.push(SectorType.Mining);
  for (let i = 0; i < hostileCount; i++) types.push(SectorType.Hostile);
  for (let i = 0; i < neutralCount; i++) types.push(SectorType.Neutral);

  return types;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createSectors(count: number): Sector[] {
  const typeDistribution = distributeSectorTypes(count);
  const shuffled = shuffleArray(typeDistribution);
  shuffled[0] = SectorType.Mothership;

  const sectors: Sector[] = [];
  const radius = 300;
  const nameCounters: Record<SectorType, number> = {
    [SectorType.Mothership]: 0,
    [SectorType.Mining]: 0,
    [SectorType.Hostile]: 0,
    [SectorType.Neutral]: 0,
  };

  for (let i = 0; i < count; i++) {
    const id = generateSectorId(i);
    const sectorType = shuffled[i];

    let x: number;
    let y: number;

    if (i === 0) {
      x = 0;
      y = 0;
    } else {
      const angle = ((i - 1) / (count - 1)) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
      const dist = radius * (0.4 + Math.random() * 0.6);
      x = Math.round(Math.cos(angle) * dist);
      y = Math.round(Math.sin(angle) * dist);
    }

    const nameIndex = nameCounters[sectorType];
    const name = SECTOR_NAMES[sectorType][nameIndex % SECTOR_NAMES[sectorType].length];
    nameCounters[sectorType]++;

    let resourceType: ResourceType | undefined;
    let resourceAmount = 0;

    if (sectorType === SectorType.Mining) {
      resourceType = MINING_RESOURCES[nameIndex % MINING_RESOURCES.length];
      resourceAmount = 200 + Math.floor(Math.random() * 300);
    } else if (sectorType === SectorType.Neutral) {
      resourceAmount = Math.random() > 0.6 ? 50 + Math.floor(Math.random() * 100) : 0;
      if (resourceAmount > 0) {
        resourceType = MINING_RESOURCES[Math.floor(Math.random() * MINING_RESOURCES.length)];
      }
    }

    sectors.push({
      id,
      name,
      x,
      y,
      type: sectorType,
      resourceType,
      resourceAmount,
      connections: [],
      hasAsteroid: sectorType === SectorType.Mining && Math.random() > 0.5,
    });
  }

  const connections = buildConnections(sectors);
  for (let i = 0; i < sectors.length; i++) {
    sectors[i].connections = connections[i];
  }

  return sectors;
}

function buildConnections(sectors: Sector[]): string[][] {
  const n = sectors.length;
  const connections: string[][] = Array.from({ length: n }, () => []);
  const connected = new Set<number>([0]);
  const unconnected = new Set<number>();

  for (let i = 1; i < n; i++) unconnected.add(i);

  while (unconnected.size > 0) {
    let bestFrom = -1;
    let bestTo = -1;
    let bestDist = Infinity;

    for (const from of connected) {
      for (const to of unconnected) {
        const dx = sectors[from].x - sectors[to].x;
        const dy = sectors[from].y - sectors[to].y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestFrom === -1 || bestTo === -1) break;

    connections[bestFrom].push(sectors[bestTo].id);
    connections[bestTo].push(sectors[bestFrom].id);
    connected.add(bestTo);
    unconnected.delete(bestTo);
  }

  const extraConnections = Math.floor(n * 0.3);
  let added = 0;

  for (let attempt = 0; attempt < extraConnections * 10 && added < extraConnections; attempt++) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a === b) continue;
    if (connections[a].includes(sectors[b].id)) continue;

    connections[a].push(sectors[b].id);
    connections[b].push(sectors[a].id);
    added++;
  }

  return connections;
}

function createShips(
  config: LevelConfig,
  mothershipSectorId: string
): { ships: Ship[]; mothershipId: string } {
  const ships: Ship[] = [];
  let shipIndex = 0;
  let mothershipId = '';

  const allShipConfigs = [
    { type: ShipType.Mothership, count: 1 },
    ...config.initialShips,
  ];

  for (const shipConfig of allShipConfigs) {
    const stats = SHIP_STATS[shipConfig.type];
    for (let i = 0; i < shipConfig.count; i++) {
      const id = generateShipId(shipIndex);
      const name =
        shipConfig.count > 1 ? `${stats.name} ${i + 1}` : stats.name;

      if (shipConfig.type === ShipType.Mothership) {
        mothershipId = id;
      }

      ships.push({
        id,
        name,
        type: shipConfig.type,
        state: ShipState.Idle,
        sectorId: mothershipSectorId,
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
      });

      shipIndex++;
    }
  }

  return { ships, mothershipId };
}

function createTechs(): Tech[] {
  return TECH_DEFINITIONS.map((def) => ({
    ...def,
    level: 0,
  }));
}

export function createInitialGameState(config: LevelConfig): GameState {
  const sectors = createSectors(config.sectorCount);
  const mothershipSectorId = sectors[0].id;
  const { ships, mothershipId } = createShips(config, mothershipSectorId);
  const techs = createTechs();

  return {
    levelId: config.id,
    phase: GamePhase.Playing,
    sectors,
    ships,
    mothershipId,
    warehouse: [],
    warehouseCapacity: 1000,
    energy: 100,
    maxEnergy: 100,
    energyRate: 0.5,
    techs,
    events: [],
    activeEvent: null,
    gameTime: 0,
    losses: 0,
    lastSaveTime: 0,
  };
}
