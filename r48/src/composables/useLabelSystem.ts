import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { DeviceData, AlarmLevel } from '@/types'
import { ALARM_LEVEL_COLORS } from '@/types'

export function useLabelSystem(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
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
      paramStr = `流量: ${Number(device.params.flow).toFixed(0)} m³/h`
    } else if (device.type === 'valve') {
      paramStr = `开度: ${device.params.opening}%`
    } else if (device.type === 'sensor') {
      if ('level' in device.params) paramStr = `液位: ${Number(device.params.level).toFixed(1)} m`
      else if ('flow' in device.params) paramStr = `流量: ${Number(device.params.flow).toFixed(0)} m³/h`
      else if ('pressure' in device.params) paramStr = `压力: ${Number(device.params.pressure).toFixed(2)} MPa`
    } else if (device.type === 'cabinet') {
      paramStr = `电流: ${device.params.current}A`
    } else if (device.type === 'pool') {
      paramStr = `水位: ${Number(device.params.level).toFixed(1)} m`
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

  const checkOcclusion = (labelPosition: THREE.Vector3, deviceGroup: THREE.Object3D): boolean => {
    const direction = new THREE.Vector3().subVectors(camera.position, labelPosition).normalize()
    const raycaster = new THREE.Raycaster()
    raycaster.set(labelPosition, direction)
    raycaster.far = camera.position.distanceTo(labelPosition) - 0.5

    const allMeshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== deviceGroup && !child.userData.isLabelAnchor) {
        allMeshes.push(child)
      }
    })

    const intersects = raycaster.intersectObjects(allMeshes, false)
    return intersects.length > 0
  }

  const updateOcclusion = (): void => {
    const tmpVector = new THREE.Vector3()
    labels.forEach((label, deviceId) => {
      if (!label.parent) return
      tmpVector.copy(label.position)
      label.parent.localToWorld(tmpVector)
      const isOccluded = checkOcclusion(tmpVector, label.parent)
      label.element.style.opacity = isOccluded ? '0.15' : '1'
      label.element.style.pointerEvents = isOccluded ? 'none' : 'auto'
    })
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

  const setHighlight = (deviceId: string | null, highlight: boolean) => {
    const label = labels.get(deviceId || '')
    if (label && label.element) {
      if (highlight) {
        label.element.style.transform = 'scale(1.15)'
        label.element.style.zIndex = '100'
      } else {
        label.element.style.transform = 'scale(1)'
        label.element.style.zIndex = '1'
      }
    }
  }

  const updateAllLabels = (devices: DeviceData[]) => {
    devices.forEach(device => updateLabel(device))
  }

  return {
    addLabels,
    updateLabel,
    removeLabels,
    setVisibleByArea,
    setFilterByAlarmLevel,
    setHighlight,
    updateOcclusion,
    updateAllLabels,
  }
}
