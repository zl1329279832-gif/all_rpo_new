import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildHeatSinks(): THREE.Group {
  const heatSinksGroup = new THREE.Group()
  heatSinksGroup.name = 'heat_sinks'

  const heatSink1 = buildHeatSinkUnit()
  heatSink1.position.set(0, -0.6, 0.8)
  heatSink1.rotation.x = Math.PI / 2
  heatSink1.name = 'heat_sink_front'
  heatSink1.userData.partId = 'heat_sink'
  heatSinksGroup.add(heatSink1)

  const heatSink2 = buildHeatSinkUnit()
  heatSink2.position.set(0, -0.6, -0.8)
  heatSink2.rotation.x = -Math.PI / 2
  heatSink2.name = 'heat_sink_rear'
  heatSink2.userData.partId = 'heat_sink'
  heatSinksGroup.add(heatSink2)

  const heatPipes = buildHeatPipes()
  heatSinksGroup.add(heatPipes)

  return heatSinksGroup
}

function buildHeatSinkUnit(): THREE.Group {
  const heatSinkGroup = new THREE.Group()

  const metalMaterial = materialManager.getMetalMaterial({ color: 0xaaaaaa })

  const baseGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.4)
  const base = new THREE.Mesh(baseGeometry, metalMaterial)
  heatSinkGroup.add(base)

  const finGeometry = new THREE.BoxGeometry(0.55, 0.01, 0.4)
  const finMaterial = materialManager.getMetalMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 })

  for (let i = 0; i < 15; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial)
    fin.position.set(0, 0.03 + i * 0.02, 0)
    heatSinkGroup.add(fin)
  }

  const pipeGeometry = new THREE.TorusGeometry(0.02, 0.01, 8, 16)
  const pipeMaterial = materialManager.getCopperMaterial()

  for (let i = 0; i < 3; i++) {
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial)
    pipe.position.set(-0.2 + i * 0.2, 0.02, 0)
    pipe.rotation.y = Math.PI / 2
    heatSinkGroup.add(pipe)
  }

  return heatSinkGroup
}

function buildHeatPipes(): THREE.Group {
  const pipesGroup = new THREE.Group()
  pipesGroup.name = 'heat_pipes'

  const pipeMaterial = materialManager.getCopperMaterial()

  const pipePositions = [
    { start: [0, -0.5, 0.6], end: [0, -0.6, 0.8] },
    { start: [0, -0.5, -0.6], end: [0, -0.6, -0.8] },
    { start: [0.5, 0, 0], end: [0.5, -0.3, 0.5] },
    { start: [-0.5, 0, 0], end: [-0.5, -0.3, 0.5] },
  ]

  pipePositions.forEach(({ start, end }, i) => {
    const pipe = createPipe(
      new THREE.Vector3(start[0], start[1], start[2]),
      new THREE.Vector3(end[0], end[1], end[2]),
      pipeMaterial
    )
    pipe.name = `heat_pipe_${i}`
    pipe.userData.partId = 'heat_pipe'
    pipesGroup.add(pipe)
  })

  return pipesGroup
}

function createPipe(start: THREE.Vector3, end: THREE.Vector3, material: THREE.Material): THREE.Group {
  const pipeGroup = new THREE.Group()

  const path = new THREE.LineCurve3(start, end)
  const tubeGeometry = new THREE.TubeGeometry(path, 8, 0.02, 8, false)
  const tube = new THREE.Mesh(tubeGeometry, material)
  pipeGroup.add(tube)

  return pipeGroup
}

export function buildRadiators(): THREE.Group {
  const radiatorsGroup = new THREE.Group()
  radiatorsGroup.name = 'deployable_radiators'

  const leftRadiator = buildDeployableRadiator('left')
  leftRadiator.position.set(-1.1, 0, 0)
  leftRadiator.rotation.y = 0
  radiatorsGroup.add(leftRadiator)

  const rightRadiator = buildDeployableRadiator('right')
  rightRadiator.position.set(1.1, 0, 0)
  rightRadiator.rotation.y = Math.PI
  radiatorsGroup.add(rightRadiator)

  return radiatorsGroup
}

function buildDeployableRadiator(side: string): THREE.Group {
  const radiatorGroup = new THREE.Group()
  radiatorGroup.name = `radiator_${side}`

  const metalMaterial = materialManager.getMetalMaterial()
  const whiteMaterial = materialManager.getWhiteMaterial()

  const panelGeometry = new THREE.BoxGeometry(1.5, 0.03, 0.8)
  const panel = new THREE.Mesh(panelGeometry, whiteMaterial)
  panel.userData.partId = 'deployable_radiator'
  radiatorGroup.add(panel)

  const frameGeometry = new THREE.BoxGeometry(1.55, 0.05, 0.85)
  const frameMaterial = materialManager.getMetalMaterial({ color: 0x666666 })
  const frame = new THREE.Mesh(frameGeometry, frameMaterial)
  radiatorGroup.add(frame)

  const tubeGeometry = new THREE.TorusGeometry(0.015, 0.005, 4, 32)
  const tubeMaterial = materialManager.getMetalMaterial({ color: 0x444444 })

  for (let i = 0; i < 5; i++) {
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
    tube.position.set(0, 0.02, -0.3 + i * 0.15)
    tube.scale.set(45, 1, 1)
    radiatorGroup.add(tube)
  }

  const hingeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12)
  const hinge = new THREE.Mesh(hingeGeometry, metalMaterial)
  hinge.position.set(side === 'left' ? 0.75 : -0.75, 0, 0)
  hinge.rotation.z = Math.PI / 2
  radiatorGroup.add(hinge)

  return radiatorGroup
}
