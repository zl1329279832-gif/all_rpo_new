<template>
  <div ref="containerRef" class="scene-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { SceneManager } from '@/scene/SceneManager'
import { ModelFactory } from '@/scene/ModelFactory'
import { InstancedRenderer } from '@/scene/InstancedRenderer'
import { RaycasterManager } from '@/scene/Raycaster'
import { LabelManager } from '@/scene/LabelManager'
import { AnimationManager } from '@/scene/AnimationManager'
import { MockDataService } from '@/services/MockDataService'
import type { BaseObject, Container, Truck, QuayCrane, Berth, YardBlock, AlertLevel } from '@/types'
import { SceneConfig } from '@/scene/config'

const props = defineProps<{
  selectedArea: string
  alertLevels: AlertLevel[]
  showLabels: boolean
  animationEnabled: boolean
  animationSpeed: number
}>()

const emit = defineEmits<{
  (e: 'objectClick', data: BaseObject | Container | null): void
  (e: 'dataUpdate', data: {
    berths: Berth[]
    yardBlocks: YardBlock[]
    cranes: QuayCrane[]
    trucks: Truck[]
    containers: Container[]
  }): void
}>()

const containerRef = ref<HTMLElement | null>(null)

let sceneManager: SceneManager | null = null
let instancedRenderer: InstancedRenderer | null = null
let raycasterManager: RaycasterManager | null = null
let labelManager: LabelManager | null = null
let animationManager: AnimationManager | null = null

const sceneObjects = ref<{
  berths: Berth[]
  yardBlocks: YardBlock[]
  cranes: QuayCrane[]
  trucks: Truck[]
  containers: Container[]
}>({
  berths: [],
  yardBlocks: [],
  cranes: [],
  trucks: [],
  containers: []
})

const objectGroups = ref<Map<string, THREE.Object3D>>(new Map())

const initScene = () => {
  if (!containerRef.value) return

  sceneManager = new SceneManager(containerRef.value)
  instancedRenderer = new InstancedRenderer(sceneManager.scene, SceneConfig.containerCount)
  raycasterManager = new RaycasterManager(sceneManager.camera, sceneManager.renderer.domElement)
  labelManager = new LabelManager(sceneManager.camera, containerRef.value)
  animationManager = new AnimationManager(sceneManager.scene)

  raycasterManager.setInstancedRenderer(instancedRenderer)

  generateSceneData()
  setupInteraction()
  setupAnimationLoop()
}

const generateSceneData = () => {
  if (!sceneManager || !instancedRenderer || !animationManager || !labelManager) return

  const berths = MockDataService.generateBerths(SceneConfig.berthCount)
  const yardBlocks = MockDataService.generateYardBlocks(SceneConfig.yardBlockCount)
  const cranes = MockDataService.generateQuayCranes(SceneConfig.craneCount)
  const trucks = MockDataService.generateTrucks(SceneConfig.truckCount, yardBlocks)
  const containers = MockDataService.generateContainers(SceneConfig.containerCount, yardBlocks)
  const roads = MockDataService.generateRoads(yardBlocks)

  sceneObjects.value = { berths, yardBlocks, cranes, trucks, containers }

  emit('dataUpdate', { berths, yardBlocks, cranes, trucks, containers })

  const targetObjects: THREE.Object3D[] = []

  berths.forEach(berth => {
    const mesh = ModelFactory.createBerth(berth)
    sceneManager!.scene.add(mesh)
    objectGroups.value.set(berth.id, mesh)
    targetObjects.push(mesh)
    labelManager!.createObjectLabel(berth, new THREE.Vector3(berth.position.x, 5, berth.position.z))
  })

  yardBlocks.forEach(block => {
    const mesh = ModelFactory.createYardBlock(block)
    sceneManager!.scene.add(mesh)
    objectGroups.value.set(block.id, mesh)
    targetObjects.push(mesh)
    labelManager!.createObjectLabel(block, new THREE.Vector3(block.position.x, 3, block.position.z))
  })

  cranes.forEach(crane => {
    const mesh = ModelFactory.createQuayCrane(crane)
    sceneManager!.scene.add(mesh)
    objectGroups.value.set(crane.id, mesh)
    targetObjects.push(mesh)
    animationManager!.addCraneAnimation(crane.id, mesh)
    labelManager!.createObjectLabel(crane, new THREE.Vector3(crane.position.x, crane.height + 8, crane.position.z))
  })

  trucks.forEach(truck => {
    const mesh = ModelFactory.createTruck(truck)
    sceneManager!.scene.add(mesh)
    objectGroups.value.set(truck.id, mesh)
    targetObjects.push(mesh)
    if (truck.path) {
      animationManager!.addTruckAnimation(truck.id, mesh, truck.path, 0.003)
    }
  })

  roads.forEach(road => {
    const mesh = ModelFactory.createRoad(road)
    sceneManager!.scene.add(mesh)
    objectGroups.value.set(road.id, mesh)
  })

  instancedRenderer.createInstancedContainers(containers)

  raycasterManager!.setTargetObjects(targetObjects)
}

const setupInteraction = () => {
  if (!raycasterManager) return

  raycasterManager.onClick((result) => {
    if (result) {
      emit('objectClick', result.data)
    } else {
      emit('objectClick', null)
    }
  })
}

const setupAnimationLoop = () => {
  if (!sceneManager || !animationManager || !labelManager) return

  const animate = (delta: number) => {
    if (props.animationEnabled) {
      animationManager!.update(delta)
    }
    labelManager!.updateLabels()
  }

  sceneManager.onRender(animate)
}

const filterByArea = (area: string) => {
  if (!objectGroups.value.size) return

  objectGroups.value.forEach((obj, id) => {
    let visible = true

    if (area !== 'all') {
      if (area === 'berth') {
        visible = id.startsWith('berth') || id.startsWith('crane')
      } else if (area === 'yard') {
        visible = id.startsWith('yard') || id.startsWith('container')
      } else if (area === 'road') {
        visible = id.startsWith('road') || id.startsWith('truck')
      }
    }

    obj.visible = visible
  })

  if (instancedRenderer) {
    instancedRenderer.setVisibility(area === 'all' || area === 'yard')
  }
}

const focusOnObject = (data: BaseObject | Container) => {
  if (!sceneManager) return
  
  const pos = new THREE.Vector3(
    data.position.x,
    data.position.y + 5,
    data.position.z
  )
  sceneManager.focusOn(pos, 40)

  if (instancedRenderer && data.type === 'container') {
    instancedRenderer.highlightContainer(data.id)
  }
}

const playTruckRoute = (truckId: string) => {
  if (!animationManager) return
  animationManager.playTruckRoute(truckId)
}

const resetCamera = () => {
  sceneManager?.resetCamera()
  instancedRenderer?.clearHighlight()
}

watch(() => props.selectedArea, (newArea) => {
  filterByArea(newArea)
})

watch(() => props.showLabels, (show) => {
  labelManager?.setEnabled(show)
})

watch(() => props.animationEnabled, (enabled) => {
  animationManager?.setEnabled(enabled)
})

watch(() => props.animationSpeed, (speed) => {
  animationManager?.setSpeed(speed)
})

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  animationManager?.destroy()
  labelManager?.destroy()
  raycasterManager?.destroy()
  instancedRenderer?.dispose()
  sceneManager?.destroy()
  ModelFactory.dispose()
})

defineExpose({
  focusOnObject,
  playTruckRoute,
  resetCamera
})
</script>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
