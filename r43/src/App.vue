<template>
  <div class="app-container">
    <Sidebar
      :arrays="arrays"
      :patrol-routes="patrolRoutes"
      :selected-array="selectedArray"
      :selected-status="selectedStatus"
      :selected-route="selectedRoute"
      :total-devices="totalDevices"
      :fault-count="statistics.faultCount"
      :online-rate="statistics.onlineRate"
      @array-click="handleArrayClick"
      @filter-change="handleFilterChange"
      @route-click="handleRouteClick"
    />

    <div class="main-content">
      <ControlPanel
        :statistics="statistics"
        :alarm-count="alarms.length"
        :is-patrolling="isPatrolling"
        :selected-route="selectedRoute"
        @reset-view="handleResetView"
        @start-patrol="handleStartPatrol"
        @stop-patrol="handleStopPatrol"
      />

      <div class="scene-container" ref="sceneContainer">
        <div 
          v-if="selectedDevice" 
          class="device-detail-overlay"
          @click.stop
        >
          <DeviceDetailPanel
            :device="selectedDevice"
            @close="selectedDevice = null"
            @locate="handleDeviceLocate"
            @add-to-patrol="handleAddToPatrol"
          />
        </div>

        <div v-if="patrolProgress && isPatrolling" class="patrol-overlay">
          <div class="patrol-info">
            <div class="patrol-title">🛣️ {{ patrolProgress.routeName }}</div>
            <div class="patrol-current">
              当前巡检点: {{ patrolProgress.currentPointName }}
            </div>
            <div class="patrol-bar-wrapper">
              <div 
                class="patrol-bar" 
                :style="{ width: `${patrolProgress.progress * 100}%` }"
              ></div>
            </div>
            <div class="patrol-percentage">
              {{ (patrolProgress.progress * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <StatsPanel
      :power-data="powerData"
      :fault-ranking="faultRanking"
      :online-rate="statistics.onlineRate"
      :maintenance-progress="statistics.maintenanceProgress"
      :maintenance-count="maintenanceCount"
      :alarms="alarms"
      @locate="handleDeviceLocate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { PVStationScene } from '@/three/PVStationScene'
import { PatrolProgress } from '@/three/patrol/PatrolSimulator'
import Sidebar from '@/components/Sidebar.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import DeviceDetailPanel from '@/components/DeviceDetailPanel.vue'
import type { 
  DeviceData, 
  DeviceStatus, 
  ArrayData, 
  PatrolRoute, 
  AlarmData,
  StatisticsData,
  PowerGenerationData,
  FaultRankingData
} from '@/types'

const sceneContainer = ref<HTMLElement | null>(null)
let pvStation: PVStationScene | null = null

const arrays = ref<ArrayData[]>([])
const patrolRoutes = ref<PatrolRoute[]>([])
const alarms = ref<AlarmData[]>([])
const powerData = ref<PowerGenerationData[]>([])
const faultRanking = ref<FaultRankingData[]>([])

const selectedArray = ref<string | null>(null)
const selectedStatus = ref<DeviceStatus | null>(null)
const selectedRoute = ref<string | null>(null)
const selectedDevice = ref<DeviceData | null>(null)
const isPatrolling = ref(false)
const patrolProgress = ref<PatrolProgress | null>(null)

const statistics = reactive<StatisticsData>({
  totalPower: 0,
  onlineRate: 0,
  faultCount: 0,
  maintenanceProgress: 0,
  todayGeneration: 0,
  monthGeneration: 0
})

const totalDevices = computed(() => {
  return arrays.value.reduce((sum, arr) => sum + arr.deviceCount, 0)
})

const maintenanceCount = computed(() => {
  if (!pvStation) return 0
  return pvStation.getDevices().filter(d => d.status === 'maintenance').length
})

const initScene = () => {
  if (!sceneContainer.value) return

  pvStation = new PVStationScene(sceneContainer.value, {
    onDeviceClick: (device: DeviceData, _point: THREE.Vector3) => {
      selectedDevice.value = device
    },
    onDeviceHover: (_device: DeviceData | null) => {
    },
    onAlarm: (alarm: AlarmData) => {
      alarms.value.unshift(alarm)
      if (alarms.value.length > 20) {
        alarms.value.pop()
      }
      updateStatistics()
      updateFaultRanking()
    },
    onPatrolProgress: (progress: PatrolProgress) => {
      patrolProgress.value = progress
    },
    onPatrolComplete: () => {
      isPatrolling.value = false
      patrolProgress.value = null
    }
  })

  pvStation.start()

  arrays.value = pvStation.getArrays()
  patrolRoutes.value = pvStation.getPatrolRoutes()
  powerData.value = pvStation.getPowerGenerationData()
  
  updateStatistics()
  updateFaultRanking()
}

const updateStatistics = () => {
  if (!pvStation) return
  const stats = pvStation.getStatistics()
  Object.assign(statistics, stats)
}

const updateFaultRanking = () => {
  if (!pvStation) return
  faultRanking.value = pvStation.getFaultRankingData()
}

const handleArrayClick = (arrayId: string) => {
  selectedArray.value = selectedArray.value === arrayId ? null : arrayId
  if (selectedArray.value && pvStation) {
    pvStation.flyToArray(arrayId)
  }
}

const handleFilterChange = (status: DeviceStatus | null) => {
  selectedStatus.value = status
  if (pvStation) {
    pvStation.filterByStatus(status)
  }
}

const handleRouteClick = (routeId: string) => {
  selectedRoute.value = selectedRoute.value === routeId ? null : routeId
}

const handleResetView = () => {
  if (pvStation) {
    pvStation.resetView()
  }
}

const handleStartPatrol = (followCamera: boolean) => {
  if (selectedRoute.value && pvStation) {
    isPatrolling.value = true
    pvStation.startPatrol(selectedRoute.value, followCamera)
  }
}

const handleStopPatrol = () => {
  if (pvStation) {
    pvStation.stopPatrol()
  }
  isPatrolling.value = false
  patrolProgress.value = null
}

const handleDeviceLocate = (deviceId: string) => {
  if (pvStation) {
    pvStation.flyToDevice(deviceId)
    const device = pvStation.getDeviceById(deviceId)
    if (device) {
      selectedDevice.value = device
    }
  }
}

const handleAddToPatrol = (_deviceId: string) => {
}

let statsUpdateInterval: number | null = null

onMounted(() => {
  setTimeout(() => {
    initScene()
  }, 100)

  statsUpdateInterval = window.setInterval(() => {
    updateStatistics()
    updateFaultRanking()
  }, 5000)
})

onUnmounted(() => {
  if (statsUpdateInterval !== null) {
    clearInterval(statsUpdateInterval)
  }
  if (pvStation) {
    pvStation.dispose()
    pvStation = null
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.scene-container {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  background: #87ceeb;
}

.device-detail-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 360px;
  z-index: 100;
}

.patrol-overlay {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 24px;
  color: #fff;
  z-index: 100;
  min-width: 400px;
}

.patrol-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.patrol-current {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.patrol-bar-wrapper {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.patrol-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s;
}

.patrol-percentage {
  font-size: 11px;
  text-align: right;
  color: #94a3b8;
}
</style>
