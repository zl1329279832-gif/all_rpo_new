import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildCables(): THREE.Group {
  const cablesGroup = new THREE.Group()
  cablesGroup.name = 'cables'

  const powerCables = buildPowerCables()
  cablesGroup.add(powerCables)

  const dataCables = buildDataCables()
  cablesGroup.add(dataCables)

  const signalCables = buildSignalCables()
  cablesGroup.add(signalCables)

  return cablesGroup
}

function buildPowerCables(): THREE.Group {
  const cablesGroup = new THREE.Group()
  cablesGroup.name = 'power_cables'

  const cableMaterial = materialManager.getMetalMaterial({ color: 0xff0000 })

  const cablePaths = [
    [
      new THREE.Vector3(-1.1, 0.3, 0),
      new THREE.Vector3(-0.8, 0.3, 0.2),
      new THREE.Vector3(-0.5, 0.2, 0.3),
      new THREE.Vector3(0, 0.2, 0.3),
    ],
    [
      new THREE.Vector3(1.1, 0.3, 0),
      new THREE.Vector3(0.8, 0.3, 0.2),
      new THREE.Vector3(0.5, 0.2, 0.3),
      new THREE.Vector3(0, 0.2, 0.3),
    ],
    [
      new THREE.Vector3(0, 0.2, 0.3),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, -0.3, 0.5),
    ],
  ]

  cablePaths.forEach((points, i) => {
    const cable = createCable(points, 0.025, cableMaterial)
    cable.name = `power_cable_${i}`
    cable.userData.partId = 'power_cable'
    cablesGroup.add(cable)
  })

  return cablesGroup
}

function buildDataCables(): THREE.Group {
  const cablesGroup = new THREE.Group()
  cablesGroup.name = 'data_cables'

  const cableMaterial = materialManager.getMetalMaterial({ color: 0x0066ff })

  const cablePaths = [
    [
      new THREE.Vector3(0, 1.0, 0),
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(0.2, 0.5, 0.2),
      new THREE.Vector3(0.3, 0.3, 0.4),
    ],
    [
      new THREE.Vector3(0.7, 0.75, 0.7),
      new THREE.Vector3(0.5, 0.5, 0.6),
      new THREE.Vector3(0.3, 0.3, 0.4),
    ],
    [
      new THREE.Vector3(-0.7, 0.75, 0.7),
      new THREE.Vector3(-0.5, 0.5, 0.6),
      new THREE.Vector3(-0.3, 0.3, 0.4),
    ],
    [
      new THREE.Vector3(0, 0.75, -0.5),
      new THREE.Vector3(0, 0.5, -0.4),
      new THREE.Vector3(0, 0.3, -0.2),
    ],
  ]

  cablePaths.forEach((points, i) => {
    const cable = createCable(points, 0.015, cableMaterial)
    cable.name = `data_cable_${i}`
    cable.userData.partId = 'data_cable'
    cablesGroup.add(cable)
  })

  return cablesGroup
}

function buildSignalCables(): THREE.Group {
  const cablesGroup = new THREE.Group()
  cablesGroup.name = 'signal_cables'

  const cableMaterial = materialManager.getMetalMaterial({ color: 0xffff00 })

  const cablePaths = [
    [
      new THREE.Vector3(0.9, 0.5, 0),
      new THREE.Vector3(0.7, 0.4, 0.1),
      new THREE.Vector3(0.5, 0.3, 0.2),
    ],
    [
      new THREE.Vector3(-0.5, 0.85, 0.5),
      new THREE.Vector3(-0.4, 0.6, 0.4),
      new THREE.Vector3(-0.3, 0.4, 0.3),
    ],
    [
      new THREE.Vector3(0.5, 0, 0.8),
      new THREE.Vector3(0.4, -0.1, 0.6),
      new THREE.Vector3(0.3, -0.2, 0.4),
    ],
  ]

  cablePaths.forEach((points, i) => {
    const cable = createCable(points, 0.01, cableMaterial)
    cable.name = `signal_cable_${i}`
    cable.userData.partId = 'signal_cable'
    cablesGroup.add(cable)
  })

  return cablesGroup
}

function createCable(points: THREE.Vector3[], radius: number, material: THREE.Material): THREE.Group {
  const cableGroup = new THREE.Group()

  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeometry = new THREE.TubeGeometry(curve, 32, radius, 8, false)
  const tube = new THREE.Mesh(tubeGeometry, material)
  cableGroup.add(tube)

  return cableGroup
}

export function buildConnectors(): THREE.Group {
  const connectorsGroup = new THREE.Group()
  connectorsGroup.name = 'connectors'

  const metalMaterial = materialManager.getMetalMaterial()
  const goldMaterial = materialManager.getGoldMaterial()

  const connectorPositions = [
    { pos: [-1.0, 0.3, 0], rot: [0, 0, 0] },
    { pos: [1.0, 0.3, 0], rot: [0, Math.PI, 0] },
    { pos: [0, 0.9, 0], rot: [0, 0, 0] },
    { pos: [0.3, 0.3, 0.4], rot: [0, 0, 0] },
    { pos: [-0.3, 0.3, 0.4], rot: [0, 0, 0] },
  ]

  connectorPositions.forEach(({ pos, rot }, i) => {
    const connector = buildSingleConnector(metalMaterial, goldMaterial)
    connector.position.set(pos[0], pos[1], pos[2])
    connector.rotation.set(rot[0], rot[1], rot[2])
    connector.name = `connector_${i}`
    connector.userData.partId = 'connector'
    connectorsGroup.add(connector)
  })

  return connectorsGroup
}

function buildSingleConnector(metalMaterial: THREE.MeshStandardMaterial, goldMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const connectorGroup = new THREE.Group()

  const bodyGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.1)
  const body = new THREE.Mesh(bodyGeometry, metalMaterial)
  connectorGroup.add(body)

  const pinGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const pin = new THREE.Mesh(pinGeometry, goldMaterial)
      pin.position.set(-0.02 + i * 0.02, -0.01 + j * 0.02, 0.07)
      connectorGroup.add(pin)
    }
  }

  return connectorGroup
}
