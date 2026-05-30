import type { DeviceData, AlarmInfo, StationMetrics, WaterLevelData, TimeSeriesPoint, DeviceStatus, AlarmLevel, AreaType } from '@/types'

const DEVICES: Omit<DeviceData, 'alarms'>[] = [
  { id: 'pump-1', name: '1号水泵', type: 'pump', status: 'running', position: { x: -2, y: 0.5, z: 2 }, params: { flow: 320, pressure: 0.45, power: 55, rpm: 1480, runtime: 2340 }, area: 'pumpHouse' },
  { id: 'pump-2', name: '2号水泵', type: 'pump', status: 'running', position: { x: 0, y: 0.5, z: 2 }, params: { flow: 310, pressure: 0.44, power: 52, rpm: 1470, runtime: 1890 }, area: 'pumpHouse' },
  { id: 'pump-3', name: '3号水泵', type: 'pump', status: 'alarm', position: { x: 2, y: 0.5, z: 2 }, params: { flow: 0, pressure: 0, power: 0, rpm: 0, runtime: 5670 }, area: 'pumpHouse' },
  { id: 'pump-4', name: '4号水泵', type: 'pump', status: 'maintenance', position: { x: 4, y: 0.5, z: 2 }, params: { flow: 0, pressure: 0, power: 0, rpm: 0, runtime: 8920 }, area: 'pumpHouse' },
  { id: 'valve-1', name: '进水主阀', type: 'valve', status: 'running', position: { x: -8, y: 1, z: 0 }, params: { opening: 85, pressure: 0.32 }, area: 'intake' },
  { id: 'valve-2', name: '出水主阀', type: 'valve', status: 'running', position: { x: 8, y: 1, z: 0 }, params: { opening: 90, pressure: 0.48 }, area: 'outlet' },
  { id: 'valve-3', name: '旁通阀', type: 'valve', status: 'alarm', position: { x: 0, y: 1, z: -3 }, params: { opening: 15, pressure: 0.52 }, area: 'pumpHouse' },
  { id: 'sensor-1', name: '进水流量计', type: 'sensor', status: 'running', position: { x: -10, y: 2, z: 0 }, params: { flow: 630, temperature: 18.5 }, area: 'intake' },
  { id: 'sensor-2', name: '出水流量计', type: 'sensor', status: 'running', position: { x: 10, y: 2, z: 0 }, params: { flow: 625, temperature: 19.2 }, area: 'outlet' },
  { id: 'sensor-3', name: '压力传感器A', type: 'sensor', status: 'running', position: { x: -4, y: 2.5, z: 0 }, params: { pressure: 0.45 }, area: 'pumpHouse' },
  { id: 'sensor-4', name: '压力传感器B', type: 'sensor', status: 'alarm', position: { x: 4, y: 2.5, z: 0 }, params: { pressure: 0.78 }, area: 'pumpHouse' },
  { id: 'sensor-5', name: '液位传感器', type: 'sensor', status: 'running', position: { x: -10, y: 3, z: 4 }, params: { level: 3.2, temperature: 17.8 }, area: 'intake' },
  { id: 'cabinet-1', name: '1号电控柜', type: 'cabinet', status: 'running', position: { x: -3, y: 0.8, z: -4 }, params: { voltage: 380, current: 85, powerFactor: 0.92, temperature: 42 }, area: 'pumpHouse' },
  { id: 'cabinet-2', name: '2号电控柜', type: 'cabinet', status: 'running', position: { x: 3, y: 0.8, z: -4 }, params: { voltage: 380, current: 78, powerFactor: 0.90, temperature: 39 }, area: 'pumpHouse' },
  { id: 'pool-1', name: '进水池', type: 'pool', status: 'running', position: { x: -10, y: 0, z: 2 }, params: { level: 3.2, capacity: 500, inflow: 630 }, area: 'intake' },
  { id: 'pool-2', name: '蓄水池', type: 'pool', status: 'alarm', position: { x: -10, y: 0, z: -2 }, params: { level: 4.5, capacity: 500, inflow: 630 }, area: 'intake' },
]

const ALARMS: AlarmInfo[] = [
  { id: 'alarm-1', level: 'critical', message: '3号水泵停机', timestamp: Date.now() - 120000, deviceId: 'pump-3' },
  { id: 'alarm-2', level: 'critical', message: '蓄水池水位过高', timestamp: Date.now() - 60000, deviceId: 'pool-2' },
  { id: 'alarm-3', level: 'major', message: '压力传感器B压力异常', timestamp: Date.now() - 180000, deviceId: 'sensor-4' },
  { id: 'alarm-4', level: 'major', message: '旁通阀开度过低', timestamp: Date.now() - 300000, deviceId: 'valve-3' },
  { id: 'alarm-5', level: 'minor', message: '4号水泵计划检修中', timestamp: Date.now() - 600000, deviceId: 'pump-4' },
  { id: 'alarm-6', level: 'info', message: '1号电控柜温度偏高', timestamp: Date.now() - 900000, deviceId: 'cabinet-1' },
]

function generateTimeSeries(count: number, baseValue: number, variance: number): TimeSeriesPoint[] {
  const now = Date.now()
  const points: TimeSeriesPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    points.push({
      time: now - i * 60000,
      value: Math.round((baseValue + (Math.random() - 0.5) * variance) * 100) / 100,
    })
  }
  return points
}

function generatePressureSeries(): Record<string, TimeSeriesPoint[]> {
  return {
    '进水口': generateTimeSeries(30, 0.32, 0.05),
    '泵出口A': generateTimeSeries(30, 0.45, 0.08),
    '泵出口B': generateTimeSeries(30, 0.44, 0.07),
    '出水口': generateTimeSeries(30, 0.48, 0.06),
  }
}

export function getDevices(): DeviceData[] {
  return DEVICES.map(d => ({
    ...d,
    alarms: ALARMS.filter(a => a.deviceId === d.id),
  }))
}

export function getAlarms(): AlarmInfo[] {
  return [...ALARMS]
}

export function getStationMetrics(): StationMetrics {
  return {
    flowIn: generateTimeSeries(30, 630, 30),
    flowOut: generateTimeSeries(30, 625, 28),
    pressure: generatePressureSeries(),
    energyDaily: generateTimeSeries(24, 220, 40),
    energyMonthly: generateTimeSeries(30, 6600, 800),
    onlineRate: { online: 12, offline: 2 },
    alarmTrend: generateTimeSeries(7, 5, 4),
    alarmDistribution: { critical: 2, major: 2, minor: 1, info: 1 },
  }
}

export function getWaterLevelData(): WaterLevelData {
  const now = Date.now()
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
      } else if (d.type === 'sensor') {
        if ('level' in d.params) {
          updated.params.level = Math.max(0, (d.params.level as number) + (Math.random() - 0.5) * 0.1)
        }
        if ('pressure' in d.params) {
          updated.params.pressure = Math.max(0, (d.params.pressure as number) + (Math.random() - 0.5) * 0.01)
        }
      } else if (d.type === 'cabinet') {
        updated.params.temperature = Math.max(0, (d.params.temperature as number) + (Math.random() - 0.5) * 2)
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
  const summary: Record<DeviceStatus, number> = { running: 0, stopped: 0, alarm: 0, maintenance: 0, offline: 0 }
  devices.forEach(d => { summary[d.status]++ })
  return summary
}
