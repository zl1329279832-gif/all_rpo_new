import { BuildingData, EnergyLevel, RiskLevel } from '@/types';

function generateBuilding(index: number): BuildingData {
  const names = [
    '科技创业大厦', '金融中心A座', '城市会展中心', '绿色软件园', '智慧办公大楼',
    '行政服务中心', '创新孵化器', '数据中心园区', '商业综合体', '医疗健康中心',
    '教育研发楼', '物流配送中心', '文化艺术中心', '体育训练馆', '酒店公寓',
    '交通枢纽中心', '能源管理中心', '环境监测站', '通信基站大楼', '安全监控中心',
    '贸易大厦', '研发中心楼', '生产调度中心', '质量检测楼', '培训中心',
    '客户服务中心', '技术支持中心', '市场推广中心', '人力资源中心', '财务管理中心'
  ];
  
  const addresses = [
    '科技大道1号', '金融街100号', '会展路88号', '软件园路50号', '智慧大道200号',
    '行政路1号', '创新街36号', '数据中心大道1号', '商业路99号', '健康路66号',
    '学府路12号', '物流大道20号', '文化广场1号', '体育路10号', '酒店路8号',
    '交通路15号', '能源路25号', '环保路30号', '通信路18号', '安全路22号',
    '贸易广场8号', '研发路16号', '生产路45号', '质检路11号', '培训路33号',
    '客服路19号', '技术路27号', '市场路38号', '人力路55号', '财务路77号'
  ];

  const energyLevels = [EnergyLevel.LOW, EnergyLevel.MEDIUM, EnergyLevel.HIGH, EnergyLevel.CRITICAL];
  const riskLevels = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];

  const seed = index * 137.5;
  const gridSize = 6;
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  const spacing = 20;
  const offsetX = (col - gridSize / 2) * spacing + (Math.sin(seed) * 5);
  const offsetZ = (row - gridSize / 2) * spacing + (Math.cos(seed * 1.3) * 5);

  const floors = Math.floor((Math.abs(Math.sin(seed * 0.7)) * 40) + 5);
  const height = floors * 1.2;

  const energyLevelIndex = Math.floor((Math.abs(Math.sin(seed * 2.1)) * 4));
  const riskLevelIndex = Math.floor((Math.abs(Math.sin(seed * 3.7)) * 4));

  const baseElectricity = 5000 + (energyLevelIndex * 15000);
  const baseWater = 100 + (energyLevelIndex * 300);
  const baseCarbon = 2000 + (energyLevelIndex * 5000);
  const basePeople = 100 + (floors * 20);

  return {
    id: `building_${String(index).padStart(3, '0')}`,
    name: names[index % names.length],
    address: addresses[index % addresses.length],
    position: { x: offsetX, z: offsetZ },
    size: {
      width: 8 + Math.abs(Math.sin(seed * 1.5)) * 6,
      depth: 8 + Math.abs(Math.cos(seed * 1.5)) * 6,
      height
    },
    floors,
    energyLevel: energyLevels[energyLevelIndex],
    energyData: {
      electricity: Math.floor(baseElectricity * (0.8 + Math.abs(Math.sin(seed * 4.1)) * 0.4)),
      water: Math.floor(baseWater * (0.8 + Math.abs(Math.cos(seed * 4.1)) * 0.4)),
      carbonEmission: Math.floor(baseCarbon * (0.8 + Math.abs(Math.sin(seed * 5.3)) * 0.4)),
      personCount: Math.floor(basePeople * (0.7 + Math.abs(Math.cos(seed * 5.3)) * 0.6))
    },
    riskLevel: riskLevels[riskLevelIndex],
    lastUpdated: new Date().toISOString()
  };
}

export const BUILDINGS_COUNT = 36;

export const mockBuildings: BuildingData[] = Array.from(
  { length: BUILDINGS_COUNT },
  (_, i) => generateBuilding(i)
);

export function getBuildingById(id: string): BuildingData | undefined {
  return mockBuildings.find(b => b.id === id);
}

export function filterBuildingsByEnergyLevel(levels: EnergyLevel[]): BuildingData[] {
  return mockBuildings.filter(b => levels.includes(b.energyLevel));
}

export function filterBuildingsByRiskLevel(levels: RiskLevel[]): BuildingData[] {
  return mockBuildings.filter(b => levels.includes(b.riskLevel));
}
