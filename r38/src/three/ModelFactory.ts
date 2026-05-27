import * as THREE from 'three'
import { COLORS } from './constants'
import type { Building, Device, CampusGate } from '@/types'

export class ModelFactory {
  private static materials: Map<string, THREE.Material> = new Map()

  static getMaterial(color: number, transparent = false, opacity = 1): THREE.MeshStandardMaterial {
    const key = `${color}_${transparent}_${opacity}`
    if (!this.materials.has(key)) {
      this.materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          transparent,
          opacity,
          metalness: 0.1,
          roughness: 0.8
        })
      )
    }
    return this.materials.get(key)! as THREE.MeshStandardMaterial
  }

  static createGround(size: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size, 50, 50)
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.ground,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = 'ground'
    return ground
  }

  static createGrass(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(200, 150)
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.grass,
      roughness: 1,
      metalness: 0
    })
    const grass = new THREE.Mesh(geometry, material)
    grass.rotation.x = -Math.PI / 2
    grass.position.y = 0.01
    grass.receiveShadow = true
    grass.name = 'grass'
    return grass
  }

  static createRoads(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'roads'

    const roadMaterial = this.getMaterial(COLORS.road)
    const roadWidth = 8

    const mainRoadH = new THREE.Mesh(new THREE.BoxGeometry(200, 0.1, roadWidth), roadMaterial)
    mainRoadH.position.set(0, 0.05, 0)
    mainRoadH.receiveShadow = true
    group.add(mainRoadH)

    const mainRoadV = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.1, 150), roadMaterial)
    mainRoadV.position.set(0, 0.05, 0)
    mainRoadV.receiveShadow = true
    group.add(mainRoadV)

    const secondaryRoad1 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, roadWidth), roadMaterial)
    secondaryRoad1.position.set(50, 0.05, 40)
    secondaryRoad1.receiveShadow = true
    group.add(secondaryRoad1)

    const secondaryRoad2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, roadWidth), roadMaterial)
    secondaryRoad2.position.set(-50, 0.05, -40)
    secondaryRoad2.receiveShadow = true
    group.add(secondaryRoad2)

    return group
  }

  static createBuilding(building: Building): THREE.Group {
    const group = new THREE.Group()
    group.name = `building_${building.id}`
    group.userData = { type: 'building', data: building }

    const { position, size, floors, color } = building
    const floorHeight = size.height / floors

    for (let i = 0; i < floors; i++) {
      const floorGroup = new THREE.Group()
      floorGroup.name = `floor_${i + 1}`

      const floorGeometry = new THREE.BoxGeometry(size.width, floorHeight * 0.95, size.depth)
      const floorMaterial = this.getMaterial(color)
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
      floorMesh.position.y = i * floorHeight + floorHeight / 2
      floorMesh.castShadow = true
      floorMesh.receiveShadow = true
      floorGroup.add(floorMesh)

      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.6,
        emissive: 0x4488aa,
        emissiveIntensity: 0.2
      })

      const windowWidth = 2
      const windowHeight = 1.5
      const windowSpacing = 4

      for (let wx = -size.width / 2 + windowSpacing / 2; wx < size.width / 2 - windowWidth / 2; wx += windowSpacing) {
        const windowFront = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial)
        windowFront.position.set(wx, i * floorHeight + floorHeight / 2, size.depth / 2 + 0.01)
        floorGroup.add(windowFront)

        const windowBack = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial)
        windowBack.position.set(wx, i * floorHeight + floorHeight / 2, -size.depth / 2 - 0.01)
        windowBack.rotation.y = Math.PI
        floorGroup.add(windowBack)
      }

      for (let wz = -size.depth / 2 + windowSpacing / 2; wz < size.depth / 2 - windowWidth / 2; wz += windowSpacing) {
        const windowLeft = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial)
        windowLeft.position.set(-size.width / 2 - 0.01, i * floorHeight + floorHeight / 2, wz)
        windowLeft.rotation.y = -Math.PI / 2
        floorGroup.add(windowLeft)

        const windowRight = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, windowHeight), windowMaterial)
        windowRight.position.set(size.width / 2 + 0.01, i * floorHeight + floorHeight / 2, wz)
        windowRight.rotation.y = Math.PI / 2
        floorGroup.add(windowRight)
      }

      group.add(floorGroup)
    }

    const roofGeometry = new THREE.ConeGeometry(size.width * 0.6, 3, 4)
    const roofMaterial = this.getMaterial(0x5c4033)
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.y = size.height + 1.5
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)

    group.position.set(position.x, position.y, position.z)

    return group
  }

  static createDevice(device: Device, color: number): THREE.Group {
    const group = new THREE.Group()
    group.name = `device_${device.id}`
    group.userData = { type: 'device', data: device }

    const geometry = new THREE.SphereGeometry(0.8, 16, 16)
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    group.add(mesh)

    const ringGeometry = new THREE.RingGeometry(1.2, 1.5, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.05
    group.add(ring)

    if (device.type === 'camera') {
      const coneGeometry = new THREE.ConeGeometry(0.5, 2, 8)
      const coneMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
      const cone = new THREE.Mesh(coneGeometry, coneMaterial)
      cone.position.y = 1.5
      cone.castShadow = true
      group.add(cone)
    } else if (device.type === 'fireExtinguisher') {
      const cylGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16)
      const cylMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
      const cyl = new THREE.Mesh(cylGeometry, cylMaterial)
      cyl.position.y = 1
      cyl.castShadow = true
      group.add(cyl)
    } else if (device.type === 'smokeDetector') {
      const discGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16)
      const discMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
      const disc = new THREE.Mesh(discGeometry, discMaterial)
      disc.position.y = 1
      disc.castShadow = true
      group.add(disc)
    }

    group.position.set(device.position.x, device.position.y, device.position.z)

    return group
  }

  static createGate(gate: CampusGate): THREE.Group {
    const group = new THREE.Group()
    group.name = `gate_${gate.id}`
    group.userData = { type: 'gate', data: gate }

    const pillarGeometry = new THREE.BoxGeometry(1, 5, 1)
    const pillarMaterial = this.getMaterial(0x4a4a4a)
    const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
    leftPillar.position.set(-3, 2.5, 0)
    leftPillar.castShadow = true
    group.add(leftPillar)

    const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
    rightPillar.position.set(3, 2.5, 0)
    rightPillar.castShadow = true
    group.add(rightPillar)

    const beamGeometry = new THREE.BoxGeometry(8, 0.5, 0.5)
    const beamMaterial = this.getMaterial(COLORS.gate)
    const beam = new THREE.Mesh(beamGeometry, beamMaterial)
    beam.position.set(0, 5.25, 0)
    beam.castShadow = true
    group.add(beam)

    const gateColor = gate.status === 'open' ? COLORS.online : COLORS.offline
    const statusGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const statusMaterial = new THREE.MeshStandardMaterial({
      color: gateColor,
      emissive: gateColor,
      emissiveIntensity: 0.5
    })
    const status = new THREE.Mesh(statusGeometry, statusMaterial)
    status.position.set(0, 6, 0)
    group.add(status)

    group.position.set(gate.position.x, gate.position.y, gate.position.z)

    return group
  }

  static createAlarmIndicator(color: number): THREE.Group {
    const group = new THREE.Group()
    group.name = 'alarm_indicator'

    const pulseGeometry = new THREE.RingGeometry(2, 2.5, 32)
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial)
    pulse.rotation.x = -Math.PI / 2
    pulse.name = 'pulse'
    group.add(pulse)

    const beaconGeometry = new THREE.ConeGeometry(0.8, 4, 8)
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6
    })
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial)
    beacon.position.y = 2
    beacon.name = 'beacon'
    group.add(beacon)

    return group
  }

  static createSelectionRing(): THREE.Mesh {
    const geometry = new THREE.RingGeometry(2, 2.3, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x1890ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.1
    ring.name = 'selection_ring'
    return ring
  }
}
