import * as THREE from 'three'
import { COMPONENT_INFO } from '@/types'

export interface ComponentInfo {
  id: string
  name: string
  description: string
  category: string
  position: THREE.Vector3
}

export class ComponentLabelSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()

  private cachedMeshes: THREE.Mesh[] = []
  private selectedObject: THREE.Object3D | null = null

  private onSelectCallback?: (info: ComponentInfo | null) => void
  private onHoverCallback?: (info: ComponentInfo | null) => void

  private hoveredObject: THREE.Object3D | null = null
  private lastMoveTime: number = 0
  private readonly THROTTLE_MS: number = 100
  private needsRaycast: boolean = false
  private pendingMouseX: number = 0
  private pendingMouseY: number = 0

  private boundOnClick: (e: MouseEvent) => void
  private boundOnMouseMove: (e: MouseEvent) => void

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.boundOnClick = this.onClick.bind(this)
    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('click', this.boundOnClick)
    this.renderer.domElement.addEventListener('mousemove', this.boundOnMouseMove)
  }

  registerRecursive(root: THREE.Object3D): void {
    this.cachedMeshes = []
    root.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.componentId) {
        this.cachedMeshes.push(child)
      } else if (child instanceof THREE.Mesh) {
        let parent: THREE.Object3D | null = child
        while (parent) {
          if (parent.userData.componentId) {
            this.cachedMeshes.push(child)
            break
          }
          parent = parent.parent
        }
      }
    })
  }

  private getComponentInfo(obj: THREE.Object3D): ComponentInfo | null {
    let current: THREE.Object3D | null = obj
    while (current) {
      if (current.userData.componentId) {
        const componentId = current.userData.componentId
        const info = COMPONENT_INFO[componentId]
        if (info) {
          const worldPos = new THREE.Vector3()
          current.getWorldPosition(worldPos)
          return {
            id: componentId,
            name: info.name,
            description: info.description,
            category: info.category,
            position: worldPos
          }
        }
      }
      current = current.parent
    }
    return null
  }

  private onMouseMove(e: MouseEvent): void {
    const now = performance.now()
    if (now - this.lastMoveTime < this.THROTTLE_MS) {
      this.pendingMouseX = e.clientX
      this.pendingMouseY = e.clientY
      this.needsRaycast = true
      return
    }
    this.lastMoveTime = now
    this.performHoverRaycast(e.clientX, e.clientY)
  }

  private performHoverRaycast(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.raycaster.firstHitOnly = true
    const intersects = this.raycaster.intersectObjects(this.cachedMeshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0].object
      const info = this.getComponentInfo(hit)

      if (info) {
        if (this.hoveredObject !== hit) {
          this.hoveredObject = hit
          this.renderer.domElement.style.cursor = 'pointer'
        }
        if (this.onHoverCallback) {
          this.onHoverCallback(info)
        }
      } else {
        this.clearHover()
      }
    } else {
      this.clearHover()
    }
  }

  private clearHover(): void {
    if (this.hoveredObject === null) return
    this.hoveredObject = null
    this.renderer.domElement.style.cursor = 'default'
    if (this.onHoverCallback) {
      this.onHoverCallback(null)
    }
  }

  private onClick(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.raycaster.firstHitOnly = true
    const intersects = this.raycaster.intersectObjects(this.cachedMeshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0].object
      const info = this.getComponentInfo(hit)

      if (info) {
        this.selectedObject = hit
        if (this.onSelectCallback) {
          this.onSelectCallback(info)
        }
      }
    } else {
      this.clearSelection()
    }
  }

  clearSelection(): void {
    this.selectedObject = null
    if (this.onSelectCallback) {
      this.onSelectCallback(null)
    }
  }

  setOnSelectCallback(callback: (info: ComponentInfo | null) => void): void {
    this.onSelectCallback = callback
  }

  setOnHoverCallback(callback: (info: ComponentInfo | null) => void): void {
    this.onHoverCallback = callback
  }

  update(): void {
    if (this.needsRaycast) {
      this.needsRaycast = false
      this.lastMoveTime = performance.now()
      this.performHoverRaycast(this.pendingMouseX, this.pendingMouseY)
    }
  }

  dispose(): void {
    this.renderer.domElement.removeEventListener('click', this.boundOnClick)
    this.renderer.domElement.removeEventListener('mousemove', this.boundOnMouseMove)
    this.cachedMeshes = []
  }
}
