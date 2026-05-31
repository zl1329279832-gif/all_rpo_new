import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildSensors(): THREE.Group {
  const sensorsGroup = new THREE.Group()
  sensorsGroup.name = 'sensors'

  const starTracker = buildStarTracker()
  starTracker.position.set(0, 0.8, -0.5)
  starTracker.name = 'star_tracker'
  starTracker.userData.partId = 'star_tracker'
  sensorsGroup.add(starTracker)

  const sunSensor1 = buildSunSensor()
  sunSensor1.position.set(0.7, 0.8, 0.7)
  sunSensor1.rotation.y = -Math.PI / 4
  sunSensor1.name = 'sun_sensor_1'
  sunSensor1.userData.partId = 'sun_sensor'
  sensorsGroup.add(sunSensor1)

  const sunSensor2 = buildSunSensor()
  sunSensor2.position.set(-0.7, 0.8, 0.7)
  sunSensor2.rotation.y = Math.PI / 4
  sunSensor2.name = 'sun_sensor_2'
  sunSensor2.userData.partId = 'sun_sensor'
  sensorsGroup.add(sunSensor2)

  const imu = buildIMU()
  imu.position.set(0.5, 0, 0.8)
  imu.name = 'imu'
  imu.userData.partId = 'imu'
  sensorsGroup.add(imu)

  const gpsAntenna = buildGPSAntenna()
  gpsAntenna.position.set(-0.5, 0.85, 0.5)
  gpsAntenna.name = 'gps_antenna'
  gpsAntenna.userData.partId = 'gps_antenna'
  sensorsGroup.add(gpsAntenna)

  return sensorsGroup
}

function buildStarTracker(): THREE.Group {
  const trackerGroup = new THREE.Group()

  const metalMaterial = materialManager.getMetalMaterial()

  const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 16)
  const body = new THREE.Mesh(bodyGeometry, metalMaterial)
  trackerGroup.add(body)

  const lensGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.1, 16)
  const lensMaterial = materialManager.getGlassMaterial()
  const lens = new THREE.Mesh(lensGeometry, lensMaterial)
  lens.position.y = 0.15
  trackerGroup.add(lens)

  const baffleGeometry = new THREE.CylinderGeometry(0.11, 0.08, 0.15, 16, 1, true)
  const baffleMaterial = materialManager.getMetalMaterial({ color: 0x222222 })
  const baffle = new THREE.Mesh(baffleGeometry, baffleMaterial)
  baffle.position.y = 0.2
  trackerGroup.add(baffle)

  return trackerGroup
}

function buildSunSensor(): THREE.Group {
  const sensorGroup = new THREE.Group()

  const metalMaterial = materialManager.getMetalMaterial()

  const baseGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.12)
  const base = new THREE.Mesh(baseGeometry, metalMaterial)
  sensorGroup.add(base)

  const cellGeometry = new THREE.CircleGeometry(0.04, 16)
  const cellMaterial = materialManager.getSolarCellMaterial()
  const cell = new THREE.Mesh(cellGeometry, cellMaterial)
  cell.position.y = 0.03
  cell.rotation.x = -Math.PI / 2
  sensorGroup.add(cell)

  const cell2 = new THREE.Mesh(cellGeometry, cellMaterial)
  cell2.position.set(0.03, 0.03, 0)
  cell2.rotation.x = -Math.PI / 2
  sensorGroup.add(cell2)

  const cell3 = new THREE.Mesh(cellGeometry, cellMaterial)
  cell3.position.set(-0.03, 0.03, 0)
  cell3.rotation.x = -Math.PI / 2
  sensorGroup.add(cell3)

  const cell4 = new THREE.Mesh(cellGeometry, cellMaterial)
  cell4.position.set(0, 0.03, 0.03)
  cell4.rotation.x = -Math.PI / 2
  sensorGroup.add(cell4)

  const cell5 = new THREE.Mesh(cellGeometry, cellMaterial)
  cell5.position.set(0, 0.03, -0.03)
  cell5.rotation.x = -Math.PI / 2
  sensorGroup.add(cell5)

  return sensorGroup
}

function buildIMU(): THREE.Group {
  const imuGroup = new THREE.Group()

  const metalMaterial = materialManager.getMetalMaterial({ color: 0x444444 })

  const bodyGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.15)
  const body = new THREE.Mesh(bodyGeometry, metalMaterial)
  imuGroup.add(body)

  const connectorGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.04)
  const connectorMaterial = materialManager.getMetalMaterial({ color: 0x666666 })
  const connector = new THREE.Mesh(connectorGeometry, connectorMaterial)
  connector.position.set(0, 0.05, 0.08)
  imuGroup.add(connector)

  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 128
  labelCanvas.height = 64
  const ctx = labelCanvas.getContext('2d')!
  ctx.fillStyle = '#333333'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('IMU', 64, 40)

  const labelTexture = new THREE.CanvasTexture(labelCanvas)
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
  })

  const labelGeometry = new THREE.PlaneGeometry(0.12, 0.06)
  const label = new THREE.Mesh(labelGeometry, labelMaterial)
  label.position.set(0, 0.051, 0)
  label.rotation.x = -Math.PI / 2
  imuGroup.add(label)

  return imuGroup
}

function buildGPSAntenna(): THREE.Group {
  const antennaGroup = new THREE.Group()

  const metalMaterial = materialManager.getMetalMaterial()

  const baseGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12)
  const base = new THREE.Mesh(baseGeometry, metalMaterial)
  antennaGroup.add(base)

  const radomeGeometry = new THREE.SphereGeometry(0.06, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const radomeMaterial = materialManager.getWhiteMaterial()
  const radome = new THREE.Mesh(radomeGeometry, radomeMaterial)
  radome.position.y = 0.06
  antennaGroup.add(radome)

  return antennaGroup
}
