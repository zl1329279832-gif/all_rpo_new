<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EnergyLevel } from '@/types';
import { ENERGY_LEVEL_LABELS, TIME_RANGES } from '@/types';

const emit = defineEmits<{
  (e: 'update:timeRange', value: string): void;
  (e: 'update:energyLevels', value: EnergyLevel[]): void;
}>();

const props = defineProps<{
  timeRange: string;
  energyLevels: EnergyLevel[];
}>();

const isPanelOpen = ref(false);

const energyOptions: { value: EnergyLevel; label: string }[] = [
  { value: 'low' as EnergyLevel, label: ENERGY_LEVEL_LABELS.low },
  { value: 'medium' as EnergyLevel, label: ENERGY_LEVEL_LABELS.medium },
  { value: 'high' as EnergyLevel, label: ENERGY_LEVEL_LABELS.high },
  { value: 'critical' as EnergyLevel, label: ENERGY_LEVEL_LABELS.critical }
];

const localTimeRange = ref(props.timeRange);
const localEnergyLevels = ref<EnergyLevel[]>([...props.energyLevels]);

watch(
  () => props.timeRange,
  (newVal) => {
    localTimeRange.value = newVal;
  }
);

watch(
  () => props.energyLevels,
  (newVal) => {
    localEnergyLevels.value = [...newVal];
  },
  { deep: true }
);

function selectTimeRange(range: string): void {
  localTimeRange.value = range;
  emit('update:timeRange', range);
}

function toggleEnergyLevel(level: EnergyLevel): void {
  const index = localEnergyLevels.value.indexOf(level);
  if (index > -1) {
    localEnergyLevels.value.splice(index, 1);
  } else {
    localEnergyLevels.value.push(level);
  }
  emit('update:energyLevels', [...localEnergyLevels.value]);
}

function isLevelSelected(level: EnergyLevel): boolean {
  return localEnergyLevels.value.includes(level);
}

function getLevelBadgeClass(level: EnergyLevel): string {
  const map: Record<EnergyLevel, string> = {
    low: 'level-low',
    medium: 'level-medium',
    high: 'level-high',
    critical: 'level-critical'
  };
  return map[level];
}
</script>

<template>
  <div class="filter-panel-container">
    <button
      class="filter-toggle-btn"
      @click="isPanelOpen = !isPanelOpen"
      :class="{ active: isPanelOpen }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
      <span>筛选</span>
    </button>

    <Transition name="panel">
      <div v-if="isPanelOpen" class="filter-panel">
        <div class="filter-section">
          <h4 class="filter-title">时间范围</h4>
          <div class="time-range-buttons">
            <button
              v-for="range in TIME_RANGES"
              :key="range.value"
              class="time-btn"
              :class="{ active: localTimeRange === range.value }"
              @click="selectTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">能耗等级</h4>
          <div class="energy-level-toggles">
            <button
              v-for="option in energyOptions"
              :key="option.value"
              class="energy-toggle"
              :class="[
                getLevelBadgeClass(option.value),
                { active: isLevelSelected(option.value) }
              ]"
              @click="toggleEnergyLevel(option.value)"
            >
              <span class="toggle-icon">
                {{ isLevelSelected(option.value) ? '✓' : '' }}
              </span>
              <span class="toggle-label">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <div class="filter-actions">
          <button
            class="reset-btn"
            @click="
              localEnergyLevels = [];
              emit('update:energyLevels', []);
            "
          >
            重置筛选
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-panel-container {
  position: absolute;
  bottom: 30px;
  left: 30px;
  z-index: 15;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.filter-toggle-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
}

.filter-toggle-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.filter-toggle-btn svg {
  width: 18px;
  height: 18px;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.filter-panel {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  min-width: 320px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section:last-of-type {
  margin-bottom: 0;
}

.filter-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-range-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.time-btn {
  padding: 8px 16px;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.time-btn.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
  color: #ffffff;
}

.energy-level-toggles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.energy-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(51, 65, 85, 0.6);
  border: 2px solid transparent;
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.energy-toggle:hover {
  background: rgba(71, 85, 105, 0.8);
}

.toggle-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.energy-toggle.active {
  background: rgba(59, 130, 246, 0.1);
}

.energy-toggle.active .toggle-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.energy-toggle.level-low.active {
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.1);
}

.energy-toggle.level-medium.active {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.energy-toggle.level-high.active {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.1);
}

.energy-toggle.level-critical.active {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.1);
}

.filter-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(71, 85, 105, 0.3);
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: rgba(71, 85, 105, 0.3);
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .filter-panel {
    min-width: unset;
    width: calc(100vw - 60px);
  }
}
</style>
