import * as THREE from 'three'

export type PartCategory = 
  | 'structure' 
  | 'power' 
  | 'communication' 
  | 'propulsion' 
  | 'sensor' 
  | 'thermal' 
  | 'internal'

export interface PartMetadata {
  id: string
  name: string
  category: PartCategory
  description: string
  specifications: Record<string, string>
  function: string
}

export interface TelemetryData {
  power: {
    solarPanelOutput: number
    batteryLevel: number
    powerConsumption: number
  }
  attitude: {
    roll: number
    pitch: number
    yaw: number
    angularVelocity: { x: number; y: number; z: number }
  }
  temperature: {
    body: number
    solarPanel: number
    battery: number
    cpu: number
  }
  communication: {
    signalStrength: number
    dataRate: number
    linkStatus: 'connected' | 'disconnected' | 'degraded'
  }
  timestamp: number
}

export type ViewMode = 'normal' | 'exploded' | 'internal'

export interface AnimationState {
  isPlaying: boolean
  progress: number
  speed: number
}

export interface SatellitePart {
  id: string
  object3D: THREE.Object3D
  originalPosition: THREE.Vector3
  explodedPosition: THREE.Vector3
  metadata: PartMetadata
}

export interface MaterialConfig {
  color?: number
  metalness?: number
  roughness?: number
  emissive?: number
  emissiveIntensity?: number
}

export interface SceneConfig {
  container: HTMLElement
  backgroundColor?: number
  fov?: number
  near?: number
  far?: number
}
