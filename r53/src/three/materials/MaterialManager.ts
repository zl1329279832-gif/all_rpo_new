import * as THREE from 'three'
import type { MaterialConfig } from '../../types'

export class MaterialManager {
  private materials: Map<string, THREE.Material> = new Map()

  getMetalMaterial(config?: MaterialConfig): THREE.MeshStandardMaterial {
    const key = `metal_${config?.color ?? 0x888888}_${config?.metalness ?? 0.8}_${config?.roughness ?? 0.2}`
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: config?.color ?? 0x888888,
      metalness: config?.metalness ?? 0.8,
      roughness: config?.roughness ?? 0.2,
      emissive: config?.emissive ?? 0x000000,
      emissiveIntensity: config?.emissiveIntensity ?? 0,
    })

    this.materials.set(key, material)
    return material
  }

  getSolarCellMaterial(): THREE.MeshStandardMaterial {
    const key = 'solar_cell'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#1a237e'
    ctx.fillRect(0, 0, 256, 256)
    
    ctx.strokeStyle = '#3949ab'
    ctx.lineWidth = 2
    
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 32, 0)
      ctx.lineTo(i * 32, 256)
      ctx.stroke()
    }
    
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * 32)
      ctx.lineTo(256, i * 32)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x283593,
      metalness: 0.3,
      roughness: 0.7,
    })

    this.materials.set(key, material)
    return material
  }

  getCarbonFiberMaterial(): THREE.MeshStandardMaterial {
    const key = 'carbon_fiber'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 128, 128)
    
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    
    for (let i = 0; i < 128; i += 4) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(128, i)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x1a1a1a,
      metalness: 0.1,
      roughness: 0.9,
    })

    this.materials.set(key, material)
    return material
  }

  getGlowMaterial(color: number = 0x00d4ff): THREE.MeshBasicMaterial {
    const key = `glow_${color}`
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshBasicMaterial
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    })

    this.materials.set(key, material)
    return material
  }

  getWhiteMaterial(): THREE.MeshStandardMaterial {
    const key = 'white'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.5,
    })

    this.materials.set(key, material)
    return material
  }

  getGoldMaterial(): THREE.MeshStandardMaterial {
    const key = 'gold'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.3,
    })

    this.materials.set(key, material)
    return material
  }

  getCopperMaterial(): THREE.MeshStandardMaterial {
    const key = 'copper'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      metalness: 0.7,
      roughness: 0.4,
    })

    this.materials.set(key, material)
    return material
  }

  getBlueMaterial(): THREE.MeshStandardMaterial {
    const key = 'blue'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.5,
      roughness: 0.5,
    })

    this.materials.set(key, material)
    return material
  }

  getRedMaterial(): THREE.MeshStandardMaterial {
    const key = 'red'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      metalness: 0.3,
      roughness: 0.6,
    })

    this.materials.set(key, material)
    return material
  }

  getGlassMaterial(): THREE.MeshPhysicalMaterial {
    const key = 'glass'
    
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshPhysicalMaterial
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3,
    })

    this.materials.set(key, material)
    return material
  }

  dispose(): void {
    this.materials.forEach((material) => {
      material.dispose()
    })
    this.materials.clear()
  }
}

export const materialManager = new MaterialManager()
