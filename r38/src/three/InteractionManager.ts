import * as THREE from 'three'
import type { Building, Device } from '@/types'

export interface PickResult {
  type: 'building' | 'device' | 'gate' | null
  data: Building | Device | null
  object: THREE.Object3D | null
}

export class InteractionManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private onPickCallback?: (result: PickResult) => void
  private onHoverCallback?: (result: PickResult) => void
  private isDragging = false
  private clickThreshold = 5
  private lastMouseX = 0
  private lastMouseY = 0

  private boundOnMouseDown: (event: MouseEvent) => void
  private boundOnMouseMove: (event: MouseEvent) => void
  private boundOnMouseUp: (event: MouseEvent) => void
  private boundOnTouchStart: (event: TouchEvent) => void
  private boundOnTouchEnd: (event: TouchEvent) => void

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.boundOnMouseDown = this.onMouseDown.bind(this)
    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.boundOnMouseUp = this.onMouseUp.bind(this)
    this.boundOnTouchStart = this.onTouchStart.bind(this)
    this.boundOnTouchEnd = this.onTouchEnd.bind(this)

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    const domElement = this.renderer.domElement

    domElement.addEventListener('mousedown', this.boundOnMouseDown)
    domElement.addEventListener('mousemove', this.boundOnMouseMove)
    domElement.addEventListener('mouseup', this.boundOnMouseUp)
    domElement.addEventListener('touchstart', this.boundOnTouchStart)
    domElement.addEventListener('touchend', this.boundOnTouchEnd)
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = false
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private onMouseMove(event: MouseEvent): void {
    const deltaX = Math.abs(event.clientX - this.lastMouseX)
    const deltaY = Math.abs(event.clientY - this.lastMouseY)

    if (deltaX > this.clickThreshold || deltaY > this.clickThreshold) {
      this.isDragging = true
    }

    this.updateMouse(event)
    const result = this.pick()
    if (this.onHoverCallback) {
      this.onHoverCallback(result)
    }

    this.renderer.domElement.style.cursor = result.object ? 'pointer' : 'grab'
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) {
      this.updateMouse(event)
      const result = this.pick()
      if (this.onPickCallback) {
        this.onPickCallback(result)
      }
    }
    this.isDragging = false
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = false
      this.lastMouseX = event.touches[0].clientX
      this.lastMouseY = event.touches[0].clientY
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1 && !this.isDragging) {
      const touch = event.changedTouches[0]
      this.updateMouse(touch)
      const result = this.pick()
      if (this.onPickCallback) {
        this.onPickCallback(result)
      }
    }
    this.isDragging = false
  }

  private updateMouse(event: { clientX: number; clientY: number }): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private getObjectsByType(type: string): THREE.Object3D[] {
    const result: THREE.Object3D[] = []
    this.scene.traverse((obj) => {
      if (obj.userData && obj.userData.type === type) {
        result.push(obj)
      }
    })
    return result
  }

  pick(): PickResult {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const buildings = this.getObjectsByType('building')
    const devices = this.getObjectsByType('device')
    const gates = this.getObjectsByType('gate')

    const allObjects = [...buildings, ...devices, ...gates]

    const intersects = this.raycaster.intersectObjects(allObjects, true)

    if (intersects.length > 0) {
      let obj = intersects[0].object

      while (obj.parent && !obj.userData.type) {
        obj = obj.parent
      }

      if (obj.userData.type) {
        return {
          type: obj.userData.type,
          data: obj.userData.data,
          object: obj
        }
      }
    }

    return { type: null, data: null, object: null }
  }

  setOnPickCallback(callback: (result: PickResult) => void): void {
    this.onPickCallback = callback
  }

  setOnHoverCallback(callback: (result: PickResult) => void): void {
    this.onHoverCallback = callback
  }

  dispose(): void {
    const domElement = this.renderer.domElement
    domElement.removeEventListener('mousedown', this.boundOnMouseDown)
    domElement.removeEventListener('mousemove', this.boundOnMouseMove)
    domElement.removeEventListener('mouseup', this.boundOnMouseUp)
    domElement.removeEventListener('touchstart', this.boundOnTouchStart)
    domElement.removeEventListener('touchend', this.boundOnTouchEnd)
  }
}
