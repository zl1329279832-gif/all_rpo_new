import * as THREE from 'three'
import type { PartMetadata } from '../../types'

export interface IntersectionResult {
  partId: string
  parentPartId: string
  point: THREE.Vector3
  object: THREE.Object3D
}

export class RaycasterSystem {
  private raycaster: THREE.Raycaster
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private targetObjects: THREE.Object3D[] = []
  private hoveredObject: THREE.Object3D | null = null
  private originalMaterials: Map<THREE.Object3D, THREE.Material | THREE.Material[]> = new Map()
  private onPartClickCallback: ((result: IntersectionResult) => void) | null = null
  private onPartHoverCallback: ((result: IntersectionResult | null) => void) | null = null

  constructor(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ) {
    this.raycaster = new THREE.Raycaster()
    this.camera = camera
    this.renderer = renderer
    this.scene = scene

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement
    canvas.addEventListener('click', this.handleClick)
    canvas.addEventListener('mousemove', this.handleMouseMove)
  }

  private handleClick = (event: MouseEvent): void => {
    const result = this.intersect(event)
    if (result && this.onPartClickCallback) {
      this.onPartClickCallback(result)
    }
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const result = this.intersect(event)

    if (result) {
      if (this.hoveredObject !== result.object) {
        this.clearHover()
        this.setHover(result.object)
        this.hoveredObject = result.object
        if (this.onPartHoverCallback) {
          this.onPartHoverCallback(result)
        }
      }
    } else if (this.hoveredObject) {
      this.clearHover()
      this.hoveredObject = null
      if (this.onPartHoverCallback) {
        this.onPartHoverCallback(null)
      }
    }
  }

  private intersect(event: MouseEvent): IntersectionResult | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(mouse, this.camera)

    const intersects = this.raycaster.intersectObjects(
      this.targetObjects.length > 0 ? this.targetObjects : [this.scene],
      true
    )

    if (intersects.length > 0) {
      const intersect = intersects[0]
      let object = intersect.object
      let partId = object.userData.partId
      let parentPartId = object.userData.parentPartId || ''

      while (!partId && object.parent) {
        object = object.parent
        partId = object.userData.partId
        parentPartId = object.userData.parentPartId || ''
      }

      if (partId) {
        return {
          partId,
          parentPartId,
          point: intersect.point,
          object,
        }
      }
    }

    return null
  }

  private setHover(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (this.originalMaterials.has(child)) return
        
        this.originalMaterials.set(child, child.material)

        const hoverMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.5,
        })
        child.material = hoverMaterial
      }
    })
  }

  private clearHover(): void {
    this.originalMaterials.forEach((material, object) => {
      if (object instanceof THREE.Mesh) {
        object.material = material
      }
    })
    this.originalMaterials.clear()
  }

  setTargetObjects(objects: THREE.Object3D[]): void {
    this.targetObjects = objects
  }

  setOnPartClick(callback: (result: IntersectionResult) => void): void {
    this.onPartClickCallback = callback
  }

  setOnPartHover(callback: (result: IntersectionResult | null) => void): void {
    this.onPartHoverCallback = callback
  }

  dispose(): void {
    const canvas = this.renderer.domElement
    canvas.removeEventListener('click', this.handleClick)
    canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.clearHover()
  }
}
