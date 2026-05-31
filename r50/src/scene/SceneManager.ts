import * as THREE from 'three'
import { StructureLayer } from '@/types'
import { BuildingComponents } from '@/builders/BuildingComponents'
import { BaseComponents } from '@/builders/BaseComponents'

export class SceneManager {
  private scene: THREE.Scene
  private rootGroup: THREE.Group = new THREE.Group()

  private ground!: THREE.Group
  private courtyardWalls!: THREE.Group
  private paifang!: THREE.Group
  private mainHall!: THREE.Group
  private eastWing!: THREE.Group
  private westWing!: THREE.Group
  private environmentGroup: THREE.Group = new THREE.Group()

  private layers: Record<StructureLayer, THREE.Object3D[]> = {
    foundation: [],
    columns: [],
    walls: [],
    roof: [],
    all: []
  }

  private currentLayer: StructureLayer = 'all'

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.scene.add(this.rootGroup)
    this.buildScene()
    this.collectLayers()
  }

  private buildScene(): void {
    this.ground = BuildingComponents.createGround(50, 50)
    this.rootGroup.add(this.ground)

    this.courtyardWalls = BuildingComponents.createCourtyardWalls(28, 22, 3.5)
    this.rootGroup.add(this.courtyardWalls)

    this.paifang = BuildingComponents.createPaifang(9, 7, new THREE.Vector3(0, 0, -11))
    this.rootGroup.add(this.paifang)

    this.mainHall = BuildingComponents.createMainHall(10, 6, 4.2, new THREE.Vector3(0, 0, 5))
    this.rootGroup.add(this.mainHall)

    this.eastWing = BuildingComponents.createWingRoom(
      7, 4.5, 3.2,
      new THREE.Vector3(9, 0, 3),
      -Math.PI / 2
    )
    this.rootGroup.add(this.eastWing)

    this.westWing = BuildingComponents.createWingRoom(
      7, 4.5, 3.2,
      new THREE.Vector3(-9, 0, 3),
      Math.PI / 2
    )
    this.rootGroup.add(this.westWing)

    this.createEnvironment()
    this.rootGroup.add(this.environmentGroup)
  }

  private createEnvironment(): void {
    const treePositions = [
      { x: -12, z: -5 },
      { x: 12, z: -5 },
      { x: -11, z: 8 },
      { x: 11, z: 8 },
      { x: -5, z: -8 },
      { x: 5, z: -8 }
    ]

    treePositions.forEach((pos, index) => {
      const height = 4 + Math.random() * 2
      const tree = BaseComponents.createTree(height, new THREE.Vector3(pos.x, 0, pos.z))
      tree.userData.componentId = 'tree'
      this.environmentGroup.add(tree)
    })

    const lanternPositions = [
      { x: -4.5, y: 3, z: -10.5 },
      { x: 4.5, y: 3, z: -10.5 },
      { x: -2, y: 3, z: -10.5 },
      { x: 2, y: 3, z: -10.5 },
      { x: -6, y: 3, z: 5 },
      { x: 6, y: 3, z: 5 },
      { x: -12, y: 2.8, z: -1 },
      { x: 12, y: 2.8, z: -1 }
    ]

    lanternPositions.forEach(pos => {
      const lantern = BaseComponents.createLantern(0.3, new THREE.Vector3(pos.x, pos.y, pos.z), false)
      lantern.userData.componentId = 'lantern'
      this.environmentGroup.add(lantern)
    })

    const stonePlanterGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.6, 8)
    const stonePlanterMat = new THREE.MeshStandardMaterial({ color: 0x8a8a7a, roughness: 0.9 })
    const planterPositions = [
      { x: -6, z: -7 },
      { x: 6, z: -7 },
      { x: -3, z: -2 },
      { x: 3, z: -2 }
    ]

    const plantGeo = new THREE.SphereGeometry(0.7, 8, 6)
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.8 })
    planterPositions.forEach(pos => {
      const planter = new THREE.Mesh(stonePlanterGeo, stonePlanterMat)
      planter.position.set(pos.x, 0.3, pos.z)
      planter.castShadow = true
      planter.receiveShadow = true
      planter.userData.componentId = 'railing'
      this.environmentGroup.add(planter)

      const plant = new THREE.Mesh(plantGeo, plantMat)
      plant.position.set(pos.x, 1.2, pos.z)
      plant.scale.y = 0.6
      plant.castShadow = true
      this.environmentGroup.add(plant)
    })
  }

  private collectLayers(): void {
    this.rootGroup.traverse(obj => {
      const layer = obj.userData.layer as StructureLayer | undefined
      if (layer) {
        this.layers[layer].push(obj)
      }
      this.layers.all.push(obj)
    })
  }

  setLayer(layer: StructureLayer): void {
    this.currentLayer = layer

    const showLayers: StructureLayer[] = layer === 'all'
      ? ['foundation', 'columns', 'walls', 'roof']
      : [layer]

    this.rootGroup.traverse(obj => {
      if (obj.userData.layer) {
        obj.visible = showLayers.includes(obj.userData.layer)
      }
    })

    this.environmentGroup.visible = layer === 'all' || layer === 'foundation'
    this.ground.visible = true
  }

  getLayer(): StructureLayer {
    return this.currentLayer
  }

  getClickableObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = []
    this.rootGroup.traverse(obj => {
      if (obj.userData.componentId) {
        objects.push(obj)
      }
    })
    return objects
  }

  getRoot(): THREE.Group {
    return this.rootGroup
  }

  private lastAnimTime: number = 0
  private readonly ANIM_INTERVAL: number = 0.1

  animate(time: number): void {
    if (time - this.lastAnimTime < this.ANIM_INTERVAL) return
    this.lastAnimTime = time

    const children = this.environmentGroup.children
    for (let i = 0; i < children.length; i++) {
      const obj = children[i]
      if (obj.userData.componentId === 'tree') {
        obj.rotation.y = Math.sin(time * 0.3 + obj.position.x) * 0.02
      } else if (obj instanceof THREE.PointLight) {
        obj.intensity = 1.2 + Math.sin(time * 2 + obj.position.x) * 0.15
      }
    }
  }

  dispose(): void {
    this.rootGroup.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
}
