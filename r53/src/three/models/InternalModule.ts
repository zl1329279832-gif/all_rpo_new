import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildInternalModules(): THREE.Group {
  const modulesGroup = new THREE.Group()
  modulesGroup.name = 'internal_modules'

  const mainBoard = buildMainCircuitBoard()
  mainBoard.position.set(0, 0.2, 0)
  modulesGroup.add(mainBoard)

  const batteryModule = buildBatteryModule()
  batteryModule.position.set(0, -0.2, 0)
  modulesGroup.add(batteryModule)

  const computerModule = buildOnboardComputer()
  computerModule.position.set(0.4, 0.2, 0.3)
  modulesGroup.add(computerModule)

  const powerModule = buildPowerControlModule()
  powerModule.position.set(-0.4, 0.2, 0.3)
  modulesGroup.add(powerModule)

  const memoryModules = buildMemoryModules()
  modulesGroup.add(memoryModules)

  return modulesGroup
}

function buildMainCircuitBoard(): THREE.Group {
  const boardGroup = new THREE.Group()
  boardGroup.name = 'main_board'

  const pcbMaterial = materialManager.getMetalMaterial({ color: 0x006600, metalness: 0.1, roughness: 0.8 })

  const boardGeometry = new THREE.BoxGeometry(1.6, 0.03, 1.6)
  const board = new THREE.Mesh(boardGeometry, pcbMaterial)
  board.userData.partId = 'main_board'
  boardGroup.add(board)

  const traceMaterial = materialManager.getMetalMaterial({ color: 0xccaa00, metalness: 0.9, roughness: 0.2 })
  const traceGeometry = new THREE.BoxGeometry(0.005, 0.002, 1.5)

  for (let i = 0; i < 20; i++) {
    const trace = new THREE.Mesh(traceGeometry, traceMaterial)
    trace.position.set(-0.7 + i * 0.08, 0.017, 0)
    boardGroup.add(trace)
  }

  const chipGeometry = new THREE.BoxGeometry(0.1, 0.04, 0.1)
  const chipMaterial = materialManager.getMetalMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.5 })

  const chipPositions = [
    [-0.5, 0], [-0.2, 0.3], [0.2, -0.3], [0.5, 0.1],
    [-0.3, -0.4], [0.4, 0.4], [0, -0.2], [-0.1, 0.2],
  ]

  chipPositions.forEach((pos, i) => {
    const chip = new THREE.Mesh(chipGeometry, chipMaterial)
    chip.position.set(pos[0], 0.04, pos[1])
    chip.name = `chip_${i}`
    chip.userData.partId = 'circuit_chip'
    boardGroup.add(chip)
  })

  const capacitorGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8)
  const capacitorMaterial = materialManager.getMetalMaterial({ color: 0x8b4513, metalness: 0.2, roughness: 0.6 })

  for (let i = 0; i < 15; i++) {
    const capacitor = new THREE.Mesh(capacitorGeometry, capacitorMaterial)
    capacitor.position.set(
      -0.6 + Math.random() * 1.2,
      0.04,
      -0.6 + Math.random() * 1.2
    )
    capacitor.rotation.x = Math.PI / 2
    boardGroup.add(capacitor)
  }

  return boardGroup
}

function buildBatteryModule(): THREE.Group {
  const batteryGroup = new THREE.Group()
  batteryGroup.name = 'battery_module'

  const metalMaterial = materialManager.getMetalMaterial({ color: 0x444444 })
  const cellMaterial = materialManager.getMetalMaterial({ color: 0x333366, metalness: 0.5, roughness: 0.3 })

  const casingGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.8)
  const casing = new THREE.Mesh(casingGeometry, metalMaterial)
  casing.userData.partId = 'battery_casing'
  batteryGroup.add(casing)

  const cellGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.7)
  for (let i = 0; i < 6; i++) {
    const cell = new THREE.Mesh(cellGeometry, cellMaterial)
    cell.position.set(-0.45 + i * 0.18, 0, 0)
    cell.name = `battery_cell_${i}`
    cell.userData.partId = 'battery_cell'
    batteryGroup.add(cell)
  }

  const bmsGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3)
  const bmsMaterial = materialManager.getMetalMaterial({ color: 0x006600, metalness: 0.1, roughness: 0.8 })
  const bms = new THREE.Mesh(bmsGeometry, bmsMaterial)
  bms.position.set(0.55, 0, 0)
  bms.name = 'bms_board'
  bms.userData.partId = 'bms'
  batteryGroup.add(bms)

  const terminalGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8)
  const terminalMaterial = materialManager.getMetalMaterial({ color: 0xffd700 })
  
  const positiveTerminal = new THREE.Mesh(terminalGeometry, terminalMaterial)
  positiveTerminal.position.set(-0.5, 0.15, 0.25)
  batteryGroup.add(positiveTerminal)

  const negativeTerminal = new THREE.Mesh(terminalGeometry, terminalMaterial)
  negativeTerminal.position.set(-0.5, 0.15, -0.25)
  batteryGroup.add(negativeTerminal)

  return batteryGroup
}

function buildOnboardComputer(): THREE.Group {
  const computerGroup = new THREE.Group()
  computerGroup.name = 'onboard_computer'

  const metalMaterial = materialManager.getMetalMaterial()
  const pcbMaterial = materialManager.getMetalMaterial({ color: 0x006600, metalness: 0.1, roughness: 0.8 })

  const casingGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.25)
  const casing = new THREE.Mesh(casingGeometry, metalMaterial)
  computerGroup.add(casing)

  const cpuGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.12)
  const cpuMaterial = materialManager.getMetalMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.5 })
  const cpu = new THREE.Mesh(cpuGeometry, cpuMaterial)
  cpu.position.set(0, 0.06, 0)
  cpu.name = 'main_cpu'
  cpu.userData.partId = 'cpu'
  computerGroup.add(cpu)

  const heatSinkGeometry = new THREE.BoxGeometry(0.14, 0.08, 0.14)
  const heatSinkMaterial = materialManager.getMetalMaterial({ color: 0x888888 })
  const heatSink = new THREE.Mesh(heatSinkGeometry, heatSinkMaterial)
  heatSink.position.set(0, 0.1, 0)
  computerGroup.add(heatSink)

  return computerGroup
}

function buildPowerControlModule(): THREE.Group {
  const pcmGroup = new THREE.Group()
  pcmGroup.name = 'power_control_module'

  const metalMaterial = materialManager.getMetalMaterial()

  const casingGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.25)
  const casing = new THREE.Mesh(casingGeometry, metalMaterial)
  pcmGroup.add(casing)

  const relayGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08)
  const relayMaterial = materialManager.getMetalMaterial({ color: 0x333333 })
  
  for (let i = 0; i < 4; i++) {
    const relay = new THREE.Mesh(relayGeometry, relayMaterial)
    relay.position.set(-0.1 + (i % 2) * 0.12, 0.06, -0.06 + Math.floor(i / 2) * 0.12)
    pcmGroup.add(relay)
  }

  const fuseGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6)
  const fuseMaterial = materialManager.getMetalMaterial({ color: 0xff0000 })
  
  for (let i = 0; i < 3; i++) {
    const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial)
    fuse.position.set(-0.08 + i * 0.08, 0.06, 0.1)
    fuse.rotation.z = Math.PI / 2
    pcmGroup.add(fuse)
  }

  return pcmGroup
}

function buildMemoryModules(): THREE.Group {
  const memoryGroup = new THREE.Group()
  memoryGroup.name = 'memory_modules'

  const moduleGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.15)
  const moduleMaterial = materialManager.getMetalMaterial({ color: 0x006600, metalness: 0.1, roughness: 0.8 })
  const chipMaterial = materialManager.getMetalMaterial({ color: 0x222222 })

  const positions = [
    [0.3, 0.22, -0.3],
    [0.4, 0.22, -0.3],
    [-0.3, 0.22, -0.3],
    [-0.4, 0.22, -0.3],
  ]

  positions.forEach((pos, i) => {
    const module = new THREE.Mesh(moduleGeometry, moduleMaterial)
    module.position.set(pos[0], pos[1], pos[2])
    module.name = `memory_module_${i}`
    module.userData.partId = 'memory_module'
    memoryGroup.add(module)

    for (let j = 0; j < 4; j++) {
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.015, 0.03),
        chipMaterial
      )
      chip.position.set(pos[0] - 0.02 + j * 0.015, pos[1] + 0.015, pos[2])
      memoryGroup.add(chip)
    }
  })

  return memoryGroup
}
