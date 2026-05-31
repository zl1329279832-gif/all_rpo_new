import * as THREE from 'three'
import { MaterialLibrary } from '@/materials/MaterialLibrary'

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mergedGeo = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let indexOffset = 0

  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position')
    const normAttr = geo.getAttribute('normal')
    const uvAttr = geo.getAttribute('uv')
    const indexAttr = geo.index

    if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
        if (normAttr) {
          normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i))
        }
        if (uvAttr) {
          uvs.push(uvAttr.getX(i), uvAttr.getY(i))
        }
      }
    }

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i++) {
        indices.push(indexAttr.getX(i) + indexOffset)
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + indexOffset)
      }
    }

    indexOffset += posAttr ? posAttr.count : 0
  }

  mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length > 0) {
    mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  }
  if (uvs.length > 0) {
    mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }
  mergedGeo.setIndex(indices)
  mergedGeo.computeBoundingSphere()

  return mergedGeo
}

export class BaseComponents {
  static createColumn(
    radius: number = 0.25,
    height: number = 4,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'column'

    const geometry = new THREE.CylinderGeometry(radius, radius * 1.05, height, 16)
    const material = MaterialLibrary.redWoodColumn
    const column = new THREE.Mesh(geometry, material)
    column.position.y = height / 2
    column.castShadow = true
    column.receiveShadow = true
    group.add(column)

    const baseGeometry = new THREE.CylinderGeometry(radius * 1.4, radius * 1.5, 0.15, 16)
    const baseMaterial = MaterialLibrary.stoneStep
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.075
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)

    const capitalGeometry = new THREE.CylinderGeometry(radius * 1.3, radius * 1.1, 0.2, 16)
    const capital = new THREE.Mesh(capitalGeometry, MaterialLibrary.darkWoodBeam)
    capital.position.y = height - 0.1
    capital.castShadow = true
    group.add(capital)

    group.position.copy(position)
    return group
  }

  static createBeam(
    width: number = 0.4,
    height: number = 0.5,
    length: number = 5,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'beam'

    const geometry = new THREE.BoxGeometry(length, height, width)
    const beam = new THREE.Mesh(geometry, MaterialLibrary.darkWoodBeam)
    beam.castShadow = true
    beam.receiveShadow = true
    group.add(beam)

    group.position.copy(position)
    return group
  }

  static createDougong(
    size: number = 0.8,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'dougong'

    const woodMaterial = MaterialLibrary.darkWoodBeam
    const goldMaterial = MaterialLibrary.goldDecorative

    const woodGeometries: THREE.BoxGeometry[] = []

    const baseGeo = new THREE.BoxGeometry(size, size * 0.25, size)
    baseGeo.translate(0, 0, 0)
    woodGeometries.push(baseGeo)

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const armGeo = new THREE.BoxGeometry(size * 0.8, size * 0.15, size * 0.15)
      armGeo.translate(cos * size * 0.4, size * 0.2, sin * size * 0.4)
      armGeo.rotateY(angle)
      woodGeometries.push(armGeo)

      const bowGeo = new THREE.BoxGeometry(size * 0.15, size * 0.2, size * 0.5)
      bowGeo.translate(cos * size * 0.6, size * 0.35, sin * size * 0.6)
      bowGeo.rotateY(angle)
      woodGeometries.push(bowGeo)
    }

    const mergedWoodGeo = mergeGeometries(woodGeometries)
    const woodMesh = new THREE.Mesh(mergedWoodGeo, woodMaterial)
    woodMesh.castShadow = true
    woodMesh.receiveShadow = true
    group.add(woodMesh)

    woodGeometries.forEach(g => g.dispose())

    const topBlock = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.9, size * 0.2, size * 0.9),
      goldMaterial
    )
    topBlock.position.y = size * 0.5
    topBlock.castShadow = true
    group.add(topBlock)

    group.position.copy(position)
    return group
  }

  static createTileRow(
    width: number = 4,
    depth: number = 0.3,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'tile'

    const tileMaterial = MaterialLibrary.greyTileRoof

    const baseGeometry = new THREE.BoxGeometry(width, 0.08, depth)
    const base = new THREE.Mesh(baseGeometry, tileMaterial)
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)

    const tileCount = Math.floor(width / 0.15)
    for (let i = 0; i < tileCount; i++) {
      const x = -width / 2 + 0.075 + i * 0.15
      const tileGeo = new THREE.CylinderGeometry(0.06, 0.04, depth, 8, 1, true, Math.PI, Math.PI)
      const tile = new THREE.Mesh(tileGeo, tileMaterial)
      tile.rotation.x = Math.PI / 2
      tile.rotation.z = Math.PI / 2
      tile.position.set(x, 0.06, 0)
      tile.castShadow = true
      group.add(tile)

      const dripGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12)
      const drip = new THREE.Mesh(dripGeo, tileMaterial)
      drip.rotation.x = Math.PI / 2
      drip.position.set(x, 0.05, -depth / 2 - 0.01)
      drip.castShadow = true
      group.add(drip)
    }

    group.position.copy(position)
    return group
  }

  static createRidge(
    length: number = 5,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'ridge'

    const tileMaterial = MaterialLibrary.greyTileRoof
    const goldMaterial = MaterialLibrary.goldDecorative

    const mainRidgeGeo = new THREE.BoxGeometry(length, 0.35, 0.45)
    const mainRidge = new THREE.Mesh(mainRidgeGeo, tileMaterial)
    mainRidge.position.y = 0.175
    mainRidge.castShadow = true
    group.add(mainRidge)

    const ridgeTopGeo = new THREE.BoxGeometry(length, 0.12, 0.2)
    const ridgeTop = new THREE.Mesh(ridgeTopGeo, goldMaterial)
    ridgeTop.position.y = 0.4
    ridgeTop.castShadow = true
    group.add(ridgeTop)

    const chiwenLeft = this.createChiwen()
    chiwenLeft.position.set(-length / 2 - 0.15, 0.15, 0)
    chiwenLeft.rotation.z = -0.3
    group.add(chiwenLeft)

    const chiwenRight = this.createChiwen()
    chiwenRight.position.set(length / 2 + 0.15, 0.15, 0)
    chiwenRight.rotation.z = 0.3
    chiwenRight.rotation.y = Math.PI
    group.add(chiwenRight)

    const beastCount = Math.min(5, Math.floor(length / 1.5) - 1)
    for (let i = 0; i < beastCount; i++) {
      const offset = (length - 1) / (beastCount + 1) * (i + 1) - length / 2 + 0.5
      const beast = this.createRidgeBeast()
      beast.position.set(offset, 0.35, 0.25)
      group.add(beast)
    }

    group.position.copy(position)
    return group
  }

  private static createChiwen(): THREE.Group {
    const group = new THREE.Group()
    const material = MaterialLibrary.goldDecorative

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), material)
    body.scale.set(1, 1.2, 0.8)
    body.position.y = 0.1
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), material)
    head.position.set(0.1, 0.25, 0)
    head.castShadow = true
    group.add(head)

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), material)
    tail.position.set(-0.15, 0.3, 0)
    tail.rotation.z = Math.PI / 4
    tail.castShadow = true
    group.add(tail)

    return group
  }

  private static createRidgeBeast(): THREE.Group {
    const group = new THREE.Group()
    const material = MaterialLibrary.goldDecorative

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.12), material)
    body.position.y = 0.1
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), material)
    head.position.set(0, 0.22, 0.06)
    head.castShadow = true
    group.add(head)

    return group
  }

  static createEave(
    width: number = 5,
    depth: number = 1.2,
    rise: number = 0.4,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'eave'

    const curvePoints: THREE.Vector2[] = []
    const segments = 20
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = t * depth
      const y = Math.pow(t, 1.8) * rise + Math.sin(t * Math.PI) * rise * 0.3
      curvePoints.push(new THREE.Vector2(x, y))
    }

    const curve = new THREE.CatmullRomCurve3(
      curvePoints.map(p => new THREE.Vector3(0, p.y, -p.x))
    )

    const profileShape = new THREE.Shape()
    profileShape.moveTo(-0.05, -0.02)
    profileShape.lineTo(0.05, -0.02)
    profileShape.lineTo(0.04, 0.02)
    profileShape.lineTo(-0.04, 0.02)
    profileShape.closePath()

    const extrudeSettings = {
      steps: segments,
      bevelEnabled: false,
      extrudePath: curve
    }

    const rafterCount = Math.floor(width / 0.25)
    for (let i = 0; i <= rafterCount; i++) {
      const x = -width / 2 + i * (width / rafterCount)
      const rafterGeo = new THREE.ExtrudeGeometry(profileShape, extrudeSettings)
      const rafter = new THREE.Mesh(rafterGeo, MaterialLibrary.darkWoodBeam)
      rafter.position.x = x
      rafter.castShadow = true
      group.add(rafter)
    }

    const tileSegments = 8
    for (let i = 0; i < tileSegments; i++) {
      const t = i / tileSegments
      const tileDepth = depth * 0.9
      const tileY = Math.pow(t, 1.8) * rise + Math.sin(t * Math.PI) * rise * 0.3
      const tileZ = -t * tileDepth

      const tileGroup = this.createTileRow(width, 0.35)
      tileGroup.position.set(0, tileY + 0.05, tileZ)
      tileGroup.rotation.x = -Math.atan(
        (1.8 * Math.pow(t, 0.8) * rise + 0.3 * Math.PI * Math.cos(t * Math.PI) * rise) / depth
      )
      group.add(tileGroup)
    }

    const cornerRaise = rise * 1.5
    for (let corner of [-1, 1]) {
      const cornerCurve: THREE.Vector3[] = []
      for (let i = 0; i <= 10; i++) {
        const t = i / 10
        cornerCurve.push(new THREE.Vector3(
          corner * (width / 2 + t * 0.5),
          t * t * cornerRaise,
          -t * depth * 0.8
        ))
      }

      const cornerGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(cornerCurve),
        10,
        0.06,
        8,
        false
      )
      const cornerMesh = new THREE.Mesh(cornerGeo, MaterialLibrary.goldDecorative)
      cornerMesh.castShadow = true
      group.add(cornerMesh)
    }

    group.position.copy(position)
    return group
  }

  static createWindow(
    width: number = 1.2,
    height: number = 1.8,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'window'

    const frameMaterial = MaterialLibrary.darkWoodBeam
    const latticeMaterial = MaterialLibrary.latticeWindow

    const frameThickness = 0.08
    const frameDepth = 0.15

    const framePositions = [
      { w: width, h: frameThickness, d: frameDepth, x: 0, y: height / 2 - frameThickness / 2, z: 0 },
      { w: width, h: frameThickness, d: frameDepth, x: 0, y: -height / 2 + frameThickness / 2, z: 0 },
      { w: frameThickness, h: height, d: frameDepth, x: -width / 2 + frameThickness / 2, y: 0, z: 0 },
      { w: frameThickness, h: height, d: frameDepth, x: width / 2 - frameThickness / 2, y: 0, z: 0 }
    ]

    framePositions.forEach(pos => {
      const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d)
      const mesh = new THREE.Mesh(geo, frameMaterial)
      mesh.position.set(pos.x, pos.y, pos.z)
      mesh.castShadow = true
      group.add(mesh)
    })

    const innerWidth = width - frameThickness * 2
    const innerHeight = height - frameThickness * 2
    const latticeGeo = new THREE.PlaneGeometry(innerWidth, innerHeight)
    const lattice = new THREE.Mesh(latticeGeo, latticeMaterial)
    lattice.position.z = 0.01
    lattice.castShadow = true
    group.add(lattice)

    const mullionGeo = new THREE.BoxGeometry(0.04, innerHeight, 0.06)
    const m1 = new THREE.Mesh(mullionGeo, frameMaterial)
    m1.position.x = -innerWidth / 4
    m1.castShadow = true
    group.add(m1)
    const m2 = new THREE.Mesh(mullionGeo, frameMaterial)
    m2.position.x = innerWidth / 4
    m2.castShadow = true
    group.add(m2)

    const transomGeo = new THREE.BoxGeometry(innerWidth, 0.04, 0.06)
    const t1 = new THREE.Mesh(transomGeo, frameMaterial)
    t1.position.y = -innerHeight / 6
    t1.castShadow = true
    group.add(t1)
    const t2 = new THREE.Mesh(transomGeo, frameMaterial)
    t2.position.y = innerHeight / 6
    t2.castShadow = true
    group.add(t2)

    group.position.copy(position)
    return group
  }

  static createDoor(
    width: number = 1.6,
    height: number = 2.8,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'door'

    const frameMaterial = MaterialLibrary.redWoodColumn
    const latticeMaterial = MaterialLibrary.latticeWindow

    const frameThickness = 0.1
    const frameDepth = 0.18

    const framePositions = [
      { w: width, h: frameThickness, d: frameDepth, x: 0, y: height / 2 - frameThickness / 2, z: 0 },
      { w: frameThickness, h: height, d: frameDepth, x: -width / 2 + frameThickness / 2, y: 0, z: 0 },
      { w: frameThickness, h: height, d: frameDepth, x: width / 2 - frameThickness / 2, y: 0, z: 0 }
    ]

    framePositions.forEach(pos => {
      const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d)
      const mesh = new THREE.Mesh(geo, frameMaterial)
      mesh.position.set(pos.x, pos.y, pos.z)
      mesh.castShadow = true
      group.add(mesh)
    })

    const leafWidth = (width - frameThickness * 2 - 0.05) / 2
    for (let leafSide of [-1, 1]) {
      const leafGroup = new THREE.Group()

      const leafFrameGeo = new THREE.BoxGeometry(leafWidth, height - frameThickness * 2, 0.12)
      const leafFrame = new THREE.Mesh(leafFrameGeo, frameMaterial)
      leafFrame.castShadow = true
      leafGroup.add(leafFrame)

      const panelWidth = leafWidth - 0.15
      const upperPanelHeight = (height - frameThickness * 2) * 0.45
      const upperPanelGeo = new THREE.PlaneGeometry(panelWidth, upperPanelHeight - 0.1)
      const upperPanel = new THREE.Mesh(upperPanelGeo, latticeMaterial)
      upperPanel.position.set(0, (height - frameThickness * 2) * 0.25, 0.07)
      upperPanel.castShadow = true
      leafGroup.add(upperPanel)

      const lowerPanelHeight = (height - frameThickness * 2) * 0.45
      const lowerPanelGeo = new THREE.BoxGeometry(panelWidth, lowerPanelHeight - 0.1, 0.05)
      const lowerPanel = new THREE.Mesh(lowerPanelGeo, frameMaterial)
      lowerPanel.position.set(0, -(height - frameThickness * 2) * 0.25, 0.05)
      lowerPanel.castShadow = true
      leafGroup.add(lowerPanel)

      const knockerGeo = new THREE.SphereGeometry(0.06, 8, 8)
      const knocker = new THREE.Mesh(knockerGeo, MaterialLibrary.goldDecorative)
      knocker.position.set(leafSide * 0.25, 0, 0.13)
      leafGroup.add(knocker)

      leafGroup.position.x = leafSide * (leafWidth + 0.025) / 2
      leafGroup.position.y = -frameThickness / 2
      group.add(leafGroup)
    }

    const thresholdGeo = new THREE.BoxGeometry(width + 0.1, 0.15, 0.25)
    const threshold = new THREE.Mesh(thresholdGeo, MaterialLibrary.stoneStep)
    threshold.position.y = -height / 2 + 0.075
    threshold.castShadow = true
    threshold.receiveShadow = true
    group.add(threshold)

    group.position.copy(position)
    return group
  }

  static createStoneStep(
    width: number = 4,
    depth: number = 0.6,
    height: number = 0.2,
    steps: number = 3,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'step'

    const material = MaterialLibrary.stoneStep

    for (let i = 0; i < steps; i++) {
      const stepHeight = height
      const stepWidth = width - i * 0.15
      const stepDepth = depth
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth)
      const step = new THREE.Mesh(stepGeo, material)
      step.position.set(0, i * stepHeight + stepHeight / 2, -i * stepDepth * 0.8)
      step.castShadow = true
      step.receiveShadow = true
      group.add(step)

      const nosingGeo = new THREE.BoxGeometry(stepWidth + 0.04, 0.03, stepDepth + 0.04)
      const nosing = new THREE.Mesh(nosingGeo, MaterialLibrary.darkPaint)
      nosing.position.set(0, i * stepHeight + stepHeight + 0.015, -i * stepDepth * 0.8)
      group.add(nosing)
    }

    group.position.copy(position)
    return group
  }

  static createRailing(
    width: number = 5,
    height: number = 1.1,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'railing'

    const material = MaterialLibrary.woodRailing

    const postCount = Math.floor(width / 1.5) + 1
    for (let i = 0; i < postCount; i++) {
      const x = -width / 2 + i * (width / (postCount - 1))

      const postGeo = new THREE.BoxGeometry(0.1, height, 0.1)
      const post = new THREE.Mesh(postGeo, material)
      post.position.set(x, height / 2, 0)
      post.castShadow = true
      group.add(post)

      const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8)
      const cap = new THREE.Mesh(capGeo, material)
      cap.position.set(x, height + 0.04, 0)
      cap.castShadow = true
      group.add(cap)
    }

    const topRailGeo = new THREE.BoxGeometry(width + 0.1, 0.1, 0.08)
    const topRail = new THREE.Mesh(topRailGeo, material)
    topRail.position.set(0, height - 0.05, 0)
    topRail.castShadow = true
    group.add(topRail)

    const midRailGeo = new THREE.BoxGeometry(width + 0.1, 0.06, 0.06)
    const midRail = new THREE.Mesh(midRailGeo, material)
    midRail.position.set(0, height * 0.45, 0)
    midRail.castShadow = true
    group.add(midRail)

    const bottomRailGeo = new THREE.BoxGeometry(width + 0.1, 0.08, 0.08)
    const bottomRail = new THREE.Mesh(bottomRailGeo, material)
    bottomRail.position.set(0, 0.04, 0)
    bottomRail.castShadow = true
    group.add(bottomRail)

    const balusterCount = postCount * 3 - 2
    for (let i = 0; i < balusterCount; i++) {
      const x = -width / 2 + i * (width / (balusterCount - 1))
      const balusterGeo = new THREE.BoxGeometry(0.04, height * 0.35, 0.04)
      const baluster = new THREE.Mesh(balusterGeo, material)
      baluster.position.set(x, height * 0.625, 0)
      baluster.castShadow = true
      group.add(baluster)
    }

    group.position.copy(position)
    return group
  }

  static createLantern(
    size: number = 0.4,
    position: THREE.Vector3 = new THREE.Vector3(),
    lit: boolean = true
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'lantern'

    const frameMaterial = MaterialLibrary.lanternFrame
    const paperMaterial = MaterialLibrary.lanternPaper.clone()
    paperMaterial.emissiveIntensity = lit ? 1.2 : 0.2

    const topCapGeo = new THREE.CylinderGeometry(0, size * 0.5, size * 0.15, 6)
    const topCap = new THREE.Mesh(topCapGeo, frameMaterial)
    topCap.position.y = size * 0.55
    topCap.castShadow = true
    group.add(topCap)

    const bottomBaseGeo = new THREE.CylinderGeometry(size * 0.5, 0, size * 0.15, 6)
    const bottomBase = new THREE.Mesh(bottomBaseGeo, frameMaterial)
    bottomBase.position.y = -size * 0.55
    bottomBase.rotation.x = Math.PI
    bottomBase.castShadow = true
    group.add(bottomBase)

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const frameBarGeo = new THREE.BoxGeometry(size * 0.04, size * 0.8, size * 0.04)
      const frameBar = new THREE.Mesh(frameBarGeo, frameMaterial)
      frameBar.position.set(
        Math.cos(angle) * size * 0.45,
        0,
        Math.sin(angle) * size * 0.45
      )
      frameBar.rotation.y = angle
      frameBar.castShadow = true
      group.add(frameBar)
    }

    const panelGeo = new THREE.CylinderGeometry(size * 0.42, size * 0.48, size * 0.7, 6, 1, true)
    const panel = new THREE.Mesh(panelGeo, paperMaterial)
    panel.castShadow = true
    group.add(panel)

    const topRingGeo = new THREE.TorusGeometry(size * 0.46, size * 0.03, 6, 6)
    const topRing = new THREE.Mesh(topRingGeo, frameMaterial)
    topRing.position.y = size * 0.35
    topRing.rotation.x = Math.PI / 2
    group.add(topRing)

    const bottomRingGeo = new THREE.TorusGeometry(size * 0.46, size * 0.03, 6, 6)
    const bottomRing = new THREE.Mesh(bottomRingGeo, frameMaterial)
    bottomRing.position.y = -size * 0.35
    bottomRing.rotation.x = Math.PI / 2
    group.add(bottomRing)

    const tasselGeo = new THREE.CylinderGeometry(0.02, 0.01, size * 0.25, 6)
    const tassel = new THREE.Mesh(tasselGeo, MaterialLibrary.goldDecorative)
    tassel.position.y = -size * 0.72
    group.add(tassel)

    const topHookGeo = new THREE.TorusGeometry(size * 0.05, size * 0.015, 6, 12, Math.PI)
    const topHook = new THREE.Mesh(topHookGeo, frameMaterial)
    topHook.position.y = size * 0.65
    topHook.rotation.x = Math.PI / 2
    group.add(topHook)

    if (lit) {
      const light = new THREE.PointLight(0xff6633, 1.5, 8, 2)
      light.position.y = 0
      light.castShadow = true
      light.shadow.mapSize.width = 512
      light.shadow.mapSize.height = 512
      group.add(light)
    }

    group.position.copy(position)
    return group
  }

  static createTree(
    height: number = 5,
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData.componentId = 'tree'

    const trunkMaterial = MaterialLibrary.treeTrunk
    const leavesMaterial = MaterialLibrary.treeLeaves

    const trunkHeight = height * 0.5
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 8)
    const trunk = new THREE.Mesh(trunkGeo, trunkMaterial)
    trunk.position.y = trunkHeight / 2
    trunk.castShadow = true
    trunk.receiveShadow = true
    group.add(trunk)

    const branchCount = 4
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = trunkHeight * 0.5 + i * trunkHeight * 0.15
      const branchLength = height * 0.3 - i * 0.2
      const branchGeo = new THREE.CylinderGeometry(0.06, 0.08, branchLength, 6)
      const branch = new THREE.Mesh(branchGeo, trunkMaterial)
      branch.position.set(
        Math.cos(i * 1.2) * 0.3,
        branchHeight,
        Math.sin(i * 1.2) * 0.3
      )
      branch.rotation.z = Math.PI / 4 + i * 0.2
      branch.rotation.y = i * 1.2
      branch.castShadow = true
      group.add(branch)
    }

    const foliageLayers = 5
    for (let i = 0; i < foliageLayers; i++) {
      const layerY = trunkHeight + i * height * 0.1
      const layerRadius = height * (0.45 - i * 0.07)
      const foliageGeo = new THREE.SphereGeometry(layerRadius, 8, 6)
      const foliage = new THREE.Mesh(foliageGeo, leavesMaterial.clone())
      foliage.position.y = layerY
      foliage.position.x = Math.sin(i * 0.8) * 0.2
      foliage.position.z = Math.cos(i * 0.8) * 0.2
      foliage.scale.y = 0.7
      foliage.castShadow = true
      foliage.receiveShadow = true
      group.add(foliage)
    }

    group.position.copy(position)
    return group
  }
}
