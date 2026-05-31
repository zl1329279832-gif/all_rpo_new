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
    const wallThickness = 0.3

    const foundation = this.createFoundation(width + 2, depth + 2, baseY)
    group.add(foundation)

    const columnsGroup = this.createColumnsStructure(width, depth, columnHeight, baseY)
    columnsGroup.userData.layer = 'columns'
    group.add(columnsGroup)

    const wallsGroup = this.createMainHallWalls(width, depth, columnHeight, baseY, wallThickness)
    wallsGroup.userData.layer = 'walls'
    group.add(wallsGroup)

    const roofGroup = this.createMainRoof(width, depth, columnHeight, baseY, wallThickness)
    roofGroup.userData.layer = 'roof'
    group.add(roofGroup)

    const steps = BaseComponents.createStoneStep(3.5, 0.8, 0.22, 4, new THREE.Vector3(0, 0, depth / 2 + 1.5))
    steps.userData.layer = 'foundation'
    group.add(steps)

    const platformRailFront = BaseComponents.createRailing(width - 0.5, 1.0, new THREE.Vector3(0, 1.0, depth / 2 + 0.2))
    platformRailFront.userData.layer = 'foundation'
    group.add(platformRailFront)

    const lanternPositions = [
      { x: -width / 2 + 0.8, y: baseY + columnHeight - 0.3, z: depth / 2 - 0.5 },
      { x: width / 2 - 0.8, y: baseY + columnHeight - 0.3, z: depth / 2 - 0.5 }
    ]
    lanternPositions.forEach(pos => {
      const lantern = BaseComponents.createLantern(0.3, new THREE.Vector3(pos.x, pos.y, pos.z), false)
      lantern.userData.layer = 'columns'
      group.add(lantern)
    })

    group.position.copy(position)
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
      group.add(BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(x, baseY, depth / 2)))
      group.add(BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(x, baseY, -depth / 2)))
    }

    for (let i = 1; i < sideColumnCount - 1; i++) {
      const z = -depth / 2 + i * (depth / (sideColumnCount - 1))
      group.add(BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(-width / 2, baseY, z)))
      group.add(BaseComponents.createColumn(0.22, columnHeight, new THREE.Vector3(width / 2, baseY, z)))
    }

    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      group.add(BaseComponents.createDougong(0.55, new THREE.Vector3(x, baseY + columnHeight, depth / 2)))
      group.add(BaseComponents.createDougong(0.55, new THREE.Vector3(x, baseY + columnHeight, -depth / 2)))
    }

    const beamY = baseY + columnHeight + 0.5
    group.add(BaseComponents.createBeam(0.3, 0.35, width, new THREE.Vector3(0, beamY, depth / 2)))
    group.add(BaseComponents.createBeam(0.3, 0.35, width, new THREE.Vector3(0, beamY, -depth / 2)))
    const leftBeam = BaseComponents.createBeam(0.3, 0.35, depth, new THREE.Vector3(-width / 2, beamY, 0))
    leftBeam.rotation.y = Math.PI / 2
    group.add(leftBeam)
    const rightBeam = BaseComponents.createBeam(0.3, 0.35, depth, new THREE.Vector3(width / 2, beamY, 0))
    rightBeam.rotation.y = -Math.PI / 2
    group.add(rightBeam)

    const lintelY = baseY + columnHeight * 0.55
    const lintelGeo = new THREE.BoxGeometry(width + 0.3, 0.3, 0.2)
    const frontLintel = new THREE.Mesh(lintelGeo, MaterialLibrary.redWoodColumn)
    frontLintel.position.set(0, lintelY, depth / 2)
    frontLintel.castShadow = true
    group.add(frontLintel)
    const backLintel = new THREE.Mesh(lintelGeo.clone(), MaterialLibrary.redWoodColumn)
    backLintel.position.set(0, lintelY, -depth / 2)
    backLintel.castShadow = true
    group.add(backLintel)

    return group
  }

  private static createMainHallWalls(
    width: number,
    depth: number,
    columnHeight: number,
    baseY: number,
    wallThickness: number
  ): THREE.Group {
    const group = new THREE.Group()
    const wallHeight = columnHeight * 0.7
    const wallBottom = baseY
    const wallTop = wallBottom + wallHeight
    const wallCenterY = wallBottom + wallHeight / 2

    const frontWallLeftGeo = new THREE.BoxGeometry(width / 2 - 1.6, wallHeight, wallThickness)
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, MaterialLibrary.brickWall)
    frontWallLeft.position.set(-width / 4 - 0.8, wallCenterY, depth / 2)
    frontWallLeft.castShadow = true
    frontWallLeft.receiveShadow = true
    group.add(frontWallLeft)

    const frontWallRightGeo = new THREE.BoxGeometry(width / 2 - 1.6, wallHeight, wallThickness)
    const frontWallRight = new THREE.Mesh(frontWallRightGeo, MaterialLibrary.brickWall)
    frontWallRight.position.set(width / 4 + 0.8, wallCenterY, depth / 2)
    frontWallRight.castShadow = true
    frontWallRight.receiveShadow = true
    group.add(frontWallRight)

    const backWallGeo = new THREE.BoxGeometry(width, wallHeight, wallThickness)
    const backWall = new THREE.Mesh(backWallGeo, MaterialLibrary.brickWall)
    backWall.position.set(0, wallCenterY, -depth / 2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    group.add(backWall)

    const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, depth)
    const leftWall = new THREE.Mesh(sideWallGeo, MaterialLibrary.brickWall)
    leftWall.position.set(-width / 2, wallCenterY, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    group.add(leftWall)

    const rightWall = new THREE.Mesh(sideWallGeo.clone(), MaterialLibrary.brickWall)
    rightWall.position.set(width / 2, wallCenterY, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    group.add(rightWall)

    const door = BaseComponents.createDoor(2.0, wallHeight * 0.85, new THREE.Vector3(0, wallBottom + wallHeight * 0.425, depth / 2 + 0.05))
    group.add(door)

    const winY = wallBottom + wallHeight * 0.5
    group.add(BaseComponents.createWindow(1.0, 1.4, new THREE.Vector3(-2.8, winY, depth / 2 + 0.05)))
    group.add(BaseComponents.createWindow(1.0, 1.4, new THREE.Vector3(2.8, winY, depth / 2 + 0.05)))
    group.add(BaseComponents.createWindow(1.2, 1.4, new THREE.Vector3(-2, winY, -depth / 2 - 0.05)))
    group.add(BaseComponents.createWindow(1.2, 1.4, new THREE.Vector3(2, winY, -depth / 2 - 0.05)))

    const gableHeight = columnHeight * 0.35
    const gableBottom = wallTop
    const gableCenterY = gableBottom + gableHeight / 2
    const gableGeo = new THREE.BoxGeometry(wallThickness + 0.05, gableHeight, depth + wallThickness)
    const gableLeft = new THREE.Mesh(gableGeo, MaterialLibrary.brickWall)
    gableLeft.position.set(-width / 2, gableCenterY, 0)
    gableLeft.castShadow = true
    group.add(gableLeft)
    const gableRight = new THREE.Mesh(gableGeo.clone(), MaterialLibrary.brickWall)
    gableRight.position.set(width / 2, gableCenterY, 0)
    gableRight.castShadow = true
    group.add(gableRight)

    return group
  }

  private static createMainRoof(
    width: number,
    depth: number,
    columnHeight: number,
    baseY: number,
    wallThickness: number
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'roof-main'

    const eaveY = baseY + columnHeight + 0.6
    const eaveOverhang = 1.2
    const ridgeHeight = 2.0

    const roofWidth = width + eaveOverhang * 2
    const roofDepth = depth + eaveOverhang * 2

    const roofShape = new THREE.Shape()
    roofShape.moveTo(-roofDepth / 2, 0)
    roofShape.lineTo(-roofDepth / 4, ridgeHeight * 0.6)
    roofShape.lineTo(0, ridgeHeight)
    roofShape.lineTo(roofDepth / 4, ridgeHeight * 0.6)
    roofShape.lineTo(roofDepth / 2, 0)
    roofShape.lineTo(-roofDepth / 2, 0)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: roofWidth,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 1
    }

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings)
    const roof = new THREE.Mesh(roofGeo, MaterialLibrary.greyTileRoof)
    roof.rotation.y = -Math.PI / 2
    roof.position.set(roofWidth / 2, eaveY, -roofDepth / 2)
    roof.castShadow = true
    roof.receiveShadow = true
    group.add(roof)

    const ridge = BaseComponents.createRidge(roofWidth - 0.5, new THREE.Vector3(0, eaveY + ridgeHeight + 0.2, 0))
    group.add(ridge)

    group.add(BaseComponents.createEave(roofWidth, eaveOverhang, 0.4, new THREE.Vector3(0, eaveY, depth / 2 + eaveOverhang / 2)))
    const backEave = BaseComponents.createEave(roofWidth, eaveOverhang, 0.4, new THREE.Vector3(0, eaveY, -depth / 2 - eaveOverhang / 2))
    backEave.rotation.y = Math.PI
    group.add(backEave)

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
    const wallThickness = 0.25

    const foundation = this.createFoundation(width + 1, depth + 1, baseY)
    group.add(foundation)

    const columnsGroup = new THREE.Group()
    columnsGroup.userData.layer = 'columns'

    const frontColumnCount = 4
    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      columnsGroup.add(BaseComponents.createColumn(0.18, columnHeight, new THREE.Vector3(x, baseY, depth / 2)))
      columnsGroup.add(BaseComponents.createColumn(0.18, columnHeight, new THREE.Vector3(x, baseY, -depth / 2)))
    }

    for (let i = 0; i < frontColumnCount; i++) {
      const x = -width / 2 + i * (width / (frontColumnCount - 1))
      columnsGroup.add(BaseComponents.createDougong(0.4, new THREE.Vector3(x, baseY + columnHeight, depth / 2)))
    }

    const beamY = baseY + columnHeight + 0.35
    columnsGroup.add(BaseComponents.createBeam(0.22, 0.25, width, new THREE.Vector3(0, beamY, depth / 2)))
    columnsGroup.add(BaseComponents.createBeam(0.22, 0.25, width, new THREE.Vector3(0, beamY, -depth / 2)))

    const lintelGeo = new THREE.BoxGeometry(width + 0.2, 0.24, 0.18)
    const frontLintel = new THREE.Mesh(lintelGeo, MaterialLibrary.redWoodColumn)
    frontLintel.position.set(0, baseY + columnHeight * 0.55, depth / 2)
    frontLintel.castShadow = true
    columnsGroup.add(frontLintel)

    group.add(columnsGroup)

    const wallsGroup = new THREE.Group()
    wallsGroup.userData.layer = 'walls'

    const wallHeight = columnHeight * 0.7
    const wallBottom = baseY
    const wallCenterY = wallBottom + wallHeight / 2

    const frontWallLeftGeo = new THREE.BoxGeometry(width / 2 - 1.2, wallHeight, wallThickness)
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, MaterialLibrary.brickWall)
    frontWallLeft.position.set(-width / 4 - 0.6, wallCenterY, depth / 2)
    frontWallLeft.castShadow = true
    frontWallLeft.receiveShadow = true
    wallsGroup.add(frontWallLeft)

    const frontWallRightGeo = new THREE.BoxGeometry(width / 2 - 1.2, wallHeight, wallThickness)
    const frontWallRight = new THREE.Mesh(frontWallRightGeo, MaterialLibrary.brickWall)
    frontWallRight.position.set(width / 4 + 0.6, wallCenterY, depth / 2)
    frontWallRight.castShadow = true
    frontWallRight.receiveShadow = true
    wallsGroup.add(frontWallRight)

    const backWallGeo = new THREE.BoxGeometry(width, wallHeight, wallThickness)
    const backWall = new THREE.Mesh(backWallGeo, MaterialLibrary.brickWall)
    backWall.position.set(0, wallCenterY, -depth / 2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    wallsGroup.add(backWall)

    const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, depth)
    const leftWall = new THREE.Mesh(sideWallGeo, MaterialLibrary.brickWall)
    leftWall.position.set(-width / 2, wallCenterY, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    wallsGroup.add(leftWall)
    const rightWall = new THREE.Mesh(sideWallGeo.clone(), MaterialLibrary.brickWall)
    rightWall.position.set(width / 2, wallCenterY, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    wallsGroup.add(rightWall)

    wallsGroup.add(BaseComponents.createDoor(1.6, wallHeight * 0.85, new THREE.Vector3(0, wallBottom + wallHeight * 0.425, depth / 2 + 0.05)))
    wallsGroup.add(BaseComponents.createWindow(0.8, 1.2, new THREE.Vector3(-2, wallBottom + wallHeight * 0.5, depth / 2 + 0.05)))
    wallsGroup.add(BaseComponents.createWindow(0.8, 1.2, new THREE.Vector3(2, wallBottom + wallHeight * 0.5, depth / 2 + 0.05)))

    const gableHeight = columnHeight * 0.3
    const gableBottom = wallBottom + wallHeight
    const gableGeo = new THREE.BoxGeometry(wallThickness + 0.05, gableHeight, depth + wallThickness)
    const gableLeft = new THREE.Mesh(gableGeo, MaterialLibrary.brickWall)
    gableLeft.position.set(-width / 2, gableBottom + gableHeight / 2, 0)
    gableLeft.castShadow = true
    wallsGroup.add(gableLeft)
    const gableRight = new THREE.Mesh(gableGeo.clone(), MaterialLibrary.brickWall)
    gableRight.position.set(width / 2, gableBottom + gableHeight / 2, 0)
    gableRight.castShadow = true
    wallsGroup.add(gableRight)

    group.add(wallsGroup)

    const roofGroup = this.createSideRoof(width, depth, columnHeight, baseY, wallThickness)
    roofGroup.userData.layer = 'roof'
    group.add(roofGroup)

    const steps = BaseComponents.createStoneStep(2.5, 0.5, 0.2, 3, new THREE.Vector3(0, 0, depth / 2 + 1.0))
    steps.userData.layer = 'foundation'
    group.add(steps)

    group.rotation.y = rotation
    group.position.copy(position)
    return group
  }

  private static createSideRoof(
    width: number,
    depth: number,
    columnHeight: number,
    baseY: number,
    wallThickness: number
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'roof-side'

    const eaveY = baseY + columnHeight + 0.5
    const eaveOverhang = 0.8
    const ridgeHeight = 1.4

    const roofWidth = width + eaveOverhang * 2
    const roofDepth = depth + eaveOverhang

    const roofShape = new THREE.Shape()
    roofShape.moveTo(-roofDepth / 2, 0)
    roofShape.lineTo(-roofDepth / 4, ridgeHeight * 0.55)
    roofShape.lineTo(0, ridgeHeight)
    roofShape.lineTo(roofDepth / 4, ridgeHeight * 0.55)
    roofShape.lineTo(roofDepth / 2, 0)
    roofShape.lineTo(-roofDepth / 2, 0)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: roofWidth,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 1
    }

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings)
    const roof = new THREE.Mesh(roofGeo, MaterialLibrary.greyTileRoof)
    roof.rotation.y = -Math.PI / 2
    roof.position.set(roofWidth / 2, eaveY, -roofDepth / 2)
    roof.castShadow = true
    roof.receiveShadow = true
    group.add(roof)

    const ridge = BaseComponents.createRidge(roofWidth - 0.3, new THREE.Vector3(0, eaveY + ridgeHeight + 0.15, 0))
    group.add(ridge)

    group.add(BaseComponents.createEave(roofWidth, eaveOverhang, 0.3, new THREE.Vector3(0, eaveY, depth / 2 + eaveOverhang / 2)))
    const backEave = BaseComponents.createEave(roofWidth, eaveOverhang, 0.3, new THREE.Vector3(0, eaveY, -depth / 2 - eaveOverhang / 2))
    backEave.rotation.y = Math.PI
    group.add(backEave)

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
      const colH = index % 2 === 0 ? height - 1.5 : height - 2.5
      columnsGroup.add(BaseComponents.createColumn(0.3, colH, new THREE.Vector3(x, 0.5, 0)))
      columnsGroup.add(BaseComponents.createDougong(0.5, new THREE.Vector3(x, 0.5 + colH, 0)))
    })

    for (let i = 0; i < 3; i++) {
      const lintelGeo = new THREE.BoxGeometry(width + 0.5, 0.3, 0.2)
      const lintel = new THREE.Mesh(lintelGeo, MaterialLibrary.redWoodColumn)
      lintel.position.set(0, 0.5 + height - 3.5 + i * 0.45, 0)
      lintel.castShadow = true
      columnsGroup.add(lintel)
    }

    group.add(columnsGroup)

    const roofGroup = new THREE.Group()
    roofGroup.userData.layer = 'roof'

    const mainRoof = this.createSmallRoof(width + 1.5, 2.5, height - 0.8)
    mainRoof.rotation.y = Math.PI
    roofGroup.add(mainRoof)

    const leftSideRoof = this.createSmallRoof(3.5, 2, height - 2.2)
    leftSideRoof.position.x = -2.5
    leftSideRoof.rotation.y = Math.PI
    roofGroup.add(leftSideRoof)

    const rightSideRoof = this.createSmallRoof(3.5, 2, height - 2.2)
    rightSideRoof.position.x = 2.5
    rightSideRoof.rotation.y = Math.PI
    roofGroup.add(rightSideRoof)

    const plaqueGeo = new THREE.BoxGeometry(2.5, 0.8, 0.15)
    const plaque = new THREE.Mesh(plaqueGeo, MaterialLibrary.redWoodColumn)
    plaque.position.set(0, height - 1.5, -0.4)
    roofGroup.add(plaque)
    const plaqueFrameGeo = new THREE.BoxGeometry(2.7, 1.0, 0.08)
    const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, MaterialLibrary.goldDecorative)
    plaqueFrame.position.set(0, height - 1.5, -0.49)
    roofGroup.add(plaqueFrame)

    group.add(roofGroup)

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

    const ridgeHeight = 0.7
    const eaveOverhang = 0.4

    const roofWidth = width
    const roofDepth = depth + eaveOverhang * 2

    const roofShape = new THREE.Shape()
    roofShape.moveTo(-roofDepth / 2, 0)
    roofShape.lineTo(0, ridgeHeight)
    roofShape.lineTo(roofDepth / 2, 0)
    roofShape.lineTo(-roofDepth / 2, 0)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: roofWidth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 1
    }

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings)
    const roof = new THREE.Mesh(roofGeo, MaterialLibrary.greyTileRoof)
    roof.rotation.y = -Math.PI / 2
    roof.position.set(roofWidth / 2, baseY, -roofDepth / 2)
    roof.castShadow = true
    roof.receiveShadow = true
    group.add(roof)

    const ridgeGeo = new THREE.BoxGeometry(roofWidth, 0.2, 0.22)
    const ridge = new THREE.Mesh(ridgeGeo, MaterialLibrary.goldDecorative)
    ridge.position.set(0, baseY + ridgeHeight + 0.1, 0)
    ridge.castShadow = true
    group.add(ridge)

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

    const wallThickness = 0.35

    const createWall = (w: number, h: number, d: number, pos: THREE.Vector3, rotY: number = 0) => {
      const wallGroup = new THREE.Group()
      wallGroup.userData.layer = 'walls'

      const wallGeo = new THREE.BoxGeometry(w, h, d)
      const wall = new THREE.Mesh(wallGeo, MaterialLibrary.brickWall)
      wall.position.y = h / 2
      wall.castShadow = true
      wall.receiveShadow = true
      wallGroup.add(wall)

      const copingGeo = new THREE.BoxGeometry(w + 0.1, 0.15, d + 0.1)
      const coping = new THREE.Mesh(copingGeo, MaterialLibrary.greyTileRoof)
      coping.position.y = h + 0.075
      coping.castShadow = true
      wallGroup.add(coping)

      const baseGeo = new THREE.BoxGeometry(w + 0.05, 0.2, d + 0.05)
      const base = new THREE.Mesh(baseGeo, MaterialLibrary.stoneFoundation)
      base.position.y = 0.1
      base.castShadow = true
      base.receiveShadow = true
      wallGroup.add(base)

      wallGroup.position.copy(pos)
      wallGroup.rotation.y = rotY
      return wallGroup
    }

    group.add(createWall(courtyardWidth / 2 - 5, wallHeight, wallThickness, new THREE.Vector3(-courtyardWidth / 4 - 2.5, 0, -courtyardDepth / 2)))
    group.add(createWall(courtyardWidth / 2 - 5, wallHeight, wallThickness, new THREE.Vector3(courtyardWidth / 4 + 2.5, 0, -courtyardDepth / 2)))

    const pillarGeo = new THREE.BoxGeometry(0.5, wallHeight + 0.4, 0.5)
    const pillarLeft = new THREE.Mesh(pillarGeo, MaterialLibrary.stoneFoundation)
    pillarLeft.position.set(-4.5, (wallHeight + 0.4) / 2, -courtyardDepth / 2)
    pillarLeft.castShadow = true
    pillarLeft.userData.layer = 'walls'
    group.add(pillarLeft)
    const pillarRight = new THREE.Mesh(pillarGeo.clone(), MaterialLibrary.stoneFoundation)
    pillarRight.position.set(4.5, (wallHeight + 0.4) / 2, -courtyardDepth / 2)
    pillarRight.castShadow = true
    pillarRight.userData.layer = 'walls'
    group.add(pillarRight)

    group.add(createWall(courtyardWidth, wallHeight, wallThickness, new THREE.Vector3(0, 0, courtyardDepth / 2)))
    group.add(createWall(courtyardDepth, wallHeight, wallThickness, new THREE.Vector3(-courtyardWidth / 2, 0, 0), Math.PI / 2))
    group.add(createWall(courtyardDepth, wallHeight, wallThickness, new THREE.Vector3(courtyardWidth / 2, 0, 0), -Math.PI / 2))

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
