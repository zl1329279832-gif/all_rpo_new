import * as THREE from 'three'
import { TextureConfig } from '@/types'

export class TextureManager {
  private static instance: TextureManager
  private textureCache: Map<string, THREE.Texture> = new Map()
  private materialCache: Map<string, THREE.MeshStandardMaterial> = new Map()
  private canvasCache: Map<string, HTMLCanvasElement> = new Map()

  private constructor() {}

  static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager()
    }
    return TextureManager.instance
  }

  createCanvasTexture(
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
    key: string
  ): THREE.CanvasTexture {
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key) as THREE.CanvasTexture
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    drawFn(ctx, width, height)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.anisotropy = 8

    this.textureCache.set(key, texture)
    this.canvasCache.set(key, canvas)

    return texture
  }

  createStoneFloorTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#5a5a55'
      ctx.fillRect(0, 0, w, h)

      const stoneSize = 64
      const gap = 3

      for (let y = 0; y < h; y += stoneSize + gap) {
        for (let x = 0; x < w; x += stoneSize + gap) {
          const offsetY = (x / (stoneSize + gap)) % 2 === 0 ? 0 : (stoneSize + gap) / 2
          const actualY = y + offsetY

          const shade = 100 + Math.random() * 30
          ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`
          ctx.fillRect(x + gap, actualY + gap, stoneSize - gap * 2, stoneSize - gap * 2)

          ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`
          for (let i = 0; i < 5; i++) {
            const dx = x + gap + Math.random() * (stoneSize - gap * 2)
            const dy = actualY + gap + Math.random() * (stoneSize - gap * 2)
            const dw = 2 + Math.random() * 4
            ctx.fillRect(dx, dy, dw, 1)
          }

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.lineWidth = gap
          ctx.strokeRect(x + gap, actualY + gap, stoneSize - gap * 2, stoneSize - gap * 2)
        }
      }
    }, 'stone_floor')
  }

  createBrickTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#4a4a48'
      ctx.fillRect(0, 0, w, h)

      const brickW = 48
      const brickH = 24
      const gap = 2

      for (let y = 0; y < h; y += brickH + gap) {
        for (let x = 0; x < w; x += brickW + gap) {
          const offsetX = (y / (brickH + gap)) % 2 === 0 ? 0 : (brickW + gap) / 2
          const actualX = x + offsetX

          const shade = 90 + Math.random() * 25
          ctx.fillStyle = `rgb(${shade + 20}, ${shade + 10}, ${shade})`
          ctx.fillRect(actualX + gap, y + gap, brickW - gap * 2, brickH - gap * 2)

          ctx.strokeStyle = 'rgba(60, 55, 50, 0.6)'
          ctx.lineWidth = gap
          ctx.strokeRect(actualX + gap, y + gap, brickW - gap * 2, brickH - gap * 2)
        }
      }
    }, 'brick_wall')
  }

  createTileTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(128, 256, (ctx, w, h) => {
      const tileW = 16
      const tileH = 32
      const overlap = 8

      for (let row = 0; row < 8; row++) {
        const offsetX = row % 2 === 0 ? 0 : tileW / 2
        for (let col = 0; col < 10; col++) {
          const x = col * tileW + offsetX
          const y = row * (tileH - overlap)

          const shade = 100 + Math.random() * 30
          const gradient = ctx.createLinearGradient(x, y, x, y + tileH)
          gradient.addColorStop(0, `rgb(${shade + 20}, ${shade + 20}, ${shade + 25})`)
          gradient.addColorStop(0.5, `rgb(${shade}, ${shade}, ${shade + 5})`)
          gradient.addColorStop(1, `rgb(${shade - 20}, ${shade - 20}, ${shade - 15})`)

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + tileW, y)
          ctx.lineTo(x + tileW, y + tileH - 4)
          ctx.quadraticCurveTo(x + tileW / 2, y + tileH, x, y + tileH - 4)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = `rgb(${shade + 40}, ${shade + 35}, ${shade + 30})`
          ctx.beginPath()
          ctx.arc(x + tileW / 2, y + tileH - 4, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }, 'roof_tile')
  }

  createWoodTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(256, 512, (ctx, w, h) => {
      const baseR = 139
      const baseG = 90
      const baseB = 43

      ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < h; i += 2) {
        const variation = Math.sin(i * 0.02) * 15 + Math.sin(i * 0.05) * 8
        const r = Math.min(255, Math.max(0, baseR + variation))
        const g = Math.min(255, Math.max(0, baseG + variation * 0.7))
        const b = Math.min(255, Math.max(0, baseB + variation * 0.4))
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(0, i, w, 2)
      }

      for (let i = 0; i < 8; i++) {
        const y = Math.random() * h
        const len = 50 + Math.random() * 150
        ctx.strokeStyle = `rgba(80, 50, 20, ${0.2 + Math.random() * 0.3})`
        ctx.lineWidth = 1 + Math.random() * 2
        ctx.beginPath()
        ctx.moveTo(0, y)
        for (let x = 0; x < len; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.1) * 3)
        }
        ctx.stroke()
      }
    }, 'wood')
  }

  createLatticePattern(): THREE.CanvasTexture {
    return this.createCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(100, 60, 30, 0.95)'
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(255, 240, 200, 0.85)'
      const gridSize = 32
      const barWidth = 6

      for (let x = 0; x < w; x += gridSize) {
        ctx.fillRect(x + gridSize / 2 - barWidth / 2, 0, barWidth, h)
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.fillRect(0, y + gridSize / 2 - barWidth / 2, w, barWidth)
      }

      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          const cx = x + gridSize / 2
          const cy = y + gridSize / 2
          ctx.strokeStyle = 'rgba(100, 60, 30, 0.95)'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(cx - gridSize / 3, cy)
          ctx.lineTo(cx + gridSize / 3, cy)
          ctx.moveTo(cx, cy - gridSize / 3)
          ctx.lineTo(cx, cy + gridSize / 3)
          ctx.stroke()
        }
      }

      ctx.strokeStyle = 'rgba(100, 60, 30, 0.95)'
      ctx.lineWidth = 8
      ctx.strokeRect(0, 0, w, h)
    }, 'lattice')
  }

  createRedPaintTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#8b1a1a'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 50; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const r = 1 + Math.random() * 3
        const alpha = 0.05 + Math.random() * 0.1
        ctx.fillStyle = `rgba(60, 10, 10, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w)
      gradient.addColorStop(0, 'rgba(180, 40, 40, 0.3)')
      gradient.addColorStop(1, 'rgba(100, 20, 20, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
    }, 'red_paint')
  }

  createGoldPaintTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(128, 128, (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, '#d4a84b')
      gradient.addColorStop(0.3, '#f0d890')
      gradient.addColorStop(0.5, '#d4a84b')
      gradient.addColorStop(0.7, '#b8941f')
      gradient.addColorStop(1, '#d4a84b')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 30; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const r = 0.5 + Math.random() * 1.5
        ctx.fillStyle = `rgba(255, 240, 200, ${0.1 + Math.random() * 0.2})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }, 'gold_paint')
  }

  createStoneTexture(): THREE.CanvasTexture {
    return this.createCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#6b6b68'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 200; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const r = 2 + Math.random() * 8
        const shade = 80 + Math.random() * 40
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 5}, ${0.3 + Math.random() * 0.4})`
        ctx.beginPath()
        ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < 5; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const len = 20 + Math.random() * 60
        const angle = Math.random() * Math.PI
        ctx.strokeStyle = `rgba(50, 50, 50, ${0.2 + Math.random() * 0.3})`
        ctx.lineWidth = 0.5 + Math.random() * 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
        ctx.stroke()
      }
    }, 'stone')
  }

  createMaterial(config: TextureConfig, textureKey?: string): THREE.MeshStandardMaterial {
    const cacheKey = `${textureKey || 'solid'}-${config.color}-${config.roughness || 1}-${config.metalness || 0}`

    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!.clone()
    }

    const materialParams: THREE.MeshStandardMaterialParameters = {
      color: config.color,
      roughness: config.roughness ?? 0.8,
      metalness: config.metalness ?? 0.1
    }

    if (textureKey) {
      let map: THREE.Texture | undefined
      switch (textureKey) {
        case 'stone_floor':
          map = this.createStoneFloorTexture()
          break
        case 'brick_wall':
          map = this.createBrickTexture()
          break
        case 'roof_tile':
          map = this.createTileTexture()
          break
        case 'wood':
          map = this.createWoodTexture()
          break
        case 'lattice':
          map = this.createLatticePattern()
          materialParams.transparent = true
          materialParams.alphaTest = 0.1
          break
        case 'red_paint':
          map = this.createRedPaintTexture()
          break
        case 'gold_paint':
          map = this.createGoldPaintTexture()
          materialParams.roughness = 0.3
          materialParams.metalness = 0.6
          break
        case 'stone':
          map = this.createStoneTexture()
          break
      }
      if (map && config.repeat) {
        map = map.clone()
        map.repeat.set(config.repeat.x, config.repeat.y)
      }
      materialParams.map = map
    }

    if (config.emissive !== undefined) {
      materialParams.emissive = config.emissive
      materialParams.emissiveIntensity = config.emissiveIntensity ?? 1
    }

    const material = new THREE.MeshStandardMaterial(materialParams)
    this.materialCache.set(cacheKey, material)

    return material.clone()
  }

  clearCache(): void {
    this.textureCache.forEach(texture => texture.dispose())
    this.materialCache.forEach(material => material.dispose())
    this.canvasCache.clear()
    this.textureCache.clear()
    this.materialCache.clear()
  }
}
