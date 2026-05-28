import type { Sector } from '../../types';
import { SectorType, ResourceType } from '../../types';

const SECTOR_NAMES: Record<SectorType, string[]> = {
  [SectorType.Mothership]: ['Command Center'],
  [SectorType.Mining]: ['Iron Belt', 'Crystal Vein', 'Deuterium Well', 'Dark Rift', 'Mineral Heights', 'Ore Fields', 'Gem Cluster', 'Fuel Springs', 'Asteroid Strip', 'Comet Trail'],
  [SectorType.Hostile]: ['Pirate Haven', 'Raider Outpost', 'Shadow Base', 'Corsair Den', 'Reaver Camp'],
  [SectorType.Neutral]: ['Drift Zone', 'Abandoned Station', 'Signal Point', 'Relay Hub', 'Deep Space', 'Void Cross', 'Trade Post', 'Waystation'],
};

const MINING_RESOURCES: ResourceType[] = [ResourceType.Iron, ResourceType.Crystal, ResourceType.Deuterium, ResourceType.DarkMatter];

function generateSectorId(index: number): string {
  return `sector-${index}`;
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

export function generateStarMap(count: number): Sector[] {
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
