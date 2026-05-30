<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/composables/useThreeScene'
import { useModelFactory } from '@/composables/useModelFactory'
import { useAnimationLoop } from '@/composables/useAnimationLoop'
import { useCameraAnimation } from '@/composables/useCameraAnimation'
import { useLabelSystem } from '@/composables/useLabelSystem'
import { useDeviceStore, useSceneStore } from '@/stores'
import type { DeviceData } from '@/types'

const SCENE_CONTAINER_ID = 'three-scene-container'

const deviceStore = useDeviceStore()
const sceneStore = useSceneStore()
const modelFactory = useModelFactory()

const { init, startLoop, destroy, getScene, getCamera, getControls } = useThreeScene(SCENE_CONTAINER_ID)

const deviceGroups = new Map<string, THREE.Group>()
let cameraAnim: ReturnType<typeof useCameraAnimation> | null = null
let animLoop: ReturnType<typeof useAnimationLoop> | null = null
let dataUpdateTimer: number | null = null
let waterLevelTimer: number | null = null

const onDeviceClick = (device: DeviceData | null) => {
  deviceStore.selectDevice(device)
}

watch(() => deviceStore.currentArea, (area) => {
  cameraAnim?.flyTo(area)
})

watch(() => deviceStore.alarmFilter, () => {
  updateDeviceVisibility()
})

watch(() => deviceStore.devices, (devices) => {
  devices.forEach(device => {
    const group = deviceGroups.get(device.id)
    if (group) {
      modelFactory.updateDeviceStatus(group, device)
    }
  })
}, { deep: true })

watch(() => sceneStore.playProgress, (progress) => {
  const idx = Math.floor(progress)
  const level = sceneStore.waterLevelData.levels[idx] ?? 3.0
  updateWaterLevel(level)
})

function updateWaterLevel(level: number) {
  const scene = getScene()
  if (!scene) return
  scene.traverse((child) => {
    if (child.userData?.deviceType === 'pool') {
      child.traverse((mesh) => {
        if (mesh.name === 'water' && mesh instanceof THREE.Mesh) {
          mesh.position.y = -1 + level * 0.4
        }
      })
    }
  })
}

function updateDeviceVisibility() {
  const devices = deviceStore.devices
  const filter = deviceStore.alarmFilter

  deviceGroups.forEach((group, id) => {
    const device = devices.find(d => d.id === id)
    if (!device) return
    if (filter) {
      group.visible = device.alarms.some(a => a.level === filter)
    } else {
      group.visible = true
    }
  })
}

onMounted(() => {
  init()
  const scene = getScene()
  const camera = getCamera()
  const controls = getControls()
  if (!scene || !camera || !controls) return

  cameraAnim = useCameraAnimation(camera, controls)
  animLoop = useAnimationLoop(scene)

  const devices = deviceStore.devices
  devices.forEach(device => {
    const group = modelFactory.createDevice(device)
    scene.add(group)
    deviceGroups.set(device.id, group)
  })

  const pipes = modelFactory.createPipes(devices)
  pipes.forEach(pipe => scene.add(pipe))

  const building = modelFactory.createPumpHouseBuilding()
  scene.add(building)

  const labelSystem = useLabelSystem(scene)
  labelSystem.addLabels(devices, deviceGroups)

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const container = document.getElementById(SCENE_CONTAINER_ID)
  if (container) {
    container.addEventListener('click', (event) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      let foundDevice: DeviceData | null = null
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object
        while (obj) {
          if (obj.userData?.deviceId) {
            foundDevice = devices.find(d => d.id === obj!.userData.deviceId) ?? null
            break
          }
          obj = obj.parent
        }
        if (foundDevice) break
      }
      onDeviceClick(foundDevice)
    })

    container.addEventListener('mousemove', (event) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      let found = false
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object
        while (obj) {
          if (obj.userData?.deviceId) {
            found = true
            break
          }
          obj = obj.parent
        }
        if (found) break
      }
      container.style.cursor = found ? 'pointer' : 'default'
    })
  }

  startLoop((time) => {
    cameraAnim?.update()
    animLoop?.updateAnimations(time, devices, sceneStore.waterLevelData.levels[Math.floor(sceneStore.playProgress)] ?? 3.0)

    if (sceneStore.isPlaying) {
      const newProgress = sceneStore.playProgress + sceneStore.playSpeed * 0.02
      if (newProgress >= sceneStore.waterLevelData.levels.length - 1) {
        sceneStore.isPlaying = false
        sceneStore.playProgress = sceneStore.waterLevelData.levels.length - 1
      } else {
        sceneStore.playProgress = newProgress
      }
    }
  })

  dataUpdateTimer = window.setInterval(() => {
    deviceStore.updateData()
  }, 3000)

  waterLevelTimer = window.setInterval(() => {
    sceneStore.refreshMetrics()
  }, 10000)
})

onBeforeUnmount(() => {
  destroy()
  if (dataUpdateTimer) clearInterval(dataUpdateTimer)
  if (waterLevelTimer) clearInterval(waterLevelTimer)
})
</script>

<template>
  <div :id="SCENE_CONTAINER_ID" class="scene-container"></div>
</template>

<style scoped>
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
