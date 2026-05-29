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
        color: 0x4a4a4a,
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
    
    const frameGeometry = new THREE.BoxGeometry(2.4, 0.12, 1.4)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      roughness: 0.6,
      metalness: 0.5
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.y = 1.7
    frame.castShadow = false
    frame.receiveShadow = true
    panelGroup.add(frame)

    const cellColor = status === DeviceStatus.NORMAL ? 0x1e3a5f : STATUS_COLORS[status]
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const cellGeometry = new THREE.PlaneGeometry(0.32, 0.32)
        const cellMaterial = new THREE.MeshStandardMaterial({
          color: cellColor,
          roughness: 0.15,
          metalness: 0.95,
          emissive: status !== DeviceStatus.NORMAL ? cellColor : 0x000000,
          emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
        })
        const cell = new THREE.Mesh(cellGeometry, cellMaterial)
        cell.position.set(-0.8 + col * 0.34, 1.76, -0.52 + row * 0.34)
        cell.rotation.x = -Math.PI / 5
        panelGroup.add(cell)
      }
    }

    const dividerGeometry = new THREE.BoxGeometry(0.02, 0.05, 1.3)
    const dividerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.6
    })
    for (let i = 0; i < 5; i++) {
      const divider = new THREE.Mesh(dividerGeometry, dividerMaterial)
      divider.position.set(-0.96 + i * 0.34, 1.73, 0)
      divider.rotation.x = -Math.PI / 5
      panelGroup.add(divider)
    }

    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.8, 6)
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.5,
      metalness: 0.7
    })
    
    const positions = [[-0.9, 0.9, -0.4], [0.9, 0.9, -0.4], [-0.9, 0.9, 0.4], [0.9, 0.9, 0.4]]
    positions.forEach(([x, y, z]) => {
      const support = new THREE.Mesh(supportGeometry, supportMaterial)
      support.position.set(x, y, z)
      support.castShadow = false
      support.receiveShadow = true
      panelGroup.add(support)
    })

    const junctionBoxGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.25)
    const junctionBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6
    })
    const junctionBox = new THREE.Mesh(junctionBoxGeometry, junctionBoxMaterial)
    junctionBox.position.set(0, 0.85, 0)
    panelGroup.add(junctionBox)

    const labelGeometry = new THREE.PlaneGeometry(0.5, 0.15)
    const labelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9
    })
    const label = new THREE.Mesh(labelGeometry, labelMaterial)
    label.position.set(0, 0.95, 0.13)
    panelGroup.add(label)

    return panelGroup
  }

  public static createInverter(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const inverterGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const cabinetGeometry = new THREE.BoxGeometry(3.5, 3, 1.8)
    const cabinetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.35,
      metalness: 0.75
    })
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
    cabinet.position.y = 1.7
    cabinet.castShadow = true
    cabinet.receiveShadow = true
    inverterGroup.add(cabinet)

    const frontPanelColor = status === DeviceStatus.NORMAL ? 0x4a5568 : statusColor
    const frontGeometry = new THREE.BoxGeometry(3.3, 2.6, 0.1)
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: frontPanelColor,
      roughness: 0.25,
      metalness: 0.85,
      emissive: status !== DeviceStatus.NORMAL ? statusColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.5 : 0
    })
    const frontPanel = new THREE.Mesh(frontGeometry, frontMaterial)
    frontPanel.position.set(0, 1.7, 0.95)
    frontPanel.name = 'inverter_surface'
    inverterGroup.add(frontPanel)

    const screenFrameGeometry = new THREE.BoxGeometry(1.6, 1.0, 0.05)
    const screenFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.9
    })
    const screenFrame = new THREE.Mesh(screenFrameGeometry, screenFrameMaterial)
    screenFrame.position.set(0, 2.4, 1.0)
    inverterGroup.add(screenFrame)

    const screenGeometry = new THREE.PlaneGeometry(1.4, 0.8)
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x10b981,
      emissiveIntensity: 0.7
    })
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.position.set(0, 2.4, 1.03)
    inverterGroup.add(screen)

    const ventGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05)
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8
    })
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(ventGeometry, ventMaterial)
      vent.position.set(-1.0, 1.2, 1.0)
      inverterGroup.add(vent)
    }

    const ledColors = status === DeviceStatus.NORMAL ? [0x22c55e, 0x22c55e, 0xf59e0b] : [0xef4444, 0xef4444, 0xef4444]
    for (let i = 0; i < 3; i++) {
      const ledGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12)
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: ledColors[i],
        emissive: ledColors[i],
        emissiveIntensity: 0.9
      })
      const led = new THREE.Mesh(ledGeometry, ledMaterial)
      led.position.set(-0.6 + i * 0.6, 0.6, 1.03)
      led.rotation.x = Math.PI / 2
      inverterGroup.add(led)
    }

    const baseGeometry = new THREE.BoxGeometry(3.9, 0.4, 2.0)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.4
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.2
    base.castShadow = true
    base.receiveShadow = true
    inverterGroup.add(base)

    for (let i = 0; i < 10; i++) {
      const finGeometry = new THREE.BoxGeometry(0.08, 0.5, 1.6)
      const finMaterial = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        metalness: 0.7
      })
      const fin = new THREE.Mesh(finGeometry, finMaterial)
      fin.position.set(-1.44 + i * 0.32, 3.4, 0)
      fin.castShadow = true
      inverterGroup.add(fin)
    }

    const logoGeometry = new THREE.BoxGeometry(0.6, 0.25, 0.05)
    const logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3
    })
    const logo = new THREE.Mesh(logoGeometry, logoMaterial)
    logo.position.set(0, 0.6, 1.03)
    inverterGroup.add(logo)

    return inverterGroup
  }

  public static createCombinerBox(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const boxGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const boxGeometry = new THREE.BoxGeometry(1.6, 2.2, 0.9)
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.45,
      metalness: 0.65
    })
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.position.y = 1.8
    box.castShadow = true
    box.receiveShadow = true
    boxGroup.add(box)

    const doorColor = status === DeviceStatus.NORMAL ? 0x6b7280 : statusColor
    const doorGeometry = new THREE.BoxGeometry(1.4, 1.8, 0.08)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: doorColor,
      roughness: 0.3,
      metalness: 0.75,
      emissive: status !== DeviceStatus.NORMAL ? statusColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
    })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(0, 1.8, 0.49)
    door.name = 'combiner_surface'
    boxGroup.add(door)

    const handleGeometry = new THREE.TorusGeometry(0.12, 0.04, 8, 16)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(0.5, 1.8, 0.58)
    handle.rotation.y = Math.PI / 2
    boxGroup.add(handle)

    const lockGeometry = new THREE.BoxGeometry(0.12, 0.16, 0.08)
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.3
    })
    const lock = new THREE.Mesh(lockGeometry, lockMaterial)
    lock.position.set(0.5, 1.5, 0.58)
    boxGroup.add(lock)

    for (let i = 0; i < 4; i++) {
      const terminalGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8)
      const terminalMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8
      })
      const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial)
      terminal.position.set(-0.5 + i * 0.33, 0.75, 0.54)
      boxGroup.add(terminal)
    }

    const warningGeometry = new THREE.BoxGeometry(0.5, 0.25, 0.05)
    const warningMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.6
    })
    const warning = new THREE.Mesh(warningGeometry, warningMaterial)
    warning.position.set(0, 2.65, 0.54)
    boxGroup.add(warning)

    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.12, 1.6, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.55,
      metalness: 0.55
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 0.8
    pole.castShadow = true
    pole.receiveShadow = true
    boxGroup.add(pole)

    const flangeGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.08, 8)
    const flangeMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.7
    })
    const flange = new THREE.Mesh(flangeGeometry, flangeMaterial)
    flange.position.y = 0.04
    flange.castShadow = true
    flange.receiveShadow = true
    boxGroup.add(flange)

    return boxGroup
  }

  public static createAlarmDevice(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const alarmGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const basePlateGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 12)
    const basePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.5,
      metalness: 0.6
    })
    const basePlate = new THREE.Mesh(basePlateGeometry, basePlateMaterial)
    basePlate.position.y = 0.075
    basePlate.castShadow = true
    basePlate.receiveShadow = true
    alarmGroup.add(basePlate)

    const poleSegments = 5
    for (let i = 0; i < poleSegments; i++) {
      const poleGeometry = new THREE.CylinderGeometry(0.08, 0.09, 1.2, 8)
      const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        roughness: 0.5,
        metalness: 0.6
      })
      const pole = new THREE.Mesh(poleGeometry, poleMaterial)
      pole.position.y = 0.75 + i * 1.1
      pole.castShadow = true
      pole.receiveShadow = true
      alarmGroup.add(pole)

      const ringGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16)
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b7280,
        metalness: 0.7
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.y = 1.3 + i * 1.1
      ring.rotation.x = Math.PI / 2
      alarmGroup.add(ring)
    }

    const boxGeometry = new THREE.BoxGeometry(1.1, 0.7, 0.55)
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.35,
      metalness: 0.8
    })
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.position.y = 5.6
    box.castShadow = true
    alarmGroup.add(box)

    const lightHousingGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16)
    const lightColor = status === DeviceStatus.NORMAL ? 0x22c55e : statusColor
    const lightHousingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.7
    })
    const lightHousing = new THREE.Mesh(lightHousingGeometry, lightHousingMaterial)
    lightHousing.position.y = 6.1
    alarmGroup.add(lightHousing)

    const lensGeometry = new THREE.SphereGeometry(0.32, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2)
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: lightColor,
      emissive: lightColor,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 1.5 : 0.5,
      transparent: true,
      opacity: 0.9
    })
    const lens = new THREE.Mesh(lensGeometry, lensMaterial)
    lens.position.y = 6.25
    lens.name = 'alarm_light'
    alarmGroup.add(lens)

    const speakerGeometry = new THREE.ConeGeometry(0.35, 0.55, 16, 1, true)
    const speakerMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.25,
      metalness: 0.85,
      side: THREE.DoubleSide
    })
    const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial)
    speaker.position.set(0, 5.8, 0.5)
    speaker.rotation.x = -Math.PI / 2
    alarmGroup.add(speaker)

    for (let i = 0; i < 3; i++) {
      const solarGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12)
      const solarMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8
      })
      const solar = new THREE.Mesh(solarGeometry, solarMaterial)
      solar.position.set(-0.35 + i * 0.35, 5.35, 0)
      alarmGroup.add(solar)
    }

    const signGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.4)
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.6
    })
    const sign = new THREE.Mesh(signGeometry, signMaterial)
    sign.position.set(0, 5.0, 0.22)
    sign.rotation.x = -Math.PI / 6
    alarmGroup.add(sign)

    return alarmGroup
  }

  public static createPatrolMarker(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.6, 20, 20)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.95
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
          color = 0x1e3a5f
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
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
    })
    
    this.materialCache.set(key, material)
    return material
  }

  public static disposeMaterials(): void {
    this.materialCache.forEach(material => material.dispose())
    this.materialCache.clear()
  }
}
