<script setup lang="ts">
import type { BuildingStats, EnergyLevel, RiskLevel } from '@/types';
import {
  ENERGY_LEVEL_LABELS,
  ENERGY_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS
} from '@/types';

defineProps<{
  stats: BuildingStats;
}>();

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
</script>

<template>
  <div class="top-panel">
    <div class="panel-header">
      <h1 class="title">城市建筑能耗 3D 可视化系统</h1>
      <p class="subtitle">实时监控 · 智能分析 · 节能减排</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">🏢</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalBuildings }}</div>
          <div class="stat-label">建筑总数</div>
        </div>
      </div>

      <div class="stat-card electricity">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalElectricity) }}</div>
          <div class="stat-label">总用电量 (kWh)</div>
        </div>
      </div>

      <div class="stat-card water">
        <div class="stat-icon">💧</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalWater) }}</div>
          <div class="stat-label">总用水量 (吨)</div>
        </div>
      </div>

      <div class="stat-card carbon">
        <div class="stat-icon">🌍</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalCarbonEmission) }}</div>
          <div class="stat-label">碳排放 (kgCO₂)</div>
        </div>
      </div>
    </div>

    <div class="legend-section">
      <div class="legend-group">
        <span class="legend-title">能耗等级:</span>
        <div class="legend-items">
          <div
            v-for="level in Object.values({ 'low': '低', 'medium': '中', 'high': '高', 'critical': '警告' })"
            :key="level"
            class="legend-item"
          >
            <span
              class="legend-color"
              :style="{ backgroundColor: ENERGY_LEVEL_COLORS[level as EnergyLevel] }"
            ></span>
            <span class="legend-text">{{ ENERGY_LEVEL_LABELS[level as EnergyLevel] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 20px 30px;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 30, 0.95) 0%,
    rgba(10, 10, 30, 0.8) 70%,
    rgba(10, 10, 30, 0) 100%
  );
}

.panel-header {
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0;
  letter-spacing: 1px;
}

.stats-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  backdrop-filter: blur(10px);
  min-width: 140px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
}

.stat-icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
}

.stat-card.primary .stat-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
}

.stat-card.electricity .stat-icon {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.2));
}

.stat-card.water .stat-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
}

.stat-card.carbon .stat-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 197, 94, 0.2));
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.legend-section {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.legend-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-title {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.legend-items {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-text {
  font-size: 12px;
  color: #cbd5e1;
}

@media (max-width: 1200px) {
  .stats-grid {
    gap: 12px;
  }
  
  .stat-card {
    padding: 10px 16px;
    min-width: 120px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .title {
    font-size: 20px;
  }
}
</style>
