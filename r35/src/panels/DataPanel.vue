<script setup lang="ts">
import { computed } from 'vue';
import { useWarehouseStore } from '@/data/warehouseStore';
import { COLORS } from '@/config';
import { Package, Thermometer, Droplets, Truck, Wifi, TrendingUp, Database, Clock } from 'lucide-vue-next';
import { formatPercent, formatNumber, getUtilizationColor } from '@/utils';

const store = useWarehouseStore();

const stats = computed(() => store.stats);

const utilizationColor = computed(() => getUtilizationColor(stats.value.utilizationRate));

const avgTemperature = computed(() => {
  const sensors = store.sensors.filter(s => s.type === 'temperature' && s.status !== 'offline');
  if (sensors.length === 0) return 0;
  return sensors.reduce((sum, s) => sum + s.value, 0) / sensors.length;
});

const avgHumidity = computed(() => {
  const sensors = store.sensors.filter(s => s.type === 'humidity' && s.status !== 'offline');
  if (sensors.length === 0) return 0;
  return sensors.reduce((sum, s) => sum + s.value, 0) / sensors.length;
});

const floorUtilization = computed(() => {
  const floorShelves = store.shelves.filter(s => s.floor === store.currentFloor);
  if (floorShelves.length === 0) return 0;
  const totalCapacity = floorShelves.reduce((sum, s) => sum + s.capacity, 0);
  const usedCapacity = floorShelves.reduce((sum, s) => sum + s.usedSlots, 0);
  return totalCapacity > 0 ? usedCapacity / totalCapacity : 0;
});

function getStatusClass(status: string): string {
  if (status === 'normal' || status === 'working' || status === 'available') return 'status-normal';
  if (status === 'warning' || status === 'reserved' || status === 'idle') return 'status-warning';
  if (status === 'alarm' || status === 'error' || status === 'occupied') return 'status-danger';
  return 'status-offline';
}
</script>

<template>
  <div class="data-panel glass-panel animate-slide-in-left">
    <div class="panel-header">
      <h3 class="panel-title">
        <Database :size="18" />
        <span>实时数据</span>
      </h3>
      <span class="update-badge">
        <span class="pulse-dot"></span>
        实时更新
      </span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(24, 144, 255, 0.15); color: var(--color-primary);">
          <Package :size="22" />
        </div>
        <div class="stat-content">
          <div class="stat-label">总库存容量</div>
          <div class="stat-value font-mono">{{ formatNumber(stats.usedCapacity, 0) }}/{{ formatNumber(stats.totalCapacity, 0) }}</div>
          <div class="stat-progress">
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                :style="{ width: formatPercent(stats.utilizationRate), background: utilizationColor }"
              ></div>
            </div>
            <span class="progress-text" :style="{ color: utilizationColor }">
              {{ formatPercent(stats.utilizationRate) }}
            </span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(82, 196, 26, 0.15); color: var(--color-success);">
          <TrendingUp :size="22" />
        </div>
        <div class="stat-content">
          <div class="stat-label">当前楼层利用率</div>
          <div class="stat-value font-mono">{{ formatPercent(floorUtilization) }}</div>
          <div class="stat-progress">
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                :style="{ width: formatPercent(floorUtilization), background: getUtilizationColor(floorUtilization) }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(255, 77, 79, 0.15); color: var(--color-danger);">
          <Thermometer :size="22" />
        </div>
        <div class="stat-content">
          <div class="stat-label">平均温度</div>
          <div class="stat-value font-mono" :class="{ 'text-red-400': avgTemperature > 30 }">
            {{ formatNumber(avgTemperature) }}°C
          </div>
          <div class="stat-sub">
            正常范围: 18°C - 28°C
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(19, 194, 194, 0.15); color: var(--color-info);">
          <Droplets :size="22" />
        </div>
        <div class="stat-content">
          <div class="stat-label">平均湿度</div>
          <div class="stat-value font-mono" :class="{ 'text-yellow-400': avgHumidity > 75 }">
            {{ formatNumber(avgHumidity) }}%
          </div>
          <div class="stat-sub">
            正常范围: 40% - 75%
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h4 class="section-title">
          <Truck :size="16" />
          叉车状态
        </h4>
        <span class="section-count">{{ stats.activeForklifts }}/{{ stats.totalForklifts }} 在线</span>
      </div>
      <div class="forklift-list">
        <div
          v-for="forklift in store.forklifts.slice(0, 6)"
          :key="forklift.id"
          class="forklift-item"
        >
          <span :class="['status-dot', getStatusClass(forklift.status)]"></span>
          <span class="forklift-code">{{ forklift.code }}</span>
          <span class="forklift-status">{{ forklift.status === 'working' ? '作业中' : forklift.status === 'idle' ? '空闲' : forklift.status === 'offline' ? '离线' : '故障' }}</span>
          <span class="forklift-battery font-mono">{{ formatNumber(forklift.battery, 0) }}%</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h4 class="section-title">
          <Wifi :size="16" />
          传感器状态
        </h4>
        <span class="section-count">{{ stats.totalSensors - stats.offlineSensors }}/{{ stats.totalSensors }} 在线</span>
      </div>
      <div class="sensor-grid">
        <div class="sensor-type-item">
          <span class="sensor-icon temp">🌡️</span>
          <span class="sensor-count">{{ store.sensors.filter(s => s.type === 'temperature').length }}</span>
          <span class="sensor-label">温度</span>
        </div>
        <div class="sensor-type-item">
          <span class="sensor-icon humidity">💧</span>
          <span class="sensor-count">{{ store.sensors.filter(s => s.type === 'humidity').length }}</span>
          <span class="sensor-label">湿度</span>
        </div>
        <div class="sensor-type-item">
          <span class="sensor-icon smoke">🚨</span>
          <span class="sensor-count">{{ store.sensors.filter(s => s.type === 'smoke').length }}</span>
          <span class="sensor-label">烟雾</span>
        </div>
        <div class="sensor-type-item">
          <span class="sensor-icon door">🚪</span>
          <span class="sensor-count">{{ store.sensors.filter(s => s.type === 'door').length }}</span>
          <span class="sensor-label">门禁</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h4 class="section-title">
          <Clock :size="16" />
          通道拥堵
        </h4>
      </div>
      <div class="channel-list">
        <div
          v-for="channel in store.channels"
          :key="channel.id"
          class="channel-item"
        >
          <span class="channel-code">{{ channel.code }}</span>
          <div class="channel-bar">
            <div
              class="channel-bar-fill"
              :style="{
                width: `${channel.congestionLevel}%`,
                background: channel.congestionLevel >= 90 ? 'var(--color-danger)' : channel.congestionLevel >= 70 ? 'var(--color-warning)' : 'var(--color-success)'
              }"
            ></div>
          </div>
          <span class="channel-value font-mono" :class="{
            'text-red-400': channel.congestionLevel >= 90,
            'text-yellow-400': channel.congestionLevel >= 70 && channel.congestionLevel < 90,
            'text-green-400': channel.congestionLevel < 70
          }">
            {{ formatNumber(channel.congestionLevel, 0) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-panel {
  position: absolute;
  top: 92px;
  left: 16px;
  width: 340px;
  max-height: calc(100vh - 280px);
  padding: 16px;
  overflow-y: auto;
  z-index: 50;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .update-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-success);
    padding: 4px 10px;
    background: rgba(82, 196, 26, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(82, 196, 26, 0.3);

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse-glow 2s infinite;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  .stat-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    gap: 10px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-glass-light);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-label {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-bottom: 2px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      .stat-sub {
        font-size: 10px;
        color: var(--text-tertiary);
      }

      .stat-progress {
        display: flex;
        align-items: center;
        gap: 8px;

        .progress-bar {
          flex: 1;
        }

        .progress-text {
          font-size: 11px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
      }
    }
  }
}

.section {
  margin-bottom: 20px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-count {
      font-size: 11px;
      color: var(--text-tertiary);
      font-family: 'JetBrains Mono', monospace;
    }
  }
}

.forklift-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .forklift-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--bg-tertiary);
    border-radius: 6px;
    font-size: 12px;

    .forklift-code {
      flex: 1;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
    }

    .forklift-status {
      color: var(--text-secondary);
      font-size: 11px;
    }

    .forklift-battery {
      font-size: 11px;
      color: var(--text-tertiary);
      min-width: 35px;
      text-align: right;
    }
  }
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  .sensor-type-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 8px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    gap: 4px;

    .sensor-icon {
      font-size: 18px;
    }

    .sensor-count {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 16px;
      color: var(--text-primary);
    }

    .sensor-label {
      font-size: 10px;
      color: var(--text-tertiary);
    }
  }
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .channel-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .channel-code {
      font-size: 11px;
      color: var(--text-secondary);
      min-width: 70px;
    }

    .channel-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;

      .channel-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
      }
    }

    .channel-value {
      font-size: 11px;
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
  }
}
</style>
