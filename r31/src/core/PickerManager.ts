import * as THREE from 'three'
import type { PickResult, ScreenPosition, RackData } from './types'
import { InstancedRackManager } from './InstancedRackManager'

export class PickerManager {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private rackManager: InstancedRackManager
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private debounceTimer: number | null = null
  private lastPickTime: number = 0
  private readonly DEBOUNCE_MS = 16
  private readonly PICK_COOLDOWN_MS = 8

  constructor(
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    rackManager: InstancedRackManager
  ) {
    this.domElement = domElement
    this.camera = camera
    this.rackManager = rackManager
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Mesh.threshold = 0.1
    this.mouse = new THREE.Vector2()
  }

  pick(clientX: number, clientY: number): PickResult | null {
    const now = performance.now()
    if (now - this.lastPickTime < this.PICK_COOLDOWN_MS) {
      return null
    }
    this.lastPickTime = now

    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const mesh = this.rackManager.getMesh()
    const intersects = this.raycaster.intersectObject(mesh, false)

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const hit = intersects[0]
      return {
        rackId: this.rackManager.getRackDataByInstanceId(hit.instanceId)?.id ?? -1,
        instanceId: hit.instanceId,
        distance: hit.distance,
        point: hit.point.clone()
      }
    }

    return null
  }

  pickDebounced(
    clientX: number,
    clientY: number,
    callback: (result: PickResult | null) => void
  ): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = window.setTimeout(() => {
      const result = this.pick(clientX, clientY)
      callback(result)
      this.debounceTimer = null
    }, this.DEBOUNCE_MS)
  }

  worldToScreen(worldPosition: THREE.Vector3): ScreenPosition {
    const vector = worldPosition.clone().project(this.camera)
    const rect = this.domElement.getBoundingClientRect()

    return {
      x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top,
      visible: vector.z < 1 && vector.z > -1
    }
  }

  getRackScreenPosition(rack: RackData): ScreenPosition {
    const worldPos = new THREE.Vector3(rack.x, 2.5, rack.z)
    return this.worldToScreen(worldPos)
  }

  dispose(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer)
    }
  }
}
