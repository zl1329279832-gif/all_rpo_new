import * as THREE from 'three'
import { BuildingComponent, COMPONENT_INFO } from '@/types'

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

  private clickableObjects: THREE.Object3D[] = []
  private selectedObject: THREE.Object3D | null = null
  private highlightMesh: THREE.Mesh | null = null

  private onSelectCallback?: (info: ComponentInfo | null) => void
  private onHoverCallback?: (info: ComponentInfo | null) => void

  private hoveredObject: THREE.Object3D | null = null

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.setupEventListeners()
    this.createHighlight()
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this))
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  private createHighlight(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      wireframeLinewidth: 2
    })
    this.highlightMesh = new THREE.Mesh(geometry, material)
    this.highlightMesh.visible = false
    this.scene.add(this.highlightMesh)
  }

  registerObject(obj: THREE.Object3D): void {
    this.clickableObjects.push(obj)
  }

  registerRecursive(root: THREE.Object3D): void {
    root.traverse(child => {
      if (child.userData.componentId) {
        this.clickableObjects.push(child)
      }
    })
  }

  private getAllMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = []
    this.clickableObjects.forEach(obj => {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child)
        }
      })
    })
    return meshes
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
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = this.getAllMeshes()
    const intersects = this.raycaster.intersectObjects(meshes, true)

    if (intersects.length > 0) {
      const hit = intersects[0].object
      const info = this.getComponentInfo(hit)

      if (info) {
        this.hoveredObject = hit
        this.renderer.domElement.style.cursor = 'pointer'

        if (this.highlightMesh && hit !== this.selectedObject) {
          const box = new THREE.Box3().setFromObject(hit)
          const center = new THREE.Vector3()
          const size = new THREE.Vector3()
          box.getCenter(center)
          box.getSize(size)

          this.highlightMesh.position.copy(center)
          this.highlightMesh.scale.copy(size).multiplyScalar(1.05)
          this.highlightMesh.visible = true
          const material = this.highlightMesh.material as THREE.MeshBasicMaterial
          material.color.setHex(0x00ff88)
          material.opacity = 0.2
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
    this.hoveredObject = null
    this.renderer.domElement.style.cursor = 'default'

    if (this.highlightMesh && this.selectedObject === null) {
      this.highlightMesh.visible = false
    }

    if (this.onHoverCallback) {
      this.onHoverCallback(null)
    }
  }

  private onClick(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = this.getAllMeshes()
    const intersects = this.raycaster.intersectObjects(meshes, true)

    if (intersects.length > 0) {
      const hit = intersects[0].object
      const info = this.getComponentInfo(hit)

      if (info) {
        this.selectedObject = hit

        if (this.highlightMesh) {
          const box = new THREE.Box3().setFromObject(hit)
          const center = new THREE.Vector3()
          const size = new THREE.Vector3()
          box.getCenter(center)
          box.getSize(size)

          this.highlightMesh.position.copy(center)
          this.highlightMesh.scale.copy(size).multiplyScalar(1.1)
          this.highlightMesh.visible = true
          const material = this.highlightMesh.material as THREE.MeshBasicMaterial
          material.color.setHex(0x00ffff)
          material.opacity = 0.4
        }

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
    if (this.highlightMesh) {
      this.highlightMesh.visible = false
    }
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

  getSelectedInfo(): ComponentInfo | null {
    if (this.selectedObject) {
      return this.getComponentInfo(this.selectedObject)
    }
    return null
  }

  update(): void {
    if (this.highlightMesh && this.selectedObject) {
      const box = new THREE.Box3().setFromObject(this.selectedObject)
      const center = new THREE.Vector3()
      const size = new THREE.Vector3()
      box.getCenter(center)
      box.getSize(size)
      this.highlightMesh.position.copy(center)
      this.highlightMesh.scale.copy(size).multiplyScalar(1.1)
    }
  }

  dispose(): void {
    this.renderer.domElement.removeEventListener('click', this.onClick.bind(this))
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this))
    if (this.highlightMesh) {
      this.highlightMesh.material.dispose()
      this.highlightMesh.geometry.dispose()
    }
  }
}
