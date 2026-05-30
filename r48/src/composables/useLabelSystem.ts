import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { DeviceData, AlarmLevel } from '@/types'
import { ALARM_LEVEL_COLORS } from '@/types'

export function useLabelSystem(scene: THREE.Scene) {
  const labels: Map<string, CSS2DObject> = new Map()

  const createLabel = (device: DeviceData): CSS2DObject => {
    const div = document.createElement('div')
    div.className = 'device-label'
    div.innerHTML = buildLabelHTML(device)
    const label = new CSS2DObject(div)
    label.position.set(0, getLabelOffset(device.type), 0)
    label.name = `label-${device.id}`
    return label
  }

  const buildLabelHTML = (device: DeviceData): string => {
    const statusClass = `status-${device.status}`
    const hasAlarm = device.alarms.length > 0
    let alarmIcon = ''
    if (hasAlarm) {
      const maxLevel = device.alarms.reduce((max, a) => {
        const order: AlarmLevel[] = ['critical', 'major', 'minor', 'info']
        return order.indexOf(a.level) < order.indexOf(max) ? a.level : max
      }, 'info' as AlarmLevel)
      alarmIcon = `<span class="alarm-badge" style="background:${ALARM_LEVEL_COLORS[maxLevel]}">⚠</span>`
    }

    let paramStr = ''
    if (device.type === 'pump') {
      paramStr = `流量: ${device.params.flow} m³/h | 压力: ${device.params.pressure} MPa`
    } else if (device.type === 'valve') {
      paramStr = `开度: ${device.params.opening}% | 压力: ${device.params.pressure} MPa`
    } else if (device.type === 'sensor') {
      if ('level' in device.params) paramStr = `液位: ${device.params.level} m`
      else if ('flow' in device.params) paramStr = `流量: ${device.params.flow} m³/h`
      else if ('pressure' in device.params) paramStr = `压力: ${device.params.pressure} MPa`
    } else if (device.type === 'cabinet') {
      paramStr = `电压: ${device.params.voltage}V | 电流: ${device.params.current}A`
    } else if (device.type === 'pool') {
      paramStr = `水位: ${device.params.level} m | 容量: ${device.params.capacity} m³`
    }

    return `
      <div class="label-content ${statusClass}">
        <div class="label-header">
          <span class="label-name">${device.name}</span>
          ${alarmIcon}
        </div>
        <div class="label-params">${paramStr}</div>
      </div>
    `
  }

  const getLabelOffset = (type: DeviceData['type']): number => {
    const offsets: Record<DeviceData['type'], number> = {
      pump: 1.5,
      valve: 0.8,
      sensor: 0.8,
      cabinet: 1.6,
      pool: 2.5,
      pipe: 0.5,
    }
    return offsets[type]
  }

  const addLabels = (devices: DeviceData[], sceneGroups: Map<string, THREE.Object3D>) => {
    devices.forEach(device => {
      const group = sceneGroups.get(device.id)
      if (group) {
        const label = createLabel(device)
        group.add(label)
        labels.set(device.id, label)
      }
    })
  }

  const updateLabel = (device: DeviceData) => {
    const label = labels.get(device.id)
    if (label && label.element) {
      label.element.innerHTML = buildLabelHTML(device)
    }
  }

  const removeLabels = () => {
    labels.forEach(label => {
      if (label.parent) label.parent.remove(label)
      if (label.element && label.element.parentNode) {
        label.element.parentNode.removeChild(label.element)
      }
    })
    labels.clear()
  }

  const setVisibleByArea = (devices: DeviceData[], area: string) => {
    devices.forEach(device => {
      const label = labels.get(device.id)
      if (label) {
        label.visible = area === 'all' || device.area === area
      }
    })
  }

  const setFilterByAlarmLevel = (devices: DeviceData[], level: AlarmLevel | null) => {
    devices.forEach(device => {
      const label = labels.get(device.id)
      if (label) {
        if (level === null) {
          label.visible = true
        } else {
          label.visible = device.alarms.some(a => a.level === level)
        }
      }
    })
  }

  return { addLabels, updateLabel, removeLabels, setVisibleByArea, setFilterByAlarmLevel }
}
