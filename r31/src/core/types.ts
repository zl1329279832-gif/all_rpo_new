export interface RackData {
  id: number
  x: number
  z: number
  row: number
  col: number
  temperature: number
  power: number
  status: 'normal' | 'warning' | 'critical' | 'offline'
  rackType: 'server' | 'network' | 'storage'
}

export interface ScreenPosition {
  x: number
  y: number
  visible: boolean
}

export interface PickResult {
  rackId: number
  instanceId: number
  distance: number
  point: THREE.Vector3
}

export interface EngineStats {
  fps: number
  frameCount: number
  renderTime: number
  instanceCount: number
}

export const RACK_CONFIG = {
  WIDTH: 0.6,
  DEPTH: 1.2,
  HEIGHT: 2.0,
  GAP_X: 1.0,
  GAP_Z: 2.5,
  ROWS: 100,
  COLS: 100
} as const

export const TEMPERATURE_COLORS = {
  normal: 0x22c55e,
  warning: 0xf59e0b,
  critical: 0xef4444,
  offline: 0x6b7280
} as const
