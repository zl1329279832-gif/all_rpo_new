import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export interface SolarPanelData {
  group: THREE.Group
  leftPanels: THREE.Group
  rightPanels: THREE.Group
  leftYoke: THREE.Group
  rightYoke: THREE.Group
}

export function buildSolarPanels(): SolarPanelData {
  const solarPanelsGroup = new THREE.Group()
  solarPanelsGroup.name = 'solar_panels'

  const metalMaterial = materialManager.getMetalMaterial()
  const solarCellMaterial = materialManager.getSolarCellMaterial()
  const copperMaterial = materialManager.getCopperMaterial()

  const leftYoke = buildYoke('left', metalMaterial, copperMaterial)
  leftYoke.position.set(-1.2, 0, 0)
  leftYoke.rotation.z = 0
  solarPanelsGroup.add(leftYoke)

  const rightYoke = buildYoke('right', metalMaterial, copperMaterial)
  rightYoke.position.set(1.2, 0, 0)
  rightYoke.rotation.z = 0
  solarPanelsGroup.add(rightYoke)

  const leftPanels = buildPanelArray('left', solarCellMaterial, metalMaterial)
  leftPanels.position.set(-0.5, 0, 0)
  leftYoke.add(leftPanels)

  const rightPanels = buildPanelArray('right', solarCellMaterial, metalMaterial)
  rightPanels.position.set(0.5, 0, 0)
  rightYoke.add(rightPanels)

  return {
    group: solarPanelsGroup,
    leftPanels,
    rightPanels,
    leftYoke,
    rightYoke,
  }
}

function buildYoke(side: string, metalMaterial: THREE.MeshStandardMaterial, copperMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const yokeGroup = new THREE.Group()
  yokeGroup.name = `yoke_${side}`

  const yokeArmGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.4)
  const yokeArm = new THREE.Mesh(yokeArmGeometry, metalMaterial)
  yokeArm.name = `yoke_arm_${side}`
  yokeArm.userData.partId = 'solar_yoke'
  yokeGroup.add(yokeArm)

  const hingeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16)
  const hinge = new THREE.Mesh(hingeGeometry, copperMaterial)
  hinge.rotation.z = Math.PI / 2
  hinge.position.set(side === 'left' ? -0.35 : 0.35, 0, 0)
  hinge.name = `hinge_${side}`
  hinge.userData.partId = 'solar_hinge'
  yokeGroup.add(hinge)

  const motorGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16)
  const motorMaterial = materialManager.getMetalMaterial({ color: 0x333333 })
  const motor = new THREE.Mesh(motorGeometry, motorMaterial)
  motor.rotation.z = Math.PI / 2
  motor.position.set(side === 'left' ? 0.3 : -0.3, 0, 0)
  motor.name = `drive_motor_${side}`
  motor.userData.partId = 'solar_drive'
  yokeGroup.add(motor)

  return yokeGroup
}

function buildPanelArray(side: string, solarCellMaterial: THREE.MeshStandardMaterial, metalMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const panelArray = new THREE.Group()
  panelArray.name = `panel_array_${side}`

  const panelWidth = 1.2
  const panelHeight = 2.5
  const panelSpacing = 0.05

  for (let i = 0; i < 3; i++) {
    const panel = buildSinglePanel(panelWidth, panelHeight, solarCellMaterial, metalMaterial)
    panel.position.set((side === 'left' ? -1 : 1) * (i * (panelWidth + panelSpacing) + panelWidth / 2), 0, 0)
    panel.name = `panel_${side}_${i}`
    panel.userData.partId = 'solar_panel'
    panelArray.add(panel)
  }

  const backboneGeometry = new THREE.BoxGeometry(3.8, 0.08, 0.1)
  const backbone = new THREE.Mesh(backboneGeometry, metalMaterial)
  backbone.position.set((side === 'left' ? -1 : 1) * 1.85, 0, 0)
  backbone.name = `backbone_${side}`
  backbone.userData.partId = 'panel_backbone'
  panelArray.add(backbone)

  const cableGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3.6, 8)
  const cableMaterial = materialManager.getMetalMaterial({ color: 0xffd700 })
  const cable = new THREE.Mesh(cableGeometry, cableMaterial)
  cable.rotation.z = Math.PI / 2
  cable.position.set((side === 'left' ? -1 : 1) * 1.8, 0, 0.12)
  panelArray.add(cable)

  return panelArray
}

function buildSinglePanel(width: number, height: number, solarCellMaterial: THREE.MeshStandardMaterial, metalMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const panelGroup = new THREE.Group()

  const frameGeometry = new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.04)
  const frame = new THREE.Mesh(frameGeometry, metalMaterial)
  panelGroup.add(frame)

  const cellGeometry = new THREE.BoxGeometry(width, height, 0.02)
  const cells = new THREE.Mesh(cellGeometry, solarCellMaterial)
  cells.position.z = 0.02
  panelGroup.add(cells)

  const gridGeometry = new THREE.BoxGeometry(width + 0.02, height + 0.02, 0.01)
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x4444ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  })
  const grid = new THREE.Mesh(gridGeometry, gridMaterial)
  grid.position.z = 0.04
  panelGroup.add(grid)

  const connectorGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.06)
  const connectorMaterial = materialManager.getMetalMaterial({ color: 0x666666 })
  
  const connectorPositions = [
    [-width / 2, 0, 0],
    [width / 2, 0, 0],
  ]

  connectorPositions.forEach((pos) => {
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial)
    connector.position.set(pos[0], pos[1], pos[2])
    panelGroup.add(connector)
  })

  return panelGroup
}

export function getInitialDeployedState(): { leftAngle: number; rightAngle: number; leftPanelAngle: number; rightPanelAngle: number } {
  return {
    leftAngle: 0,
    rightAngle: 0,
    leftPanelAngle: 0,
    rightPanelAngle: 0,
  }
}

export function getFullyDeployedState(): { leftAngle: number; rightAngle: number; leftPanelAngle: number; rightPanelAngle: number } {
  return {
    leftAngle: -Math.PI / 2,
    rightAngle: Math.PI / 2,
    leftPanelAngle: 0,
    rightPanelAngle: 0,
  }
}
