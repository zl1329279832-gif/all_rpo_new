export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface ShelfData {
  id: string;
  code: string;
  floor: number;
  position: Vector3;
  levels: number;
  slotsPerLevel: number;
  usedSlots: number;
  capacity: number;
  utilization: number;
  temperature: number;
  humidity: number;
  status: 'normal' | 'warning' | 'alarm';
}

export interface ForkliftData {
  id: string;
  code: string;
  status: 'idle' | 'working' | 'offline' | 'error';
  position: Vector3;
  rotation: number;
  battery: number;
  speed: number;
  currentTask: string | null;
  driver: string | null;
}

export interface SensorData {
  id: string;
  code: string;
  type: 'temperature' | 'humidity' | 'smoke' | 'door' | 'infrared';
  position: Vector3;
  value: number;
  status: 'normal' | 'warning' | 'alarm' | 'offline';
  lastUpdate: number;
  threshold: {
    warning: number;
    alarm: number;
  };
}

export interface LoadingDockData {
  id: string;
  code: string;
  position: Vector3;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentVehicle: string | null;
  estimatedDeparture: number | null;
}

export type AlarmLevel = 'critical' | 'warning' | 'info';
export type AlarmType = 'temperature' | 'humidity' | 'offline' | 'congestion' | 'capacity' | 'smoke' | 'door';
export type AlarmStatus = 'unhandled' | 'processing' | 'resolved';

export interface AlarmData {
  id: string;
  level: AlarmLevel;
  type: AlarmType;
  targetId: string;
  targetType: 'shelf' | 'forklift' | 'sensor' | 'dock' | 'channel';
  message: string;
  timestamp: number;
  status: AlarmStatus;
  handledBy?: string;
  handledAt?: number;
}

export interface TrackPoint {
  timestamp: number;
  position: Vector3;
  rotation: number;
  speed: number;
}

export interface ForkliftTrack {
  forkliftId: string;
  startTime: number;
  endTime: number;
  points: TrackPoint[];
}

export interface ChannelData {
  id: string;
  code: string;
  start: Vector3;
  end: Vector3;
  congestionLevel: number;
  vehicleCount: number;
}

export interface WarehouseStats {
  totalCapacity: number;
  usedCapacity: number;
  utilizationRate: number;
  totalShelves: number;
  activeShelves: number;
  totalForklifts: number;
  activeForklifts: number;
  offlineForklifts: number;
  totalSensors: number;
  offlineSensors: number;
  activeAlarms: number;
  criticalAlarms: number;
  warningAlarms: number;
}

export type CameraView = 'perspective' | 'top' | 'front' | 'side' | 'orthographic';

export interface SceneConfig {
  warehouseWidth: number;
  warehouseDepth: number;
  warehouseHeight: number;
  floorCount: number;
  floorHeight: number;
  shelfWidth: number;
  shelfDepth: number;
  shelfHeight: number;
  shelfGap: number;
  rowGap: number;
  levels: number;
  slotsPerLevel: number;
}

export type ObjectType = 'shelf' | 'forklift' | 'sensor' | 'dock' | 'channel' | 'floor' | 'wall';

export interface PickedObject {
  type: ObjectType;
  id: string;
  data: ShelfData | ForkliftData | SensorData | LoadingDockData;
}
