import * as THREE from 'three'
import { CameraMode } from '@/types'

export class CameraControls {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private mode: CameraMode = 'roam'

  private target: THREE.Vector3 = new THREE.Vector3(0, 2, 0)
  private spherical: THREE.Spherical = new THREE.Spherical(30, Math.PI / 3, Math.PI / 2)

  private isPointerLocked: boolean = false
  private yaw: number = 0
  private pitch: number = 0
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private keys: Record<string, boolean> = {}
  private moveSpeed: number = 8

  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private roamPosition: THREE.Vector3 = new THREE.Vector3(0, 2, 18)

  private boundaryMin: THREE.Vector3 = new THREE.Vector3(-18, 1.5, -18)
  private boundaryMax: THREE.Vector3 = new THREE.Vector3(18, 6, 18)

  private onChangeCallback?: () => void

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
    this.setupEventListeners()
    this.setMode('topdown')
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.domElement.addEventListener('wheel', this.onWheel.bind(this))
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault())

    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this))
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.mode === 'roam') {
      if (e.button === 0) {
        this.domElement.requestPointerLock()
      }
    } else {
      if (e.button === 0) {
        this.isDragging = true
        this.previousMousePosition = { x: e.clientX, y: e.clientY }
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.mode === 'roam' && this.isPointerLocked) {
      const sensitivity = 0.002
      this.yaw -= e.movementX * sensitivity
      this.pitch -= e.movementY * sensitivity

      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch))
    } else if (this.mode === 'topdown' && this.isDragging) {
      const deltaX = e.clientX - this.previousMousePosition.x
      const deltaY = e.clientY - this.previousMousePosition.y

      this.spherical.theta -= deltaX * 0.01
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.spherical.phi + deltaY * 0.01))

      this.previousMousePosition = { x: e.clientX, y: e.clientY }
      this.updateOrbitCamera()
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.mode === 'topdown' && e.button === 0) {
      this.isDragging = false
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    if (this.mode === 'topdown') {
      this.spherical.radius = Math.max(10, Math.min(60, this.spherical.radius + e.deltaY * 0.03))
      this.updateOrbitCamera()
    }
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.domElement
  }

  setMode(mode: CameraMode): void {
    if (this.mode === mode) return

    if (this.mode === 'roam') {
      this.roamPosition.copy(this.camera.position)
      if (this.isPointerLocked) {
        document.exitPointerLock()
      }
    }

    this.mode = mode

    if (mode === 'topdown') {
      this.spherical.set(35, Math.PI / 4, Math.PI / 2)
      this.target.set(0, 2, 0)
      this.updateOrbitCamera()
    } else {
      this.camera.position.copy(this.roamPosition)
      this.yaw = Math.PI
      this.pitch = -0.1
      this.velocity.set(0, 0, 0)
    }

    if (this.onChangeCallback) {
      this.onChangeCallback()
    }
  }

  getMode(): CameraMode {
    return this.mode
  }

  private updateOrbitCamera(): void {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(offset)
    this.camera.lookAt(this.target)
  }

  setChangeCallback(callback: () => void): void {
    this.onChangeCallback = callback
  }

  update(deltaTime: number): void {
    if (this.mode === 'roam' && this.isPointerLocked) {
      const forward = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      )
      forward.y = 0
      forward.normalize()

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const moveDir = new THREE.Vector3()
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward)
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward)
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right)
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right)

      if (this.keys['Space']) moveDir.y += 1
      if (this.keys['ShiftLeft']) moveDir.y -= 1

      if (moveDir.length() > 0) {
        moveDir.normalize()
        this.velocity.lerp(moveDir.multiplyScalar(this.moveSpeed), 0.2)
      } else {
        this.velocity.lerp(new THREE.Vector3(0, 0, 0), 0.15)
      }

      const newPosition = this.camera.position.clone().add(
        this.velocity.clone().multiplyScalar(deltaTime)
      )

      newPosition.x = Math.max(this.boundaryMin.x, Math.min(this.boundaryMax.x, newPosition.x))
      newPosition.y = Math.max(this.boundaryMin.y, Math.min(this.boundaryMax.y, newPosition.y))
      newPosition.z = Math.max(this.boundaryMin.z, Math.min(this.boundaryMax.z, newPosition.z))

      this.camera.position.copy(newPosition)

      const lookDir = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      )
      this.camera.lookAt(this.camera.position.clone().add(lookDir))
    }
  }

  getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone()
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this))
    document.removeEventListener('keyup', this.onKeyUp.bind(this))
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this))
  }
}
