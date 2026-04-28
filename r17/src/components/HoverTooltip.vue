<script setup lang="ts">
import { computed } from 'vue';
import type { HoverTooltip as HoverTooltipType } from '@/types';
import { ENERGY_LEVEL_LABELS, ENERGY_LEVEL_COLORS } from '@/types';

const props = defineProps<{
  data: HoverTooltipType;
}>();

const tooltipStyle = computed(() => {
  if (!props.data.visible) {
    return { display: 'none' };
  }
  return {
    left: `${props.data.x + 15}px`,
    top: `${props.data.y + 15}px`
  };
});

const energyLevelColor = computed(() => {
  if (!props.data.building) return '#94a3b8';
  return ENERGY_LEVEL_COLORS[props.data.building.energyLevel];
});

const energyLevelLabel = computed(() => {
  if (!props.data.building) return '未知';
  return ENERGY_LEVEL_LABELS[props.data.building.energyLevel];
});
</script>

<template>
  <div class="hover-tooltip" :style="tooltipStyle">
    <div v-if="data.building" class="tooltip-content">
      <div class="tooltip-header">
        <h4 class="building-name">{{ data.building.name }}</h4>
        <span
          class="energy-badge"
          :style="{ backgroundColor: energyLevelColor + '33', color: energyLevelColor }"
        >
          {{ energyLevelLabel }}
        </span>
      </div>
      <div class="tooltip-stats">
        <div class="stat-row">
          <span class="stat-label">楼层</span>
          <span class="stat-value">{{ data.building.floors }} 层</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">用电量</span>
          <span class="stat-value">{{ data.building.energyData.electricity.toLocaleString() }} kWh</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">用水量</span>
          <span class="stat-value">{{ data.building.energyData.water.toLocaleString() }} 吨</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">人员</span>
          <span class="stat-value">{{ data.building.energyData.personCount.toLocaleString() }} 人</span>
        </div>
      </div>
      <div class="tooltip-hint">点击查看详情</div>
    </div>
  </div>
</template>

<style scoped>
.hover-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(71, 85, 105, 0.6);
  border-radius: 12px;
  padding: 14px 16px;
  min-width: 240px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
}

.building-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.energy-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.tooltip-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.stat-value {
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
}

.tooltip-hint {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(71, 85, 105, 0.3);
  font-size: 11px;
  color: #64748b;
  text-align: center;
}
</style>
