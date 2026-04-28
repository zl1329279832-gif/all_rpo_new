import { BuildingTrend, EnergyLevel } from '@/types';
import { mockBuildings } from './buildings';

function generateTrendData(buildingId: string, range: string): BuildingTrend[] {
  const building = mockBuildings.find(b => b.id === buildingId);
  if (!building) return [];

  const baseElectricity = building.energyData.electricity;
  const baseWater = building.energyData.water;
  const baseCarbon = building.energyData.carbonEmission;

  const energyMultiplier = {
    [EnergyLevel.LOW]: 0.6,
    [EnergyLevel.MEDIUM]: 0.8,
    [EnergyLevel.HIGH]: 1.0,
    [EnergyLevel.CRITICAL]: 1.2
  }[building.energyLevel];

  let dataPoints: number;
  let dateStep: number;
  let now = new Date();

  switch (range) {
    case 'today':
      dataPoints = 24;
      dateStep = 60 * 60 * 1000;
      now.setHours(23, 59, 59, 999);
      break;
    case 'week':
      dataPoints = 7;
      dateStep = 24 * 60 * 60 * 1000;
      break;
    case 'month':
      dataPoints = 30;
      dateStep = 24 * 60 * 60 * 1000;
      break;
    case 'year':
      dataPoints = 12;
      dateStep = 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      dataPoints = 7;
      dateStep = 24 * 60 * 60 * 1000;
  }

  const trends: BuildingTrend[] = [];
  const seed = parseInt(buildingId.replace('building_', ''), 10);

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - (dataPoints - 1 - i) * dateStep);
    const variation = Math.sin((seed * 0.7 + i * 0.3) * Math.PI * 2 / dataPoints) * 0.3;
    const randomFactor = 0.9 + Math.random() * 0.2;

    trends.push({
      timestamp: timestamp.toISOString(),
      electricity: Math.floor(baseElectricity * energyMultiplier * (1 + variation) * randomFactor),
      water: Math.floor(baseWater * energyMultiplier * (1 + variation * 0.5) * randomFactor),
      carbonEmission: Math.floor(baseCarbon * energyMultiplier * (1 + variation * 0.8) * randomFactor)
    });
  }

  return trends;
}

export function getBuildingTrend(buildingId: string, range: string = 'week'): BuildingTrend[] {
  return generateTrendData(buildingId, range);
}

export function getAggregatedTrend(range: string = 'week'): BuildingTrend[] {
  const dataPoints = {
    'today': 24,
    'week': 7,
    'month': 30,
    'year': 12
  }[range] || 7;

  const dateStep = {
    'today': 60 * 60 * 1000,
    'week': 24 * 60 * 60 * 1000,
    'month': 24 * 60 * 60 * 1000,
    'year': 30 * 24 * 60 * 60 * 1000
  }[range] || 24 * 60 * 60 * 1000;

  const now = new Date();
  const trends: BuildingTrend[] = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - (dataPoints - 1 - i) * dateStep);
    const variation = Math.sin((i * 0.3) * Math.PI * 2 / dataPoints) * 0.2;
    const randomFactor = 0.95 + Math.random() * 0.1;

    trends.push({
      timestamp: timestamp.toISOString(),
      electricity: Math.floor(350000 * (1 + variation) * randomFactor),
      water: Math.floor(8000 * (1 + variation * 0.5) * randomFactor),
      carbonEmission: Math.floor(120000 * (1 + variation * 0.8) * randomFactor)
    });
  }

  return trends;
}
