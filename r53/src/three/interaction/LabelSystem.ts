import * as THREE from 'three'
import type { PartMetadata } from '../../types'

export interface LabelData {
  id: string
  position: THREE.Vector3
  metadata: PartMetadata
}

export class LabelSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private labels: Map<string, LabelData> = new Map()
  private labelElements: Map<string, HTMLDivElement> = new Map()
  private container: HTMLElement
  private activeLabelId: string | null = null
  private onLabelCloseCallback: (() => void) | null = null
  private ignoreNextClick: boolean = false

  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene
    this.camera = camera
    this.container = container
    this.setupClickOutsideListener()
  }

  private setupClickOutsideListener(): void {
    document.addEventListener('click', this.handleDocumentClick)
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false
      return
    }

    if (!this.activeLabelId) return

    const activeElement = this.labelElements.get(this.activeLabelId)
    const target = event.target as Node
    
    if (activeElement && !activeElement.contains(target)) {
      this.hideActiveLabel()
    }
  }

  addLabel(id: string, position: THREE.Vector3, metadata: PartMetadata): void {
    this.labels.set(id, { id, position, metadata })
  }

  removeLabel(id: string): void {
    this.labels.delete(id)
    const element = this.labelElements.get(id)
    if (element) {
      element.remove()
      this.labelElements.delete(id)
    }
  }

  showLabel(id: string): void {
    this.hideActiveLabel()
    
    const labelData = this.labels.get(id)
    if (!labelData) return

    const labelElement = this.createLabelElement(labelData.metadata)
    this.labelElements.set(id, labelElement)
    this.container.appendChild(labelElement)
    this.activeLabelId = id
    this.ignoreNextClick = true

    this.updateLabelPosition(id, labelData.position)
  }

  private createLabelElement(metadata: PartMetadata): HTMLDivElement {
    const label = document.createElement('div')
    label.className = 'part-label'
    label.style.cssText = `
      position: absolute;
      background: rgba(10, 22, 40, 0.95);
      border: 1px solid rgba(0, 212, 255, 0.5);
      border-radius: 8px;
      padding: 12px 16px;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      min-width: 200px;
      pointer-events: auto;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    `

    const categoryColors: Record<string, string> = {
      structure: '#00d4ff',
      power: '#ffd700',
      communication: '#00ff88',
      propulsion: '#ff6600',
      sensor: '#ff4444',
      thermal: '#ff8800',
      internal: '#aa44ff',
    }

    const categoryColor = categoryColors[metadata.category] || '#ffffff'

    label.innerHTML = `
      <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <div style="width: 8px; height: 8px; background: ${categoryColor}; border-radius: 50%;"></div>
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${metadata.name}</h3>
      </div>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px;">
        ${metadata.description}
      </div>
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 8px;">
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">功能说明</div>
        <div style="font-size: 12px;">${metadata.function}</div>
      </div>
      ${Object.keys(metadata.specifications).length > 0 ? `
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 8px; margin-top: 8px;">
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">技术参数</div>
        ${Object.entries(metadata.specifications).map(([key, value]) => `
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: rgba(255, 255, 255, 0.5);">${key}</span>
            <span>${value}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}
    `

    return label
  }

  setOnLabelClose(callback: () => void): void {
    this.onLabelCloseCallback = callback
  }

  hideActiveLabel(): void {
    if (this.activeLabelId) {
      const element = this.labelElements.get(this.activeLabelId)
      if (element) {
        element.remove()
      }
      this.labelElements.delete(this.activeLabelId)
      this.activeLabelId = null
      this.onLabelCloseCallback?.()
    }
  }

  update(): void {
    this.labels.forEach((labelData, id) => {
      this.updateLabelPosition(id, labelData.position)
    })
  }

  private updateLabelPosition(id: string, position: THREE.Vector3): void {
    const element = this.labelElements.get(id)
    if (!element) return

    const vector = position.clone()
    vector.project(this.camera)

    const x = (vector.x * 0.5 + 0.5) * this.container.clientWidth
    const y = (-vector.y * 0.5 + 0.5) * this.container.clientHeight

    element.style.left = `${x + 20}px`
    element.style.top = `${y - 100}px`

    if (vector.z > 1) {
      element.style.display = 'none'
    } else {
      element.style.display = 'block'
    }
  }

  clearAllLabels(): void {
    this.labels.clear()
    this.labelElements.forEach((element) => element.remove())
    this.labelElements.clear()
    this.activeLabelId = null
  }

  dispose(): void {
    document.removeEventListener('click', this.handleDocumentClick)
    this.clearAllLabels()
  }
}
