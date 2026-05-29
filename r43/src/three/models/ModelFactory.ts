import * as THREE from 'three'
import { DeviceType, DeviceStatus, STATUS_COLORS } from '@/types'

export class ModelFactory {
  private static materialCache: Map<string, THREE.Material> = new Map()

  public static createGround(size: number = 400): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size, 10, 10)
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
      road.position.y = 0.02
      road.rotation.x = -Math.PI / 2
      road.rotation.z = -Math.atan2(direction.x, direction.z)
      road.receiveShadow = true
      
      roadGroup.add(road)
    }

    return roadGroup
  }

  public static createPVPanel(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const panelGroup = new THREE.Group()
    
    const frameGeometry = new THREE.BoxGeometry(2.4, 0.15, 1.4)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      roughness: 0.7,
      metalness: 0.4
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.y = 1.6
    frame.castShadow = false
    frame.receiveShadow = true
    frame.name = 'pv_frame'
    panelGroup.add(frame)

    const panelColor = status === DeviceStatus.NORMAL ? 0x1e3a5f : STATUS_COLORS[status]
    const panelGeometry = new THREE.BoxGeometry(2.2, 0.05, 1.2)
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: panelColor,
      roughness: 0.2,
      metalness: 0.9,
      emissive: status !== DeviceStatus.NORMAL ? panelColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
    })
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)
    panel.position.y = 1.7
    panel.position.z = 0.05
    panel.rotation.x = -Math.PI / 5
    panel.name = 'pv_panel'
    panelGroup.add(panel)

    const cellLineGeo = new THREE.BoxGeometry(2.1, 0.02, 0.02)
    const cellLineMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.5
    })
    for (let i = 0; i < 7; i++) {
      const line = new THREE.Mesh(cellLineGeo, cellLineMat)
      line.position.set(0, 1.72, -0.5 + i * 0.17)
      line.rotation.x = -Math.PI / 5
      panelGroup.add(line)
    }

    const supportGeometry = new THREE.CylinderGeometry(0.06, 0.1, 1.7, 6)
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.6,
      metalness: 0.6
    })
    
    const positions = [[-0.9, 0.85, -0.45], [0.9, 0.85, -0.45], [-0.9, 0.85, 0.45], [0.9, 0.85, 0.45]]
    positions.forEach(([x, y, z]) => {
      const support = new THREE.Mesh(supportGeometry, supportMaterial)
      support.position.set(x, y, z)
      support.castShadow = false
      support.receiveShadow = true
      panelGroup.add(support)
    })

    const boxGeo = new THREE.BoxGeometry(0.5, 0.2, 0.3)
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5
    })
    const junctionBox = new THREE.Mesh(boxGeo, boxMat)
    junctionBox.position.set(0, 0.85, 0)
    junctionBox.name = 'junction_box'
    panelGroup.add(junctionBox)

    return panelGroup
  }

  public static createInverter(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const inverterGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const bodyGeometry = new THREE.BoxGeometry(3.5, 2.8, 1.7)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.4,
      metalness: 0.7
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.6
    body.castShadow = true
    body.receiveShadow = true
    body.name = 'inverter_body'
    inverterGroup.add(body)

    const frontColor = status === DeviceStatus.NORMAL ? 0x4a5568 : statusColor
    const frontGeometry = new THREE.BoxGeometry(3.3, 2.4, 0.15)
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: frontColor,
      roughness: 0.3,
      metalness: 0.8,
      emissive: status !== DeviceStatus.NORMAL ? statusColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.5 : 0
    })
    const frontPanel = new THREE.Mesh(frontGeometry, frontMaterial)
    frontPanel.position.set(0, 1.6, 0.92)
    frontPanel.name = 'inverter_front'
    inverterGroup.add(frontPanel)

    const screenFrameGeo = new THREE.BoxGeometry(1.5, 0.8, 0.08)
    const screenFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.9
    })
    const screenFrame = new THREE.Mesh(screenFrameGeo, screenFrameMat)
    screenFrame.position.set(0, 2.2, 1.0)
    screenFrame.name = 'screen_frame'
    inverterGroup.add(screenFrame)

    const screenGeo = new THREE.BoxGeometry(1.3, 0.6, 0.02)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x10b981,
      emissiveIntensity: 0.6
    })
    const screen = new THREE.Mesh(screenGeo, screenMat)
    screen.position.set(0, 2.2, 1.05)
    screen.name = 'screen'
    inverterGroup.add(screen)

    const ledColors = status === DeviceStatus.NORMAL ? [0x22c55e, 0x22c55e, 0xf59e0b] : [0xef4444, 0xef4444, 0xef4444]
    for (let i = 0; i < 3; i++) {
      const ledGeo = new THREE.SphereGeometry(0.1, 12, 12)
      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColors[i],
        emissive: ledColors[i],
        emissiveIntensity: 0.8
      })
      const led = new THREE.Mesh(ledGeo, ledMat)
      led.position.set(-0.6 + i * 0.6, 0.8, 1.05)
      led.name = `led_${i}`
      inverterGroup.add(led)
    }

    const ventGeo = new THREE.BoxGeometry(0.7, 0.5, 0.05)
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8
    })
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(ventGeo, ventMat)
      vent.position.set(-1.0, 1.4, 1.0)
      vent.name = `vent_${i}`
      inverterGroup.add(vent)
    }

    const baseGeo = new THREE.BoxGeometry(3.9, 0.4, 1.9)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.4
    })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = 0.2
    base.castShadow = true
    base.receiveShadow = true
    base.name = 'inverter_base'
    inverterGroup.add(base)

    for (let i = 0; i < 10; i++) {
      const finGeo = new THREE.BoxGeometry(0.1, 0.4, 1.5)
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        metalness: 0.6
      })
      const fin = new THREE.Mesh(finGeo, finMat)
      fin.position.set(-1.35 + i * 0.3, 3.2, 0)
      fin.castShadow = true
      fin.name = `fin_${i}`
      inverterGroup.add(fin)
    }

    const logoGeo = new THREE.BoxGeometry(0.5, 0.2, 0.05)
    const logoMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3
    })
    const logo = new THREE.Mesh(logoGeo, logoMat)
    logo.position.set(0, 0.8, 1.05)
    logo.name = 'logo'
    inverterGroup.add(logo)

    return inverterGroup
  }

  public static createCombinerBox(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const boxGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const bodyGeo = new THREE.BoxGeometry(1.5, 2.0, 0.8)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.5,
      metalness: 0.6
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.7
    body.castShadow = true
    body.receiveShadow = true
    body.name = 'combiner_body'
    boxGroup.add(body)

    const doorColor = status === DeviceStatus.NORMAL ? 0x6b7280 : statusColor
    const doorGeo = new THREE.BoxGeometry(1.3, 1.6, 0.1)
    const doorMat = new THREE.MeshStandardMaterial({
      color: doorColor,
      roughness: 0.35,
      metalness: 0.7,
      emissive: status !== DeviceStatus.NORMAL ? statusColor : 0x000000,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 0.4 : 0
    })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(0, 1.7, 0.45)
    door.name = 'combiner_door'
    boxGroup.add(door)

    const handleGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 12)
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    })
    const handle = new THREE.Mesh(handleGeo, handleMat)
    handle.position.set(0.45, 1.7, 0.52)
    handle.rotation.y = Math.PI / 2
    handle.name = 'handle'
    boxGroup.add(handle)

    const lockGeo = new THREE.BoxGeometry(0.1, 0.12, 0.08)
    const lockMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.3
    })
    const lock = new THREE.Mesh(lockGeo, lockMat)
    lock.position.set(0.45, 1.45, 0.52)
    lock.name = 'lock'
    boxGroup.add(lock)

    for (let i = 0; i < 4; i++) {
      const terminalGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8)
      const terminalMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8
      })
      const terminal = new THREE.Mesh(terminalGeo, terminalMat)
      terminal.position.set(-0.45 + i * 0.3, 0.85, 0.5)
      terminal.rotation.x = Math.PI / 2
      terminal.name = `terminal_${i}`
      boxGroup.add(terminal)
    }

    const warningGeo = new THREE.BoxGeometry(0.4, 0.2, 0.05)
    const warningMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.6
    })
    const warning = new THREE.Mesh(warningGeo, warningMat)
    warning.position.set(0, 2.65, 0.45)
    warning.name = 'warning'
    boxGroup.add(warning)

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.7, 8)
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.6,
      metalness: 0.5
    })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.y = 0.85
    pole.castShadow = true
    pole.receiveShadow = true
    pole.name = 'pole'
    boxGroup.add(pole)

    const flangeGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.08, 8)
    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.7
    })
    const flange = new THREE.Mesh(flangeGeo, flangeMat)
    flange.position.y = 0.04
    flange.castShadow = true
    flange.receiveShadow = true
    flange.name = 'flange'
    boxGroup.add(flange)

    return boxGroup
  }

  public static createAlarmDevice(status: DeviceStatus = DeviceStatus.NORMAL): THREE.Group {
    const alarmGroup = new THREE.Group()
    const statusColor = STATUS_COLORS[status]

    const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.15, 12)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.5,
      metalness: 0.6
    })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = 0.075
    base.castShadow = true
    base.receiveShadow = true
    base.name = 'alarm_base'
    alarmGroup.add(base)

    for (let i = 0; i < 4; i++) {
      const poleSegGeo = new THREE.CylinderGeometry(0.07, 0.08, 1.4, 8)
      const poleSegMat = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        roughness: 0.5,
        metalness: 0.6
      })
      const poleSeg = new THREE.Mesh(poleSegGeo, poleSegMat)
      poleSeg.position.y = 0.85 + i * 1.35
      poleSeg.castShadow = true
      poleSeg.receiveShadow = true
      poleSeg.name = `pole_segment_${i}`
      alarmGroup.add(poleSeg)

      const ringGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 12)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x6b7280,
        metalness: 0.7
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = 1.5 + i * 1.35
      ring.rotation.x = Math.PI / 2
      ring.name = `ring_${i}`
      alarmGroup.add(ring)
    }

    const boxGeo = new THREE.BoxGeometry(1.0, 0.6, 0.5)
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.4,
      metalness: 0.8
    })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.y = 5.6
    box.castShadow = true
    box.name = 'alarm_box'
    alarmGroup.add(box)

    const lightHousingGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16)
    const lightHousingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.7
    })
    const lightHousing = new THREE.Mesh(lightHousingGeo, lightHousingMat)
    lightHousing.position.y = 6.0
    lightHousing.name = 'light_housing'
    alarmGroup.add(lightHousing)

    const lightColor = status === DeviceStatus.NORMAL ? 0x22c55e : statusColor
    const lensGeo = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const lensMat = new THREE.MeshStandardMaterial({
      color: lightColor,
      emissive: lightColor,
      emissiveIntensity: status !== DeviceStatus.NORMAL ? 1.5 : 0.5,
      transparent: true,
      opacity: 0.9
    })
    const lens = new THREE.Mesh(lensGeo, lensMat)
    lens.position.y = 6.15
    lens.name = 'alarm_light'
    alarmGroup.add(lens)

    const speakerGeo = new THREE.ConeGeometry(0.3, 0.5, 12, 1, true)
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.85,
      side: THREE.DoubleSide
    })
    const speaker = new THREE.Mesh(speakerGeo, speakerMat)
    speaker.position.set(0, 5.75, 0.45)
    speaker.rotation.x = -Math.PI / 2
    speaker.name = 'speaker'
    alarmGroup.add(speaker)

    for (let i = 0; i < 3; i++) {
      const panelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12)
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8
      })
      const panel = new THREE.Mesh(panelGeo, panelMat)
      panel.position.set(-0.3 + i * 0.3, 5.3, 0)
      panel.name = `solar_panel_${i}`
      alarmGroup.add(panel)
    }

    const signGeo = new THREE.BoxGeometry(0.25, 0.05, 0.35)
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.6
    })
    const sign = new THREE.Mesh(signGeo, signMat)
    sign.position.set(0, 4.95, 0.2)
    sign.rotation.x = -Math.PI / 6
    sign.name = 'sign'
    alarmGroup.add(sign)

    return alarmGroup
  }

  public static createPatrolMarker(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.6, 16, 16)
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
      roughness: 0.3,
      metalness: 0.8,
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
