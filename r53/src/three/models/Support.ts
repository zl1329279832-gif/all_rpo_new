import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildSupports(): THREE.Group {
  const supportsGroup = new THREE.Group()
  supportsGroup.name = 'supports'

  const solarPanelSupports = buildSolarPanelSupports()
  supportsGroup.add(solarPanelSupports)

  const antennaSupports = buildAntennaSupports()
  supportsGroup.add(antennaSupports)

  const sensorMounts = buildSensorMounts()
  supportsGroup.add(sensorMounts)

  return supportsGroup
}

function buildSolarPanelSupports(): THREE.Group {
  const supportsGroup = new THREE.Group()
  supportsGroup.name = 'solar_panel_supports'

  const metalMaterial = materialManager.getMetalMaterial()

  const beamGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1)
  const strutGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8)

  const leftBeam = new THREE.Mesh(beamGeometry, metalMaterial)
  leftBeam.position.set(-1.05, 0, 0)
  leftBeam.userData.partId = 'solar_support'
  supportsGroup.add(leftBeam)

  const rightBeam = new THREE.Mesh(beamGeometry, metalMaterial)
  rightBeam.position.set(1.05, 0, 0)
  rightBeam.userData.partId = 'solar_support'
  supportsGroup.add(rightBeam)

  const strutPositions = [
    { pos: [-1.05, 0.4, 0.4], rot: [Math.PI / 4, 0, 0] },
    { pos: [-1.05, 0.4, -0.4], rot: [-Math.PI / 4, 0, 0] },
    { pos: [-1.05, -0.4, 0.4], rot: [-Math.PI / 4, 0, 0] },
    { pos: [-1.05, -0.4, -0.4], rot: [Math.PI / 4, 0, 0] },
    { pos: [1.05, 0.4, 0.4], rot: [Math.PI / 4, 0, 0] },
    { pos: [1.05, 0.4, -0.4], rot: [-Math.PI / 4, 0, 0] },
    { pos: [1.05, -0.4, 0.4], rot: [-Math.PI / 4, 0, 0] },
    { pos: [1.05, -0.4, -0.4], rot: [Math.PI / 4, 0, 0] },
  ]

  strutPositions.forEach(({ pos, rot }) => {
    const strut = new THREE.Mesh(strutGeometry, metalMaterial)
    strut.position.set(pos[0], pos[1], pos[2])
    strut.rotation.set(rot[0], rot[1], rot[2])
    supportsGroup.add(strut)
  })

  const gussetGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02)
  const gussetMaterial = materialManager.getMetalMaterial({ color: 0x666666 })

  const gussetPositions = [
    [-1.05, 0.4, 0], [-1.05, -0.4, 0],
    [1.05, 0.4, 0], [1.05, -0.4, 0],
  ]

  gussetPositions.forEach((pos) => {
    const gusset = new THREE.Mesh(gussetGeometry, gussetMaterial)
    gusset.position.set(pos[0], pos[1], pos[2])
    supportsGroup.add(gusset)
  })

  return supportsGroup
}

function buildAntennaSupports(): THREE.Group {
  const supportsGroup = new THREE.Group()
  supportsGroup.name = 'antenna_supports'

  const metalMaterial = materialManager.getMetalMaterial()

  const mastGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.6, 12)
  const mast = new THREE.Mesh(mastGeometry, metalMaterial)
  mast.position.set(0, 1.1, 0)
  mast.userData.partId = 'antenna_mast'
  supportsGroup.add(mast)

  const braceGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8)
  const bracePositions = [
    { pos: [0.3, 0.9, 0.3], rot: [0, Math.PI / 4, -Math.PI / 4] },
    { pos: [-0.3, 0.9, 0.3], rot: [0, -Math.PI / 4, Math.PI / 4] },
    { pos: [0.3, 0.9, -0.3], rot: [0, -Math.PI / 4, -Math.PI / 4] },
    { pos: [-0.3, 0.9, -0.3], rot: [0, Math.PI / 4, Math.PI / 4] },
  ]

  bracePositions.forEach(({ pos, rot }) => {
    const brace = new THREE.Mesh(braceGeometry, metalMaterial)
    brace.position.set(pos[0], pos[1], pos[2])
    brace.rotation.set(rot[0], rot[1], rot[2])
    supportsGroup.add(brace)
  })

  const platformGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16)
  const platform = new THREE.Mesh(platformGeometry, metalMaterial)
  platform.position.set(0, 1.4, 0)
  supportsGroup.add(platform)

  return supportsGroup
}

function buildSensorMounts(): THREE.Group {
  const mountsGroup = new THREE.Group()
  mountsGroup.name = 'sensor_mounts'

  const metalMaterial = materialManager.getMetalMaterial()

  const mountPositions = [
    { pos: [0.7, 0.75, 0.7], size: 0.12 },
    { pos: [-0.7, 0.75, 0.7], size: 0.12 },
    { pos: [0, 0.75, -0.5], size: 0.15 },
    { pos: [-0.5, 0.8, 0.5], size: 0.08 },
  ]

  mountPositions.forEach(({ pos, size }, i) => {
    const mountGeometry = new THREE.CylinderGeometry(size * 0.6, size * 0.7, 0.05, 12)
    const mount = new THREE.Mesh(mountGeometry, metalMaterial)
    mount.position.set(pos[0], pos[1], pos[2])
    mount.name = `sensor_mount_${i}`
    mount.userData.partId = 'sensor_mount'
    mountsGroup.add(mount)
  })

  return mountsGroup
}
