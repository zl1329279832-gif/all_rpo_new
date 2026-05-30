import type {
  DeviceData,
  AlarmInfo,
  StationMetrics,
  WaterLevelData,
  TimeSeriesPoint,
  DeviceStatus,
  AlarmLevel,
  AreaType,
  PlaybackData,
  PlaybackFrame,
  OperationStats,
  ScenarioType,
  DeviceSearchResult,
  DisposalRecord,
  MaintenanceRecord,
} from '@/types'

const now = Date.now()

const OPERATORS = ['张工', '李工', '王工', '赵工', '刘工']

const DEVICES_BASE: Omit<DeviceData, 'alarms'>[] = [
  {
    id: 'pump-1', name: '1号水泵', type: 'pump', status: 'running',
    position: { x: -2, y: 0.5, z: 2 },
    params: { flow: 320, pressure: 0.45, power: 55, rpm: 1480, runtime: 2340, vibration: 2.3, temperature: 52 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 30 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 60 * 24 * 3600 * 1000,
      faultCount: 3,
      maintenanceRecords: [
        { id: 'mr-1', date: now - 30 * 24 * 3600 * 1000, type: 'routine', operator: '张工', description: '例行保养，更换润滑油', cost: 1200 },
        { id: 'mr-2', date: now - 90 * 24 * 3600 * 1000, type: 'repair', operator: '李工', description: '更换机械密封', cost: 3500 },
        { id: 'mr-3', date: now - 180 * 24 * 3600 * 1000, type: 'inspection', operator: '王工', description: '年度检测', cost: 800 },
      ],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'ISG100-200',
    manufacturer: '上海水泵厂',
  },
  {
    id: 'pump-2', name: '2号水泵', type: 'pump', status: 'running',
    position: { x: 0, y: 0.5, z: 2 },
    params: { flow: 310, pressure: 0.44, power: 52, rpm: 1470, runtime: 1890, vibration: 2.1, temperature: 49 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 25 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 65 * 24 * 3600 * 1000,
      faultCount: 1,
      maintenanceRecords: [
        { id: 'mr-4', date: now - 25 * 24 * 3600 * 1000, type: 'routine', operator: '张工', description: '例行保养', cost: 1200 },
      ],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'ISG100-200',
    manufacturer: '上海水泵厂',
  },
  {
    id: 'pump-3', name: '3号水泵', type: 'pump', status: 'alarm',
    position: { x: 2, y: 0.5, z: 2 },
    params: { flow: 0, pressure: 0, power: 0, rpm: 0, runtime: 5670, vibration: 0, temperature: 28 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 60 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 30 * 24 * 3600 * 1000,
      faultCount: 8,
      maintenanceRecords: [
        { id: 'mr-5', date: now - 60 * 24 * 3600 * 1000, type: 'repair', operator: '李工', description: '电机故障维修', cost: 8500 },
      ],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 3,
    model: 'ISG100-200',
    manufacturer: '上海水泵厂',
  },
  {
    id: 'pump-4', name: '4号水泵', type: 'pump', status: 'maintenance',
    position: { x: 4, y: 0.5, z: 2 },
    params: { flow: 0, pressure: 0, power: 0, rpm: 0, runtime: 8920, vibration: 0, temperature: 25 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 1 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 1 * 24 * 3600 * 1000,
      faultCount: 5,
      maintenanceRecords: [
        { id: 'mr-6', date: now - 1 * 24 * 3600 * 1000, type: 'repair', operator: '王工', description: '大修中，更换轴承叶轮', cost: 15000 },
      ],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 4,
    model: 'ISG125-250',
    manufacturer: '上海水泵厂',
  },
  {
    id: 'valve-1', name: '进水主阀', type: 'valve', status: 'running',
    position: { x: -8, y: 1, z: 0 },
    params: { opening: 85, pressure: 0.32, leakage: 0 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 45 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 45 * 24 * 3600 * 1000,
      faultCount: 1,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'Z941H-16C',
    manufacturer: '浙江阀门厂',
  },
  {
    id: 'valve-2', name: '出水主阀', type: 'valve', status: 'running',
    position: { x: 8, y: 1, z: 0 },
    params: { opening: 90, pressure: 0.48, leakage: 0 },
    area: 'outlet',
    maintenance: {
      lastMaintenanceDate: now - 40 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 50 * 24 * 3600 * 1000,
      faultCount: 0,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'Z941H-16C',
    manufacturer: '浙江阀门厂',
  },
  {
    id: 'valve-3', name: '旁通阀', type: 'valve', status: 'alarm',
    position: { x: 0, y: 1, z: -3 },
    params: { opening: 15, pressure: 0.52, leakage: 0.1 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 80 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 10 * 24 * 3600 * 1000,
      faultCount: 4,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'Z941H-16C',
    manufacturer: '浙江阀门厂',
  },
  {
    id: 'valve-4', name: '泄压阀', type: 'valve', status: 'stopped',
    position: { x: 6, y: 1, z: -2 },
    params: { opening: 0, pressure: 0.5, leakage: 0 },
    area: 'outlet',
    maintenance: {
      lastMaintenanceDate: now - 50 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 40 * 24 * 3600 * 1000,
      faultCount: 2,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'A41H-16C',
    manufacturer: '浙江阀门厂',
  },
  {
    id: 'sensor-1', name: '进水流量计', type: 'sensor', status: 'running',
    position: { x: -10, y: 2, z: 0 },
    params: { flow: 630, temperature: 18.5, accuracy: 0.5 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 15 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 75 * 24 * 3600 * 1000,
      faultCount: 0,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000,
    model: 'LDG-100',
    manufacturer: '深圳某仪表厂',
  },
  {
    id: 'sensor-2', name: '出水流量计', type: 'sensor', status: 'running',
    position: { x: 10, y: 2, z: 0 },
    params: { flow: 625, temperature: 19.2, accuracy: 0.5 },
    area: 'outlet',
    maintenance: {
      lastMaintenanceDate: now - 12 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 78 * 24 * 3600 * 1000,
      faultCount: 0,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000,
    model: 'LDG-100',
    manufacturer: '深圳某仪表厂',
  },
  {
    id: 'sensor-3', name: '压力传感器A', type: 'sensor', status: 'running',
    position: { x: -4, y: 2.5, z: 0 },
    params: { pressure: 0.45, temperature: 22, accuracy: 0.25 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 20 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 70 * 24 * 3600 * 1000,
      faultCount: 0,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000,
    model: 'PT-100',
    manufacturer: '北京某传感器厂',
  },
  {
    id: 'sensor-4', name: '压力传感器B', type: 'sensor', status: 'alarm',
    position: { x: 4, y: 2.5, z: 0 },
    params: { pressure: 0.78, temperature: 25, accuracy: 0.25 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 70 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 20 * 24 * 3600 * 1000,
      faultCount: 3,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000,
    model: 'PT-100',
    manufacturer: '北京某传感器厂',
  },
  {
    id: 'sensor-5', name: '液位传感器', type: 'sensor', status: 'running',
    position: { x: -10, y: 3, z: 4 },
    params: { level: 3.2, temperature: 17.8, accuracy: 0.1 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 10 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 80 * 24 * 3600 * 1000,
      faultCount: 1,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000,
    model: 'ULS-200',
    manufacturer: '广州某仪表厂',
  },
  {
    id: 'sensor-6', name: '余氯传感器', type: 'sensor', status: 'offline',
    position: { x: -10, y: 3, z: -2 },
    params: { cl: 0, temperature: 0, accuracy: 0 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 100 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 5 * 24 * 3600 * 1000,
      faultCount: 6,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'CL-2000',
    manufacturer: '上海某仪表厂',
  },
  {
    id: 'cabinet-1', name: '1号电控柜', type: 'cabinet', status: 'running',
    position: { x: -3, y: 0.8, z: -4 },
    params: { voltage: 380, current: 85, powerFactor: 0.92, temperature: 42, frequency: 50, power: 32 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 35 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 55 * 24 * 3600 * 1000,
      faultCount: 2,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'GCK-0.4',
    manufacturer: '江苏某电气厂',
  },
  {
    id: 'cabinet-2', name: '2号电控柜', type: 'cabinet', status: 'running',
    position: { x: 3, y: 0.8, z: -4 },
    params: { voltage: 380, current: 78, powerFactor: 0.90, temperature: 39, frequency: 50, power: 29 },
    area: 'pumpHouse',
    maintenance: {
      lastMaintenanceDate: now - 38 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 52 * 24 * 3600 * 1000,
      faultCount: 0,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 2,
    model: 'GCK-0.4',
    manufacturer: '江苏某电气厂',
  },
  {
    id: 'pool-1', name: '进水池', type: 'pool', status: 'running',
    position: { x: -10, y: 0, z: 2 },
    params: { level: 3.2, capacity: 500, inflow: 630, outflow: 625, turbidity: 12 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 60 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 30 * 24 * 3600 * 1000,
      faultCount: 1,
      maintenanceRecords: [
        { id: 'mr-7', date: now - 60 * 24 * 3600 * 1000, type: 'routine', operator: '刘工', description: '水池清淤', cost: 2500 },
      ],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 5,
    model: 'RC-500',
    manufacturer: '本地建筑公司',
  },
  {
    id: 'pool-2', name: '蓄水池', type: 'pool', status: 'alarm',
    position: { x: -10, y: 0, z: -2 },
    params: { level: 4.5, capacity: 500, inflow: 630, outflow: 500, turbidity: 15 },
    area: 'intake',
    maintenance: {
      lastMaintenanceDate: now - 90 * 24 * 3600 * 1000,
      nextMaintenanceDate: now + 0 * 24 * 3600 * 1000,
      faultCount: 2,
      maintenanceRecords: [],
    },
    installDate: now - 365 * 24 * 3600 * 1000 * 5,
    model: 'RC-500',
    manufacturer: '本地建筑公司',
  },
]

function generateDisposalRecords(alarmId: string, count: number): DisposalRecord[] {
  const records: DisposalRecord[] = []
  const baseTime = now - Math.random() * 3600000 * 24
  const actions = [
    { action: '现场检查', description: '运维人员到达现场检查设备状态' },
    { action: '参数确认', description: '确认告警参数是否超过阈值' },
    { action: '故障排查', description: '排查故障原因，定位问题点' },
    { action: '应急处理', description: '采取应急措施，防止事态扩大' },
    { action: '维修作业', description: '进行维修作业，更换故障部件' },
    { action: '试运行', description: '修复后试运行，确认恢复正常' },
    { action: '记录归档', description: '填写维修记录，归档保存' },
  ]
  for (let i = 0; i < count; i++) {
    const actionItem = actions[i % actions.length]
    records.push({
      id: `${alarmId}-dr-${i}`,
      timestamp: baseTime + i * 1800000 + Math.random() * 600000,
      operator: OPERATORS[Math.floor(Math.random() * OPERATORS.length)],
      action: actionItem.action,
      description: actionItem.description,
    })
  }
  return records
}

const ALARMS_BASE: AlarmInfo[] = [
  {
    id: 'alarm-1', level: 'critical', message: '3号水泵停机', timestamp: now - 120000, deviceId: 'pump-3',
    status: 'confirmed', confirmedAt: now - 100000, confirmedBy: '张工',
    disposalRecords: generateDisposalRecords('alarm-1', 3),
    triggerValue: 0, threshold: 50, recoveryValue: 0,
  },
  {
    id: 'alarm-2', level: 'critical', message: '蓄水池水位过高', timestamp: now - 60000, deviceId: 'pool-2',
    status: 'processing', confirmedAt: now - 50000, confirmedBy: '李工',
    disposalRecords: generateDisposalRecords('alarm-2', 4),
    triggerValue: 4.5, threshold: 4.0, recoveryValue: 3.5,
  },
  {
    id: 'alarm-3', level: 'major', message: '压力传感器B压力异常', timestamp: now - 180000, deviceId: 'sensor-4',
    status: 'pending',
    disposalRecords: generateDisposalRecords('alarm-3', 1),
    triggerValue: 0.78, threshold: 0.6, recoveryValue: 0.5,
  },
  {
    id: 'alarm-4', level: 'major', message: '旁通阀开度过低', timestamp: now - 300000, deviceId: 'valve-3',
    status: 'processing', confirmedAt: now - 250000, confirmedBy: '王工',
    disposalRecords: generateDisposalRecords('alarm-4', 5),
    triggerValue: 15, threshold: 30, recoveryValue: 70,
  },
  {
    id: 'alarm-5', level: 'minor', message: '4号水泵计划检修中', timestamp: now - 600000, deviceId: 'pump-4',
    status: 'processing', confirmedAt: now - 580000, confirmedBy: '赵工',
    disposalRecords: generateDisposalRecords('alarm-5', 6),
    triggerValue: 0, threshold: 0, recoveryValue: 0,
  },
  {
    id: 'alarm-6', level: 'info', message: '1号电控柜温度偏高', timestamp: now - 900000, deviceId: 'cabinet-1',
    status: 'recovered', confirmedAt: now - 850000, confirmedBy: '刘工',
    recoveredAt: now - 300000,
    disposalRecords: generateDisposalRecords('alarm-6', 3),
    triggerValue: 42, threshold: 45, recoveryValue: 40,
  },
  {
    id: 'alarm-7', level: 'critical', message: '余氯传感器离线', timestamp: now - 3600000, deviceId: 'sensor-6',
    status: 'confirmed', confirmedAt: now - 3500000, confirmedBy: '张工',
    disposalRecords: generateDisposalRecords('alarm-7', 2),
    triggerValue: 0, threshold: 0, recoveryValue: 0,
  },
  {
    id: 'alarm-8', level: 'major', message: '泄压阀故障', timestamp: now - 7200000, deviceId: 'valve-4',
    status: 'closed', confirmedAt: now - 7100000, confirmedBy: '李工',
    recoveredAt: now - 3600000, closedAt: now - 3500000, closedBy: '王工',
    disposalRecords: generateDisposalRecords('alarm-8', 5),
    triggerValue: 0, threshold: 0, recoveryValue: 0,
  },
]

function generateTimeSeries(count: number, baseValue: number, variance: number, seed: number = 0): TimeSeriesPoint[] {
  const startTime = now
  const points: TimeSeriesPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const noise = Math.sin(seed + i * 0.3) * variance * 0.5 + (Math.random() - 0.5) * variance
    points.push({
      time: startTime - i * 60000,
      value: Math.round((baseValue + noise) * 100) / 100,
    })
  }
  return points
}

function generatePressureSeries(): Record<string, TimeSeriesPoint[]> {
  return {
    '进水口': generateTimeSeries(30, 0.32, 0.05, 1),
    '泵出口A': generateTimeSeries(30, 0.45, 0.08, 2),
    '泵出口B': generateTimeSeries(30, 0.44, 0.07, 3),
    '出水口': generateTimeSeries(30, 0.48, 0.06, 4),
  }
}

export function getDevices(): DeviceData[] {
  return DEVICES_BASE.map(d => ({
    ...d,
    alarms: ALARMS_BASE.filter(a => a.deviceId === d.id),
  }))
}

export function getAlarms(): AlarmInfo[] {
  return [...ALARMS_BASE]
}

export function getStationMetrics(): StationMetrics {
  return {
    flowIn: generateTimeSeries(30, 630, 30, 5),
    flowOut: generateTimeSeries(30, 625, 28, 6),
    pressure: generatePressureSeries(),
    energyDaily: generateTimeSeries(24, 220, 40, 7),
    energyMonthly: generateTimeSeries(30, 6600, 800, 8),
    onlineRate: { online: 14, offline: 2 },
    alarmTrend: generateTimeSeries(7, 5, 4, 9),
    alarmDistribution: { critical: 2, major: 2, minor: 1, info: 1 },
  }
}

export function getWaterLevelData(): WaterLevelData {
  const timestamps: number[] = []
  const levels: number[] = []
  for (let i = 23; i >= 0; i--) {
    timestamps.push(now - i * 3600000)
    levels.push(Math.round((2.5 + Math.sin(i * 0.5) * 1.2 + Math.random() * 0.3) * 100) / 100)
  }
  return { timestamps, levels }
}

export function simulateDataUpdate(devices: DeviceData[]): DeviceData[] {
  return devices.map(d => {
    const updated = { ...d, params: { ...d.params } }
    if (d.status === 'running') {
      if (d.type === 'pump') {
        updated.params.flow = Math.max(0, (d.params.flow as number) + (Math.random() - 0.5) * 10)
        updated.params.pressure = Math.max(0, (d.params.pressure as number) + (Math.random() - 0.5) * 0.02)
        updated.params.vibration = Math.max(0, (d.params.vibration as number) + (Math.random() - 0.5) * 0.2)
        updated.params.temperature = Math.max(0, (d.params.temperature as number) + (Math.random() - 0.5) * 1)
      } else if (d.type === 'sensor') {
        if ('level' in d.params) {
          updated.params.level = Math.max(0, (d.params.level as number) + (Math.random() - 0.5) * 0.1)
        }
        if ('pressure' in d.params) {
          updated.params.pressure = Math.max(0, (d.params.pressure as number) + (Math.random() - 0.5) * 0.01)
        }
        if ('flow' in d.params) {
          updated.params.flow = Math.max(0, (d.params.flow as number) + (Math.random() - 0.5) * 5)
        }
      } else if (d.type === 'cabinet') {
        updated.params.temperature = Math.max(0, (d.params.temperature as number) + (Math.random() - 0.5) * 2)
        updated.params.current = Math.max(0, (d.params.current as number) + (Math.random() - 0.5) * 3)
      } else if (d.type === 'valve') {
        updated.params.opening = Math.max(0, Math.min(100, (d.params.opening as number) + (Math.random() - 0.5) * 1))
      } else if (d.type === 'pool') {
        updated.params.level = Math.max(0, (d.params.level as number) + (Math.random() - 0.5) * 0.05)
      }
    }
    return updated
  })
}

export function getDevicesByArea(devices: DeviceData[], area: AreaType): DeviceData[] {
  return devices.filter(d => d.area === area)
}

export function getDevicesByAlarmLevel(devices: DeviceData[], level: AlarmLevel): DeviceData[] {
  return devices.filter(d => d.alarms.some(a => a.level === level))
}

export function getDeviceStatusSummary(devices: DeviceData[]): Record<DeviceStatus, number> {
  const summary: Record<DeviceStatus, number> = { running: 0, stopped: 0, alarm: 0, maintenance: 0, offline: 0, recovering: 0 }
  devices.forEach(d => { summary[d.status]++ })
  return summary
}

export function searchDevices(devices: DeviceData[], keyword: string): DeviceSearchResult[] {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []
  return devices
    .map(device => {
      let score = 0
      if (device.name.toLowerCase().includes(kw)) score += 10
      if (device.id.toLowerCase().includes(kw)) score += 8
      if (device.model.toLowerCase().includes(kw)) score += 5
      if (device.manufacturer.toLowerCase().includes(kw)) score += 4
      if (device.alarms.some(a => a.message.toLowerCase().includes(kw))) score += 7
      return { device, matchScore: score }
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function getOperationStats(devices: DeviceData[], alarms: AlarmInfo[], metrics: StationMetrics): OperationStats {
  const totalDevices = devices.length
  const runningDevices = devices.filter(d => d.status === 'running').length
  const totalAlarms = alarms.length
  const handledAlarms = alarms.filter(a => a.status !== 'pending').length
  const totalEnergy = metrics.energyDaily.reduce((sum, p) => sum + p.value, 0)
  const totalFlow = metrics.flowIn.reduce((sum, p) => sum + p.value, 0)
  const pressureValues = Object.values(metrics.pressure).flatMap(arr => arr.map(p => p.value))
  const avgPressure = pressureValues.length > 0 ? pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length : 0
  const faultCount = devices.reduce((sum, d) => sum + d.maintenance.faultCount, 0)
  const maintenanceCount = devices.reduce((sum, d) => sum + d.maintenance.maintenanceRecords.length, 0)
  return {
    totalDevices,
    runningDevices,
    onlineRate: totalDevices > 0 ? (runningDevices / totalDevices) * 100 : 0,
    totalAlarms,
    handledAlarms,
    alarmHandlingRate: totalAlarms > 0 ? (handledAlarms / totalAlarms) * 100 : 0,
    totalEnergy: Math.round(totalEnergy * 100) / 100,
    totalFlow: Math.round(totalFlow * 100) / 100,
    averagePressure: Math.round(avgPressure * 100) / 100,
    maintenanceCount,
    faultRate: totalDevices > 0 ? (faultCount / totalDevices) * 100 : 0,
  }
}

export function generatePlaybackData(durationHours: number = 24, intervalMinutes: number = 5): PlaybackData {
  const frames: PlaybackFrame[] = []
  const frameCount = (durationHours * 60) / intervalMinutes
  const intervalMs = intervalMinutes * 60 * 1000
  const endTime = now
  const startTime = endTime - durationHours * 3600 * 1000
  const baseDevices = getDevices()
  const baseAlarms = getAlarms()
  for (let i = 0; i < frameCount; i++) {
    const timestamp = startTime + i * intervalMs
    const progress = i / frameCount
    const wave = Math.sin(progress * Math.PI * 4)
    const devices = baseDevices.map(d => {
      const modified = JSON.parse(JSON.stringify(d)) as DeviceData
      if (modified.status === 'running' && modified.params.flow !== undefined) {
        modified.params.flow = Math.max(0, (modified.params.flow as number) + wave * 50)
      }
      if (modified.status === 'running' && modified.params.pressure !== undefined) {
        modified.params.pressure = Math.max(0, (modified.params.pressure as number) + wave * 0.1)
      }
      if (progress > 0.3 && progress < 0.4 && modified.id === 'pump-3') {
        modified.status = 'alarm'
        modified.params.flow = 0
        modified.params.power = 0
      }
      if (progress > 0.4 && modified.id === 'pump-3') {
        modified.status = 'recovering'
        modified.params.flow = wave > 0 ? 100 : 0
      }
      if (progress > 0.7 && modified.id === 'pool-2') {
        modified.params.level = 3.8 + wave * 0.8
        modified.status = (modified.params.level as number) > 4.0 ? 'alarm' : 'running'
      }
      return modified
    })
    const activeAlarms = baseAlarms.filter(a => {
      if (a.deviceId === 'pump-3') return progress > 0.3
      if (a.deviceId === 'pool-2') return progress > 0.7
      return progress > 0.1
    })
    const waterLevel = 2.5 + Math.sin(progress * Math.PI * 2) * 1.2 + Math.random() * 0.3
    const flowRate = 280 + Math.abs(wave) * 140 + Math.random() * 20
    frames.push({
      timestamp,
      devices,
      alarms: activeAlarms,
      metrics: {
        flowIn: generateTimeSeries(10, 600 + wave * 50, 20, i),
        flowOut: generateTimeSeries(10, 595 + wave * 48, 18, i + 1),
        pressure: generatePressureSeries(),
        energyDaily: generateTimeSeries(10, 220, 30, i + 2),
        energyMonthly: generateTimeSeries(10, 6600, 600, i + 3),
        onlineRate: { online: 14 - Math.floor(Math.abs(wave) * 2), offline: 2 + Math.floor(Math.abs(wave) * 2) },
        alarmTrend: generateTimeSeries(5, 5, 3, i + 4),
        alarmDistribution: {
          critical: activeAlarms.filter(a => a.level === 'critical').length,
          major: activeAlarms.filter(a => a.level === 'major').length,
          minor: activeAlarms.filter(a => a.level === 'minor').length,
          info: activeAlarms.filter(a => a.level === 'info').length,
        },
      },
      waterLevel,
      flowRate,
    })
  }
  return { startTime, endTime, frames, interval: intervalMs }
}

export function getScenarioDevices(scenario: ScenarioType): DeviceData[] {
  const devices = getDevices()
  const modify = (id: string, status: DeviceStatus, params: Record<string, number | string>) => {
    const dev = devices.find(d => d.id === id)
    if (dev) {
      dev.status = status
      Object.assign(dev.params, params)
    }
  }
  switch (scenario) {
    case 'normal':
      return devices
    case 'highWaterLevel':
      modify('pool-1', 'alarm', { level: 4.8 })
      modify('pool-2', 'alarm', { level: 4.6 })
      modify('sensor-5', 'alarm', { level: 4.8 })
      return devices
    case 'pressureAbnormal':
      modify('sensor-3', 'alarm', { pressure: 0.85 })
      modify('sensor-4', 'alarm', { pressure: 0.92 })
      return devices
    case 'pumpStopped':
      modify('pump-1', 'alarm', { flow: 0, pressure: 0, power: 0, rpm: 0 })
      modify('pump-2', 'stopped', { flow: 0, pressure: 0, power: 0, rpm: 0 })
      return devices
    case 'valveFault':
      modify('valve-1', 'alarm', { opening: 0, leakage: 0.5 })
      modify('valve-3', 'alarm', { opening: 0, leakage: 0.3 })
      return devices
    case 'sensorOffline':
      modify('sensor-1', 'offline', { flow: 0 })
      modify('sensor-6', 'offline', { cl: 0 })
      return devices
    case 'maintenance':
      modify('pump-1', 'maintenance', { flow: 0, pressure: 0, power: 0, rpm: 0 })
      modify('valve-1', 'maintenance', { opening: 0 })
      return devices
    case 'recovery':
      modify('pump-3', 'recovering', { flow: 280, pressure: 0.38, power: 48, rpm: 1200 })
      modify('pool-2', 'running', { level: 3.2 })
      return devices
    default:
      return devices
  }
}

export function confirmAlarm(alarm: AlarmInfo, operator: string): AlarmInfo {
  alarm.status = 'confirmed'
  alarm.confirmedAt = Date.now()
  alarm.confirmedBy = operator
  alarm.disposalRecords.push({
    id: `${alarm.id}-confirm`,
    timestamp: Date.now(),
    operator,
    action: '告警确认',
    description: '已确认告警，开始处置流程',
  })
  return alarm
}

export function startDisposal(alarm: AlarmInfo, operator: string, action: string, description: string): AlarmInfo {
  alarm.status = 'processing'
  alarm.disposalRecords.push({
    id: `${alarm.id}-${Date.now()}`,
    timestamp: Date.now(),
    operator,
    action,
    description,
  })
  return alarm
}

export function recoverAlarm(alarm: AlarmInfo, operator: string, recoveryValue?: number): AlarmInfo {
  alarm.status = 'recovered'
  alarm.recoveredAt = Date.now()
  if (recoveryValue !== undefined) {
    alarm.recoveryValue = recoveryValue
  }
  alarm.disposalRecords.push({
    id: `${alarm.id}-recover`,
    timestamp: Date.now(),
    operator,
    action: '故障恢复',
    description: '设备已恢复正常运行',
  })
  return alarm
}

export function closeAlarm(alarm: AlarmInfo, operator: string): AlarmInfo {
  alarm.status = 'closed'
  alarm.closedAt = Date.now()
  alarm.closedBy = operator
  alarm.disposalRecords.push({
    id: `${alarm.id}-close`,
    timestamp: Date.now(),
    operator,
    action: '关闭告警',
    description: '处置完成，关闭告警',
  })
  return alarm
}
