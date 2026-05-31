import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildThrusters(): THREE.Group {
  const thrustersGroup = new THREE.Group()
  thrustersGroup.name = 'thrusters'

  const metalMaterial = materialManager.getMetalMaterial()
  const copperMaterial = materialManager.getCopperMaterial()

  const positions = [
    { pos: [0, -0.9, 0], rot: [0, 0, 0], name: 'main_thruster' },
    { pos: [0.8, -0.7, 0.8], rot: [Math.PI / 4, 0, -Math.PI / 4], name: 'thruster_rf' },
    { pos: [-0.8, -0.7, 0.8], rot: [Math.PI / 4, 0, Math.PI / 4], name: 'thruster_lf' },
    { pos: [0.8, -0.7, -0.8], rot: [-Math.PI / 4, 0, -Math.PI / 4], name: 'thruster_rb' },
    { pos: [-0.8, -0.7, -0.8], rot: [-Math.PI / 4, 0, Math.PI / 4], name: 'thruster_lb' },
  ]

  positions.forEach(({ pos, rot, name }) => {
    const thruster = buildSingleThruster(metalMaterial, copperMaterial)
    thruster.position.set(pos[0], pos[1], pos[2])
    thruster.rotation.set(rot[0], rot[1], rot[2])
    thruster.name = name
    thruster.userData.partId = 'thruster'
    thrustersGroup.add(thruster)
  })

  return thrustersGroup
}

function buildSingleThruster(metalMaterial: THREE.MeshStandardMaterial, copperMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const thrusterGroup = new THREE.Group()

  const nozzleGeometry = new THREE.CylinderGeometry(0.08, 0.18, 0.25, 16)
  const nozzle = new THREE.Mesh(nozzleGeometry, copperMaterial)
  nozzle.position.y = -0.125
  thrusterGroup.add(nozzle)

  const chamberGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16)
  const chamber = new THREE.Mesh(chamberGeometry, metalMaterial)
  chamber.position.y = 0.075
  thrusterGroup.add(chamber)

  const flangeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16)
  const flangeMaterial = materialManager.getMetalMaterial({ color: 0x555555 })
  const flange = new THREE.Mesh(flangeGeometry, flangeMaterial)
  flange.position.y = 0.175
  thrusterGroup.add(flange)

  const glowGeometry = new THREE.ConeGeometry(0.12, 0.3, 16)
  const glowMaterial = materialManager.getGlowMaterial(0xff6600)
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.y = -0.4
  glow.rotation.x = Math.PI
  glow.name = 'thruster_glow'
  glow.visible = false
  thrusterGroup.add(glow)

  return thrusterGroup
}

export function buildRCSThrusters(): THREE.Group {
  const rcsGroup = new THREE.Group()
  rcsGroup.name = 'rcs_thrusters'

  const metalMaterial = materialManager.getMetalMaterial()

  const rcsPositions = [
    { pos: [1.01, 0.5, 0], rot: [0, 0, 0], name: 'rcs_right_1' },
    { pos: [1.01, -0.5, 0], rot: [0, 0, 0], name: 'rcs_right_2' },
    { pos: [-1.01, 0.5, 0], rot: [0, Math.PI, 0], name: 'rcs_left_1' },
    { pos: [-1.01, -0.5, 0], rot: [0, Math.PI, 0], name: 'rcs_left_2' },
    { pos: [0, 0.5, 1.01], rot: [0, -Math.PI / 2, 0], name: 'rcs_front_1' },
    { pos: [0, -0.5, 1.01], rot: [0, -Math.PI / 2, 0], name: 'rcs_front_2' },
    { pos: [0, 0.5, -1.01], rot: [0, Math.PI / 2, 0], name: 'rcs_back_1' },
    { pos: [0, -0.5, -1.01], rot: [0, Math.PI / 2, 0], name: 'rcs_back_2' },
  ]

  rcsPositions.forEach(({ pos, rot, name }) => {
    const rcs = buildSingleRCS(metalMaterial)
    rcs.position.set(pos[0], pos[1], pos[2])
    rcs.rotation.set(rot[0], rot[1], rot[2])
    rcs.name = name
    rcs.userData.partId = 'rcs_thruster'
    rcsGroup.add(rcs)
  })

  return rcsGroup
}

function buildSingleRCS(metalMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const rcsGroup = new THREE.Group()

  const bodyGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.12)
  const body = new THREE.Mesh(bodyGeometry, metalMaterial)
  rcsGroup.add(body)

  const nozzleGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.08, 8)
  const nozzle = new THREE.Mesh(nozzleGeometry, metalMaterial)
  nozzle.position.x = 0.08
  nozzle.rotation.z = Math.PI / 2
  rcsGroup.add(nozzle)

  return rcsGroup
}
