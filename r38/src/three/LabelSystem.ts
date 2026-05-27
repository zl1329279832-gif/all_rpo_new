import * as THREE from 'three'
import { LABEL_CONFIG } from './constants'
import { createCanvasTexture, createRoundedRectPath } from './utils'

export interface LabelData {
  id: string
  text: string
  position: THREE.Vector3
  color?: string
  type?: 'building' | 'device' | 'gate' | 'alarm'
}

export class LabelSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private labels: Map<string, THREE.Sprite> = new Map()
  private container: HTMLElement

  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene
    this.camera = camera
    this.container = container
  }

  createLabel(data: LabelData): THREE.Sprite {
    const { id, text, position, color = '#ffffff, type = 'device' } = data

    const padding = LABEL_CONFIG.padding
    const fontSize = LABEL_CONFIG.fontSize

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    ctx.font = `${fontSize}px Microsoft YaHei`
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize

    const width = textWidth + padding * 2
    const height = textHeight + padding * 2

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    createRoundedRectPath(ctx, 0, 0, width, height, 4)
    ctx.fillStyle = LABEL_CONFIG.backgroundColor
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = `${fontSize}px Microsoft YaHei`
    ctx.fillStyle = LABEL_CONFIG.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(width / 30, height / 30, 1)
    sprite.position.copy(position)
    sprite.position.y += 2
    sprite.name = `label_${id}`
    sprite.userData = { type, text, labelId: id }

    this.scene.add(sprite)
    this.labels.set(id, sprite)

    return sprite
  }

  updateLabelPosition(id: string, position: THREE.Vector3): void {
    const label = this.labels.get(id)
    if (label) {
      label.position.copy(position)
      label.position.y += 2
    }
  }

  removeLabel(id: string): void {
    const label = this.labels.get(id)
    if (label) {
      this.scene.remove(label)
      const material = label.material as THREE.SpriteMaterial
      if (material.map) {
        material.map.dispose()
      }
      material.dispose()
      this.labels.delete(id)
    }
  }

  updateAllLabels(): void {
    this.labels.forEach((label) => {
      label.lookAt(this.camera.position)
    })
  }

  setLabelVisible(id: string, visible: boolean): void {
    const label = this.labels.get(id)
    if (label) {
      label.visible = visible
    }
  }

  setAllLabelsVisible(visible: boolean): void {
    this.labels.forEach((label) => {
      label.visible = visible
    })
  }

  updateLabelText(id: string, text: string, color?: string): void {
    const label = this.labels.get(id)
    if (label) {
      const material = label.material as THREE.SpriteMaterial
      if (material.map) {
        const canvas = (material.map as THREE.CanvasTexture).image as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!

        const padding = LABEL_CONFIG.padding
        const fontSize = LABEL_CONFIG.fontSize

        ctx.font = `${fontSize}px Microsoft YaHei`
        const metrics = ctx.measureText(text)
        const textWidth = metrics.width
        const textHeight = fontSize

        const width = textWidth + padding * 2
        const height = textHeight + padding * 2

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
        }

        ctx.clearRect(0, 0, width, height)

        createRoundedRectPath(ctx, 0, 0, width, height, 4)
        ctx.fillStyle = LABEL_CONFIG.backgroundColor
        ctx.fill()
        ctx.strokeStyle = color || '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.font = `${fontSize}px Microsoft YaHei`
        ctx.fillStyle = LABEL_CONFIG.textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, width / 2, height / 2)

        material.map.needsUpdate = true
        label.scale.set(width / 30, height / 30, 1)
      }
    }
  }

  dispose(): void {
    this.labels.forEach((label) => {
      this.scene.remove(label)
      const material = label.material as THREE.SpriteMaterial
      if (material.map) {
        material.map.dispose()
      }
      material.dispose()
    })
    this.labels.clear()
  }

  getLabel(id: string): THREE.Sprite | undefined {
    return this.labels.get(id)
  }
}
