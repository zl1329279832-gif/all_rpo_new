<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { BuildingData, EnergyLevel, PickResult, HoverTooltip, BuildingStats } from '@/types';
import { getStatsByTimeRange, mockStats } from '@/mock';
import {
  ThreeScene,
  TopPanel,
  RightPanel,
  FilterPanel,
  HoverTooltip as HoverTooltipComponent
} from '@/components';

const selectedBuilding = ref<BuildingData | null>(null);
const hoverTooltip = ref<HoverTooltip>({
  visible: false,
  x: 0,
  y: 0,
  building: null
});

const timeRange = ref<string>('week');
const energyLevels = ref<EnergyLevel[]>([]);

const stats = ref<BuildingStats>(mockStats);

watch(
  timeRange,
  (newRange) => {
    stats.value = getStatsByTimeRange(newRange);
  },
  { immediate: true }
);

function handleBuildingClick(result: PickResult | null): void {
  selectedBuilding.value = result?.data || null;
}

function handleBuildingHover(data: HoverTooltip): void {
  hoverTooltip.value = data;
}

function closeRightPanel(): void {
  selectedBuilding.value = null;
}
</script>

<template>
  <div class="dashboard">
    <ThreeScene
      :visible-energy-levels="energyLevels"
      @building-click="handleBuildingClick"
      @building-hover="handleBuildingHover"
    />

    <TopPanel :stats="stats" />

    <FilterPanel
      v-model:time-range="timeRange"
      v-model:energy-levels="energyLevels"
    />

    <RightPanel
      :building="selectedBuilding"
      :time-range="timeRange"
      @close="closeRightPanel"
    />

    <HoverTooltipComponent :data="hoverTooltip" />
  </div>
</template>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #0a0a1e;
}
</style>
