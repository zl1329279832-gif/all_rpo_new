<template>
  <div class="app-container">
    <div class="top-toolbar">
      <div class="toolbar-left">
        <h1 class="app-title">
          <span class="title-icon">🚢</span>
          港口集装箱堆场三维运行监控系统
        </h1>
      </div>
      <div class="toolbar-center">
        <SearchBar
          :containers="sceneData.containers"
          :trucks="sceneData.trucks"
          :cranes="sceneData.cranes"
          @select="handleSearchSelect"
        />
      </div>
      <div class="toolbar-right">
        <div class="toolbar-controls">
          <button 
            class="ctrl-btn" 
            :class="{ active: showLabels }"
            @click="showLabels = !showLabels"
            title="显示标签"
          >
            🏷️
          </button>
          <button 
            class="ctrl-btn" 
            :class="{ active: animationEnabled }"
            @click="animationEnabled = !animationEnabled"
            title="播放动画"
          >
            {{ animationEnabled ? '⏸️' : '▶️' }}
          </button>
          <button class="ctrl-btn" @click="decreaseSpeed" title="减速">
            ⏪
          </button>
          <span class="speed-text">{{ animationSpeed.toFixed(1) }}x</span>
          <button class="ctrl-btn" @click="increaseSpeed" title="加速">
            ⏩
          </button>
          <button class="ctrl-btn" @click="handleResetCamera" title="重置视角">
            🔄
          </button>
        </div>
      </div>
    </div>

    <div class="second-toolbar">
      <AreaSelector @change="handleAreaChange" />
      <AlertFilter :alerts="alerts" @change="handleAlertLevelChange" />
      <div class="time-display">
        <span class="time-label">系统时间：</span>
        <span class="time-value">{{ currentTime }}</span>
      </div>
    </div>

    <div class="main-content">
      <PortYardScene
        ref="sceneRef"
        :selectedArea="selectedArea"
        :alertLevels="selectedAlertLevels"
        :showLabels="showLabels"
        :animationEnabled="animationEnabled"
        :animationSpeed="animationSpeed"
        @objectClick="handleObjectClick"
        @dataUpdate="handleDataUpdate"
      />

      <DataPanel
        v-if="showDataPanel"
        :containers="sceneData.containers"
        :throughputData="throughputData"
        :utilizationData="utilizationData"
        :congestionData="congestionData"
        :alerts="alerts"
      />

      <DetailPanel
        :visible="detailPanelVisible"
        :objectData="selectedObject"
        @close="detailPanelVisible = false"
        @playRoute="handlePlayRoute"
      />

      <button class="toggle-panel-btn" @click="showDataPanel = !showDataPanel">
        {{ showDataPanel ? '◀' : '▶' }}
      </button>
    </div>

    <div class="bottom-legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #4CAF50;"></span>
        <span>正常作业</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #9C27B0;"></span>
        <span>超时滞箱</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #FF5722;"></span>
        <span>危险品箱</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #FF9800;"></span>
        <span>设备告警</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #F44336;"></span>
        <span>设备故障</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #7B1FA2;"></span>
        <span>危险品区</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #E53935;"></span>
        <span>道路拥堵</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import PortYardScene from './components/PortYardScene.vue'
import SearchBar from './components/SearchBar.vue'
import AreaSelector from './components/AreaSelector.vue'
import AlertFilter from './components/AlertFilter.vue'
import DataPanel from './components/DataPanel.vue'
import DetailPanel from './components/DetailPanel.vue'
import { MockDataService } from './services/MockDataService'
import type {
  BaseObject,
  Container,
  Berth,
  YardBlock,
  QuayCrane,
  Truck,
  Alert,
  AlertLevel,
  ThroughputData,
  EquipmentUtilization,
  CongestionData
} from './types'

const sceneRef = ref<InstanceType<typeof PortYardScene> | null>(null)

const selectedArea = ref('all')
const selectedAlertLevels = ref<AlertLevel[]>(['warning', 'danger', 'critical'])
const showLabels = ref(true)
const animationEnabled = ref(true)
const animationSpeed = ref(1.0)
const showDataPanel = ref(true)

const detailPanelVisible = ref(false)
const selectedObject = ref<BaseObject | Container | null>(null)

const currentTime = ref('')

const sceneData = reactive({
  berths: [] as Berth[],
  yardBlocks: [] as YardBlock[],
  cranes: [] as QuayCrane[],
  trucks: [] as Truck[],
  containers: [] as Container[]
})

const alerts = ref<Alert[]>([])
const throughputData = ref<ThroughputData[]>([])
const utilizationData = ref<EquipmentUtilization[]>([])
const congestionData = ref<CongestionData[]>([])

let timeInterval: number | null = null

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const initMockData = () => {
  throughputData.value = MockDataService.generateThroughputData(24)
  congestionData.value = MockDataService.generateCongestionData(12)
}

const handleDataUpdate = (data: {
  berths: Berth[]
  yardBlocks: YardBlock[]
  cranes: QuayCrane[]
  trucks: Truck[]
  containers: Container[]
}) => {
  sceneData.berths = data.berths
  sceneData.yardBlocks = data.yardBlocks
  sceneData.cranes = data.cranes
  sceneData.trucks = data.trucks
  sceneData.containers = data.containers

  alerts.value = MockDataService.generateAlerts(15, data.containers, data.trucks, data.cranes)
  utilizationData.value = MockDataService.generateEquipmentUtilization(data.cranes, data.trucks)
}

const handleAreaChange = (areaId: string) => {
  selectedArea.value = areaId
}

const handleAlertLevelChange = (levels: AlertLevel[]) => {
  selectedAlertLevels.value = levels
}

const handleObjectClick = (data: BaseObject | Container | null) => {
  selectedObject.value = data
  detailPanelVisible.value = !!data
}

const handleSearchSelect = (result: { data: BaseObject | Container }) => {
  sceneRef.value?.focusOnObject(result.data)
  selectedObject.value = result.data
  detailPanelVisible.value = true
}

const handlePlayRoute = (truckId: string) => {
  sceneRef.value?.playTruckRoute(truckId)
}

const handleResetCamera = () => {
  sceneRef.value?.resetCamera()
}

const increaseSpeed = () => {
  animationSpeed.value = Math.min(5, animationSpeed.value + 0.5)
}

const decreaseSpeed = () => {
  animationSpeed.value = Math.max(0.1, animationSpeed.value - 0.5)
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
  initMockData()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a1628;
}

.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(16, 32, 56, 0.95);
  border-bottom: 1px solid rgba(24, 144, 255, 0.3);
  backdrop-filter: blur(10px);
}

.toolbar-left {
  flex: 1;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #e6f7ff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.toolbar-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.toolbar-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  color: #8c8c8c;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.ctrl-btn:hover {
  background: rgba(24, 144, 255, 0.2);
  color: #e6f7ff;
}

.ctrl-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.speed-text {
  color: #e6f7ff;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.second-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(16, 32, 56, 0.8);
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-label {
  color: #8c8c8c;
  font-size: 13px;
}

.time-value {
  color: #1890ff;
  font-size: 14px;
  font-family: 'Consolas', monospace;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.toggle-panel-btn {
  position: absolute;
  top: 50%;
  left: 380px;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: rgba(16, 32, 56, 0.9);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-left: none;
  border-radius: 0 4px 4px 0;
  color: #1890ff;
  cursor: pointer;
  z-index: 100;
  transition: left 0.3s;
}

.toggle-panel-btn:hover {
  background: rgba(24, 144, 255, 0.2);
}

.bottom-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 10px 20px;
  background: rgba(16, 32, 56, 0.95);
  border-top: 1px solid rgba(24, 144, 255, 0.3);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}
</style>
