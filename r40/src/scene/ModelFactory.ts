import * as THREE from 'three'
import { SceneConfig } from './config'
import type { Berth, YardBlock, QuayCrane, Truck, Container, RoadSegment } from '@/types'

export class ModelFactory {
  private static materials: Map<string, THREE.Material> = new Map()

  public static getMaterial(color: number, options?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial {
    const key = `${color}_${JSON.stringify(options || {})}`
    if (!this.materials.has(key)) {
      this.materials.set(key, new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.2,
        ...options
      }))
    }
    return this.materials.get(key) as THREE.MeshStandardMaterial
  }

  public static createBerth(data: Berth): THREE.Group {
    const group = new THREE.Group()
    group.userData = { type: 'berth', data }

    const platformGeometry = new THREE.BoxGeometry(data.length, 2, data.width)
    const platformMaterial = this.getMaterial(SceneConfig.colors.berth)
    const platform = new THREE.Mesh(platformGeometry, platformMaterial)
    platform.position.y = 1
    platform.castShadow = true
    platform.receiveShadow = true
    group.add(platform)

    const edgeGeometry = new THREE.BoxGeometry(data.length + 1, 0.5, data.width + 1)
    const edgeMaterial = this.getMaterial(0x0d3a70)
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edge.position.y = -0.25
    edge.receiveShadow = true
    group.add(edge)

    for (let i = 0; i < 5; i++) {
      const bollardGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8)
      const bollardMaterial = this.getMaterial(0x2c3e50)
      const bollard = new THREE.Mesh(bollardGeometry, bollardMaterial)
      bollard.position.set(-data.length / 2 + 10 + i * (data.length - 20) / 4, 2.75, data.width / 2 - 1)
      bollard.castShadow = true
      group.add(bollard)
    }

    if (data.vesselName) {
      const vessel = this.createVessel(data.vesselName, data.vesselStatus, data.length * 0.8)
      vessel.position.set(0, 0, -data.width / 2 - 15)
      group.add(vessel)
    }

    group.position.set(data.position.x, data.position.y, data.position.z)
    return group
  }

  private static createVessel(name: string, status: string, length: number): THREE.Group {
    const group = new THREE.Group()
    group.name = 'vessel'
    group.userData = { type: 'vessel', name, status }

    const hullGeometry = new THREE.BoxGeometry(length, 8, 20)
    const hullMaterial = this.getMaterial(0x34495e)
    const hull = new THREE.Mesh(hullGeometry, hullMaterial)
    hull.position.y = 4
    hull.castShadow = true
    group.add(hull)

    const superstructureGeometry = new THREE.BoxGeometry(length * 0.25, 10, 16)
    const superstructureMaterial = this.getMaterial(0x5d6d7e)
    const superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial)
    superstructure.position.set(length * 0.25, 13, 0)
    superstructure.castShadow = true
    group.add(superstructure)

    const statusColor = status === 'loading' || status === 'unloading' ? 0x27ae60 : 0xf39c12
    const statusLightGeometry = new THREE.SphereGeometry(1, 16, 16)
    const statusLightMaterial = this.getMaterial(statusColor, { emissive: statusColor, emissiveIntensity: 0.5 })
    const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial)
    statusLight.name = 'statusLight'
    statusLight.position.set(length * 0.25, 20, 0)
    group.add(statusLight)

    return group
  }

  public static createYardBlock(data: YardBlock): THREE.Group {
    const group = new THREE.Group()
    group.userData = { type: 'yard', data }

    const color = data.isDangerousZone ? SceneConfig.colors.yardDangerous : SceneConfig.colors.yard
    const baseGeometry = new THREE.BoxGeometry(
      SceneConfig.yard.blockWidth,
      0.5,
      SceneConfig.yard.blockDepth
    )
    const baseMaterial = this.getMaterial(color)
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.25
    base.receiveShadow = true
    group.add(base)

    const borderGeometry = new THREE.EdgesGeometry(baseGeometry)
    const borderMaterial = new THREE.LineBasicMaterial({ 
      color: data.isDangerousZone ? 0xff5722 : 0x1890ff,
      linewidth: 2
    })
    const border = new THREE.LineSegments(borderGeometry, borderMaterial)
    border.position.y = 0.25
    group.add(border)

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 })
    
    for (let r = 0; r <= data.rows; r++) {
      const points = []
      const z = -SceneConfig.yard.blockDepth / 2 + r * (SceneConfig.yard.blockDepth / data.rows)
      points.push(new THREE.Vector3(-SceneConfig.yard.blockWidth / 2 + 2, 0.52, z))
      points.push(new THREE.Vector3(SceneConfig.yard.blockWidth / 2 - 2, 0.52, z))
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(lineGeometry, lineMaterial)
      group.add(line)
    }

    group.position.set(data.position.x, data.position.y, data.position.z)
    return group
  }

  public static createQuayCrane(data: QuayCrane): THREE.Group {
    const group = new THREE.Group()
    group.userData = { type: 'quayCrane', data }

    const legGeometry = new THREE.BoxGeometry(2, data.height, 2)
    const legMaterial = this.getMaterial(SceneConfig.colors.quayCrane)
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-8, data.height / 2, 0)
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(8, data.height / 2, 0)
    rightLeg.castShadow = true
    group.add(rightLeg)

    const beamGeometry = new THREE.BoxGeometry(50, 2, 3)
    const beam = new THREE.Mesh(beamGeometry, legMaterial)
    beam.position.set(-5, data.height + 1, 0)
    beam.castShadow = true
    group.add(beam)

    const trolleyGroup = new THREE.Group()
    trolleyGroup.name = 'trolley'
    const trolleyGeometry = new THREE.BoxGeometry(6, 3, 5)
    const trolley = new THREE.Mesh(trolleyGeometry, this.getMaterial(0x455a64))
    trolley.castShadow = true
    trolleyGroup.add(trolley)

    const spreaderGeometry = new THREE.BoxGeometry(4, 0.5, 3)
    const spreader = new THREE.Mesh(spreaderGeometry, this.getMaterial(0xffc107))
    spreader.position.y = -5
    trolleyGroup.add(spreader)

    const ropeMaterial = new THREE.LineBasicMaterial({ color: 0x9e9e9e })
    for (let i = 0; i < 4; i++) {
      const ropePoints = []
      ropePoints.push(new THREE.Vector3(-1.5 + i % 2 * 3, -1.5, -1 + Math.floor(i / 2) * 2))
      ropePoints.push(new THREE.Vector3(-1.5 + i % 2 * 3, -5, -1 + Math.floor(i / 2) * 2))
      const ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints)
      trolleyGroup.add(new THREE.Line(ropeGeometry, ropeMaterial))
    }

    trolleyGroup.position.y = data.height + 2.5
    group.add(trolleyGroup)

    const cabinGeometry = new THREE.BoxGeometry(8, 6, 6)
    const cabin = new THREE.Mesh(cabinGeometry, this.getMaterial(0x37474f))
    cabin.position.set(15, data.height - 3, 0)
    cabin.castShadow = true
    group.add(cabin)

    const statusColor = data.status === 'normal' ? 0x4caf50 : data.status === 'warning' ? 0xff9800 : 0xf44336
    const statusLightGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const statusLightMaterial = this.getMaterial(statusColor, { emissive: statusColor, emissiveIntensity: 0.8 })
    const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial)
    statusLight.position.set(15, data.height + 2, 0)
    statusLight.name = 'statusLight'
    group.add(statusLight)

    group.position.set(data.position.x, data.position.y, data.position.z)
    return group
  }

  public static createTruck(data: Truck): THREE.Group {
    const group = new THREE.Group()
    group.userData = { type: 'truck', data }

    const bodyGeometry = new THREE.BoxGeometry(8, 2.5, 3)
    const bodyMaterial = this.getMaterial(SceneConfig.colors.truck)
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 1.25
    body.castShadow = true
    group.add(body)

    const cabGeometry = new THREE.BoxGeometry(3, 3, 2.8)
    const cab = new THREE.Mesh(cabGeometry, this.getMaterial(0x01579b))
    cab.position.set(3.5, 1.5, 0)
    cab.castShadow = true
    group.add(cab)

    const containerGeometry = new THREE.BoxGeometry(12.5, 3, 2.8)
    const containerMaterial = this.getMaterial(0x78909c)
    const container = new THREE.Mesh(containerGeometry, containerMaterial)
    container.position.set(-2, 3, 0)
    container.castShadow = true
    container.visible = !!data.currentTask
    container.name = 'container'
    group.add(container)

    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16)
    const wheelMaterial = this.getMaterial(0x212121)
    const wheelPositions = [
      [-2.5, 0.6, 1.6], [-2.5, 0.6, -1.6],
      [4.5, 0.6, 1.6], [4.5, 0.6, -1.6]
    ]
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.castShadow = true
      group.add(wheel)
    })

    const statusColor = data.status === 'normal' ? 0x4caf50 : data.status === 'warning' ? 0xff9800 : 0xf44336
    const statusLightGeometry = new THREE.SphereGeometry(0.4, 8, 8)
    const statusLightMaterial = this.getMaterial(statusColor, { emissive: statusColor, emissiveIntensity: 0.6 })
    const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial)
    statusLight.position.set(5, 3.5, 0)
    statusLight.name = 'statusLight'
    group.add(statusLight)

    group.position.set(data.position.x, data.position.y, data.position.z)
    return group
  }

  public static createRoad(road: RoadSegment): THREE.Group {
    const group = new THREE.Group()
    group.userData = { type: 'road', data: road }

    const dx = road.end.x - road.start.x
    const dz = road.end.z - road.start.z
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dz, dx)

    const roadGeometry = new THREE.PlaneGeometry(length, road.width)
    const color = road.congestionLevel > 0.6 ? SceneConfig.colors.roadCongested : SceneConfig.colors.road
    const roadMaterial = this.getMaterial(color)
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)
    roadMesh.rotation.x = -Math.PI / 2
    roadMesh.rotation.z = -angle
    roadMesh.position.set(
      (road.start.x + road.end.x) / 2,
      0.02,
      (road.start.z + road.end.z) / 2
    )
    roadMesh.receiveShadow = true
    group.add(roadMesh)

    if (road.congestionLevel > 0.3) {
      const indicatorGeometry = new THREE.SphereGeometry(2, 8, 8)
      const indicatorColor = road.congestionLevel > 0.7 ? 0xf44336 : road.congestionLevel > 0.5 ? 0xff9800 : 0xffc107
      const indicatorMaterial = this.getMaterial(indicatorColor, { transparent: true, opacity: 0.8 })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.position.set(
        (road.start.x + road.end.x) / 2,
        3,
        (road.start.z + road.end.z) / 2
      )
      indicator.name = 'congestionIndicator'
      group.add(indicator)
    }

    return group
  }

  public static createContainer(data: Container): THREE.Mesh {
    const width = data.size === '20ft' ? SceneConfig.container.width20ft : SceneConfig.container.width40ft
    const geometry = new THREE.BoxGeometry(width, SceneConfig.container.height, SceneConfig.container.depth)
    
    let color = SceneConfig.colors.normal
    if (data.isDangerous) {
      color = SceneConfig.colors.dangerous
    } else if (data.status === 'overtime') {
      color = SceneConfig.colors.overtime
    }

    const material = this.getMaterial(color)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { type: 'container', data }
    mesh.castShadow = true
    mesh.receiveShadow = true

    mesh.position.set(data.position.x, data.position.y, data.position.z)
    return mesh
  }

  public static getContainerGeometry(size: '20ft' | '40ft' | '45ft'): THREE.BufferGeometry {
    const width = size === '20ft' ? SceneConfig.container.width20ft : SceneConfig.container.width40ft
    return new THREE.BoxGeometry(width, SceneConfig.container.height, SceneConfig.container.depth)
  }

  public static dispose(): void {
    this.materials.forEach(material => material.dispose())
    this.materials.clear()
  }
}
