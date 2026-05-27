<template>
  <div class="app-container">
    <Header
      :statistics="statistics"
      @reset-view="handleResetView"
      @toggle-labels="handleToggleLabels"
      :labels-visible="labelsVisible"
    />

    <ThreeScene
      ref="sceneRef"
      @pick="handlePick"
      @scene-ready="handleSceneReady"
    />

    <DataPanel
      :statistics="statistics"
      :alarm-trends="alarmTrends"
      :region-risks="regionRisks"
      :response-stats="responseStats"
      class="data-panel"
    />

    <AlarmPanel
      :alarms="filteredAlarms"
      :alarm-filter="alarmFilter"
      @filter-change="handleAlarmFilterChange"
      @locate="handleLocateAlarm"
      @handle="handleHandleAlarm"
      class="alarm-panel"
    />

    <SearchBar
      :buildings="buildings"
      :devices="devices"
      @search="handleSearch"
      class="search-bar"
    />

    <DeviceDetail
      v-if="selectedDevice"
      :device="selectedDevice"
      @close="handleCloseDetail"
    />

    <div v-if="isSimulating" class="simulation-indicator">
      <span class="pulse-dot"></span>
      事件模拟中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Header from '@/components/Header.vue'
import ThreeScene from '@/components/ThreeScene.vue'
import DataPanel from '@/components/DataPanel.vue'
import AlarmPanel from '@/components/AlarmPanel.vue'
import SearchBar from '@/components/SearchBar.vue'
import DeviceDetail from '@/components/DeviceDetail.vue'
import { SceneManager, type PickResult } from '@/three'
import { buildings, devices, gates, alarms, statistics, alarmTrends, regionRisks, responseStats } from '@/data'
import type { Device, Alarm, AlarmLevel } from '@/types'

const sceneRef = ref<InstanceType<typeof ThreeScene> | null>(null)
const sceneManager = ref<SceneManager | null>(null)
const selectedDevice = ref<Device | null>(null)
const labelsVisible = ref(true)
const alarmFilter = ref<AlarmLevel | 'all'>('all')
const isSimulating = ref(false)
const simulationInterval = ref<number | null>(null)
const alarmList = ref([...alarms])

const filteredAlarms = computed(() => {
  if (alarmFilter.value === 'all') return alarmList.value
  return alarmList.value.filter(a => a.level === alarmFilter.value)
})

const handleSceneReady = (manager: SceneManager) => {
  sceneManager.value = manager
  manager.loadBuildings(buildings)
  manager.loadDevices(devices)
  manager.loadGates(gates)

  alarms.forEach(alarm => {
    if (alarm.status !== 'resolved') {
      manager.showAlarm(alarm)
    }
  })

  manager.setOnPickCallback(handlePick)
}

const handlePick = (result: PickResult) => {
  if (result.type === 'device' && result.data) {
    selectedDevice.value = result.data as Device
    if (sceneManager.value && result.object) {
      sceneManager.value.selectObject(result.object)
    }
  }
}

const handleResetView = () => {
  sceneManager.value?.resetView()
  selectedDevice.value = null
}

const handleToggleLabels = () => {
  labelsVisible.value = !labelsVisible.value
  sceneManager.value?.setLabelsVisible(labelsVisible.value)
}

const handleSearch = (item: { type: 'building' | 'device'; data: any }) => {
  if (sceneManager.value) {
    sceneManager.value.focusPosition(item.data.position)
    if (item.type === 'device') {
      selectedDevice.value = item.data as Device
    }
  }
}

const handleAlarmFilterChange = (filter: AlarmLevel | 'all') => {
  alarmFilter.value = filter
}

const handleLocateAlarm = (alarm: Alarm) => {
  if (sceneManager.value) {
    sceneManager.value.focusPosition(alarm.position, 30)
  }
}

const handleHandleAlarm = (alarm: Alarm) => {
  const alarmIndex = alarmList.value.findIndex(a => a.id === alarm.id)
  if (alarmIndex !== -1) {
    alarmList.value[alarmIndex] = {
      ...alarmList.value[alarmIndex],
      status: 'handling',
      handler: '当前用户',
      handleTime: new Date().toLocaleString()
    }
  }
}

const handleCloseDetail = () => {
  selectedDevice.value = null
}

const startSimulation = () => {
  if (isSimulating.value) return
  isSimulating.value = true

  let alarmIndex = 0
  const alarmTypes = ['烟雾告警', '入侵检测', '设备故障', '视频丢失', '消防告警']
  const levels: AlarmLevel[] = ['low', 'medium', 'high', 'critical']

  simulationInterval.value = window.setInterval(() => {
    if (!sceneManager.value) return

    const building = buildings[Math.floor(Math.random() * buildings.length)]
    const pos = {
      x: building.position.x + (Math.random() - 0.5) * 20,
      y: Math.random() * building.size.height,
      z: building.position.z + (Math.random() - 0.5) * 15
    }

    const newAlarm: Alarm = {
      id: `sim_alarm_${Date.now()}`,
      deviceId: `dev_sim_${alarmIndex++}`,
      deviceName: `模拟设备-${String(alarmIndex).padStart(3, '0')}`,
      type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      status: 'unhandled',
      position: pos,
      buildingId: building.id,
      floor: Math.floor(Math.random() * building.floors) + 1,
      time: new Date().toLocaleString(),
      description: `模拟告警事件 - ${building.name}`
    }

    alarmList.value.unshift(newAlarm)
    sceneManager.value.showAlarm(newAlarm)

    setTimeout(() => {
      if (sceneManager.value) {
        sceneManager.value.removeAlarm(newAlarm.id)
        const idx = alarmList.value.findIndex(a => a.id === newAlarm.id)
        if (idx !== -1) {
          alarmList.value[idx] = {
            ...alarmList.value[idx],
            status: 'resolved'
          }
        }
      }
    }, 8000)
  }, 5000)
}

const stopSimulation = () => {
  isSimulating.value = false
  if (simulationInterval.value) {
    clearInterval(simulationInterval.value)
    simulationInterval.value = null
  }
}

onMounted(() => {
  setTimeout(startSimulation, 2000)
})

onUnmounted(() => {
  stopSimulation()
  sceneManager.value?.dispose()
})

defineExpose({
  startSimulation,
  stopSimulation
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bg-dark);
}

.data-panel {
  position: absolute;
  top: 70px;
  left: 20px;
  width: 320px;
  max-height: calc(100% - 100px);
}

.alarm-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 380px;
  max-height: calc(100% - 100px);
}

.search-bar {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
}

.simulation-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 77, 79, 0.9);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
</style>
