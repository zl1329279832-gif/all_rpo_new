export type DeviceType = 'pump' | 'valve' | 'sensor' | 'cabinet' | 'pool' | 'pipe'

export type DeviceStatus = 'running' | 'stopped' | 'alarm' | 'maintenance' | 'offline'

export type AlarmLevel = 'critical' | 'major' | 'minor' | 'info'

export type AreaType = 'intake' | 'pumpHouse' | 'outlet'

export interface DeviceData {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  position: { x: number; y: number; z: number }
  params: Record<string, number | string>
  alarms: AlarmInfo[]
  area: AreaType
}

export interface AlarmInfo {
  id: string
  level: AlarmLevel
  message: string
  timestamp: number
  deviceId: string
}

export interface TimeSeriesPoint {
  time: number
  value: number
}

export interface StationMetrics {
  flowIn: TimeSeriesPoint[]
  flowOut: TimeSeriesPoint[]
  pressure: Record<string, TimeSeriesPoint[]>
  energyDaily: TimeSeriesPoint[]
  energyMonthly: TimeSeriesPoint[]
  onlineRate: { online: number; offline: number }
  alarmTrend: TimeSeriesPoint[]
  alarmDistribution: Record<AlarmLevel, number>
}

export interface WaterLevelData {
  timestamps: number[]
  levels: number[]
}

export const STATUS_COLORS: Record<DeviceStatus, number> = {
  running: 0x52c41a,
  stopped: 0x595959,
  alarm: 0xff4d4f,
  maintenance: 0xfadb14,
  offline: 0x434343,
}

export const ALARM_LEVEL_LABELS: Record<AlarmLevel, string> = {
  critical: '紧急',
  major: '重要',
  minor: '一般',
  info: '提示',
}

export const ALARM_LEVEL_COLORS: Record<AlarmLevel, string> = {
  critical: '#ff4d4f',
  major: '#faad14',
  minor: '#1890ff',
  info: '#8c8c8c',
}

export const AREA_LABELS: Record<AreaType, string> = {
  intake: '进水区',
  pumpHouse: '泵房区',
  outlet: '出水区',
}

export const AREA_CAMERA_POSITIONS: Record<AreaType, { x: number; y: number; z: number }> = {
  intake: { x: -12, y: 10, z: 12 },
  pumpHouse: { x: 0, y: 10, z: 15 },
  outlet: { x: 12, y: 10, z: 12 },
}
