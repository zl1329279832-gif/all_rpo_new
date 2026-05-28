import * as THREE from 'three'
import type { BaseObject, Container } from '@/types'
import { SceneConfig } from './config'

export interface LabelData {
  id: string
  text: string
  position: THREE.Vector3
  type: 'info' | 'warning' | 'danger'
  visible: boolean
}

export class LabelManager {
  private camera: THREE.Camera
  private container: HTMLElement
  private labels: Map<string, { data: LabelData; element: HTMLElement }> = new Map()
  private enabled: boolean = true
  private maxDistance: number = SceneConfig.labelsDistance

  constructor(camera: THREE.Camera, container: HTMLElement) {
    this.camera = camera
    this.container = container
  }

  public createLabel(id: string, text: string, position: THREE.Vector3, type: 'info' | 'warning' | 'danger' = 'info'): void {
    if (this.labels.has(id)) {
      this.updateLabel(id, { text, position, type })
      return
    }

    const element = document.createElement('div')
    element.className = `label-3d ${type}`
    element.textContent = text
    element.style.display = 'none'
    this.container.appendChild(element)

    this.labels.set(id, {
      data: { id, text, position, type, visible: true },
      element
    })
  }

  public createObjectLabel(obj: BaseObject | Container, position: THREE.Vector3): void {
    let type: 'info' | 'warning' | 'danger' = 'info'
    let text = obj.name

    if (obj.type === 'container') {
      const container = obj as Container
      text = container.containerNumber
      if (container.isDangerous) {
        type = 'danger'
      } else if (container.status === 'overtime') {
        type = 'warning'
      }
    } else if (obj.type === 'truck' || obj.type === 'quayCrane') {
      if (obj.status === 'error') {
        type = 'danger'
      } else if (obj.status === 'warning') {
        type = 'warning'
      }
    }

    this.createLabel(obj.id, text, position, type)
  }

  public updateLabel(id: string, updates: Partial<LabelData>): void {
    const label = this.labels.get(id)
    if (!label) return

    if (updates.text !== undefined) {
      label.data.text = updates.text
      label.element.textContent = updates.text
    }
    if (updates.position !== undefined) {
      label.data.position.copy(updates.position)
    }
    if (updates.type !== undefined) {
      label.data.type = updates.type
      label.element.className = `label-3d ${updates.type}`
    }
    if (updates.visible !== undefined) {
      label.data.visible = updates.visible
    }
  }

  public removeLabel(id: string): void {
    const label = this.labels.get(id)
    if (label) {
      this.container.removeChild(label.element)
      this.labels.delete(id)
    }
  }

  public updateLabels(): void {
    if (!this.enabled) return

    const cameraPosition = this.camera.position

    this.labels.forEach(({ data, element }) => {
      if (!data.visible) {
        element.style.display = 'none'
        return
      }

      const distance = data.position.distanceTo(cameraPosition)
      if (distance > this.maxDistance) {
        element.style.display = 'none'
        return
      }

      const screenPos = data.position.clone().project(this.camera)
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth
      const y = (-screenPos.y * 0.5 + 0.5) * this.container.clientHeight

      if (screenPos.z > 1) {
        element.style.display = 'none'
        return
      }

      const opacity = Math.max(0, 1 - (distance - 20) / (this.maxDistance - 20))
      element.style.display = 'block'
      element.style.left = `${x + 10}px`
      element.style.top = `${y - 10}px`
      element.style.opacity = String(opacity)
    })
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.labels.forEach(({ element }) => {
      element.style.display = enabled ? 'block' : 'none'
    })
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setMaxDistance(distance: number): void {
    this.maxDistance = distance
  }

  public clearAll(): void {
    this.labels.forEach(({ element }) => {
      this.container.removeChild(element)
    })
    this.labels.clear()
  }

  public getLabelCount(): number {
    return this.labels.size
  }

  public destroy(): void {
    this.clearAll()
  }
}
