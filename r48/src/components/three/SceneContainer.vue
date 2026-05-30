<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/composables/useThreeScene'
import { useModelFactory } from '@/composables/useModelFactory'
import { useAnimationLoop } from '@/composables/useAnimationLoop'
import { useCameraAnimation } from '@/composables/useCameraAnimation'
import { useLabelSystem } from '@/composables/useLabelSystem'
import { useDeviceStore, useSceneStore, useAlarmStore } from '@/stores'
import type { DeviceData, PlaybackFrame } from '@/types'

const SCENE_CONTAINER_ID = 'three-scene-container'

const deviceStore = useDeviceStore()
const sceneStore = useSceneStore()
const alarmStore = useAlarmStore()
const modelFactory = useModelFactory()

const { init, startLoop, destroy, getScene, getCamera, getControls, getRenderer, getLabelRenderer } = useThreeScene(SCENE_CONTAINER_ID)

const deviceGroups = new Map<string, THREE.Group>()
let cameraAnim: ReturnType<typeof useCameraAnimation> | null = null
let animLoop: ReturnType<typeof useAnimationLoop> | null = null
let labelSystem: ReturnType<typeof useLabelSystem> | null = null
let dataUpdateTimer: number | null = null
let waterLevelTimer: number | null = null
let occlusionTimer: number | null = null
let resizeObserver: ResizeObserver | null = null

const onDeviceClick = (device: DeviceData | null) => {
  deviceStore.selectDevice(device)
  if (device) {
    deviceStore.highlightDevice(device.id)
  }
}

watch(() => deviceStore.currentArea, (area) => {
  cameraAnim?.flyTo(area)
})

watch(() => deviceStore.alarmFilter, () => {
  updateDeviceVisibility()
})

watch(() => deviceStore.highlightedDeviceId, (deviceId) => {
  deviceGroups.forEach((group, id) => {
    modelFactory.highlightDevice(group, id === deviceId)
  })
  labelSystem?.setHighlight(deviceId, deviceId !== null)
})

watch(() => deviceStore.selectedDevice?.id, (deviceId) => {
  if (deviceId) {
    const device = deviceStore.devices.find(d => d.id === deviceId)
    if (device) {
      flyToDevice(device)
    }
  }
})

watch(() => alarmStore.selectedAlarm, (alarm) => {
  if (alarm?.deviceId) {
    const device = deviceStore.devices.find(d => d.id === alarm.deviceId)
    if (device) {
      deviceStore.locateDevice(alarm.deviceId)
    }
  }
})

watch(() => deviceStore.devices, (devices) => {
  devices.forEach(device => {
    const group = deviceGroups.get(device.id)
    if (group) {
      modelFactory.updateDeviceStatus(group, device)
    }
  })
  labelSystem?.updateAllLabels(devices)
}, { deep: true })

watch(() => sceneStore.playProgress, (progress) => {
  if (sceneStore.playbackMode && sceneStore.playbackData) {
    const idx = Math.floor((progress / 100) * (sceneStore.playbackData.frames.length - 1))
    const frame = sceneStore.playbackData.frames[idx]
    if (frame) {
      applyPlaybackFrame(frame)
    }
  } else {
    const idx = Math.floor(progress)
    const level = sceneStore.waterLevelData.levels[idx] ?? 3.0
    updateWaterLevel(level)
  }
})

watch(() => sceneStore.playbackMode, (isPlayback) => {
  if (!isPlayback) {
    deviceStore.devices.forEach(device => {
      const group = deviceGroups.get(device.id)
      if (group) {
        modelFactory.updateDeviceStatus(group, device)
      }
    })
    labelSystem?.updateAllLabels(deviceStore.devices)
    updateWaterLevel(sceneStore.waterLevelData.levels[Math.floor(sceneStore.playProgress)] ?? 3.0)
  }
})

function flyToDevice(device: DeviceData) {
  if (!cameraAnim) return
  const group = deviceGroups.get(device.id)
  if (!group) return
  
  const camera = getCamera()
  if (!camera) return
  
  const box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const distance = maxDim * 3 + 5
  
  const direction = new THREE.Vector3(1, 0.8, 1).normalize()
  const cameraPos = center.clone().add(direction.multiplyScalar(distance))
  
  cameraAnim.flyToPosition(cameraPos, center)
}

function applyPlaybackFrame(frame: PlaybackFrame) {
  const scene = getScene()
  if (!scene) return
  
  frame.devices.forEach(deviceData => {
    const group = deviceGroups.get(deviceData.id)
    if (group) {
      modelFactory.updateDeviceStatus(group, deviceData)
    }
  })
  
  labelSystem?.updateAllLabels(frame.devices)
  updateWaterLevel(frame.waterLevel)
  updatePipeFlow(frame.flowRate)
}

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

function updatePipeFlow(flowRate: number) {
  const scene = getScene()
  if (!scene) return
  scene.traverse((child) => {
    if (child.name === 'pipeParticles' && child instanceof THREE.Points) {
      child.visible = flowRate > 0
      const speed = Math.max(0.005, flowRate * 0.002)
      child.userData.flowSpeed = speed
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

function handleResize() {
  const camera = getCamera()
  const renderer = getRenderer()
  const labelRenderer = getLabelRenderer()
  const container = document.getElementById(SCENE_CONTAINER_ID)
  
  if (!camera || !renderer || !container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  
  renderer.setSize(width, height)
  if (labelRenderer) {
    labelRenderer.setSize(width, height)
  }
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

  labelSystem = useLabelSystem(scene, camera)
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

    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(container)
  }

  startLoop((time) => {
    cameraAnim?.update()
    
    const currentDevices = sceneStore.playbackMode && sceneStore.currentFrame?.devices 
      ? sceneStore.currentFrame.devices 
      : deviceStore.devices
    const currentWaterLevel = sceneStore.playbackMode && sceneStore.currentFrame
      ? sceneStore.currentFrame.waterLevel
      : sceneStore.waterLevelData.levels[Math.floor(sceneStore.playProgress)] ?? 3.0
    
    animLoop?.updateAnimations(time, currentDevices, currentWaterLevel)
    labelSystem?.updateOcclusion()

    if (sceneStore.isPlaying) {
      if (sceneStore.playbackMode && sceneStore.playbackData) {
        const newProgress = sceneStore.playProgress + sceneStore.playSpeed * 0.1
        if (newProgress >= 100) {
          sceneStore.isPlaying = false
          sceneStore.playProgress = 100
        } else {
          sceneStore.playProgress = newProgress
        }
      } else {
        const newProgress = sceneStore.playProgress + sceneStore.playSpeed * 0.02
        if (newProgress >= sceneStore.waterLevelData.levels.length - 1) {
          sceneStore.isPlaying = false
          sceneStore.playProgress = sceneStore.waterLevelData.levels.length - 1
        } else {
          sceneStore.playProgress = newProgress
        }
      }
    }
  })

  dataUpdateTimer = window.setInterval(() => {
    if (!sceneStore.playbackMode) {
      deviceStore.updateData()
    }
  }, 3000)

  waterLevelTimer = window.setInterval(() => {
    if (!sceneStore.playbackMode) {
      sceneStore.refreshMetrics()
    }
  }, 10000)

  occlusionTimer = window.setInterval(() => {
    labelSystem?.updateOcclusion()
  }, 500)

  nextTick(() => {
    handleResize()
  })
})

onBeforeUnmount(() => {
  destroy()
  modelFactory.clearCache()
  
  if (dataUpdateTimer) clearInterval(dataUpdateTimer)
  if (waterLevelTimer) clearInterval(waterLevelTimer)
  if (occlusionTimer) clearInterval(occlusionTimer)
  if (resizeObserver) {
    const container = document.getElementById(SCENE_CONTAINER_ID)
    if (container) resizeObserver.unobserve(container)
    resizeObserver.disconnect()
  }
  
  deviceGroups.forEach((group) => {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  })
  deviceGroups.clear()
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
