import * as THREE from 'three'
import { SceneConfig } from './config'
import type { Container } from '@/types'

export class InstancedRenderer {
  private scene: THREE.Scene
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map()
  private containerData: Map<string, Container> = new Map()
  private dummy: THREE.Object3D = new THREE.Object3D()
  private maxCount: number = 2000

  constructor(scene: THREE.Scene, maxCount: number = 2000) {
    this.scene = scene
    this.maxCount = maxCount
  }

  public createInstancedContainers(containers: Container[]): void {
    this.dispose()

    const groupedByStatus = this.groupContainersByStatus(containers)

    Object.entries(groupedByStatus).forEach(([statusKey, statusContainers]) => {
      const groupedBySize = this.groupContainersBySize(statusContainers)

      Object.entries(groupedBySize).forEach(([size, sizeContainers]) => {
        const key = `${statusKey}_${size}`
        const mesh = this.createInstancedMesh(size as '20ft' | '40ft', statusKey, sizeContainers.length)
        
        sizeContainers.forEach((container, index) => {
          this.updateInstance(mesh, index, container)
          this.containerData.set(container.id, container)
        })

        mesh.instanceMatrix.needsUpdate = true
        this.instancedMeshes.set(key, mesh)
        this.scene.add(mesh)
      })
    })
  }

  private groupContainersByStatus(containers: Container[]): Record<string, Container[]> {
    return containers.reduce((acc, container) => {
      let statusKey = 'normal'
      if (container.isDangerous) {
        statusKey = 'dangerous'
      } else if (container.status === 'overtime') {
        statusKey = 'overtime'
      }
      if (!acc[statusKey]) acc[statusKey] = []
      acc[statusKey].push(container)
      return acc
    }, {} as Record<string, Container[]>)
  }

  private groupContainersBySize(containers: Container[]): Record<string, Container[]> {
    return containers.reduce((acc, container) => {
      const size = container.size
      if (!acc[size]) acc[size] = []
      acc[size].push(container)
      return acc
    }, {} as Record<string, Container[]>)
  }

  private createInstancedMesh(
    size: '20ft' | '40ft',
    status: string,
    count: number
  ): THREE.InstancedMesh {
    const width = size === '20ft' ? SceneConfig.container.width20ft : SceneConfig.container.width40ft
    const geometry = new THREE.BoxGeometry(width, SceneConfig.container.height, SceneConfig.container.depth)

    let color = SceneConfig.colors.normal
    if (status === 'dangerous') {
      color = SceneConfig.colors.dangerous
    } else if (status === 'overtime') {
      color = SceneConfig.colors.overtime
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.2
    })

    const mesh = new THREE.InstancedMesh(geometry, material, Math.min(count, this.maxCount))
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { type: 'instancedContainers', status, size }

    return mesh
  }

  private updateInstance(mesh: THREE.InstancedMesh, index: number, container: Container): void {
    this.dummy.position.set(container.position.x, container.position.y, container.position.z)
    this.dummy.rotation.set(0, 0, 0)
    this.dummy.updateMatrix()
    mesh.setMatrixAt(index, this.dummy.matrix)
    
    mesh.userData[`container_${index}`] = container.id
  }

  public updateContainer(container: Container): boolean {
    for (const [key, mesh] of this.instancedMeshes) {
      for (let i = 0; i < mesh.count; i++) {
        if (mesh.userData[`container_${i}`] === container.id) {
          this.updateInstance(mesh, i, container)
          mesh.instanceMatrix.needsUpdate = true
          return true
        }
      }
    }
    return false
  }

  public getContainerAtInstance(mesh: THREE.InstancedMesh, instanceId: number): Container | null {
    const containerId = mesh.userData[`container_${instanceId}`]
    return containerId ? this.containerData.get(containerId) || null : null
  }

  public getAllInstancedMeshes(): THREE.InstancedMesh[] {
    return Array.from(this.instancedMeshes.values())
  }

  public highlightContainer(containerId: string): void {
    this.clearHighlight()
    
    for (const [key, mesh] of this.instancedMeshes) {
      for (let i = 0; i < mesh.count; i++) {
        if (mesh.userData[`container_${i}`] === containerId) {
          const color = new THREE.Color(0xffff00)
          mesh.setColorAt(i, color)
          mesh.instanceColor!.needsUpdate = true
          break
        }
      }
    }
  }

  public clearHighlight(): void {
    for (const [key, mesh] of this.instancedMeshes) {
      if (mesh.instanceColor) {
        for (let i = 0; i < mesh.count; i++) {
          mesh.setColorAt(i, null)
        }
        mesh.instanceColor.needsUpdate = true
      }
    }
  }

  public setVisibility(visible: boolean): void {
    this.instancedMeshes.forEach(mesh => {
      mesh.visible = visible
    })
  }

  public getContainerCount(): number {
    return this.containerData.size
  }

  public dispose(): void {
    this.instancedMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
      this.scene.remove(mesh)
    })
    this.instancedMeshes.clear()
    this.containerData.clear()
  }
}
