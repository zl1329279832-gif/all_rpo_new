import * as THREE from 'three'
import { DeviceData, DeviceStatus, STATUS_COLORS, STATUS_NAMES, LabelData } from '@/types'

export class LabelSystem {
  private container: HTMLElement
  private camera: THREE.Camera
  private rendererDomElement: HTMLElement
  private labels: Map<string, HTMLElement> = new Map()
  private labelData: Map<string, LabelData> = new Map()
  private alarmIcons: Map<string, HTMLElement> = new Map()
  private animationFrameId: number | null = null

  constructor(
    container: HTMLElement,
    camera: THREE.Camera,
    rendererDomElement: HTMLElement
  ) {
    this.container = container
    this.camera = camera
    this.rendererDomElement = rendererDomElement
  }

  public createDeviceLabel(device: DeviceData): void {
    this.removeLabel(device.id)

    const labelEl = document.createElement('div')
    labelEl.className = 'device-label'
    labelEl.dataset.deviceId = device.id
    labelEl.style.cssText = `
      position: absolute;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Microsoft YaHei', sans-serif;
      pointer-events: none;
      white-space: nowrap;
      z-index: 100;
      border-left: 3px solid #${STATUS_COLORS[device.status].toString(16).padStart(6, '0')};
      backdrop-filter: blur(4px);
      transition: opacity 0.3s;
    `

    const statusColor = `#${STATUS_COLORS[device.status].toString(16).padStart(6, '0')}`
    const statusName = STATUS_NAMES[device.status]
    
    labelEl.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 2px;">${device.name}</div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; ${device.status !== DeviceStatus.NORMAL ? 'animation: pulse 1.5s infinite;' : ''}"></span>
        <span style="color: ${statusColor};">${statusName}</span>
      </div>
    `

    this.container.appendChild(labelEl)
    this.labels.set(device.id, labelEl)
    this.labelData.set(device.id, {
      id: device.id,
      text: device.name,
      position: device.position,
      type: device.status === DeviceStatus.NORMAL ? 'info' : device.status === DeviceStatus.LOW_POWER ? 'warning' : 'error',
      visible: true
    })

    if (device.status !== DeviceStatus.NORMAL) {
      this.createAlarmIcon(device)
    }
  }

  private createAlarmIcon(device: DeviceData): void {
    this.removeAlarmIcon(device.id)

    const iconEl = document.createElement('div')
    iconEl.className = 'alarm-icon'
    iconEl.dataset.deviceId = device.id
    iconEl.style.cssText = `
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      color: white;
      z-index: 101;
      pointer-events: none;
      animation: bounce 1s infinite;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `

    const bgColor = `#${STATUS_COLORS[device.status].toString(16).padStart(6, '0')}`
    iconEl.style.background = bgColor
    
    let icon = '!'
    switch (device.status) {
      case DeviceStatus.LOW_POWER:
        icon = '⚡'
        break
      case DeviceStatus.TEMP_ABNORMAL:
        icon = '🌡️'
        break
      case DeviceStatus.OFFLINE:
        icon = '📴'
        break
      case DeviceStatus.MAINTENANCE:
        icon = '🔧'
        break
    }
    iconEl.textContent = icon

    this.container.appendChild(iconEl)
    this.alarmIcons.set(device.id, iconEl)
  }

  public updateLabelStatus(deviceId: string, status: DeviceStatus): void {
    const label = this.labels.get(deviceId)
    const labelData = this.labelData.get(deviceId)
    
    if (label && labelData) {
      const statusColor = `#${STATUS_COLORS[status].toString(16).padStart(6, '0')}`
      const statusName = STATUS_NAMES[status]
      
      label.style.borderLeftColor = statusColor
      label.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 2px;">${labelData.text}</div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; ${status !== DeviceStatus.NORMAL ? 'animation: pulse 1.5s infinite;' : ''}"></span>
          <span style="color: ${statusColor};">${statusName}</span>
        </div>
      `

      if (status !== DeviceStatus.NORMAL) {
        const deviceData = { id: deviceId, name: labelData.text, status, position: labelData.position } as DeviceData
        this.createAlarmIcon(deviceData)
      } else {
        this.removeAlarmIcon(deviceId)
      }
    }
  }

  public updateLabelPosition(deviceId: string, position: { x: number; y: number; z: number }): void {
    const labelData = this.labelData.get(deviceId)
    if (labelData) {
      labelData.position = position
    }
  }

  public setLabelVisible(deviceId: string, visible: boolean): void {
    const label = this.labels.get(deviceId)
    const alarmIcon = this.alarmIcons.get(deviceId)
    const labelData = this.labelData.get(deviceId)
    
    if (label) {
      label.style.opacity = visible ? '1' : '0'
    }
    if (alarmIcon) {
      alarmIcon.style.opacity = visible ? '1' : '0'
    }
    if (labelData) {
      labelData.visible = visible
    }
  }

  public filterByStatus(status: DeviceStatus | null): void {
    this.labelData.forEach((data, id) => {
      const label = this.labels.get(id)
      const alarmIcon = this.alarmIcons.get(id)
      
      if (status === null) {
        if (label) label.style.display = 'block'
        if (alarmIcon) alarmIcon.style.display = 'flex'
      } else {
        const deviceData = data as unknown as DeviceData
        const visible = deviceData.status === status
        if (label) label.style.display = visible ? 'block' : 'none'
        if (alarmIcon) alarmIcon.style.display = visible ? 'flex' : 'none'
      }
    })
  }

  public update(): void {
    const rect = this.rendererDomElement.getBoundingClientRect()
    const vector = new THREE.Vector3()

    this.labelData.forEach((data, id) => {
      const label = this.labels.get(id)
      const alarmIcon = this.alarmIcons.get(id)
      
      if (!data.visible) return

      vector.set(data.position.x, data.position.y + 4, data.position.z)
      vector.project(this.camera)

      const x = (vector.x * 0.5 + 0.5) * rect.width
      const y = (-vector.y * 0.5 + 0.5) * rect.height

      if (vector.z > 1 || vector.z < -1) {
        if (label) label.style.display = 'none'
        if (alarmIcon) alarmIcon.style.display = 'none'
        return
      }

      if (label) {
        label.style.display = 'block'
        label.style.left = `${x - label.offsetWidth / 2}px`
        label.style.top = `${y - label.offsetHeight - 10}px`
      }

      if (alarmIcon) {
        alarmIcon.style.display = 'flex'
        alarmIcon.style.left = `${x - 12}px`
        alarmIcon.style.top = `${y - 60}px`
      }
    })
  }

  public start(): void {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `
    document.head.appendChild(style)

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)
      this.update()
    }
    animate()
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private removeLabel(deviceId: string): void {
    const label = this.labels.get(deviceId)
    if (label && label.parentNode) {
      label.parentNode.removeChild(label)
    }
    this.labels.delete(deviceId)
    this.labelData.delete(deviceId)
  }

  private removeAlarmIcon(deviceId: string): void {
    const icon = this.alarmIcons.get(deviceId)
    if (icon && icon.parentNode) {
      icon.parentNode.removeChild(icon)
    }
    this.alarmIcons.delete(deviceId)
  }

  public clearAll(): void {
    this.stop()
    this.labels.forEach(label => {
      if (label.parentNode) label.parentNode.removeChild(label)
    })
    this.alarmIcons.forEach(icon => {
      if (icon.parentNode) icon.parentNode.removeChild(icon)
    })
    this.labels.clear()
    this.alarmIcons.clear()
    this.labelData.clear()
  }

  public dispose(): void {
    this.clearAll()
  }
}
