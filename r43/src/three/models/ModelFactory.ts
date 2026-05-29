import * as THREE from 'three'
import { DeviceType, DeviceStatus, STATUS_COLORS } from '@/types'

export class ModelFactory {
  private static materialCache: Map<string, THREE.Material> = new Map()

  public static createGround(size: number = 400): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50)
    const material = new THREE.MeshStandardMaterial({
      color: 0x5a8c49,
      roughness: 0.95,
      metalness: 0.05
    })
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = 'ground'
    ground.frustumCulled = false
    return ground
  }

  public static createRoad(points: THREE.Vector3[], width: number = 4): THREE.Group {
    const roadGroup = new THREE.Group()
    roadGroup.name = 'roads'

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      
      const geometry = new THREE.PlaneGeometry(width, length)
      const material = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8
      })
      
      const road = new THREE.Mesh(geometry, material)
      road.position.copy(midPoint)
      road.position.y = 0.01
      road.rotation.x = -Math.PI / 2
      road.rotation.z = -Math.atan2(direction.x, direction.z)
      road.receiveShadow = true
      
      roadGroup.add(road)
    }

    return roadGroup
  }

  public static createPVPanel(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const panelGroup = new THREE.Group()
    
    const frameGeometry = new THREE.BoxGeometry(2.2, 0.08, 1.3)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.7,
      metalness: 0.4
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.y = 1.6
    frame.castShadow = false
    frame.receiveShadow = true
    panelGroup.add(frame)

    const panelGeometry = new THREE.PlaneGeometry(2.0, 1.1)
    const panelColor = STATUS_COLORS[status]
    const basePanelColor = status === DeviceStatus.NORMAL ? 0x1a3a5c : panelColor
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: basePanelColor,
      roughness: 0.2,
      metalness: 0.9,
      emissive: status !== DeviceStatus.NORMAL ? panelColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.35 : 0
    })
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)
    panel.position.y = 1.65
    panel.position.z = 0.02
    panel.rotation.x = -Math.PI / 5.5
    panel.name = 'pv_panel_surface'
    panelGroup.add(panel)

    const supportGeometry = new THREE.CylinderGeometry(0.04, 0.06, 1.6, 6)
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.6,
      metalness: 0.6
    })
    
    const positions = [[-0.85, 0.8, -0.35], [0.85, 0.8, -0.35], [-0.85, 0.8, 0.35], [0.85, 0.8, 0.35]]
    positions.forEach(([x, y, z]) => {
      const support = new THREE.Mesh(supportGeometry, supportMaterial)
      support.position.set(x, y, z)
      support.castShadow = false
      support.receiveShadow = true
      panelGroup.add(support)
    })

    return panelGroup
  }

  public static createInverter(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const inverterGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const bodyGeometry = new THREE.BoxGeometry(3.2, 2.6, 1.6)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.4,
      metalness: 0.7
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.45
    body.castShadow = true
    body.receiveShadow = true
    inverterGroup.add(body)

    const frontGeometry = new THREE.PlaneGeometry(2.9, 1.9)
    const frontColor = status === DeviceStatus.NORMAL ? 0x4a5568 : color
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: frontColor,
      roughness: 0.3,
      metalness: 0.8,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.45 : 0
    })
    const front = new THREE.Mesh(frontGeometry, frontMaterial)
    front.position.set(0, 1.45, 0.81)
    front.name = 'inverter_surface'
    inverterGroup.add(front)

    const screenGeometry = new THREE.PlaneGeometry(1.3, 0.7)
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x10b981,
      emissiveIntensity: 0.6
    })
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.position.set(0, 2.0, 0.82)
    inverterGroup.add(screen)

    for (let i = 0; i < 3; i++) {
      const ledGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12)
      const ledColor = status === DeviceStatus.NORMAL ? 0x22c55e : 0xef4444
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: ledColor,
        emissive: ledColor,
        emissiveIntensity: 0.8
      })
      const led = new THREE.Mesh(ledGeometry, ledMaterial)
      led.position.set(-0.9 + i * 0.9, 0.7, 0.82)
      led.rotation.x = Math.PI / 2
      inverterGroup.add(led)
    }

    const baseGeometry = new THREE.BoxGeometry(3.6, 0.35, 1.8)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      roughness: 0.7,
      metalness: 0.3
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.175
    base.castShadow = true
    base.receiveShadow = true
    inverterGroup.add(base)

    const heatSinkGeometry = new THREE.BoxGeometry(0.1, 0.4, 1.4)
    const heatSinkMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.5,
      metalness: 0.6
    })
    for (let i = 0; i < 8; i++) {
      const heatSink = new THREE.Mesh(heatSinkGeometry, heatSinkMaterial)
      heatSink.position.set(-1.4 + i * 0.4, 2.9, 0)
      heatSink.castShadow = true
      inverterGroup.add(heatSink)
    }

    return inverterGroup
  }

  public static createCombinerBox(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const boxGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const bodyGeometry = new THREE.BoxGeometry(1.3, 1.9, 0.7)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.5,
      metalness: 0.6
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.6
    body.castShadow = true
    body.receiveShadow = true
    boxGroup.add(body)

    const doorGeometry = new THREE.PlaneGeometry(1.1, 1.5)
    const doorColor = status === DeviceStatus.NORMAL ? 0x6b7280 : color
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: doorColor,
      roughness: 0.35,
      metalness: 0.7,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.35 : 0
    })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(0, 1.6, 0.36)
    door.name = 'combiner_surface'
    boxGroup.add(door)

    const handleGeometry = new THREE.BoxGeometry(0.07, 0.14, 0.06)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.9,
      roughness: 0.3
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(0.4, 1.6, 0.4)
    boxGroup.add(handle)

    const lockGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8)
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.4
    })
    const lock = new THREE.Mesh(lockGeometry, lockMaterial)
    lock.position.set(0.4, 1.4, 0.4)
    lock.rotation.x = Math.PI / 2
    boxGroup.add(lock)

    const poleGeometry = new THREE.CylinderGeometry(0.07, 0.09, 1.6, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x525252,
      roughness: 0.6,
      metalness: 0.5
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 0.8
    pole.castShadow = true
    pole.receiveShadow = true
    boxGroup.add(pole)

    return boxGroup
  }

  public static createAlarmDevice(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const alarmGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.6,
      metalness: 0.5
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.15
    base.castShadow = true
    base.receiveShadow = true
    alarmGroup.add(base)

    const poleGeometry = new THREE.CylinderGeometry(0.07, 0.08, 5.2, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.5,
      metalness: 0.6
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 2.9
    pole.castShadow = true
    pole.receiveShadow = true
    alarmGroup.add(pole)

    const housingGeometry = new THREE.BoxGeometry(0.9, 0.55, 0.45)
    const housingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      roughness: 0.4,
      metalness: 0.8
    })
    const housing = new THREE.Mesh(housingGeometry, housingMaterial)
    housing.position.y = 5.1
    housing.castShadow = true
    alarmGroup.add(housing)

    const lightColor = status === DeviceStatus.NORMAL ? 0x22c55e : color
    const lightGeometry = new THREE.SphereGeometry(0.28, 16, 16)
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: lightColor,
      emissive: lightColor,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 1.2 : 0.4,
      transparent: true,
      opacity: 0.95
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.y = 5.55
    light.name = 'alarm_light'
    alarmGroup.add(light)

    const speakerGeometry = new THREE.ConeGeometry(0.28, 0.45, 16, 1, true)
    const speakerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      roughness: 0.3,
      metalness: 0.8,
      side: THREE.DoubleSide
    })
    const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial)
    speaker.position.set(0, 5.3, 0.4)
    speaker.rotation.x = Math.PI / 2
    alarmGroup.add(speaker)

    for (let i = 0; i < 3; i++) {
      const bracketGeometry = new THREE.BoxGeometry(0.04, 0.25, 0.04)
      const bracketMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b7280,
        metalness: 0.7,
        roughness: 0.4
      })
      const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial)
      bracket.position.set(-0.3 + i * 0.3, 4.85, 0)
      alarmGroup.add(bracket)
    }

    return alarmGroup
  }

  public static createPatrolMarker(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    })
    const marker = new THREE.Mesh(geometry, material)
    marker.name = 'patrol_marker'
    return marker
  }

  public static getMaterial(type: DeviceType, status: DeviceStatus): THREE.MeshStandardMaterial {
    const key = `${type}_${status}`
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key) as THREE.MeshStandardMaterial
    }

    let color: number
    if (status === DeviceStatus.NORMAL) {
      switch (type) {
        case DeviceType.PV_PANEL:
          color = 0x1a3a5c
          break
        case DeviceType.INVERTER:
          color = 0x4a5568
          break
        case DeviceType.COMBINER_BOX:
          color = 0x6b7280
          break
        case DeviceType.ALARM_DEVICE:
          color = 0x22c55e
          break
        default:
          color = STATUS_COLORS[status]
      }
    } else {
      color = STATUS_COLORS[status]
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.25,
      metalness: 0.85,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.35 : 0
    })
    
    this.materialCache.set(key, material)
    return material
  }

  public static disposeMaterials(): void {
    this.materialCache.forEach(material => material.dispose())
    this.materialCache.clear()
  }
}
