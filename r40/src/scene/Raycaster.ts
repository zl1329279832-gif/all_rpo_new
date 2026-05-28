import * as THREE from 'three'
import type { InstancedRenderer } from './InstancedRenderer'
import type { BaseObject, Container } from '@/types'

export interface PickResult {
  object: THREE.Object3D | THREE.InstancedMesh
  data: BaseObject | Container
  point: THREE.Vector3
  instanceId?: number
}

export class RaycasterManager {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private camera: THREE.Camera
  private domElement: HTMLElement
  private instancedRenderer: InstancedRenderer | null = null
  private targetObjects: THREE.Object3D[] = []

  private onClickHandlers: Array<(result: PickResult | null) => void> = []
  private onHoverHandlers: Array<(result: PickResult | null) => void> = []

  private hoveredObject: PickResult | null = null

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 800
    this.mouse = new THREE.Vector2()
    this.camera = camera
    this.domElement = domElement

    this.setupEventListeners()
  }

  public setInstancedRenderer(renderer: InstancedRenderer): void {
    this.instancedRenderer = renderer
  }

  public setTargetObjects(objects: THREE.Object3D[]): void {
    this.targetObjects = objects
  }

  public addTargetObject(object: THREE.Object3D): void {
    this.targetObjects.push(object)
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('click', this.handleClick)
    this.domElement.addEventListener('mousemove', this.handleMouseMove)
  }

  private handleClick = (event: MouseEvent): void => {
    this.updateMouse(event)
    const result = this.pick()
    
    for (const handler of this.onClickHandlers) {
      handler(result)
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    this.updateMouse(event)
    const result = this.pick()

    if (this.hoveredObject !== result) {
      this.hoveredObject = result
      for (const handler of this.onHoverHandlers) {
        handler(result)
      }
    }

    this.domElement.style.cursor = result ? 'pointer' : 'default'
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  public pick(): PickResult | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const allObjects = [...this.targetObjects]
    
    if (this.instancedRenderer) {
      allObjects.push(...this.instancedRenderer.getAllInstancedMeshes())
    }

    const intersects = this.raycaster.intersectObjects(allObjects, true)

    if (intersects.length === 0) {
      return null
    }

    const intersect = intersects[0]
    const object = intersect.object

    if (object instanceof THREE.InstancedMesh && this.instancedRenderer) {
      const container = this.instancedRenderer.getContainerAtInstance(object, intersect.instanceId!)
      if (container) {
        return {
          object,
          data: container,
          point: intersect.point,
          instanceId: intersect.instanceId!
        }
      }
    }

    const data = this.findUserData(object)
    if (data) {
      return {
        object,
        data,
        point: intersect.point
      }
    }

    return null
  }

  private findUserData(object: THREE.Object3D): BaseObject | Container | null {
    let current: THREE.Object3D | null = object
    
    while (current) {
      if (current.userData && current.userData.data) {
        return current.userData.data
      }
      current = current.parent
    }
    
    return null
  }

  public onClick(handler: (result: PickResult | null) => void): void {
    this.onClickHandlers.push(handler)
  }

  public onHover(handler: (result: PickResult | null) => void): void {
    this.onHoverHandlers.push(handler)
  }

  public offClick(handler: (result: PickResult | null) => void): void {
    const index = this.onClickHandlers.indexOf(handler)
    if (index > -1) {
      this.onClickHandlers.splice(index, 1)
    }
  }

  public offHover(handler: (result: PickResult | null) => void): void {
    const index = this.onHoverHandlers.indexOf(handler)
    if (index > -1) {
      this.onHoverHandlers.splice(index, 1)
    }
  }

  public destroy(): void {
    this.domElement.removeEventListener('click', this.handleClick)
    this.domElement.removeEventListener('mousemove', this.handleMouseMove)
    this.onClickHandlers = []
    this.onHoverHandlers = []
    this.targetObjects = []
    this.instancedRenderer = null
  }
}
