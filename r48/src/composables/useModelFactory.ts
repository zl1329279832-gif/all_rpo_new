import * as THREE from 'three'
import type { DeviceData, DeviceType } from '@/types'
import { STATUS_COLORS } from '@/types'

function createMaterial(status: DeviceData['status'], opacity: number = 1): THREE.MeshStandardMaterial {
  const color = STATUS_COLORS[status]
  return new THREE.MeshStandardMaterial({
    color,
    emissive: status === 'alarm' ? color : 0x000000,
    emissiveIntensity: status === 'alarm' ? 0.5 : 0,
    roughness: 0.4,
    metalness: 0.6,
    transparent: opacity < 1,
    opacity,
  })
}

function createPump(device: DeviceData): THREE.Group {
  const group = new THREE.Group()
  const mat = createMaterial(device.status)

  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 16)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.castShadow = true
  group.add(body)

  const impellerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 6)
  const impellerMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, metalness: 0.8, roughness: 0.2 })
  const impeller = new THREE.Mesh(impellerGeo, impellerMat)
  impeller.position.y = 0.7
  impeller.name = 'impeller'
  group.add(impeller)

  const pipeOutGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8)
  const pipeOut = new THREE.Mesh(pipeOutGeo, mat)
  pipeOut.rotation.z = Math.PI / 2
  pipeOut.position.set(0.5, 0.3, 0)
  group.add(pipeOut)

  const baseGeo = new THREE.BoxGeometry(1.2, 0.15, 1.0)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a3a5c, metalness: 0.5, roughness: 0.5 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = -0.7
  base.castShadow = true
  group.add(base)

  group.position.set(device.position.x, device.position.y, device.position.z)
  group.userData = { deviceId: device.id, deviceType: device.type }
  return group
}

function createValve(device: DeviceData): THREE.Group {
  const group = new THREE.Group()
  const mat = createMaterial(device.status)

  const bodyGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.castShadow = true
  group.add(body)

  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 8)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, metalness: 0.7, roughness: 0.3 })
  const wheel = new THREE.Mesh(wheelGeo, wheelMat)
  wheel.position.y = 0.35
  wheel.rotation.y = Math.PI / 8
  group.add(wheel)

  const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6)
  const stem = new THREE.Mesh(stemGeo, wheelMat)
  stem.position.y = 0.2
  group.add(stem)

  group.position.set(device.position.x, device.position.y, device.position.z)
  group.userData = { deviceId: device.id, deviceType: device.type }
  return group
}

function createSensor(device: DeviceData): THREE.Group {
  const group = new THREE.Group()
  const mat = createMaterial(device.status)

  const headGeo = new THREE.SphereGeometry(0.2, 16, 16)
  const head = new THREE.Mesh(headGeo, mat)
  head.castShadow = true
  group.add(head)

  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.5, roughness: 0.4 })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.y = -0.4
  group.add(pole)

  const lightGeo = new THREE.SphereGeometry(0.08, 8, 8)
  const lightMat = new THREE.MeshStandardMaterial({
    color: device.status === 'alarm' ? 0xff4d4f : 0x52c41a,
    emissive: device.status === 'alarm' ? 0xff4d4f : 0x52c41a,
    emissiveIntensity: 0.8,
  })
  const light = new THREE.Mesh(lightGeo, lightMat)
  light.position.y = 0.22
  light.name = 'indicator'
  group.add(light)

  group.position.set(device.position.x, device.position.y, device.position.z)
  group.userData = { deviceId: device.id, deviceType: device.type }
  return group
}

function createCabinet(device: DeviceData): THREE.Group {
  const group = new THREE.Group()
  const mat = createMaterial(device.status)

  const bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.5)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.castShadow = true
  group.add(body)

  const doorGeo = new THREE.BoxGeometry(0.7, 1.4, 0.02)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, metalness: 0.3, roughness: 0.6 })
  const door = new THREE.Mesh(doorGeo, doorMat)
  door.position.z = 0.26
  group.add(door)

  const lightGeo = new THREE.SphereGeometry(0.05, 8, 8)
  const lightColor = device.status === 'running' ? 0x52c41a : device.status === 'alarm' ? 0xff4d4f : 0xfadb14
  const lightMat = new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 1 })
  const light1 = new THREE.Mesh(lightGeo, lightMat)
  light1.position.set(0.25, 0.6, 0.27)
  light1.name = 'indicator'
  group.add(light1)

  const light2 = new THREE.Mesh(lightGeo.clone(), lightMat.clone())
  light2.position.set(0.25, 0.4, 0.27)
  light2.name = 'indicator'
  group.add(light2)

  group.position.set(device.position.x, device.position.y, device.position.z)
  group.userData = { deviceId: device.id, deviceType: device.type }
  return group
}

function createPool(device: DeviceData): THREE.Group {
  const group = new THREE.Group()
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, transparent: true, opacity: 0.5, metalness: 0.3, roughness: 0.5 })

  const wallThickness = 0.15
  const poolW = 3
  const poolH = 2
  const poolD = 4

  const floorGeo = new THREE.BoxGeometry(poolW, wallThickness, poolD)
  const floor = new THREE.Mesh(floorGeo, wallMat)
  floor.position.y = -poolH / 2
  floor.receiveShadow = true
  group.add(floor)

  const wallFrontGeo = new THREE.BoxGeometry(poolW, poolH, wallThickness)
  const wallFront = new THREE.Mesh(wallFrontGeo, wallMat)
  wallFront.position.set(0, 0, poolD / 2)
  group.add(wallFront)

  const wallBackGeo = new THREE.BoxGeometry(poolW, poolH, wallThickness)
  const wallBack = new THREE.Mesh(wallBackGeo, wallMat)
  wallBack.position.set(0, 0, -poolD / 2)
  group.add(wallBack)

  const wallLeftGeo = new THREE.BoxGeometry(wallThickness, poolH, poolD)
  const wallLeft = new THREE.Mesh(wallLeftGeo, wallMat)
  wallLeft.position.set(-poolW / 2, 0, 0)
  group.add(wallLeft)

  const wallRightGeo = new THREE.BoxGeometry(wallThickness, poolH, poolD)
  const wallRight = new THREE.Mesh(wallRightGeo, wallMat)
  wallRight.position.set(poolW / 2, 0, 0)
  group.add(wallRight)

  const waterGeo = new THREE.PlaneGeometry(poolW - wallThickness * 2, poolD - wallThickness * 2, 20, 20)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1890ff,
    transparent: true,
    opacity: 0.6,
    emissive: 0x1890ff,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
  })
  const water = new THREE.Mesh(waterGeo, waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.y = -0.2
  water.name = 'water'
  group.add(water)

  group.position.set(device.position.x, device.position.y, device.position.z)
  group.userData = { deviceId: device.id, deviceType: device.type }
  return group
}

function createPipe(start: THREE.Vector3, end: THREE.Vector3, status: DeviceData['status']): THREE.Group {
  const group = new THREE.Group()
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const mat = createMaterial(status, 0.85)

  const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, length, 8)
  const pipe = new THREE.Mesh(pipeGeo, mat)
  pipe.castShadow = true

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  pipe.position.copy(mid)
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())

  group.add(pipe)

  const particleCount = Math.floor(length * 3)
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const t = Math.random()
    positions[i * 3] = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 0.05
    positions[i * 3 + 1] = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 0.05
    positions[i * 3 + 2] = start.z + (end.z - start.z) * t + (Math.random() - 0.5) * 0.05
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.05, transparent: true, opacity: 0.6 })
  const particles = new THREE.Points(particleGeo, particleMat)
  particles.name = 'pipeParticles'
  group.add(particles)

  group.userData = { isPipe: true }
  return group
}

function createBuilding(): THREE.Group {
  const group = new THREE.Group()
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a4a6c, metalness: 0.5, roughness: 0.4 })

  const w = 10
  const h = 4
  const d = 8

  const roofGeo = new THREE.BoxGeometry(w + 0.4, 0.15, d + 0.4)
  const roof = new THREE.Mesh(roofGeo, frameMat)
  roof.position.y = h
  roof.castShadow = true
  group.add(roof)

  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, h, 6)
  const corners = [
    [-w / 2, 0], [w / 2, 0], [-w / 2, -d / 2], [w / 2, -d / 2],
    [-w / 2, d / 2], [w / 2, d / 2],
  ]
  for (const [cx, cz] of corners) {
    const pillar = new THREE.Mesh(pillarGeo, frameMat)
    pillar.position.set(cx, h / 2, cz)
    pillar.castShadow = true
    group.add(pillar)
  }

  const backWallGeo = new THREE.PlaneGeometry(w, h)
  const backWall = new THREE.Mesh(backWallGeo, wallMat)
  backWall.position.set(0, h / 2, -d / 2)
  group.add(backWall)

  const leftWallGeo = new THREE.PlaneGeometry(d, h)
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-w / 2, h / 2, 0)
  group.add(leftWall)

  const rightWallGeo = new THREE.PlaneGeometry(d, h)
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.set(w / 2, h / 2, 0)
  group.add(rightWall)

  group.position.y = 0
  group.userData = { isBuilding: true }
  return group
}

export function useModelFactory() {
  const createDevice = (device: DeviceData): THREE.Group => {
    const creators: Record<DeviceType, (d: DeviceData) => THREE.Group> = {
      pump: createPump,
      valve: createValve,
      sensor: createSensor,
      cabinet: createCabinet,
      pool: createPool,
      pipe: () => new THREE.Group(),
    }
    return creators[device.type](device)
  }

  const createPipes = (devices: DeviceData[]): THREE.Group[] => {
    const pipes: THREE.Group[] = []
    const pumps = devices.filter(d => d.type === 'pump')
    const intakeValve = devices.find(d => d.id === 'valve-1')
    const outletValve = devices.find(d => d.id === 'valve-2')

    if (intakeValve) {
      for (const pump of pumps) {
        pipes.push(createPipe(
          new THREE.Vector3(intakeValve.position.x + 1, intakeValve.position.y, intakeValve.position.z),
          new THREE.Vector3(pump.position.x - 1, pump.position.y + 0.3, pump.position.z),
          'running'
        ))
      }
    }

    if (outletValve) {
      for (const pump of pumps) {
        pipes.push(createPipe(
          new THREE.Vector3(pump.position.x + 1, pump.position.y + 0.3, pump.position.z),
          new THREE.Vector3(outletValve.position.x - 1, outletValve.position.y, outletValve.position.z),
          pump.status === 'running' ? 'running' : 'stopped'
        ))
      }
    }

    const intakePool = devices.find(d => d.id === 'pool-1')
    if (intakePool && intakeValve) {
      pipes.push(createPipe(
        new THREE.Vector3(intakePool.position.x + 1.5, 0.5, intakePool.position.z),
        new THREE.Vector3(intakeValve.position.x - 1, intakeValve.position.y, intakeValve.position.z),
        'running'
      ))
    }

    return pipes
  }

  const createPumpHouseBuilding = (): THREE.Group => {
    return createBuilding()
  }

  const updateDeviceStatus = (group: THREE.Group, device: DeviceData): void => {
    const color = STATUS_COLORS[device.status]
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name !== 'impeller' && child.name !== 'indicator') {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.color) {
          mat.color.setHex(color)
        }
        if (device.status === 'alarm') {
          mat.emissive.setHex(color)
          mat.emissiveIntensity = 0.5
        } else {
          mat.emissive.setHex(0x000000)
          mat.emissiveIntensity = 0
        }
      }
    })
  }

  return { createDevice, createPipes, createPumpHouseBuilding, updateDeviceStatus }
}
