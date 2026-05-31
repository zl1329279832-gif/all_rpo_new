import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildMainBody(): THREE.Group {
  const mainBody = new THREE.Group()
  mainBody.name = 'main_body'

  const bodyMaterial = materialManager.getCarbonFiberMaterial()
  const metalMaterial = materialManager.getMetalMaterial()
  const goldMaterial = materialManager.getGoldMaterial()

  const bodyGeometry = new THREE.BoxGeometry(2, 1.5, 2)
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
  bodyMesh.name = 'body_hull'
  bodyMesh.userData.partId = 'main_body'
  mainBody.add(bodyMesh)

  const panelGeometry = new THREE.BoxGeometry(2.02, 0.02, 2.02)
  
  const topPanel = new THREE.Mesh(panelGeometry, metalMaterial)
  topPanel.position.set(0, 0.76, 0)
  topPanel.name = 'top_panel'
  topPanel.userData.partId = 'top_panel'
  mainBody.add(topPanel)

  const bottomPanel = new THREE.Mesh(panelGeometry, metalMaterial)
  bottomPanel.position.set(0, -0.76, 0)
  bottomPanel.name = 'bottom_panel'
  bottomPanel.userData.partId = 'bottom_panel'
  mainBody.add(bottomPanel)

  const boltGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8)
  const boltMaterial = materialManager.getMetalMaterial({ color: 0x444444 })
  
  const boltPositions = [
    [0.8, 0.78, 0.8], [-0.8, 0.78, 0.8],
    [0.8, 0.78, -0.8], [-0.8, 0.78, -0.8],
    [0.4, 0.78, 0.8], [-0.4, 0.78, 0.8],
    [0.4, 0.78, -0.8], [-0.4, 0.78, -0.8],
    [0.8, 0.78, 0.4], [-0.8, 0.78, 0.4],
    [0.8, 0.78, -0.4], [-0.8, 0.78, -0.4],
  ]

  boltPositions.forEach((pos, i) => {
    const bolt = new THREE.Mesh(boltGeometry, boltMaterial)
    bolt.position.set(pos[0], pos[1], pos[2])
    bolt.name = `bolt_top_${i}`
    bolt.userData.partId = 'bolts'
    mainBody.add(bolt)
  })

  const interfaceGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4)
  const interfaceMaterial = materialManager.getMetalMaterial({ color: 0x666666 })
  
  const frontInterface = new THREE.Mesh(interfaceGeometry, interfaceMaterial)
  frontInterface.position.set(0, 0, 1.02)
  frontInterface.name = 'front_interface'
  frontInterface.userData.partId = 'interfaces'
  mainBody.add(frontInterface)

  const rearInterface = new THREE.Mesh(interfaceGeometry, interfaceMaterial)
  rearInterface.position.set(0, 0, -1.02)
  rearInterface.name = 'rear_interface'
  rearInterface.userData.partId = 'interfaces'
  mainBody.add(rearInterface)

  const portGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12)
  const portMaterial = materialManager.getGoldMaterial()
  
  const portPositions = [
    [0.15, 0, 1.08], [-0.15, 0, 1.08],
    [0, 0.1, 1.08], [0, -0.1, 1.08],
  ]

  portPositions.forEach((pos, i) => {
    const port = new THREE.Mesh(portGeometry, portMaterial)
    port.position.set(pos[0], pos[1], pos[2])
    port.rotation.x = Math.PI / 2
    port.name = `data_port_${i}`
    port.userData.partId = 'data_ports'
    mainBody.add(port)
  })

  const radiatorGeometry = new THREE.BoxGeometry(1.8, 0.8, 0.05)
  const radiatorMaterial = materialManager.getWhiteMaterial()
  
  const leftRadiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial)
  leftRadiator.position.set(-1.03, 0, 0)
  leftRadiator.rotation.y = Math.PI / 2
  leftRadiator.name = 'left_radiator'
  leftRadiator.userData.partId = 'radiator'
  mainBody.add(leftRadiator)

  const rightRadiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial)
  rightRadiator.position.set(1.03, 0, 0)
  rightRadiator.rotation.y = Math.PI / 2
  rightRadiator.name = 'right_radiator'
  rightRadiator.userData.partId = 'radiator'
  mainBody.add(rightRadiator)

  const finGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.08)
  for (let i = 0; i < 6; i++) {
    const leftFin = new THREE.Mesh(finGeometry, metalMaterial)
    leftFin.position.set(-1.06, -0.3 + i * 0.12, 0)
    mainBody.add(leftFin)

    const rightFin = new THREE.Mesh(finGeometry, metalMaterial)
    rightFin.position.set(1.06, -0.3 + i * 0.12, 0)
    mainBody.add(rightFin)
  }

  const stripeGeometry = new THREE.BoxGeometry(2.04, 0.08, 2.04)
  const stripeMaterial = materialManager.getRedMaterial()
  
  const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial)
  stripe1.position.set(0, 0.5, 0)
  stripe1.scale.set(1, 0.1, 1)
  mainBody.add(stripe1)

  const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial)
  stripe2.position.set(0, -0.5, 0)
  stripe2.scale.set(1, 0.1, 1)
  mainBody.add(stripe2)

  const sensorWindowGeometry = new THREE.CircleGeometry(0.15, 32)
  const sensorWindowMaterial = materialManager.getGlassMaterial()
  
  const topSensorWindow = new THREE.Mesh(sensorWindowGeometry, sensorWindowMaterial)
  topSensorWindow.position.set(0, 0.77, 0)
  topSensorWindow.rotation.x = -Math.PI / 2
  topSensorWindow.name = 'top_sensor_window'
  topSensorWindow.userData.partId = 'sensor_window'
  mainBody.add(topSensorWindow)

  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 256
  labelCanvas.height = 64
  const ctx = labelCanvas.getContext('2d')!
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#00d4ff'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('SAT-X7', 128, 42)
  
  const labelTexture = new THREE.CanvasTexture(labelCanvas)
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
  })
  
  const labelGeometry = new THREE.PlaneGeometry(0.8, 0.2)
  const label = new THREE.Mesh(labelGeometry, labelMaterial)
  label.position.set(0, 0.2, 1.01)
  mainBody.add(label)

  return mainBody
}
