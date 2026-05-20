import * as THREE from 'three'
import { RACK_CONFIG, TEMPERATURE_COLORS, type RackData } from './types'

export class InstancedRackManager {
  private instancedMesh: THREE.InstancedMesh
  private dummy: THREE.Object3D
  private colorMap: Map<number, THREE.Color>
  private instanceIdToRackId: Map<number, number>
  private rackIdToInstanceId: Map<number, number>
  private rackData: Map<number, RackData>
  private geometry: THREE.BoxGeometry
  private material: THREE.MeshStandardMaterial

  constructor() {
    this.dummy = new THREE.Object3D()
    this.colorMap = new Map()
    this.instanceIdToRackId = new Map()
    this.rackIdToInstanceId = new Map()
    this.rackData = new Map()
    
    this.geometry = new THREE.BoxGeometry(
      RACK_CONFIG.WIDTH,
      RACK_CONFIG.HEIGHT,
      RACK_CONFIG.DEPTH
    )
    
    this.material = new THREE.MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.7,
      vertexColors: false
    })

    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      RACK_CONFIG.ROWS * RACK_CONFIG.COLS
    )
    
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.instancedMesh.frustumCulled = true
  }

  build(racks: RackData[]): THREE.InstancedMesh {
    this.clear()
    
    racks.forEach((rack, index) => {
      this.rackData.set(rack.id, rack)
      this.instanceIdToRackId.set(index, rack.id)
      this.rackIdToInstanceId.set(rack.id, index)
      
      const color = this.getTemperatureColor(rack)
      this.colorMap.set(index, color)
      
      this.dummy.position.set(rack.x, RACK_CONFIG.HEIGHT / 2, rack.z)
      this.dummy.updateMatrix()
      this.instancedMesh.setMatrixAt(index, this.dummy.matrix)
      this.instancedMesh.setColorAt(index, color)
    })
    
    this.instancedMesh.instanceMatrix.needsUpdate = true
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
    this.instancedMesh.count = racks.length
    
    return this.instancedMesh
  }

  updateRackStatus(rackId: number, data: Partial<RackData>): void {
    const instanceId = this.rackIdToInstanceId.get(rackId)
    if (instanceId === undefined) return

    const rack = this.rackData.get(rackId)
    if (!rack) return

    Object.assign(rack, data)

    const color = this.getTemperatureColor(rack)
    this.colorMap.set(instanceId, color)
    this.instancedMesh.setColorAt(instanceId, color)
    
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  highlightRack(rackId: number | null): void {
    this.colorMap.forEach((color, instanceId) => {
      const currentRackId = this.instanceIdToRackId.get(instanceId)
      if (currentRackId === undefined) return

      if (rackId === null || currentRackId === rackId) {
        const rack = this.rackData.get(currentRackId)
        const baseColor = rack ? this.getTemperatureColor(rack) : color
        this.instancedMesh.setColorAt(instanceId, baseColor)
      } else {
        const dimColor = color.clone().multiplyScalar(0.3)
        this.instancedMesh.setColorAt(instanceId, dimColor)
      }
    })
    
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true
    }
  }

  getRackDataByInstanceId(instanceId: number): RackData | undefined {
    const rackId = this.instanceIdToRackId.get(instanceId)
    return rackId !== undefined ? this.rackData.get(rackId) : undefined
  }

  getRackDataById(rackId: number): RackData | undefined {
    return this.rackData.get(rackId)
  }

  getMesh(): THREE.InstancedMesh {
    return this.instancedMesh
  }

  getInstanceCount(): number {
    return this.instancedMesh.count
  }

  private getTemperatureColor(rack: RackData): THREE.Color {
    const baseHex = TEMPERATURE_COLORS[rack.status]
    const baseColor = new THREE.Color(baseHex)
    
    if (rack.status === 'normal' || rack.status === 'warning') {
      const intensity = Math.min(rack.temperature / 40, 1)
      return baseColor.clone().lerp(new THREE.Color(0xffffff), intensity * 0.2)
    }
    
    return baseColor
  }

  clear(): void {
    this.rackData.clear()
    this.instanceIdToRackId.clear()
    this.rackIdToInstanceId.clear()
    this.colorMap.clear()
    this.instancedMesh.count = 0
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.instancedMesh.dispose()
    this.clear()
  }
}
