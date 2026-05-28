export type ObjectType = 'berth' | 'yard' | 'quayCrane' | 'truck' | 'container' | 'road'

export type EquipmentStatus = 'normal' | 'warning' | 'error' | 'stopped'

export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical'

export type ContainerStatus = 'normal' | 'overtime' | 'dangerous'

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface BaseObject {
  id: string
  type: ObjectType
  name: string
  position: Position3D
  status: EquipmentStatus | ContainerStatus
}

export interface Berth extends BaseObject {
  type: 'berth'
  length: number
  width: number
  vesselName?: string
  vesselStatus: 'docking' | 'loading' | 'unloading' | 'departing'
}

export interface YardBlock extends BaseObject {
  type: 'yard'
  blockCode: string
  rows: number
  bays: number
  tiers: number
  totalSlots: number
  occupiedSlots: number
  isDangerousZone: boolean
}

export interface QuayCrane extends BaseObject {
  type: 'quayCrane'
  craneId: string
  currentBerth: string
  workEfficiency: number
  status: EquipmentStatus
  height: number
  currentContainer?: string
}

export interface Truck extends BaseObject {
  type: 'truck'
  plateNumber: string
  driver?: string
  currentTask?: string
  speed: number
  path?: Position3D[]
  pathProgress: number
  status: EquipmentStatus
}

export interface Container extends BaseObject {
  type: 'container'
  containerNumber: string
  size: '20ft' | '40ft' | '45ft'
  weight: number
  inTime: Date
  outTime?: Date
  owner: string
  status: ContainerStatus
  isDangerous: boolean
  dangerousLevel?: number
  stackPosition: {
    block: string
    bay: number
    row: number
    tier: number
  }
}

export interface RoadSegment {
  id: string
  start: Position3D
  end: Position3D
  width: number
  congestionLevel: number
  averageSpeed: number
  vehicleCount: number
}

export interface Alert {
  id: string
  level: AlertLevel
  title: string
  description: string
  objectId: string
  objectType: ObjectType
  timestamp: Date
  acknowledged: boolean
}

export interface ThroughputData {
  time: string
  importCount: number
  exportCount: number
  total: number
}

export interface EquipmentUtilization {
  equipmentId: string
  equipmentName: string
  utilization: number
  status: EquipmentStatus
}

export interface CongestionData {
  time: string
  level: number
  affectedRoads: string[]
}

export interface SceneConfig {
  containerCount: number
  truckCount: number
  craneCount: number
  enableAnimation: boolean
  enableLabels: boolean
}
