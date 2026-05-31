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
        if (normAttr) normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i))
        if (uvAttr) uvs.push(uvAttr.getX(i), uvAttr.getY(i))
      }
    }

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i++) {
        indices.push(indexAttr.getX(i) + indexOffset)
      }
    } else if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + indexOffset)
      }
    }

    indexOffset += posAttr ? posAttr.count : 0
  }

  mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length > 0) mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  if (uvs.length > 0) mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
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

    const columnGeo = new THREE.CylinderGeometry(radius, radius * 1.05, height, 12)
    const column = new THREE.Mesh(columnGeo, MaterialLibrary.redWoodColumn)
    column.position.y = height / 2
    column.castShadow = true
    column.receiveShadow = true
    group.add(column)

    const baseGeo = new THREE.CylinderGeometry(radius * 1.4, radius * 1.5, 0.12, 12)
    const base = new THREE.Mesh(baseGeo, MaterialLibrary.stoneStep)
    base.position.y = 0.06
    base.castShadow = true
    group.add(base)

    const capitalGeo = new THREE.CylinderGeometry(radius * 1.3, radius * 1.1, 0.15, 12)
    const capital = new THREE.Mesh(capitalGeo, MaterialLibrary.darkWoodBeam)
    capital.position.y = height - 0.075
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

    const baseGeo = new THREE.BoxGeometry(size, size * 0.2, size)
    baseGeo.translate(0, size * 0.1, 0)
    woodGeometries.push(baseGeo)

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const armGeo = new THREE.BoxGeometry(size * 0.7, size * 0.12, size * 0.12)
      armGeo.translate(cos * size * 0.35, size * 0.25, sin * size * 0.35)
      armGeo.rotateY(angle)
      woodGeometries.push(armGeo)

      const bowGeo = new THREE.BoxGeometry(size * 0.12, size * 0.15, size * 0.4)
      bowGeo.translate(cos * size * 0.5, size * 0.35, sin * size * 0.5)
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
      new THREE.BoxGeometry(size * 0.85, size * 0.15, size * 0.85),
      goldMaterial
    )
    topBlock.position.y = size * 0.45
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

    const baseGeo = new THREE.BoxGeometry(width, 0.06, depth)
    const base = new THREE.Mesh(baseGeo, tileMaterial)
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)

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

    const mainRidgeGeo = new THREE.BoxGeometry(length, 0.3, 0.4)
    const mainRidge = new THREE.Mesh(mainRidgeGeo, tileMaterial)
    mainRidge.position.y = 0.15
    mainRidge.castShadow = true
    group.add(mainRidge)

    const ridgeTopGeo = new THREE.BoxGeometry(length, 0.1, 0.18)
    const ridgeTop = new THREE.Mesh(ridgeTopGeo, goldMaterial)
    ridgeTop.position.y = 0.35
    ridgeTop.castShadow = true
    group.add(ridgeTop)

    const chiwenLeft = this.createChiwen()
    chiwenLeft.position.set(-length / 2 - 0.1, 0.15, 0)
    chiwenLeft.rotation.z = -0.3
    group.add(chiwenLeft)

    const chiwenRight = this.createChiwen()
    chiwenRight.position.set(length / 2 + 0.1, 0.15, 0)
    chiwenRight.rotation.z = 0.3
    chiwenRight.rotation.y = Math.PI
    group.add(chiwenRight)

    const beastCount = Math.min(3, Math.floor(length / 2))
    for (let i = 0; i < beastCount; i++) {
      const offset = (length - 0.8) / (beastCount + 1) * (i + 1) - length / 2 + 0.4
      const beast = this.createRidgeBeast()
      beast.position.set(offset, 0.3, 0.2)
      group.add(beast)
    }

    group.position.copy(position)
    return group
  }

  private static createChiwen(): THREE.Group {
    const group = new THREE.Group()
    const material = MaterialLibrary.goldDecorative

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), material)
    body.scale.set(1, 1.2, 0.8)
    body.position.y = 0.1
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), material)
    head.position.set(0.08, 0.2, 0)
    head.castShadow = true
    group.add(head)

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), material)
    tail.position.set(-0.12, 0.25, 0)
    tail.rotation.z = Math.PI / 4
    tail.castShadow = true
    group.add(tail)

    return group
  }

  private static createRidgeBeast(): THREE.Group {
    const group = new THREE.Group()
    const material = MaterialLibrary.goldDecorative

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.1), material)
    body.position.y = 0.08
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), material)
    head.position.set(0, 0.18, 0.04)
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

    const tileMaterial = MaterialLibrary.greyTileRoof
    const woodMaterial = MaterialLibrary.darkWoodBeam
    const goldMaterial = MaterialLibrary.goldDecorative

    const eaveGeometries: THREE.BufferGeometry[] = []

    const curveSteps = 8
    for (let i = 0; i < curveSteps; i++) {
      const t1 = i / curveSteps
      const t2 = (i + 1) / curveSteps

      const y1 = Math.pow(t1, 1.5) * rise
      const z1 = -t1 * depth
      const y2 = Math.pow(t2, 1.5) * rise
      const z2 = -t2 * depth

      const segGeo = new THREE.BoxGeometry(width, 0.06, depth / curveSteps)
      segGeo.translate(0, (y1 + y2) / 2 + 0.03, (z1 + z2) / 2)
      const angle = Math.atan2(y2 - y1, z2 - z1)
      segGeo.rotateX(angle)
      eaveGeometries.push(segGeo)
    }

    const rafterCount = Math.min(8, Math.floor(width / 0.6))
    for (let i = 0; i < rafterCount; i++) {
      const x = -width / 2 + (i + 0.5) * (width / rafterCount)
      const rafterGeo = new THREE.BoxGeometry(0.06, 0.08, depth * 0.9)
      rafterGeo.translate(x, rise * 0.3 + 0.04, -depth * 0.45)
      rafterGeo.rotateX(-Math.atan2(rise * 0.6, depth * 0.9))
      eaveGeometries.push(rafterGeo)
    }

    if (eaveGeometries.length > 0) {
      const mergedEaveGeo = mergeGeometries(eaveGeometries as THREE.BoxGeometry[])
      const eaveMesh = new THREE.Mesh(mergedEaveGeo, woodMaterial)
      eaveMesh.castShadow = true
      eaveMesh.receiveShadow = true
      group.add(eaveMesh)
      eaveGeometries.forEach(g => g.dispose())
    }

    for (let corner of [-1, 1]) {
      const cornerCurve: THREE.Vector3[] = []
      for (let i = 0; i <= 8; i++) {
        const t = i / 8
        cornerCurve.push(new THREE.Vector3(
          corner * (width / 2 + t * 0.4),
          t * t * rise * 1.3,
          -t * depth * 0.7
        ))
      }
      const cornerGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(cornerCurve),
        8,
        0.05,
        6,
        false
      )
      const cornerMesh = new THREE.Mesh(cornerGeo, goldMaterial)
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

    const frameThickness = 0.06
    const frameDepth = 0.12

    const geos: THREE.BoxGeometry[] = []

    geos.push(new THREE.BoxGeometry(width, frameThickness, frameDepth).translate(0, height / 2 - frameThickness / 2, 0) as THREE.BoxGeometry)
    geos.push(new THREE.BoxGeometry(width, frameThickness, frameDepth).translate(0, -height / 2 + frameThickness / 2, 0) as THREE.BoxGeometry)
    geos.push(new THREE.BoxGeometry(frameThickness, height, frameDepth).translate(-width / 2 + frameThickness / 2, 0, 0) as THREE.BoxGeometry)
    geos.push(new THREE.BoxGeometry(frameThickness, height, frameDepth).translate(width / 2 - frameThickness / 2, 0, 0) as THREE.BoxGeometry)

    const mergedFrameGeo = mergeGeometries(geos)
    const frameMesh = new THREE.Mesh(mergedFrameGeo, frameMaterial)
    frameMesh.castShadow = true
    group.add(frameMesh)
    geos.forEach(g => g.dispose())

    const innerWidth = width - frameThickness * 2
    const innerHeight = height - frameThickness * 2
    const latticeGeo = new THREE.PlaneGeometry(innerWidth, innerHeight)
    const lattice = new THREE.Mesh(latticeGeo, latticeMaterial)
    lattice.position.z = 0.01
    group.add(lattice)

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

    const frameThickness = 0.08
    const frameDepth = 0.15

    const frameGeos: THREE.BoxGeometry[] = []
    frameGeos.push(new THREE.BoxGeometry(width, frameThickness, frameDepth).translate(0, height / 2 - frameThickness / 2, 0) as THREE.BoxGeometry)
    frameGeos.push(new THREE.BoxGeometry(frameThickness, height, frameDepth).translate(-width / 2 + frameThickness / 2, 0, 0) as THREE.BoxGeometry)
    frameGeos.push(new THREE.BoxGeometry(frameThickness, height, frameDepth).translate(width / 2 - frameThickness / 2, 0, 0) as THREE.BoxGeometry)

    const mergedFrameGeo = mergeGeometries(frameGeos)
    const frameMesh = new THREE.Mesh(mergedFrameGeo, frameMaterial)
    frameMesh.castShadow = true
    group.add(frameMesh)
    frameGeos.forEach(g => g.dispose())

    const leafWidth = (width - frameThickness * 2 - 0.04) / 2
    for (let leafSide of [-1, 1]) {
      const leafGeo = new THREE.BoxGeometry(leafWidth, height - frameThickness * 2, 0.1)
      const leaf = new THREE.Mesh(leafGeo, frameMaterial)
      leaf.position.set(leafSide * (leafWidth + 0.02) / 2, -frameThickness / 2, 0)
      leaf.castShadow = true
      group.add(leaf)

      const panelWidth = leafWidth - 0.1
      const upperPanelGeo = new THREE.PlaneGeometry(panelWidth, (height - frameThickness * 2) * 0.35)
      const upperPanel = new THREE.Mesh(upperPanelGeo, latticeMaterial)
      upperPanel.position.set(leafSide * (leafWidth + 0.02) / 2, (height - frameThickness * 2) * 0.2 - frameThickness / 2, 0.06)
      group.add(upperPanel)
    }

    const knockerGeo = new THREE.SphereGeometry(0.05, 8, 6)
    const knocker1 = new THREE.Mesh(knockerGeo, MaterialLibrary.goldDecorative)
    knocker1.position.set(-0.2, 0, 0.1)
    group.add(knocker1)
    const knocker2 = new THREE.Mesh(knockerGeo.clone(), MaterialLibrary.goldDecorative)
    knocker2.position.set(0.2, 0, 0.1)
    group.add(knocker2)

    const thresholdGeo = new THREE.BoxGeometry(width + 0.08, 0.12, 0.2)
    const threshold = new THREE.Mesh(thresholdGeo, MaterialLibrary.stoneStep)
    threshold.position.y = -height / 2 + 0.06
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
      const stepGeo = new THREE.BoxGeometry(width - i * 0.12, height, depth)
      const step = new THREE.Mesh(stepGeo, material)
      step.position.set(0, i * height + height / 2, -i * depth * 0.7)
      step.castShadow = true
      step.receiveShadow = true
      group.add(step)
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
    const railingGeos: THREE.BoxGeometry[] = []

    for (let i = 0; i < postCount; i++) {
      const x = -width / 2 + i * (width / (postCount - 1))
      const postGeo = new THREE.BoxGeometry(0.08, height, 0.08)
      postGeo.translate(x, height / 2, 0)
      railingGeos.push(postGeo)
    }

    const topRailGeo = new THREE.BoxGeometry(width, 0.08, 0.06)
    topRailGeo.translate(0, height - 0.04, 0)
    railingGeos.push(topRailGeo)

    const midRailGeo = new THREE.BoxGeometry(width, 0.05, 0.05)
    midRailGeo.translate(0, height * 0.5, 0)
    railingGeos.push(midRailGeo)

    const bottomRailGeo = new THREE.BoxGeometry(width, 0.06, 0.06)
    bottomRailGeo.translate(0, 0.03, 0)
    railingGeos.push(bottomRailGeo)

    const balusterCount = postCount * 2 - 1
    for (let i = 0; i < balusterCount; i++) {
      const x = -width / 2 + i * (width / (balusterCount - 1))
      const balGeo = new THREE.BoxGeometry(0.03, height * 0.35, 0.03)
      balGeo.translate(x, height * 0.65, 0)
      railingGeos.push(balGeo)
    }

    const mergedGeo = mergeGeometries(railingGeos)
    const railingMesh = new THREE.Mesh(mergedGeo, material)
    railingMesh.castShadow = true
    group.add(railingMesh)
    railingGeos.forEach(g => g.dispose())

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
    paperMaterial.emissiveIntensity = lit ? 1.0 : 0.2

    const topCapGeo = new THREE.CylinderGeometry(0, size * 0.4, size * 0.12, 6)
    const topCap = new THREE.Mesh(topCapGeo, frameMaterial)
    topCap.position.y = size * 0.5
    topCap.castShadow = true
    group.add(topCap)

    const bottomBaseGeo = new THREE.CylinderGeometry(size * 0.4, 0, size * 0.12, 6)
    const bottomBase = new THREE.Mesh(bottomBaseGeo, frameMaterial)
    bottomBase.position.y = -size * 0.5
    bottomBase.rotation.x = Math.PI
    bottomBase.castShadow = true
    group.add(bottomBase)

    const panelGeo = new THREE.CylinderGeometry(size * 0.38, size * 0.42, size * 0.65, 6, 1, true)
    const panel = new THREE.Mesh(panelGeo, paperMaterial)
    panel.castShadow = true
    group.add(panel)

    const topRingGeo = new THREE.TorusGeometry(size * 0.4, size * 0.025, 6, 6)
    const topRing = new THREE.Mesh(topRingGeo, frameMaterial)
    topRing.position.y = size * 0.32
    topRing.rotation.x = Math.PI / 2
    group.add(topRing)

    const bottomRingGeo = new THREE.TorusGeometry(size * 0.4, size * 0.025, 6, 6)
    const bottomRing = new THREE.Mesh(bottomRingGeo, frameMaterial)
    bottomRing.position.y = -size * 0.32
    bottomRing.rotation.x = Math.PI / 2
    group.add(bottomRing)

    const tasselGeo = new THREE.CylinderGeometry(0.015, 0.008, size * 0.2, 6)
    const tassel = new THREE.Mesh(tasselGeo, MaterialLibrary.goldDecorative)
    tassel.position.y = -size * 0.65
    group.add(tassel)

    if (lit) {
      const light = new THREE.PointLight(0xff6633, 1.2, 6, 2)
      light.position.y = 0
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
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, trunkHeight, 6)
    const trunk = new THREE.Mesh(trunkGeo, trunkMaterial)
    trunk.position.y = trunkHeight / 2
    trunk.castShadow = true
    trunk.receiveShadow = true
    group.add(trunk)

    const foliageGeo = new THREE.SphereGeometry(height * 0.35, 8, 6)
    const foliage = new THREE.Mesh(foliageGeo, leavesMaterial)
    foliage.position.y = trunkHeight + height * 0.15
    foliage.scale.y = 0.7
    foliage.castShadow = true
    foliage.receiveShadow = true
    group.add(foliage)

    group.position.copy(position)
    return group
  }
}
