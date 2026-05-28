import * as THREE from 'three'
import { DeviceType, DeviceStatus, STATUS_COLORS } from '@/types'

export class ModelFactory {
  private static materialCache: Map<string, THREE.Material> = new Map()

  public static createGround(size: number = 400): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size)
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a7c39,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = 'ground'
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
    
    const frameGeometry = new THREE.BoxGeometry(2.1, 0.1, 1.1)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.3
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.y = 1.5
    frame.castShadow = true
    frame.receiveShadow = true
    panelGroup.add(frame)

    const panelGeometry = new THREE.PlaneGeometry(2, 1)
    const panelColor = STATUS_COLORS[status]
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: panelColor,
      roughness: 0.3,
      metalness: 0.8,
      emissive: status !== DeviceStatus.NORMAL ? panelColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.3 : 0
    })
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)
    panel.position.y = 1.55
    panel.position.z = 0.01
    panel.rotation.x = -Math.PI / 6
    panel.name = 'pv_panel_surface'
    panelGroup.add(panel)

    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8)
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.5
    })
    
    const positions = [[-0.8, 0.75, -0.3], [0.8, 0.75, -0.3], [-0.8, 0.75, 0.3], [0.8, 0.75, 0.3]]
    positions.forEach(([x, y, z]) => {
      const support = new THREE.Mesh(supportGeometry, supportMaterial)
      support.position.set(x, y, z)
      support.castShadow = true
      support.receiveShadow = true
      panelGroup.add(support)
    })

    return panelGroup
  }

  public static createInverter(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const inverterGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const bodyGeometry = new THREE.BoxGeometry(3, 2.5, 1.5)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.6
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.25
    body.castShadow = true
    body.receiveShadow = true
    inverterGroup.add(body)

    const frontGeometry = new THREE.PlaneGeometry(2.8, 1.8)
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.7,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
    })
    const front = new THREE.Mesh(frontGeometry, frontMaterial)
    front.position.set(0, 1.25, 0.76)
    front.name = 'inverter_surface'
    inverterGroup.add(front)

    const screenGeometry = new THREE.PlaneGeometry(1.2, 0.6)
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5
    })
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.position.set(0, 1.8, 0.77)
    inverterGroup.add(screen)

    for (let i = 0; i < 3; i++) {
      const ledGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16)
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: status === DeviceStatus.NORMAL ? 0x00ff00 : 0xff0000,
        emissive: status === DeviceStatus.NORMAL ? 0x00ff00 : 0xff0000,
        emissiveIntensity: 1
      })
      const led = new THREE.Mesh(ledGeometry, ledMaterial)
      led.position.set(-0.8 + i * 0.8, 0.6, 0.77)
      led.rotation.x = Math.PI / 2
      inverterGroup.add(led)
    }

    const baseGeometry = new THREE.BoxGeometry(3.4, 0.3, 1.7)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.15
    base.castShadow = true
    base.receiveShadow = true
    inverterGroup.add(base)

    return inverterGroup
  }

  public static createCombinerBox(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const boxGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.6)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.5
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.5
    body.castShadow = true
    body.receiveShadow = true
    boxGroup.add(body)

    const doorGeometry = new THREE.PlaneGeometry(1, 1.4)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.3 : 0
    })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(0, 1.5, 0.31)
    door.name = 'combiner_surface'
    boxGroup.add(door)

    const handleGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.05)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(0.35, 1.5, 0.35)
    boxGroup.add(handle)

    const poleGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.4
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 0.75
    pole.castShadow = true
    pole.receiveShadow = true
    boxGroup.add(pole)

    return boxGroup
  }

  public static createAlarmDevice(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const alarmGroup = new THREE.Group()
    const color = STATUS_COLORS[status]

    const poleGeometry = new THREE.CylinderGeometry(0.08, 0.12, 5, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.5
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 2.5
    pole.castShadow = true
    pole.receiveShadow = true
    alarmGroup.add(pole)

    const housingGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.4)
    const housingMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.7
    })
    const housing = new THREE.Mesh(housingGeometry, housingMaterial)
    housing.position.y = 4.8
    housing.castShadow = true
    alarmGroup.add(housing)

    const lightGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 1 : 0.3,
      transparent: true,
      opacity: 0.9
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.y = 5.2
    light.name = 'alarm_light'
    alarmGroup.add(light)

    const speakerGeometry = new THREE.ConeGeometry(0.25, 0.4, 16, 1, true)
    const speakerMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.8,
      side: THREE.DoubleSide
    })
    const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial)
    speaker.position.set(0, 5, 0.35)
    speaker.rotation.x = Math.PI / 2
    alarmGroup.add(speaker)

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

    const color = STATUS_COLORS[status]
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.8,
      emissive: status !== DeviceStatus.NORMAL ? color : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.3 : 0
    })
    
    this.materialCache.set(key, material)
    return material
  }

  public static disposeMaterials(): void {
    this.materialCache.forEach(material => material.dispose())
    this.materialCache.clear()
  }
}
