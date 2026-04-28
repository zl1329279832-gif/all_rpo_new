<script setup lang="ts">
import { computed } from 'vue';
import type { BuildingData } from '@/types';
import {
  ENERGY_LEVEL_LABELS,
  ENERGY_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS
} from '@/types';
import TrendChart from './TrendChart.vue';

const props = defineProps<{
  building: BuildingData | null;
  timeRange: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const energyClass = computed(() => {
  if (!props.building) return '';
  return `level-${props.building.energyLevel}`;
});

const riskClass = computed(() => {
  if (!props.building) return '';
  return `level-${props.building.riskLevel}`;
});

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

function getLevelBadgeClass(type: 'energy' | 'risk', level: string): string {
  const map: Record<string, string> = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical'
  };
  return map[level] || '';
}
</script>

<template>
  <Transition name="panel">
    <div v-if="building" class="right-panel">
      <div class="panel-header">
        <div class="header-content">
          <h2 class="building-name">{{ building.name }}</h2>
          <p class="building-address">{{ building.address }}</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <div class="info-section">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">楼层数</span>
              <span class="info-value">{{ building.floors }} 层</span>
            </div>
            <div class="info-item">
              <span class="info-label">建筑高度</span>
              <span class="info-value">{{ building.size.height.toFixed(1) }} m</span>
            </div>
            <div class="info-item">
              <span class="info-label">能耗等级</span>
              <span class="badge" :class="getLevelBadgeClass('energy', building.energyLevel)">
                {{ ENERGY_LEVEL_LABELS[building.energyLevel] }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">风险等级</span>
              <span class="badge" :class="getLevelBadgeClass('risk', building.riskLevel)">
                {{ RISK_LEVEL_LABELS[building.riskLevel] }}
              </span>
            </div>
          </div>
        </div>

        <div class="energy-section">
          <h3 class="section-title">能耗数据</h3>
          <div class="energy-cards">
            <div class="energy-card electricity">
              <div class="card-icon">⚡</div>
              <div class="card-info">
                <div class="card-value">{{ formatNumber(building.energyData.electricity) }}</div>
                <div class="card-unit">kWh</div>
              </div>
              <div class="card-label">用电量</div>
            </div>

            <div class="energy-card water">
              <div class="card-icon">💧</div>
              <div class="card-info">
                <div class="card-value">{{ formatNumber(building.energyData.water) }}</div>
                <div class="card-unit">吨</div>
              </div>
              <div class="card-label">用水量</div>
            </div>

            <div class="energy-card carbon">
              <div class="card-icon">🌍</div>
              <div class="card-info">
                <div class="card-value">{{ formatNumber(building.energyData.carbonEmission) }}</div>
                <div class="card-unit">kgCO₂</div>
              </div>
              <div class="card-label">碳排放</div>
            </div>

            <div class="energy-card people">
              <div class="card-icon">👥</div>
              <div class="card-info">
                <div class="card-value">{{ formatNumber(building.energyData.personCount) }}</div>
                <div class="card-unit">人</div>
              </div>
              <div class="card-label">人员数量</div>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <h3 class="section-title">能耗趋势</h3>
          <TrendChart :building-id="building.id" :time-range="timeRange" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.right-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(71, 85, 105, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  background: linear-gradient(
    to bottom,
    rgba(30, 41, 59, 0.5) 0%,
    transparent 100%
  );
}

.header-content {
  flex: 1;
  min-width: 0;
}

.building-name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  word-break: break-word;
}

.building-address {
  font-size: 12px;
  color: #94a3b8;
  margin: 6px 0 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(71, 85, 105, 0.3);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 16px;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.5);
  border-radius: 2px;
}

.info-section,
.energy-section,
.chart-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.info-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-low {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge-medium {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.badge-high {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.badge-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.energy-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.energy-card {
  padding: 16px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(71, 85, 105, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}

.energy-card:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.card-icon {
  font-size: 20px;
}

.card-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.card-unit {
  font-size: 10px;
  color: #94a3b8;
}

.card-label {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.energy-card.electricity {
  border-left: 3px solid #eab308;
}

.energy-card.water {
  border-left: 3px solid #06b6d4;
}

.energy-card.carbon {
  border-left: 3px solid #ef4444;
}

.energy-card.people {
  border-left: 3px solid #8b5cf6;
}

@media (max-width: 768px) {
  .right-panel {
    width: 100%;
  }
}
</style>
