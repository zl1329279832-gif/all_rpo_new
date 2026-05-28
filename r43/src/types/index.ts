export enum DeviceType {
  PV_PANEL = 'pv_panel',
  INVERTER = 'inverter',
  COMBINER_BOX = 'combiner_box',
  ALARM_DEVICE = 'alarm_device'
}

export enum DeviceStatus {
  NORMAL = 'normal',
  LOW_POWER = 'low_power',
  TEMP_ABNORMAL = 'temp_abnormal',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export interface DeviceData {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  position: { x: number; y: number; z: number }
  arrayId?: string
  power: number
  temperature: number
  voltage: number
  current: number
  efficiency: number
  lastUpdate: number
}

export interface ArrayData {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  deviceCount: number
  totalPower: number
  efficiency: number
  status: DeviceStatus
}

export interface AlarmData {
  id: string
  deviceId: string
  deviceName: string
  type: DeviceStatus
  message: string
  timestamp: number
  level: 'warning' | 'error' | 'critical'
}

export interface PowerGenerationData {
  time: string
  power: number
  irradiance: number
  temperature: number
}

export interface FaultRankingData {
  name: string
  count: number
  type: DeviceStatus
}

export interface PatrolPoint {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  type: DeviceType
}

export interface PatrolRoute {
  id: string
  name: string
  points: PatrolPoint[]
  estimatedTime: number
}

export interface StatisticsData {
  totalPower: number
  onlineRate: number
  faultCount: number
  maintenanceProgress: number
  todayGeneration: number
  monthGeneration: number
}

export interface LabelData {
  id: string
  text: string
  position: { x: number; y: number; z: number }
  type: 'info' | 'warning' | 'error'
  visible: boolean
}

export const STATUS_COLORS: Record<DeviceStatus, number> = {
  [DeviceStatus.NORMAL]: 0x2ecc71,
  [DeviceStatus.LOW_POWER]: 0xf39c12,
  [DeviceStatus.TEMP_ABNORMAL]: 0xe74c3c,
  [DeviceStatus.OFFLINE]: 0x7f8c8d,
  [DeviceStatus.MAINTENANCE]: 0x3498db
}

export const STATUS_NAMES: Record<DeviceStatus, string> = {
  [DeviceStatus.NORMAL]: '正常',
  [DeviceStatus.LOW_POWER]: '发电偏低',
  [DeviceStatus.TEMP_ABNORMAL]: '温度异常',
  [DeviceStatus.OFFLINE]: '设备离线',
  [DeviceStatus.MAINTENANCE]: '待维修'
}

export const DEVICE_TYPE_NAMES: Record<DeviceType, string> = {
  [DeviceType.PV_PANEL]: '光伏板',
  [DeviceType.INVERTER]: '逆变器',
  [DeviceType.COMBINER_BOX]: '汇流箱',
  [DeviceType.ALARM_DEVICE]: '告警设备'
}
