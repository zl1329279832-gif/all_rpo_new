<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, watch } from 'vue'
import { SceneManager } from '../three/core/SceneManager'
import { AnimationSystem } from '../three/animation/AnimationSystem'
import { RaycasterSystem } from '../three/interaction/Raycaster'
import type { IntersectionResult } from '../three/interaction/Raycaster'
import { LabelSystem } from '../three/interaction/LabelSystem'
import { partMetadata } from '../data/partMetadata'
import type { ViewMode } from '../types'
import * as THREE from 'three'

const props = defineProps<{
  viewMode: ViewMode
}>()

const containerRef = ref<HTMLElement | null>(null)
let sceneManager: SceneManager | null = null
let animationSystem: AnimationSystem | null = null
let raycasterSystem: RaycasterSystem | null = null
let labelSystem: LabelSystem | null = null
let isInitialized = false

const emit = defineEmits<{
  (e: 'part-click', result: IntersectionResult): void
  (e: 'part-hover', result: IntersectionResult | null): void
  (e: 'scene-ready'): void
  (e: 'animation-start'): void
  (e: 'animation-complete'): void
}>()

function initScene() {
  if (!containerRef.value || isInitialized) return
  isInitialized = true

  sceneManager = new SceneManager({
    container: containerRef.value,
    backgroundColor: 0x0a0a1a,
    fov: 60,
    near: 0.1,
    far: 1000,
  })

  const satelliteData = sceneManager.getSatelliteData()

  animationSystem = new AnimationSystem(satelliteData)
  animationSystem.start()

  raycasterSystem = new RaycasterSystem(
    sceneManager.getCamera(),
    sceneManager.getRenderer(),
    sceneManager.getScene()
  )

  raycasterSystem.setOnPartClick((result) => {
    emit('part-click', result)
    const metadata = partMetadata[result.partId]
    if (metadata && labelSystem) {
      labelSystem.showLabel(result.partId)
    }
  })

  raycasterSystem.setOnPartHover((result) => {
    emit('part-hover', result)
  })

  labelSystem = new LabelSystem(
    sceneManager.getScene(),
    sceneManager.getCamera(),
    containerRef.value
  )

  Object.entries(partMetadata).forEach(([id, metadata]) => {
    const part = satelliteData.parts.get(id)
    if (part) {
      const position = new THREE.Vector3()
      part.getWorldPosition(position)
      labelSystem!.addLabel(id, position, metadata)
    }
  })

  sceneManager.start()

  emit('scene-ready')
}

function getAnimationSystem(): AnimationSystem | null {
  return animationSystem
}

function getSceneManager(): SceneManager | null {
  return sceneManager
}

function getLabelSystem(): LabelSystem | null {
  return labelSystem
}

function resetCamera() {
  sceneManager?.resetCamera()
}

function setViewMode(mode: ViewMode) {
  sceneManager?.setViewMode(mode)
}

function closeLabel() {
  labelSystem?.hideActiveLabel()
}

async function playExplodedView(): Promise<void> {
  emit('animation-start')
  await animationSystem?.playExplodedView(1)
  emit('animation-complete')
}

async function resetExplodedView(): Promise<void> {
  emit('animation-start')
  await animationSystem?.resetExplodedView()
  emit('animation-complete')
}

async function playInternalView(): Promise<void> {
  emit('animation-start')
  await animationSystem?.playInternalView()
  emit('animation-complete')
}

async function resetInternalView(): Promise<void> {
  emit('animation-start')
  await animationSystem?.resetInternalView()
  emit('animation-complete')
}

async function deploySolarPanels(): Promise<void> {
  emit('animation-start')
  await animationSystem?.playSolarPanelDeployment(3000)
  emit('animation-complete')
}

watch(() => props.viewMode, (newMode) => {
  setViewMode(newMode)
})

provide('getAnimationSystem', getAnimationSystem)
provide('getSceneManager', getSceneManager)
provide('getLabelSystem', getLabelSystem)

defineExpose({
  getAnimationSystem,
  getSceneManager,
  getLabelSystem,
  resetCamera,
  setViewMode,
  closeLabel,
  playExplodedView,
  resetExplodedView,
  playInternalView,
  resetInternalView,
  deploySolarPanels,
})

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  raycasterSystem?.dispose()
  labelSystem?.dispose()
  animationSystem?.dispose()
  sceneManager?.dispose()
})
</script>

<template>
  <div 
  ref="containerRef" class="scene-container"></div>
</template>

<style scoped lang="scss">
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0a0a1a;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
