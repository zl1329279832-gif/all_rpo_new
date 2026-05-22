<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWarehouseStore } from '@/data/warehouseStore';
import WarehouseScene from '@/scene/WarehouseScene.vue';
import Toolbar from '@/panels/Toolbar.vue';
import DataPanel from '@/panels/DataPanel.vue';
import AlarmPanel from '@/panels/AlarmPanel.vue';
import DeviceModal from '@/panels/DeviceModal.vue';
import UtilizationChart from '@/charts/UtilizationChart.vue';
import AlarmTrendChart from '@/charts/AlarmTrendChart.vue';
import ChannelHeatmap from '@/charts/ChannelHeatmap.vue';
import type { PickedObject, AlarmData } from '@/types';

const store = useWarehouseStore();
const sceneRef = ref<InstanceType<typeof WarehouseScene> | null>(null);
const isFullscreen = ref(false);

const showCharts = ref(true);
const showDataPanel = ref(true);
const showAlarmPanel = ref(true);

const pickedObject = computed(() => store.pickedObject);

function handleLocateAlarm(alarm: AlarmData) {
  sceneRef.value?.handleLocateAlarm(alarm);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
}

function closeModal() {
  store.setPickedObject(null);
}
</script>

<template>
  <div class="dashboard">
    <WarehouseScene
      ref="sceneRef"
      @object-picked="(obj) => store.setPickedObject(obj)"
    />

    <Toolbar @toggle-fullscreen="toggleFullscreen" />

    <Transition name="slide-left">
      <DataPanel v-if="showDataPanel" />
    </Transition>

    <Transition name="slide-right">
      <AlarmPanel v-if="showAlarmPanel" @locate-alarm="handleLocateAlarm" />
    </Transition>

    <Transition name="slide-up">
      <div v-if="showCharts" class="charts-container">
        <div class="charts-grid">
          <div class="chart-wrapper">
            <UtilizationChart />
          </div>
          <div class="chart-wrapper">
            <AlarmTrendChart />
          </div>
          <div class="chart-wrapper">
            <ChannelHeatmap />
          </div>
        </div>
      </div>
    </Transition>

    <div class="panel-toggle-buttons">
      <button
        :class="['toggle-btn', { active: showDataPanel }]"
        @click="showDataPanel = !showDataPanel"
        title="切换数据面板"
      >
        📊
      </button>
      <button
        :class="['toggle-btn', { active: showAlarmPanel }]"
        @click="showAlarmPanel = !showAlarmPanel"
        title="切换告警面板"
      >
        🔔
      </button>
      <button
        :class="['toggle-btn', { active: showCharts }]"
        @click="showCharts = !showCharts"
        title="切换图表区域"
      >
        📈
      </button>
    </div>

    <DeviceModal
      :picked-object="pickedObject"
      @close="closeModal"
    />
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.charts-container {
  position: absolute;
  bottom: 16px;
  left: 372px;
  right: 392px;
  height: 220px;
  z-index: 40;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  height: 100%;
}

.chart-wrapper {
  min-width: 0;
  min-height: 0;
}

.panel-toggle-buttons {
  position: absolute;
  top: 92px;
  left: 356px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 60;

  .toggle-btn {
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--bg-glass);
    backdrop-filter: blur(8px);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    opacity: 0.6;

    &:hover,
    &.active {
      opacity: 1;
      background: var(--color-primary);
      border-color: var(--color-primary);
      transform: scale(1.1);
    }

    &.active {
      box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
    }
  }
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 1400px) {
  .charts-container {
    left: 16px;
    right: 16px;
  }

  .panel-toggle-buttons {
    left: 16px;
  }
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }

  .chart-wrapper:last-child {
    grid-column: span 2;
  }
}
</style>
