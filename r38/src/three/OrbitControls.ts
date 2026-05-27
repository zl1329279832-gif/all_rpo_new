import * as THREE from 'three'

export class OrbitControls {
  object: THREE.PerspectiveCamera
  domElement: HTMLElement
  target: THREE.Vector3

  minDistance = 20
  maxDistance = 300
  minPolarAngle = 0.1
  maxPolarAngle = Math.PI / 2 - 0.1

  enableDamping = true
  dampingFactor = 0.05
  rotateSpeed = 1.0
  zoomSpeed = 1.0
  panSpeed = 1.0

  private spherical = new THREE.Spherical()
  private sphericalDelta = new THREE.Spherical()
  private scale = 1
  private panOffset = new THREE.Vector3()

  private rotateStart = new THREE.Vector2()
  private rotateEnd = new THREE.Vector2()
  private rotateDelta = new THREE.Vector2()

  private panStart = new THREE.Vector2()
  private panEnd = new THREE.Vector2()
  private panDelta = new THREE.Vector2()

  private dollyStart = new THREE.Vector2()
  private dollyEnd = new THREE.Vector2()
  private dollyDelta = new THREE.Vector2()

  private isRotating = false
  private isPanning = false
  private isDollying = false

  private updateOffset = new THREE.Vector3()
  private updateQuat = new THREE.Quaternion()
  private updateQuatInverse = new THREE.Quaternion()
  private updateLastPosition = new THREE.Vector3()
  private updateLastQuaternion = new THREE.Quaternion()
  private updateRight = new THREE.Vector3()
  private updateUp = new THREE.Vector3()
  private updateSpherical = new THREE.Spherical()

  constructor(object: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.object = object
    this.domElement = domElement
    this.target = new THREE.Vector3()

    this.setupEventListeners()
    this.update()
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('contextmenu', this.onContextMenu)
    this.domElement.addEventListener('mousedown', this.onMouseDown)
    this.domElement.addEventListener('wheel', this.onMouseWheel)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
    this.domElement.addEventListener('touchstart', this.onTouchStart)
    this.domElement.addEventListener('touchmove', this.onTouchMove)
    this.domElement.addEventListener('touchend', this.onTouchEnd)
  }

  private onContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  private onMouseDown = (event: MouseEvent): void => {
    event.preventDefault()

    switch (event.button) {
      case 0:
        this.isRotating = true
        this.rotateStart.set(event.clientX, event.clientY)
        break
      case 2:
        this.isPanning = true
        this.panStart.set(event.clientX, event.clientY)
        break
    }
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (this.isRotating) {
      this.rotateEnd.set(event.clientX, event.clientY)
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart)

      const element = this.domElement
      this.handleRotateLeft(this.rotateDelta.x / element.clientWidth * 2 * Math.PI * this.rotateSpeed,
        this.rotateDelta.y / element.clientHeight * 2 * Math.PI * this.rotateSpeed
      )

      this.rotateStart.copy(this.rotateEnd)
    }

    if (this.isPanning) {
      this.panEnd.set(event.clientX, event.clientY)
      this.panDelta.subVectors(this.panEnd, this.panStart)

      this.handlePan(this.panDelta.x, this.panDelta.y)

      this.panStart.copy(this.panEnd)
    }
  }

  private onMouseUp = (): void => {
    this.isRotating = false
    this.isPanning = false
  }

  private onMouseWheel = (event: WheelEvent): void => {
    event.preventDefault()

    if (event.deltaY < 0) {
      this.dollyIn(0.95)
    } else {
      this.dollyOut(1.05)
    }
  }

  private onTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 1) {
      this.isRotating = true
      this.rotateStart.set(event.touches[0].clientX, event.touches[0].clientY)
    } else if (event.touches.length === 2) {
      this.isDollying = true
      const dx = event.touches[1].clientX - event.touches[0].clientX
      const dy = event.touches[1].clientY - event.touches[0].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      this.dollyStart.set(0, distance)
    }
  }

  private onTouchMove = (event: TouchEvent): void => {
    event.preventDefault()

    if (event.touches.length === 1 && this.isRotating) {
      this.rotateEnd.set(event.touches[0].clientX, event.touches[0].clientY)
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart)

      const element = this.domElement
      this.handleRotateLeft(
        this.rotateDelta.x / element.clientWidth * 2 * Math.PI * this.rotateSpeed,
        this.rotateDelta.y / element.clientHeight * 2 * Math.PI * this.rotateSpeed
      )

      this.rotateStart.copy(this.rotateEnd)
    } else if (event.touches.length === 2 && this.isDollying) {
      const dx = event.touches[1].clientX - event.touches[0].clientX
      const dy = event.touches[1].clientY - event.touches[0].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      this.dollyEnd.set(0, distance)
      this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart)

      if (this.dollyDelta.y > 0) {
        this.dollyOut(1.01)
      } else {
        this.dollyIn(0.99)
      }

      this.dollyStart.copy(this.dollyEnd)
    }
  }

  private onTouchEnd = (): void => {
    this.isRotating = false
    this.isDollying = false
  }

  private handleRotateLeft(rotateX: number, rotateY: number): void {
    this.sphericalDelta.theta -= rotateX
    this.sphericalDelta.phi -= rotateY
  }

  private handlePan(deltaX: number, deltaY: number): void {
    const element = this.domElement
    const position = this.object.position

    this.updateRight.setFromMatrixColumn(this.object.matrix, 0)
    this.updateUp.setFromMatrixColumn(this.object.matrix, 1)

    const targetDistance = position.distanceTo(this.target)
    const panSpeed = targetDistance * 0.001 * this.panSpeed

    this.panOffset.add(this.updateRight.multiplyScalar(-deltaX * panSpeed))
    this.panOffset.add(this.updateUp.multiplyScalar(deltaY * panSpeed))
  }

  private dollyIn(scale: number): void {
    this.scale *= scale
  }

  private dollyOut(scale: number): void {
    this.scale /= scale
  }

  update(): void {
    const position = this.object.position

    this.updateOffset.copy(position).sub(this.target)

    this.updateQuat.setFromUnitVectors(this.object.up, new THREE.Vector3(0, 1, 0))
    this.updateQuatInverse.copy(this.updateQuat).invert()

    this.updateOffset.applyQuaternion(this.updateQuat)

    const radius = this.updateOffset.length()
    const theta = Math.atan2(this.updateOffset.x, this.updateOffset.z)
    const phi = Math.acos(Math.max(-1, Math.min(1, this.updateOffset.y / radius)))

    this.updateSpherical.set(radius, phi, theta)

    this.updateSpherical.theta += this.sphericalDelta.theta
    this.updateSpherical.phi += this.sphericalDelta.phi

    this.updateSpherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.updateSpherical.phi))

    this.updateSpherical.radius *= this.scale
    this.updateSpherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.updateSpherical.radius))

    if (this.enableDamping) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor
      this.sphericalDelta.phi *= 1 - this.dampingFactor
    } else {
      this.sphericalDelta.set(0, 0, 0)
    }

    this.target.add(this.panOffset)

    if (this.enableDamping) {
      this.panOffset.multiplyScalar(1 - this.dampingFactor)
    } else {
      this.panOffset.set(0, 0, 0)
    }

    this.scale = 1

    const sinPhiRadius = Math.sin(this.updateSpherical.phi) * this.updateSpherical.radius
    this.updateOffset.set(
      sinPhiRadius * Math.sin(this.updateSpherical.theta),
      Math.cos(this.updateSpherical.phi) * this.updateSpherical.radius,
      sinPhiRadius * Math.cos(this.updateSpherical.theta)
    )
    this.updateOffset.applyQuaternion(this.updateQuatInverse)

    position.copy(this.target).add(this.updateOffset)

    this.object.lookAt(this.target)

    if (this.enableDamping) {
      if (this.updateLastPosition.distanceTo(this.object.position) > 0.0001 ||
        Math.abs(2 * Math.acos(Math.abs(this.updateLastQuaternion.dot(this.object.quaternion)))) > 0.0001) {
        this.updateLastPosition.copy(this.object.position)
        this.updateLastQuaternion.copy(this.object.quaternion)
      }
    }
  }

  reset(): void {
    this.target.set(0, 0, 0)
    this.object.position.set(150, 120, 150)
    this.object.lookAt(this.target)
    this.update()
  }

  dispose(): void {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu)
    this.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.domElement.removeEventListener('wheel', this.onMouseWheel)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    this.domElement.removeEventListener('touchstart', this.onTouchStart)
    this.domElement.removeEventListener('touchmove', this.onTouchMove)
    this.domElement.removeEventListener('touchend', this.onTouchEnd)
  }
}
