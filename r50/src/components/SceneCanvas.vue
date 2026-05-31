<template>
  <div ref="containerRef" class="scene-canvas"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { SceneManager } from '@/scene/SceneManager'
import { LightingSystem } from '@/lighting/LightingSystem'
import { CameraControls } from '@/controls/CameraControls'
import { ComponentLabelSystem } from '@/interactions/ComponentLabelSystem'
import { useSceneStore } from '@/stores/sceneStore'
import { TextureManager } from '@/materials/TextureManager'

const containerRef = ref<HTMLDivElement | null>(null)
const sceneStore = useSceneStore()

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let sceneManager: SceneManager | null = null
let lightingSystem: LightingSystem | null = null
let cameraControls: CameraControls | null = null
let labelSystem: ComponentLabelSystem | null = null
let animationFrameId: number = 0
let clock: THREE.Clock = new THREE.Clock()
let lastRenderTime: number = 0
const TARGET_FPS: number = 60
const FRAME_INTERVAL: number = 1000 / TARGET_FPS

function initScene() {
  if (!containerRef.value) return

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    60,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    500
  )

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false,
    preserveDrawingBuffer: false
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.info.autoReset = true
  containerRef.value.appendChild(renderer.domElement)

  sceneManager = new SceneManager(scene)
  lightingSystem = new LightingSystem(scene)
  cameraControls = new CameraControls(camera, renderer.domElement)
  labelSystem = new ComponentLabelSystem(scene, camera, renderer)

  labelSystem.registerRecursive(sceneManager.getRoot())

  labelSystem.setOnSelectCallback((info) => {
    sceneStore.setSelectedComponent(info)
  })

  labelSystem.setOnHoverCallback((info) => {
    sceneStore.setHoveredComponent(info)
  })

  animate()
}

function animate() {
  animationFrameId = requestAnimationFrame(animate)

  const now = performance.now()
  const delta = clock.getDelta()
  const elapsed = clock.getElapsedTime()

  if (cameraControls) {
    cameraControls.update(delta)
  }

  if (now - lastRenderTime >= FRAME_INTERVAL) {
    lastRenderTime = now

    if (sceneManager) {
      sceneManager.animate(elapsed)
    }

    if (lightingSystem) {
      lightingSystem.update(elapsed)
    }

    if (labelSystem) {
      labelSystem.update()
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
}

function handleResize() {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

watch(() => sceneStore.lightMode, (newMode) => {
  if (lightingSystem) {
    lightingSystem.setMode(newMode)
  }
})

watch(() => sceneStore.cameraMode, (newMode) => {
  if (cameraControls) {
    cameraControls.setMode(newMode)
  }
})

watch(() => sceneStore.structureLayer, (newLayer) => {
  if (sceneManager) {
    sceneManager.setLayer(newLayer)
  }
})

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)

  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
  }

  sceneManager?.dispose()
  lightingSystem?.dispose()
  cameraControls?.dispose()
  labelSystem?.dispose()
  TextureManager.getInstance().clearCache()
  renderer?.dispose()
})
</script>

<style scoped>
.scene-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
