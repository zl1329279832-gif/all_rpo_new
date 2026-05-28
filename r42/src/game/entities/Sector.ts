import type { Sector } from '../../types';

export function getSectorById(sectors: Sector[], id: string): Sector | undefined {
  return sectors.find(s => s.id === id);
}

export function getConnectedSectors(sector: Sector, allSectors: Sector[]): Sector[] {
  return sector.connections
    .map(id => allSectors.find(s => s.id === id))
    .filter((s): s is Sector => s !== undefined);
}
