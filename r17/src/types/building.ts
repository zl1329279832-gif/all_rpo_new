export enum EnergyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface BuildingData {
  id: string;
  name: string;
  address: string;
  position: {
    x: number;
    z: number;
  };
  size: {
    width: number;
    depth: number;
    height: number;
  };
  floors: number;
  energyLevel: EnergyLevel;
  energyData: {
    electricity: number;
    water: number;
    carbonEmission: number;
    personCount: number;
  };
  riskLevel: RiskLevel;
  lastUpdated: string;
}

export interface BuildingTrend {
  timestamp: string;
  electricity: number;
  water: number;
  carbonEmission: number;
}

export interface FilterParams {
  energyLevel?: EnergyLevel[];
  riskLevel?: RiskLevel[];
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface BuildingStats {
  totalBuildings: number;
  totalElectricity: number;
  totalWater: number;
  totalCarbonEmission: number;
  avgElectricityPerBuilding: number;
  buildingsByEnergyLevel: Record<EnergyLevel, number>;
  buildingsByRiskLevel: Record<RiskLevel, number>;
}
