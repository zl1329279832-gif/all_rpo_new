import * as THREE from 'three'

export class ResourceDisposer {
  private geometries: Set<THREE.BufferGeometry> = new Set()
  private materials: Set<THREE.Material> = new Set()
  private textures: Set<THREE.Texture> = new Set()

  trackGeometry(geometry: THREE.BufferGeometry): void {
    this.geometries.add(geometry)
  }

  trackMaterial(material: THREE.Material): void {
    this.materials.add(material)
  }

  trackTexture(texture: THREE.Texture): void {
    this.textures.add(texture)
  }

  trackObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          this.trackGeometry(child.geometry)
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => this.trackMaterial(m))
        } else if (child.material) {
          this.trackMaterial(child.material)
        }
      }
    })
  }

  disposeGeometry(geometry: THREE.BufferGeometry): void {
    geometry.dispose()
    this.geometries.delete(geometry)
  }

  disposeMaterial(material: THREE.Material): void {
    material.dispose()
    this.materials.delete(material)
  }

  disposeTexture(texture: THREE.Texture): void {
    texture.dispose()
    this.textures.delete(texture)
  }

  disposeAll(): void {
    this.geometries.forEach((geometry) => geometry.dispose())
    this.geometries.clear()

    this.materials.forEach((material) => material.dispose())
    this.materials.clear()

    this.textures.forEach((texture) => texture.dispose())
    this.textures.clear()
  }

  getStatistics(): { geometries: number; materials: number; textures: number } {
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size,
    }
  }

  static disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    })
  }

  static deepDispose(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else if (object.material) {
          object.material.dispose()
        }
      }
    })
  }
}

export const resourceDisposer = new ResourceDisposer()
