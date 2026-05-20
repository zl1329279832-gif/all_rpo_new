import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

export class CameraController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private target: THREE.Vector3
  private spherical: THREE.Spherical
  private isDragging: boolean = false
  private isPanning: boolean = false
  private previousMouse: THREE.Vector2
  private zoomMin: number = 10
  private zoomMax: number = 200
  private rotationSpeed: number = 0.005
  private zoomSpeed: number = 0.001
  private panSpeed: number = 0.05
  private onCameraChange: (() => void) | null = null

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
    this.target = new THREE.Vector3(0, 0, 0)
    this.previousMouse = new THREE.Vector2()
    
    const offset = new THREE.Vector3().subVectors(camera.position, this.target)
    this.spherical = new THREE.Spherical().setFromVector3(offset)
    
    this.bindEvents()
  }

  private bindEvents(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown)
    this.domElement.addEventListener('mousemove', this.onMouseMove)
    this.domElement.addEventListener('mouseup', this.onMouseUp)
    this.domElement.addEventListener('mouseleave', this.onMouseUp)
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false })
    this.domElement.addEventListener('contextmenu', this.onContextMenu)
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isDragging = true
    } else if (e.button === 2) {
      this.isPanning = true
    }
    this.previousMouse.set(e.clientX, e.clientY)
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging && !this.isPanning) return

    const deltaX = e.clientX - this.previousMouse.x
    const deltaY = e.clientY - this.previousMouse.y

    if (this.isDragging) {
      this.spherical.theta -= deltaX * this.rotationSpeed
      this.spherical.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, this.spherical.phi - deltaY * this.rotationSpeed)
      )
      this.updateCameraPosition()
    }

    if (this.isPanning) {
      const panOffset = new THREE.Vector3()
      const cameraDirection = new THREE.Vector3()
      this.camera.getWorldDirection(cameraDirection)
      cameraDirection.y = 0
      cameraDirection.normalize()

      const rightDirection = new THREE.Vector3()
        .crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0))
        .normalize()

      const panDistance = this.spherical.radius * this.panSpeed
      panOffset.addScaledVector(rightDirection, -deltaX * panDistance * 0.01)
      panOffset.addScaledVector(cameraDirection, deltaY * panDistance * 0.01)
      
      this.target.add(panOffset)
      this.updateCameraPosition()
    }

    this.previousMouse.set(e.clientX, e.clientY)
  }

  private onMouseUp = (): void => {
    this.isDragging = false
    this.isPanning = false
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const zoomFactor = 1 + e.deltaY * this.zoomSpeed
    this.spherical.radius = Math.max(
      this.zoomMin,
      Math.min(this.zoomMax, this.spherical.radius * zoomFactor)
    )
    this.updateCameraPosition()
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
  }

  private updateCameraPosition(): void {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(offset)
    this.camera.lookAt(this.target)
    this.notifyChange()
  }

  flyTo(targetPos: THREE.Vector3, duration: number = 1500): Promise<void> {
    return new Promise((resolve) => {
      const startTarget = this.target.clone()
      const startSpherical = this.spherical.clone()
      
      const endTarget = targetPos.clone()
      const endSpherical = startSpherical.clone()
      endSpherical.radius = Math.max(20, startSpherical.radius * 0.6)
      
      const tweenData = {
        targetX: startTarget.x,
        targetY: startTarget.y,
        targetZ: startTarget.z,
        radius: startSpherical.radius,
        phi: startSpherical.phi,
        theta: startSpherical.theta
      }

      new TWEEN.Tween(tweenData)
        .to({
          targetX: endTarget.x,
          targetY: endTarget.y,
          targetZ: endTarget.z,
          radius: endSpherical.radius,
          phi: endSpherical.phi,
          theta: endSpherical.theta
        }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          this.target.set(tweenData.targetX, tweenData.targetY, tweenData.targetZ)
          this.spherical.radius = tweenData.radius
          this.spherical.phi = tweenData.phi
          this.spherical.theta = tweenData.theta
          this.updateCameraPosition()
        })
        .onComplete(() => {
          resolve()
        })
        .start()
    })
  }

  resetView(duration: number = 1000): Promise<void> {
    return this.flyTo(new THREE.Vector3(0, 0, 0), duration)
  }

  setOnChangeCallback(callback: () => void): void {
    this.onCameraChange = callback
  }

  private notifyChange(): void {
    if (this.onCameraChange) {
      this.onCameraChange()
    }
  }

  getTarget(): THREE.Vector3 {
    return this.target.clone()
  }

  dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.domElement.removeEventListener('mousemove', this.onMouseMove)
    this.domElement.removeEventListener('mouseup', this.onMouseUp)
    this.domElement.removeEventListener('mouseleave', this.onMouseUp)
    this.domElement.removeEventListener('wheel', this.onWheel)
    this.domElement.removeEventListener('contextmenu', this.onContextMenu)
  }
}
