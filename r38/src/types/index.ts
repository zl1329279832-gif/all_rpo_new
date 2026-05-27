export type DeviceStatus = 'online' | 'offline' | 'fault' | 'alarm'

export type DeviceType = 'camera' | 'fireExtinguisher' | 'fireHydrant' | 'smokeDetector'

export type AlarmLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Building {
  id: string
  name: string
  type: 'teaching' | 'dormitory' | 'office' | 'canteen' | 'library' | 'gym'
  position: Position3D
  size: { width: number; height: number; depth: number }
  floors: number
  color: string
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  position: Position3D
  buildingId: string
  floor: number
  installTime: string
  lastCheckTime: string
  description: string
}

export interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  type: string
  level: AlarmLevel
  status: 'unhandled' | 'handling' | 'resolved'
  position: Position3D
  buildingId: string
  floor: number
  time: string
  description: string
  handler?: string
  handleTime?: string
}

export interface CampusGate {
  id: string
  name: string
  position: Position3D
  type: 'main' | 'secondary'
  status: 'open' | 'closed'
  personFlow: number
}

export interface Statistics {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  faultDevices: number
  alarmDevices: number
  onlineRate: number
  todayAlarms: number
  unhandledAlarms: number
  avgResponseTime: number
  resolutionRate: number
}

export interface RegionRisk {
  name: string
  riskLevel: 'safe' | 'low' | 'medium' | 'high'
  deviceCount: number
  alarmCount: number
}

export interface AlarmTrend {
  time: string
  count: number
}

export interface ResponseStat {
  type: string
  count: number
  avgTime: number
}
