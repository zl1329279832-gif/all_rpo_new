import { BuildingStats, EnergyLevel, RiskLevel, BuildingTrend } from '@/types';
import { mockBuildings } from './buildings';
import { getAggregatedTrend } from './trendData';

function getTimeRangeMultiplier(timeRange: string): number {
  const multipliers: Record<string, number> = {
    'today': 1 / 30,
    'week': 1 / 4,
    'month': 1,
    'year': 12
  };
  return multipliers[timeRange] || 1;
}

export function calculateBuildingStats(timeRange: string = 'month'): BuildingStats {
  const totalBuildings = mockBuildings.length;
  const multiplier = getTimeRangeMultiplier(timeRange);
  
  let totalElectricity = 0;
  let totalWater = 0;
  let totalCarbonEmission = 0;

  const buildingsByEnergyLevel: Record<EnergyLevel, number> = {
    [EnergyLevel.LOW]: 0,
    [EnergyLevel.MEDIUM]: 0,
    [EnergyLevel.HIGH]: 0,
    [EnergyLevel.CRITICAL]: 0
  };

  const buildingsByRiskLevel: Record<RiskLevel, number> = {
    [RiskLevel.LOW]: 0,
    [RiskLevel.MEDIUM]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.CRITICAL]: 0
  };

  mockBuildings.forEach(b => {
    totalElectricity += b.energyData.electricity;
    totalWater += b.energyData.water;
    totalCarbonEmission += b.energyData.carbonEmission;
    buildingsByEnergyLevel[b.energyLevel]++;
    buildingsByRiskLevel[b.riskLevel]++;
  });

  return {
    totalBuildings,
    totalElectricity: Math.floor(totalElectricity * multiplier),
    totalWater: Math.floor(totalWater * multiplier),
    totalCarbonEmission: Math.floor(totalCarbonEmission * multiplier),
    avgElectricityPerBuilding: Math.floor(totalElectricity / totalBuildings * multiplier),
    buildingsByEnergyLevel,
    buildingsByRiskLevel
  };
}

export function calculateStatsFromTrend(trendData: BuildingTrend[]): BuildingStats {
  const totalBuildings = mockBuildings.length;
  
  const totalElectricity = trendData.reduce((sum, item) => sum + item.electricity, 0);
  const totalWater = trendData.reduce((sum, item) => sum + item.water, 0);
  const totalCarbonEmission = trendData.reduce((sum, item) => sum + item.carbonEmission, 0);

  const buildingsByEnergyLevel: Record<EnergyLevel, number> = {
    [EnergyLevel.LOW]: 0,
    [EnergyLevel.MEDIUM]: 0,
    [EnergyLevel.HIGH]: 0,
    [EnergyLevel.CRITICAL]: 0
  };

  const buildingsByRiskLevel: Record<RiskLevel, number> = {
    [RiskLevel.LOW]: 0,
    [RiskLevel.MEDIUM]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.CRITICAL]: 0
  };

  mockBuildings.forEach(b => {
    buildingsByEnergyLevel[b.energyLevel]++;
    buildingsByRiskLevel[b.riskLevel]++;
  });

  return {
    totalBuildings,
    totalElectricity,
    totalWater,
    totalCarbonEmission,
    avgElectricityPerBuilding: Math.floor(totalElectricity / totalBuildings),
    buildingsByEnergyLevel,
    buildingsByRiskLevel
  };
}

export const mockStats = calculateBuildingStats();

export function getStatsByTimeRange(timeRange: string): BuildingStats {
  const trendData = getAggregatedTrend(timeRange);
  return calculateStatsFromTrend(trendData);
}
