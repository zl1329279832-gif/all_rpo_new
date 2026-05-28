import * as THREE from 'three'
import { InstanceInfo } from '@/three/renderer/InstancedRenderer'
import { DeviceData } from '@/types'

export interface PickerOptions {
  domElement: HTMLCanvasElement
  camera: THREE.Camera
  getRaycastObjects: () => THREE.Object3D[]
  getInstanceInfo: (intersect: THREE.Intersection) => InstanceInfo | null
}

export interface PickResult {
  device: DeviceData
  point: THREE.Vector3
  instanceInfo: InstanceInfo
}

export class Picker {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private domElement: HTMLCanvasElement
  private camera: THREE.Camera
  private getRaycastObjects: () => THREE.Object3D[]
  private getInstanceInfo: (intersect: THREE.Intersection) => InstanceInfo | null
  
  private hoveredDeviceId: string | null = null
  private onClickCallbacks: ((result: PickResult) => void)[] = []
  private onHoverCallbacks: ((result: PickResult | null) => void)[] = []

  constructor(options: PickerOptions) {
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Line!.threshold = 0.1
    this.mouse = new THREE.Vector2()
    this.domElement = options.domElement
    this.camera = options.camera
    this.getRaycastObjects = options.getRaycastObjects
    this.getInstanceInfo = options.getInstanceInfo

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('click', this.handleClick.bind(this))
    this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this))
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private pick(): PickResult | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const objects = this.getRaycastObjects()
    
    if (objects.length === 0) return null

    const intersects = this.raycaster.intersectObjects(objects, false)
    
    for (const intersect of intersects) {
      const instanceInfo = this.getInstanceInfo(intersect)
      if (instanceInfo) {
        return {
          device: instanceInfo.data,
          point: intersect.point.clone(),
          instanceInfo
        }
      }
    }

    return null
  }

  private handleClick(event: MouseEvent): void {
    this.updateMouse(event)
    const result = this.pick()
    if (result) {
      this.onClickCallbacks.forEach(cb => cb(result))
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    this.updateMouse(event)
    const result = this.pick()

    const newHoveredId = result?.device.id || null
    
    if (newHoveredId !== this.hoveredDeviceId) {
      this.hoveredDeviceId = newHoveredId
      this.domElement.style.cursor = result ? 'pointer' : 'default'
      this.onHoverCallbacks.forEach(cb => cb(result))
    }
  }

  public onClick(callback: (result: PickResult) => void): void {
    this.onClickCallbacks.push(callback)
  }

  public onHover(callback: (result: PickResult | null) => void): void {
    this.onHoverCallbacks.push(callback)
  }

  public dispose(): void {
    this.domElement.removeEventListener('click', this.handleClick.bind(this))
    this.domElement.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.onClickCallbacks = []
    this.onHoverCallbacks = []
  }
}
