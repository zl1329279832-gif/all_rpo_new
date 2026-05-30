export type DeviceType = 'pump' | 'valve' | 'sensor' | 'cabinet' | 'pool' | 'pipe'

export type DeviceStatus = 'running' | 'stopped' | 'alarm' | 'maintenance' | 'offline' | 'recovering'

export type AlarmLevel = 'critical' | 'major' | 'minor' | 'info'

export type AreaType = 'intake' | 'pumpHouse' | 'outlet'

export type AlarmStatus = 'pending' | 'confirmed' | 'processing' | 'recovered' | 'closed'

export type ScenarioType = 'normal' | 'highWaterLevel' | 'pressureAbnormal' | 'pumpStopped' | 'valveFault' | 'sensorOffline' | 'maintenance' | 'recovery'

export interface DeviceData {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  position: { x: number; y: number; z: number }
  params: Record<string, number | string>
  alarms: AlarmInfo[]
  area: AreaType
  maintenance: {
    lastMaintenanceDate: number
    nextMaintenanceDate: number
    faultCount: number
    maintenanceRecords: MaintenanceRecord[]
  }
  installDate: number
  model: string
  manufacturer: string
}

export interface MaintenanceRecord {
  id: string
  date: number
  type: 'routine' | 'repair' | 'inspection'
  operator: string
  description: string
  cost: number
}

export interface AlarmInfo {
  id: string
  level: AlarmLevel
  message: string
  timestamp: number
  deviceId: string
  status: AlarmStatus
  confirmedAt?: number
  confirmedBy?: string
  recoveredAt?: number
  closedAt?: number
  closedBy?: string
  disposalRecords: DisposalRecord[]
  triggerValue?: number
  threshold?: number
  recoveryValue?: number
}

export interface DisposalRecord {
  id: string
  timestamp: number
  operator: string
  action: string
  description: string
  attachment?: string
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

export interface PlaybackFrame {
  timestamp: number
  devices: DeviceData[]
  alarms: AlarmInfo[]
  metrics: StationMetrics
  waterLevel: number
  flowRate: number
}

export interface PlaybackData {
  startTime: number
  endTime: number
  frames: PlaybackFrame[]
  interval: number
}

export interface DeviceSearchResult {
  device: DeviceData
  matchScore: number
}

export interface OperationStats {
  totalDevices: number
  runningDevices: number
  onlineRate: number
  totalAlarms: number
  handledAlarms: number
  alarmHandlingRate: number
  totalEnergy: number
  totalFlow: number
  averagePressure: number
  maintenanceCount: number
  faultRate: number
}

export const STATUS_COLORS: Record<DeviceStatus, number> = {
  running: 0x52c41a,
  stopped: 0x595959,
  alarm: 0xff4d4f,
  maintenance: 0xfadb14,
  offline: 0x434343,
  recovering: 0x13c2c2,
}

export const STATUS_LABELS: Record<DeviceStatus, string> = {
  running: '运行',
  stopped: '停机',
  alarm: '告警',
  maintenance: '检修',
  offline: '离线',
  recovering: '恢复中',
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

export const ALARM_STATUS_LABELS: Record<AlarmStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处置中',
  recovered: '已恢复',
  closed: '已关闭',
}

export const ALARM_STATUS_COLORS: Record<AlarmStatus, string> = {
  pending: '#ff4d4f',
  confirmed: '#faad14',
  processing: '#1890ff',
  recovered: '#52c41a',
  closed: '#8c8c8c',
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

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  normal: '正常运行',
  highWaterLevel: '水位过高',
  pressureAbnormal: '压力异常',
  pumpStopped: '水泵停机',
  valveFault: '阀门故障',
  sensorOffline: '传感器离线',
  maintenance: '设备检修',
  recovery: '故障恢复',
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  pump: '水泵',
  valve: '阀门',
  sensor: '传感器',
  cabinet: '电控柜',
  pool: '水池',
  pipe: '管道',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceRecord['type'], string> = {
  routine: '例行保养',
  repair: '故障维修',
  inspection: '巡检',
}
