import * as THREE from 'three'
import { BaseComponents } from './BaseComponents'
import { MaterialLibrary } from '@/materials/MaterialLibrary'

export type BuildingLayer = 'foundation' | 'columns' | 'walls' | 'roof'

export class BuildingComponents {
  static createFoundation(
    width: number = 12,
    depth: number = 8,
    height: number = 1.2,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'foundation'
    group.userData.layer = 'foundation'

    const baseGeo = new THREE.BoxGeometry(width + 0.5, height * 0.7, depth + 0.5)
    const base = new THREE.Mesh(baseGeo, MaterialLibrary.stoneFoundation)
    base.position.y = height * 0.35
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)

    const terraceGeo = new THREE.BoxGeometry(width, height * 0.3, depth)
    const terrace = new THREE.Mesh(terraceGeo, MaterialLibrary.stoneStep)
    terrace.position.y = height * 0.85
    terrace.castShadow = true
    terrace.receiveShadow = true
    group.add(terrace)

    const edgeGeo = new THREE.BoxGeometry(width + 0.1, 0.08, depth + 0.1)
    const edge = new THREE.Mesh(edgeGeo, MaterialLibrary.darkPaint)
    edge.position.y = height - 0.04
    edge.castShadow = true
    group.add(edge)

    const cornerStoneGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6)
    const cornerPositions = [
      { x: -width / 2 + 0.3, z: -depth / 2 + 0.3 },
      { x: width / 2 - 0.3, z: -depth / 2 + 0.3 },
      { x: -width / 2 + 0.3, z: depth / 2 - 0.3 },
      { x: width / 2 - 0.3, z: depth / 2 - 0.3 }
    ]
    cornerPositions.forEach(pos => {
      const stone = new THREE.Mesh(cornerStoneGeo, MaterialLibrary.stoneStep)
      stone.position.set(pos.x, height + 0.2, pos.z)
      stone.castShadow = true
      group.add(stone)
    })

    group.position.copy(position)
    return group
  }

  static createMainHall(
    width: number = 10,
    depth: number = 6,
    columnHeight: number = 4,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'main-hall'

    const baseY = 1.0

    const foundation = this.createFoundation(width + 2, depth + 2, baseY)
    group.add(foundation)

    const columnsGroup = this.createColumnsStructure(width, depth, columnHeight, baseY)
    columnsGroup.userData.layer = 'columns'
    group.add(columnsGroup)

    const wallsGroup = this.createWalls(width, depth, columnHeight, baseY)
    wallsGroup.userData.layer = 'walls'
    group.add(wallsGroup)

    const floorGroup = this.createFloorStructure(width, depth, baseY + columnHeight)
    floorGroup.userData.layer = 'columns'
    group.add(floorGroup)

    const roofGroup = this.createMainRoof(width + 2, depth + 2, baseY + columnHeight)
    roofGroup.userData.layer = 'roof'
    group.add(roofGroup)

    const steps = BaseComponents.createStoneStep(3.5, 0.8, 0.22, 4, new THREE.Vector3(0, 0, depth / 2 + 1.5))
    steps.userData.layer = 'foundation'
    group.add(steps)

    const platformRailFront = BaseComponents.createRailing(width - 0.5, 1.0, new THREE.Vector3(0, 1.0, depth / 2 + 0.2))
    platformRailFront.userData.layer = 'foundation'
    group.add(platformRailFront)

    const platformRailLeft = BaseComponents.createRailing(depth, 1.0, new THREE.Vector3(-width / 2 - 0.15, 1.0, 0))
    platformRailLeft.rotation.y = Math.PI / 2
    platformRailLeft.userData.layer = 'foundation'
    group.add(platformRailLeft)

    const platformRailRight = BaseComponents.createRailing(depth, 1.0, new THREE.Vector3(width / 2 + 0.15, 1.0, 0))
    platformRailRight.rotation.y = -Math.PI / 2
    platformRailRight.userData.layer = 'foundation'
    group.add(platformRailRight)

    const lanternPositions = [
      { x: -width / 2 + 0.5, y: baseY + columnHeight - 0.5, z: depth / 2 - 0.3 },
      { x: width / 2 - 0.5, y: baseY + columnHeight - 0.5, z: depth / 2 - 0.3 }
    ]
    lanternPositions.forEach(pos => {
      const lantern = BaseComponents.createLantern(0.35, new THREE.Vector3(pos.x, pos.y, pos.z), false)
      lantern.userData.layer = 'columns'
      group.add(lantern)
    })

    group.position.copy(position)
    return group
  }

  private static createFloorStructure(
    width: number,
    depth: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()

    const floorGeo = new THREE.BoxGeometry(width - 0.2, 0.15, depth - 0.2)
    const floor = new THREE.Mesh(floorGeo, MaterialLibrary.darkWoodBeam)
    floor.position.y = baseY - 0.08
    floor.receiveShadow = true
    floor.castShadow = true
    group.add(floor)

    const joistCount = 4
    for (let i = 0; i < joistCount; i++) {
      const z = -depth / 2 + 0.5 + i * ((depth - 1) / (joistCount - 1))
      const joistGeo = new THREE.BoxGeometry(width - 0.3, 0.12, 0.18)
      const joist = new THREE.Mesh(joistGeo, MaterialLibrary.darkWoodBeam)
      joist.position.set(0, baseY - 0.22, z)
      joist.castShadow = true
      group.add(joist)
    }

    return group
  }

  private static createColumnsStructure(
    width: number,
    depth: number,
    columnHeight: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()

    const frontColumnCount = 5
    const sideColumnCount = 4

    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      const frontColumn = BaseComponents.createColumn(0.28, columnHeight, new THREE.Vector3(x, baseY, depth / 2))
      group.add(frontColumn)

      const backColumn = BaseComponents.createColumn(0.28, columnHeight, new THREE.Vector3(x, baseY, -depth / 2))
      group.add(backColumn)
    }

    for (let i = 1; i < sideColumnCount - 1; i++) {
      const z = -depth / 2 + i * (depth / (sideColumnCount - 1))
      const leftColumn = BaseComponents.createColumn(0.28, columnHeight, new THREE.Vector3(-width / 2, baseY, z))
      group.add(leftColumn)

      const rightColumn = BaseComponents.createColumn(0.28, columnHeight, new THREE.Vector3(width / 2, baseY, z))
      group.add(rightColumn)
    }

    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      const frontDougong = BaseComponents.createDougong(0.7, new THREE.Vector3(x, baseY + columnHeight, depth / 2))
      group.add(frontDougong)

      const backDougong = BaseComponents.createDougong(0.7, new THREE.Vector3(x, baseY + columnHeight, -depth / 2))
      group.add(backDougong)
    }

    const frontTopBeam = BaseComponents.createBeam(0.35, 0.4, width, new THREE.Vector3(0, baseY + columnHeight + 0.6, depth / 2))
    group.add(frontTopBeam)

    const backTopBeam = BaseComponents.createBeam(0.35, 0.4, width, new THREE.Vector3(0, baseY + columnHeight + 0.6, -depth / 2))
    group.add(backTopBeam)

    const leftTopBeam = BaseComponents.createBeam(0.35, 0.4, depth, new THREE.Vector3(-width / 2, baseY + columnHeight + 0.6, 0))
    leftTopBeam.rotation.y = Math.PI / 2
    group.add(leftTopBeam)

    const rightTopBeam = BaseComponents.createBeam(0.35, 0.4, depth, new THREE.Vector3(width / 2, baseY + columnHeight + 0.6, 0))
    rightTopBeam.rotation.y = -Math.PI / 2
    group.add(rightTopBeam)

    const frontLintelGeo = new THREE.BoxGeometry(width, 0.35, 0.25)
    const frontLintel = new THREE.Mesh(frontLintelGeo, MaterialLibrary.redWoodColumn)
    frontLintel.position.set(0, baseY + columnHeight * 0.6, depth / 2 + 0.05)
    frontLintel.castShadow = true
    group.add(frontLintel)

    const backLintelGeo = new THREE.BoxGeometry(width, 0.35, 0.25)
    const backLintel = new THREE.Mesh(backLintelGeo, MaterialLibrary.redWoodColumn)
    backLintel.position.set(0, baseY + columnHeight * 0.6, -depth / 2 - 0.05)
    backLintel.castShadow = true
    group.add(backLintel)

    for (let i = 1; i < frontColumnCount - 1; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      const frontQueti = this.createQueti(0.25, 0.35, new THREE.Vector3(x, baseY + columnHeight * 0.3, depth / 2 + 0.15))
      group.add(frontQueti)

      const backQueti = this.createQueti(0.25, 0.35, new THREE.Vector3(x, baseY + columnHeight * 0.3, -depth / 2 - 0.15))
      backQueti.rotation.y = Math.PI
      group.add(backQueti)
    }

    const secondaryBeamCount = frontColumnCount - 1
    for (let i = 0; i < secondaryBeamCount; i++) {
      const x = -width / 2 + (i + 0.5) * (width / (frontColumnCount - 1))
      const secondaryBeam = BaseComponents.createBeam(0.25, 0.3, depth, new THREE.Vector3(x, baseY + columnHeight + 0.35, 0))
      secondaryBeam.rotation.y = Math.PI / 2
      group.add(secondaryBeam)
    }

    return group
  }

  private static createQueti(
    width: number,
    height: number,
    position: THREE.Vector3
  ): THREE.Group {
    const group = new THREE.Group()

    const bodyGeo = new THREE.BoxGeometry(width * 0.6, height, width * 0.4)
    const body = new THREE.Mesh(bodyGeo, MaterialLibrary.darkWoodBeam)
    body.castShadow = true
    group.add(body)

    const armGeo = new THREE.BoxGeometry(width, 0.08, width * 0.3)
    const arm = new THREE.Mesh(armGeo, MaterialLibrary.darkWoodBeam)
    arm.position.set(0, height * 0.3, 0)
    arm.castShadow = true
    group.add(arm)

    const tipGeo = new THREE.ConeGeometry(width * 0.15, width * 0.3, 6)
    const tip = new THREE.Mesh(tipGeo, MaterialLibrary.goldDecorative)
    tip.position.set(0, height * 0.6, 0)
    tip.castShadow = true
    group.add(tip)

    group.position.copy(position)
    return group
  }

  private static createWalls(
    width: number,
    depth: number,
    columnHeight: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()

    const wallHeight = columnHeight - 0.4
    const wallThickness = 0.35

    const frontWallLeftGeo = new THREE.BoxGeometry(width / 2 - 1.8, wallHeight, wallThickness)
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, MaterialLibrary.brickWall)
    frontWallLeft.position.set(-width / 4 - 0.9, baseY + wallHeight / 2 + 0.2, depth / 2 + wallThickness / 2 - 0.05)
    frontWallLeft.castShadow = true
    frontWallLeft.receiveShadow = true
    group.add(frontWallLeft)

    const frontWallRightGeo = new THREE.BoxGeometry(width / 2 - 1.8, wallHeight, wallThickness)
    const frontWallRight = new THREE.Mesh(frontWallRightGeo, MaterialLibrary.brickWall)
    frontWallRight.position.set(width / 4 + 0.9, baseY + wallHeight / 2 + 0.2, depth / 2 + wallThickness / 2 - 0.05)
    frontWallRight.castShadow = true
    frontWallRight.receiveShadow = true
    group.add(frontWallRight)

    const backWallGeo = new THREE.BoxGeometry(width, wallHeight, wallThickness)
    const backWall = new THREE.Mesh(backWallGeo, MaterialLibrary.brickWall)
    backWall.position.set(0, baseY + wallHeight / 2 + 0.2, -depth / 2 - wallThickness / 2 + 0.05)
    backWall.castShadow = true
    backWall.receiveShadow = true
    group.add(backWall)

    const backWindowPositions = [
      { x: -2, y: baseY + wallHeight / 2 + 0.3 },
      { x: 2, y: baseY + wallHeight / 2 + 0.3 }
    ]
    backWindowPositions.forEach(pos => {
      const window = BaseComponents.createWindow(1.4, 1.6, new THREE.Vector3(pos.x, pos.y, -depth / 2 - wallThickness / 2 + 0.15))
      window.rotation.y = Math.PI
      group.add(window)
    })

    const leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, depth)
    const leftWall = new THREE.Mesh(leftWallGeo, MaterialLibrary.brickWall)
    leftWall.position.set(-width / 2 - wallThickness / 2 + 0.05, baseY + wallHeight / 2 + 0.2, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    group.add(leftWall)

    const rightWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, depth)
    const rightWall = new THREE.Mesh(rightWallGeo, MaterialLibrary.brickWall)
    rightWall.position.set(width / 2 + wallThickness / 2 - 0.05, baseY + wallHeight / 2 + 0.2, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    group.add(rightWall)

    const sideWindowPositions = [
      { z: -1.5, rot: Math.PI / 2 },
      { z: 1.5, rot: -Math.PI / 2 }
    ]
    sideWindowPositions.forEach(swp => {
      const leftWindow = BaseComponents.createWindow(1.4, 1.6, new THREE.Vector3(-width / 2 - wallThickness / 2 + 0.15, baseY + wallHeight / 2 + 0.3, swp.z))
      leftWindow.rotation.y = swp.rot
      group.add(leftWindow)

      const rightWindow = BaseComponents.createWindow(1.4, 1.6, new THREE.Vector3(width / 2 + wallThickness / 2 - 0.15, baseY + wallHeight / 2 + 0.3, swp.z))
      rightWindow.rotation.y = -swp.rot
      group.add(rightWindow)
    })

    const door = BaseComponents.createDoor(2.2, 3.2, new THREE.Vector3(0, baseY + 1.8, depth / 2 + wallThickness / 2 - 0.05))
    group.add(door)

    const doorLeftWindow = BaseComponents.createWindow(1.2, 2.0, new THREE.Vector3(-2.5, baseY + 1.6, depth / 2 + wallThickness / 2 - 0.05))
    group.add(doorLeftWindow)

    const doorRightWindow = BaseComponents.createWindow(1.2, 2.0, new THREE.Vector3(2.5, baseY + 1.6, depth / 2 + wallThickness / 2 - 0.05))
    group.add(doorRightWindow)

    const gableLeftGeo = new THREE.BoxGeometry(0.2, 1.8, depth + 1)
    const gableLeft = new THREE.Mesh(gableLeftGeo, MaterialLibrary.brickWall)
    gableLeft.position.set(-width / 2 - 0.3, baseY + columnHeight + 1.2, 0)
    gableLeft.castShadow = true
    group.add(gableLeft)

    const gableRightGeo = new THREE.BoxGeometry(0.2, 1.8, depth + 1)
    const gableRight = new THREE.Mesh(gableRightGeo, MaterialLibrary.brickWall)
    gableRight.position.set(width / 2 + 0.3, baseY + columnHeight + 1.2, 0)
    gableRight.castShadow = true
    group.add(gableRight)

    return group
  }

  private static createMainRoof(
    width: number,
    depth: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'roof-main'

    const ridgeHeight = 2.2
    const eaveOverhang = 1.5

    const roofThickness = 0.25

    const frontSlopeGeo = new THREE.PlaneGeometry(width + eaveOverhang * 2, Math.sqrt(Math.pow(depth / 2 + eaveOverhang, 2) + Math.pow(ridgeHeight, 2)))
    const frontSlope = new THREE.Mesh(frontSlopeGeo, MaterialLibrary.greyTileRoof)
    frontSlope.rotation.x = -Math.atan2(ridgeHeight, depth / 2 + eaveOverhang)
    frontSlope.position.set(0, baseY + 1.2 + ridgeHeight / 2, depth / 4)
    frontSlope.castShadow = true
    frontSlope.receiveShadow = true
    group.add(frontSlope)

    const backSlopeGeo = new THREE.PlaneGeometry(width + eaveOverhang * 2, Math.sqrt(Math.pow(depth / 2 + eaveOverhang, 2) + Math.pow(ridgeHeight, 2)))
    const backSlope = new THREE.Mesh(backSlopeGeo, MaterialLibrary.greyTileRoof)
    backSlope.rotation.x = Math.PI + Math.atan2(ridgeHeight, depth / 2 + eaveOverhang)
    backSlope.position.set(0, baseY + 1.2 + ridgeHeight / 2, -depth / 4)
    backSlope.castShadow = true
    backSlope.receiveShadow = true
    group.add(backSlope)

    const leftSlopeGeo = new THREE.PlaneGeometry(depth + eaveOverhang * 2, Math.sqrt(Math.pow(width / 4, 2) + Math.pow(ridgeHeight, 2)))
    const leftSlope = new THREE.Mesh(leftSlopeGeo, MaterialLibrary.greyTileRoof)
    leftSlope.rotation.y = -Math.PI / 2
    leftSlope.rotation.x = -Math.atan2(ridgeHeight, width / 4)
    leftSlope.position.set(-width / 4 - eaveOverhang / 2, baseY + 1.2 + ridgeHeight / 2, 0)
    leftSlope.castShadow = true
    leftSlope.receiveShadow = true
    group.add(leftSlope)

    const rightSlopeGeo = new THREE.PlaneGeometry(depth + eaveOverhang * 2, Math.sqrt(Math.pow(width / 4, 2) + Math.pow(ridgeHeight, 2)))
    const rightSlope = new THREE.Mesh(rightSlopeGeo, MaterialLibrary.greyTileRoof)
    rightSlope.rotation.y = Math.PI / 2
    rightSlope.rotation.x = -Math.atan2(ridgeHeight, width / 4)
    rightSlope.position.set(width / 4 + eaveOverhang / 2, baseY + 1.2 + ridgeHeight / 2, 0)
    rightSlope.castShadow = true
    rightSlope.receiveShadow = true
    group.add(rightSlope)

    const purlinCount = 5
    for (let i = 0; i < purlinCount; i++) {
      const z = -depth / 2 - eaveOverhang * 0.5 + i * ((depth + eaveOverhang) / (purlinCount - 1))
      const yRatio = 1 - Math.abs(z) / (depth / 2 + eaveOverhang)
      const y = baseY + 1.2 + ridgeHeight * yRatio
      const purlinGeo = new THREE.CylinderGeometry(0.08, 0.08, width + eaveOverhang * 2, 8)
      const purlin = new THREE.Mesh(purlinGeo, MaterialLibrary.darkWoodBeam)
      purlin.rotation.z = Math.PI / 2
      purlin.position.set(0, y, z)
      purlin.castShadow = true
      group.add(purlin)
    }

    const rafterCount = 12
    for (let i = 0; i < rafterCount; i++) {
      const x = -width / 2 - eaveOverhang + i * ((width + eaveOverhang * 2) / (rafterCount - 1))
      const rafterGeo = new THREE.BoxGeometry(0.08, 0.12, depth + eaveOverhang * 2)
      const rafter = new THREE.Mesh(rafterGeo, MaterialLibrary.darkWoodBeam)
      rafter.rotation.x = -Math.atan2(ridgeHeight, depth / 2 + eaveOverhang)
      rafter.position.set(x, baseY + 1.2 + ridgeHeight / 2 - 0.15, 0)
      rafter.castShadow = true
      group.add(rafter)
    }

    const ridge = BaseComponents.createRidge(width + eaveOverhang * 2 - 1, new THREE.Vector3(0, baseY + 1.2 + ridgeHeight + 0.3, 0))
    ridge.rotation.y = Math.PI / 2
    group.add(ridge)

    const frontEave = BaseComponents.createEave(width + eaveOverhang * 2, eaveOverhang, 0.5, new THREE.Vector3(0, baseY + 1.0, depth / 2 + eaveOverhang / 2))
    group.add(frontEave)

    const backEave = BaseComponents.createEave(width + eaveOverhang * 2, eaveOverhang, 0.5, new THREE.Vector3(0, baseY + 1.0, -depth / 2 - eaveOverhang / 2))
    backEave.rotation.y = Math.PI
    group.add(backEave)

    const leftEave = BaseComponents.createEave(depth + eaveOverhang * 1.6, eaveOverhang * 0.8, 0.4, new THREE.Vector3(-width / 2 - eaveOverhang / 2, baseY + 1.0, 0))
    leftEave.rotation.y = Math.PI / 2
    group.add(leftEave)

    const rightEave = BaseComponents.createEave(depth + eaveOverhang * 1.6, eaveOverhang * 0.8, 0.4, new THREE.Vector3(width / 2 + eaveOverhang / 2, baseY + 1.0, 0))
    rightEave.rotation.y = -Math.PI / 2
    group.add(rightEave)

    return group
  }

  static createWingRoom(
    width: number = 7,
    depth: number = 4.5,
    columnHeight: number = 3.2,
    position: THREE.Vector3 = new THREE.Vector3(),
    rotation: number = 0
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'wing-room'

    const baseY = 0.7

    const foundation = this.createFoundation(width + 1, depth + 1, baseY)
    group.add(foundation)

    const columnsGroup = new THREE.Group()
    columnsGroup.userData.layer = 'columns'

    const frontColumnCount = 4
    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      const column = BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(x, baseY, depth / 2))
      columnsGroup.add(column)

      const backColumn = BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(x, baseY, -depth / 2))
      columnsGroup.add(backColumn)
    }

    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      const dougong = BaseComponents.createDougong(0.5, new THREE.Vector3(x, baseY + columnHeight, depth / 2))
      columnsGroup.add(dougong)
    }

    const frontBeam = BaseComponents.createBeam(0.25, 0.3, width, new THREE.Vector3(0, baseY + columnHeight + 0.4, depth / 2))
    columnsGroup.add(frontBeam)

    const backBeam = BaseComponents.createBeam(0.25, 0.3, width, new THREE.Vector3(0, baseY + columnHeight + 0.4, -depth / 2))
    columnsGroup.add(backBeam)

    const frontLintelGeo = new THREE.BoxGeometry(width, 0.28, 0.2)
    const frontLintel = new THREE.Mesh(frontLintelGeo, MaterialLibrary.redWoodColumn)
    frontLintel.position.set(0, baseY + columnHeight * 0.55, depth / 2 + 0.05)
    frontLintel.castShadow = true
    columnsGroup.add(frontLintel)

    group.add(columnsGroup)

    const wallsGroup = new THREE.Group()
    wallsGroup.userData.layer = 'walls'

    const wallHeight = columnHeight - 0.3
    const wallThickness = 0.3

    const frontWallLeftGeo = new THREE.BoxGeometry(width / 2 - 1.4, wallHeight, wallThickness)
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, MaterialLibrary.brickWall)
    frontWallLeft.position.set(-width / 4 - 0.7, baseY + wallHeight / 2 + 0.15, depth / 2 + wallThickness / 2 - 0.05)
    frontWallLeft.castShadow = true
    frontWallLeft.receiveShadow = true
    wallsGroup.add(frontWallLeft)

    const frontWallRightGeo = new THREE.BoxGeometry(width / 2 - 1.4, wallHeight, wallThickness)
    const frontWallRight = new THREE.Mesh(frontWallRightGeo, MaterialLibrary.brickWall)
    frontWallRight.position.set(width / 4 + 0.7, baseY + wallHeight / 2 + 0.15, depth / 2 + wallThickness / 2 - 0.05)
    frontWallRight.castShadow = true
    frontWallRight.receiveShadow = true
    wallsGroup.add(frontWallRight)

    const backWallGeo = new THREE.BoxGeometry(width, wallHeight, wallThickness)
    const backWall = new THREE.Mesh(backWallGeo, MaterialLibrary.brickWall)
    backWall.position.set(0, baseY + wallHeight / 2 + 0.15, -depth / 2 - wallThickness / 2 + 0.05)
    backWall.castShadow = true
    backWall.receiveShadow = true
    wallsGroup.add(backWall)

    const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, depth)
    const leftWall = new THREE.Mesh(sideWallGeo, MaterialLibrary.brickWall)
    leftWall.position.set(-width / 2 - wallThickness / 2 + 0.05, baseY + wallHeight / 2 + 0.15, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    wallsGroup.add(leftWall)

    const rightWall = new THREE.Mesh(sideWallGeo, MaterialLibrary.brickWall)
    rightWall.position.set(width / 2 + wallThickness / 2 - 0.05, baseY + wallHeight / 2 + 0.15, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    wallsGroup.add(rightWall)

    const door = BaseComponents.createDoor(1.8, 2.6, new THREE.Vector3(0, baseY + 1.5, depth / 2 + wallThickness / 2 - 0.05))
    wallsGroup.add(door)

    const sideWindow1 = BaseComponents.createWindow(1.0, 1.4, new THREE.Vector3(-1.8, baseY + 1.3, depth / 2 + wallThickness / 2 - 0.05))
    wallsGroup.add(sideWindow1)

    const sideWindow2 = BaseComponents.createWindow(1.0, 1.4, new THREE.Vector3(1.8, baseY + 1.3, depth / 2 + wallThickness / 2 - 0.05))
    wallsGroup.add(sideWindow2)

    const backWindow = BaseComponents.createWindow(1.2, 1.2, new THREE.Vector3(0, baseY + 1.3, -depth / 2 - wallThickness / 2 + 0.15))
    backWindow.rotation.y = Math.PI
    wallsGroup.add(backWindow)

    group.add(wallsGroup)

    const floorGroup = this.createFloorStructure(width, depth, baseY + columnHeight)
    floorGroup.userData.layer = 'columns'
    group.add(floorGroup)

    const roofGroup = this.createSideRoof(width + 1, depth + 1, columnHeight + baseY)
    roofGroup.userData.layer = 'roof'
    group.add(roofGroup)

    const steps = BaseComponents.createStoneStep(2.5, 0.5, 0.2, 3, new THREE.Vector3(0, 0, depth / 2 + 1.2))
    steps.userData.layer = 'foundation'
    group.add(steps)

    group.rotation.y = rotation
    group.position.copy(position)
    return group
  }

  private static createSideRoof(
    width: number,
    depth: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'roof-side'

    const ridgeHeight = 1.5
    const eaveOverhang = 0.9

    const slopeLength = Math.sqrt(Math.pow(depth / 2 + eaveOverhang / 2, 2) + Math.pow(ridgeHeight, 2))

    const frontSlopeGeo = new THREE.PlaneGeometry(width, slopeLength)
    const frontSlope = new THREE.Mesh(frontSlopeGeo, MaterialLibrary.greyTileRoof)
    frontSlope.rotation.x = -Math.atan2(ridgeHeight, depth / 2 + eaveOverhang / 2)
    frontSlope.position.set(0, baseY + 0.7 + ridgeHeight / 2, depth / 4)
    frontSlope.castShadow = true
    frontSlope.receiveShadow = true
    group.add(frontSlope)

    const backSlopeGeo = new THREE.PlaneGeometry(width, slopeLength)
    const backSlope = new THREE.Mesh(backSlopeGeo, MaterialLibrary.greyTileRoof)
    backSlope.rotation.x = Math.PI + Math.atan2(ridgeHeight, depth / 2 + eaveOverhang / 2)
    backSlope.position.set(0, baseY + 0.7 + ridgeHeight / 2, -depth / 4)
    backSlope.castShadow = true
    backSlope.receiveShadow = true
    group.add(backSlope)

    const purlinCount = 4
    for (let i = 0; i < purlinCount; i++) {
      const z = -depth / 2 - eaveOverhang * 0.3 + i * ((depth + eaveOverhang * 0.6) / (purlinCount - 1))
      const yRatio = 1 - Math.abs(z) / (depth / 2 + eaveOverhang / 2)
      const y = baseY + 0.7 + ridgeHeight * yRatio
      const purlinGeo = new THREE.CylinderGeometry(0.06, 0.06, width, 8)
      const purlin = new THREE.Mesh(purlinGeo, MaterialLibrary.darkWoodBeam)
      purlin.rotation.z = Math.PI / 2
      purlin.position.set(0, y, z)
      purlin.castShadow = true
      group.add(purlin)
    }

    const rafterCount = 8
    for (let i = 0; i < rafterCount; i++) {
      const x = -width / 2 + 0.3 + i * ((width - 0.6) / (rafterCount - 1))
      const rafterGeo = new THREE.BoxGeometry(0.06, 0.1, depth + eaveOverhang)
      const rafter = new THREE.Mesh(rafterGeo, MaterialLibrary.darkWoodBeam)
      rafter.rotation.x = -Math.atan2(ridgeHeight, depth / 2 + eaveOverhang / 2)
      rafter.position.set(x, baseY + 0.7 + ridgeHeight / 2 - 0.12, 0)
      rafter.castShadow = true
      group.add(rafter)
    }

    const ridge = BaseComponents.createRidge(width - 0.5, new THREE.Vector3(0, baseY + 0.7 + ridgeHeight + 0.2, 0))
    ridge.rotation.y = Math.PI / 2
    group.add(ridge)

    const frontEave = BaseComponents.createEave(width, eaveOverhang, 0.35, new THREE.Vector3(0, baseY + 0.6, depth / 2 + eaveOverhang / 2))
    group.add(frontEave)

    const backEave = BaseComponents.createEave(width, eaveOverhang, 0.35, new THREE.Vector3(0, baseY + 0.6, -depth / 2 - eaveOverhang / 2))
    backEave.rotation.y = Math.PI
    group.add(backEave)

    const gableLeftGeo = new THREE.BoxGeometry(0.15, ridgeHeight + 0.6, depth + eaveOverhang)
    const gableLeft = new THREE.Mesh(gableLeftGeo, MaterialLibrary.brickWall)
    gableLeft.position.set(-width / 2 - 0.25, baseY + 0.6 + (ridgeHeight + 0.6) / 2, 0)
    gableLeft.castShadow = true
    group.add(gableLeft)

    const gableRightGeo = new THREE.BoxGeometry(0.15, ridgeHeight + 0.6, depth + eaveOverhang)
    const gableRight = new THREE.Mesh(gableRightGeo, MaterialLibrary.brickWall)
    gableRight.position.set(width / 2 + 0.25, baseY + 0.6 + (ridgeHeight + 0.6) / 2, 0)
    gableRight.castShadow = true
    group.add(gableRight)

    return group
  }

  static createPaifang(
    width: number = 9,
    height: number = 6.5,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'paifang'

    const foundation = this.createFoundation(width + 1, 1.5, 0.5)
    foundation.userData.layer = 'foundation'
    group.add(foundation)

    const columnsGroup = new THREE.Group()
    columnsGroup.userData.layer = 'columns'

    const columnPositions = [-3.5, -1.5, 1.5, 3.5]
    columnPositions.forEach((x, index) => {
      const columnHeight = index % 2 === 0 ? height - 1.5 : height - 2.5
      const column = BaseComponents.createColumn(0.35, columnHeight, new THREE.Vector3(x, 0.5, 0))
      columnsGroup.add(column)

      const dougong = BaseComponents.createDougong(0.6, new THREE.Vector3(x, 0.5 + columnHeight, 0))
      columnsGroup.add(dougong)
    })

    for (let i = 0; i < 3; i++) {
      const lintelGeo = new THREE.BoxGeometry(width + 1, 0.35, 0.25)
      const lintel = new THREE.Mesh(lintelGeo, MaterialLibrary.redWoodColumn)
      lintel.position.set(0, 0.5 + height - 3.5 + i * 0.5, 0)
      lintel.rotation.y = Math.PI / 2
      lintel.castShadow = true
      columnsGroup.add(lintel)
    }

    group.add(columnsGroup)

    const roofGroup = new THREE.Group()
    roofGroup.userData.layer = 'roof'

    const mainBeam = BaseComponents.createBeam(0.4, 0.5, width + 1, new THREE.Vector3(0, height - 1.8, 0))
    mainBeam.rotation.y = Math.PI / 2
    roofGroup.add(mainBeam)

    const secondaryBeam = BaseComponents.createBeam(0.3, 0.35, width + 1, new THREE.Vector3(0, height - 1.2, 0))
    secondaryBeam.rotation.y = Math.PI / 2
    roofGroup.add(secondaryBeam)

    const mainRoofWidth = width + 1.5
    const mainRoof = this.createSmallRoof(mainRoofWidth, 2.5, height - 0.8)
    mainRoof.rotation.y = Math.PI / 2
    roofGroup.add(mainRoof)

    const sideRoofWidth = 3.5
    const leftSideRoof = this.createSmallRoof(sideRoofWidth, 2, height - 2.2)
    leftSideRoof.position.x = -2.5
    leftSideRoof.rotation.y = Math.PI / 2
    roofGroup.add(leftSideRoof)

    const rightSideRoof = this.createSmallRoof(sideRoofWidth, 2, height - 2.2)
    rightSideRoof.position.x = 2.5
    rightSideRoof.rotation.y = Math.PI / 2
    roofGroup.add(rightSideRoof)

    const plaqueGeo = new THREE.BoxGeometry(2.5, 0.8, 0.15)
    const plaque = new THREE.Mesh(plaqueGeo, MaterialLibrary.redWoodColumn)
    plaque.position.set(0, height - 1.5, 0.4)
    roofGroup.add(plaque)

    const plaqueFrameGeo = new THREE.BoxGeometry(2.7, 1.0, 0.08)
    const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, MaterialLibrary.goldDecorative)
    plaqueFrame.position.set(0, height - 1.5, 0.49)
    roofGroup.add(plaqueFrame)

    group.add(roofGroup)

    const lanternPositions = [
      { x: -3.5, y: height - 3.5, z: 0.8 },
      { x: 3.5, y: height - 3.5, z: 0.8 },
      { x: -1.5, y: height - 4.2, z: 0.8 },
      { x: 1.5, y: height - 4.2, z: 0.8 }
    ]
    lanternPositions.forEach(pos => {
      const lantern = BaseComponents.createLantern(0.4, new THREE.Vector3(pos.x, pos.y, pos.z), false)
      lantern.userData.layer = 'columns'
      group.add(lantern)
    })

    group.position.copy(position)
    group.userData.componentId = 'roof-gate'
    return group
  }

  private static createSmallRoof(
    width: number,
    depth: number,
    baseY: number
  ): THREE.Group {
    const group = new THREE.Group()

    const ridgeHeight = 0.6
    const eaveOverhang = 0.5

    const slopeLength = Math.sqrt(Math.pow(depth / 2 + eaveOverhang, 2) + Math.pow(ridgeHeight, 2))

    const frontSlopeGeo = new THREE.PlaneGeometry(width, slopeLength)
    const frontSlope = new THREE.Mesh(frontSlopeGeo, MaterialLibrary.greyTileRoof)
    frontSlope.rotation.x = -Math.atan2(ridgeHeight, depth / 2 + eaveOverhang)
    frontSlope.position.set(0, baseY + ridgeHeight / 2, 0)
    frontSlope.castShadow = true
    frontSlope.receiveShadow = true
    group.add(frontSlope)

    const backSlopeGeo = new THREE.PlaneGeometry(width, slopeLength)
    const backSlope = new THREE.Mesh(backSlopeGeo, MaterialLibrary.greyTileRoof)
    backSlope.rotation.x = Math.PI + Math.atan2(ridgeHeight, depth / 2 + eaveOverhang)
    backSlope.position.set(0, baseY + ridgeHeight / 2, 0)
    backSlope.castShadow = true
    backSlope.receiveShadow = true
    group.add(backSlope)

    const ridgeGeo = new THREE.BoxGeometry(width, 0.2, 0.25)
    const ridge = new THREE.Mesh(ridgeGeo, MaterialLibrary.goldDecorative)
    ridge.position.set(0, baseY + ridgeHeight + 0.1, 0)
    ridge.castShadow = true
    group.add(ridge)

    const eaveFront = BaseComponents.createEave(width, eaveOverhang, 0.25, new THREE.Vector3(0, baseY, -depth / 2 - eaveOverhang / 2))
    eaveFront.rotation.y = Math.PI
    group.add(eaveFront)

    const eaveBack = BaseComponents.createEave(width, eaveOverhang, 0.25, new THREE.Vector3(0, baseY, depth / 2 + eaveOverhang / 2))
    group.add(eaveBack)

    return group
  }

  static createCourtyardWalls(
    courtyardWidth: number = 28,
    courtyardDepth: number = 22,
    wallHeight: number = 3.5,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'wall'

    const wallThickness = 0.4

    const createWall = (w: number, h: number, d: number, pos: THREE.Vector3, rotY: number = 0) => {
      const wallGroup = new THREE.Group()
      wallGroup.userData.layer = 'walls'

      const wallGeo = new THREE.BoxGeometry(w, h, d)
      const wall = new THREE.Mesh(wallGeo, MaterialLibrary.brickWall)
      wall.position.y = h / 2
      wall.castShadow = true
      wall.receiveShadow = true
      wallGroup.add(wall)

      const copingGeo = new THREE.BoxGeometry(w + 0.15, 0.2, d + 0.15)
      const coping = new THREE.Mesh(copingGeo, MaterialLibrary.greyTileRoof)
      coping.position.y = h + 0.1
      coping.castShadow = true
      wallGroup.add(coping)

      const tileGeo = new THREE.BoxGeometry(w, 0.1, d + 0.2)
      const tile = new THREE.Mesh(tileGeo, MaterialLibrary.greyTileRoof)
      tile.position.y = h + 0.25
      tile.castShadow = true
      wallGroup.add(tile)

      const baseGeo = new THREE.BoxGeometry(w + 0.1, 0.25, d + 0.1)
      const base = new THREE.Mesh(baseGeo, MaterialLibrary.stoneFoundation)
      base.position.y = 0.125
      base.castShadow = true
      base.receiveShadow = true
      wallGroup.add(base)

      wallGroup.position.copy(pos)
      wallGroup.rotation.y = rotY
      return wallGroup
    }

    const frontWallLeft = createWall(
      courtyardWidth / 2 - 5,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-courtyardWidth / 4 - 2.5, 0, -courtyardDepth / 2)
    )
    group.add(frontWallLeft)

    const frontWallRight = createWall(
      courtyardWidth / 2 - 5,
      wallHeight,
      wallThickness,
      new THREE.Vector3(courtyardWidth / 4 + 2.5, 0, -courtyardDepth / 2)
    )
    group.add(frontWallRight)

    const gatePillarLeftGeo = new THREE.BoxGeometry(0.6, wallHeight + 0.5, 0.6)
    const gatePillarLeft = new THREE.Mesh(gatePillarLeftGeo, MaterialLibrary.stoneFoundation)
    gatePillarLeft.position.set(-4.5, (wallHeight + 0.5) / 2, -courtyardDepth / 2)
    gatePillarLeft.castShadow = true
    gatePillarLeft.userData.layer = 'walls'
    group.add(gatePillarLeft)

    const gatePillarRightGeo = new THREE.BoxGeometry(0.6, wallHeight + 0.5, 0.6)
    const gatePillarRight = new THREE.Mesh(gatePillarRightGeo, MaterialLibrary.stoneFoundation)
    gatePillarRight.position.set(4.5, (wallHeight + 0.5) / 2, -courtyardDepth / 2)
    gatePillarRight.castShadow = true
    gatePillarRight.userData.layer = 'walls'
    group.add(gatePillarRight)

    const backWall = createWall(
      courtyardWidth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(0, 0, courtyardDepth / 2)
    )
    group.add(backWall)

    const leftWall = createWall(
      courtyardDepth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-courtyardWidth / 2, 0, 0),
      Math.PI / 2
    )
    group.add(leftWall)

    const rightWall = createWall(
      courtyardDepth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(courtyardWidth / 2, 0, 0),
      -Math.PI / 2
    )
    group.add(rightWall)

    const windowPositions = [
      { x: -courtyardWidth / 3, z: courtyardDepth / 2 - 0.2, rot: Math.PI },
      { x: courtyardWidth / 3, z: courtyardDepth / 2 - 0.2, rot: Math.PI },
      { x: -courtyardWidth / 2 + 0.2, z: -courtyardDepth / 4, rot: Math.PI / 2 },
      { x: -courtyardWidth / 2 + 0.2, z: courtyardDepth / 4, rot: Math.PI / 2 },
      { x: courtyardWidth / 2 - 0.2, z: -courtyardDepth / 4, rot: -Math.PI / 2 },
      { x: courtyardWidth / 2 - 0.2, z: courtyardDepth / 4, rot: -Math.PI / 2 }
    ]
    windowPositions.forEach(pos => {
      const window = BaseComponents.createWindow(1.0, 1.2, new THREE.Vector3(pos.x, wallHeight / 2 + 0.2, pos.z))
      window.rotation.y = pos.rot
      window.userData.layer = 'walls'
      group.add(window)
    })

    group.position.copy(position)
    return group
  }

  static createGround(
    width: number = 40,
    depth: number = 40,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'floor'
    group.userData.layer = 'foundation'

    const groundGeo = new THREE.PlaneGeometry(width, depth)
    const ground = new THREE.Mesh(groundGeo, MaterialLibrary.stoneFloor)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    group.add(ground)

    const pathGeo = new THREE.PlaneGeometry(3, 20)
    const pathMaterial = MaterialLibrary.stoneStep.clone()
    const path = new THREE.Mesh(pathGeo, pathMaterial)
    path.rotation.x = -Math.PI / 2
    path.position.set(0, 0.005, -5)
    path.receiveShadow = true
    group.add(path)

    const courtyardGeo = new THREE.PlaneGeometry(16, 12)
    const courtyard = new THREE.Mesh(courtyardGeo, pathMaterial.clone())
    courtyard.rotation.x = -Math.PI / 2
    courtyard.position.set(0, 0.005, 3)
    courtyard.receiveShadow = true
    group.add(courtyard)

    group.position.copy(position)
    return group
  }
}
