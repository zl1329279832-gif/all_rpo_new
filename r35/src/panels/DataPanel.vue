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
  let sum = 0;
  let count = 0;
  const sensors = store.sensors;
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    if (s.type === 'temperature' && s.status !== 'offline') {
      sum += s.value;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
});

const avgHumidity = computed(() => {
  let sum = 0;
  let count = 0;
  const sensors = store.sensors;
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    if (s.type === 'humidity' && s.status !== 'offline') {
      sum += s.value;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
});

const floorUtilization = computed(() => {
  let totalCapacity = 0;
  let usedCapacity = 0;
  const shelves = store.shelves;
  const currentFloor = store.currentFloor;
  for (let i = 0; i < shelves.length; i++) {
    const s = shelves[i];
    if (s.floor === currentFloor) {
      totalCapacity += s.capacity;
      usedCapacity += s.usedSlots;
    }
  }
  return totalCapacity > 0 ? usedCapacity / totalCapacity : 0;
});

const sensorCounts = computed(() => {
  const counts = { temperature: 0, humidity: 0, smoke: 0, door: 0 };
  const sensors = store.sensors;
  for (let i = 0; i < sensors.length; i++) {
    const type = sensors[i].type;
    if (type in counts) {
      counts[type as keyof typeof counts]++;
    }
  }
  return counts;
});

const displayedForklifts = computed(() => {
  return store.forklifts.slice(0, 6);
});

function getForkliftMemoKey(forklift: any): string {
  return `${forklift.id}-${forklift.status}-${forklift.battery}`;
}

function getChannelMemoKey(channel: any): string {
  return `${channel.id}-${channel.congestionLevel}`;
}

function getStatusClass(status: string): string {
  if (status === 'normal' || status === 'working' || status === 'available') return 'status-normal';
  if (status === 'warning' || status === 'reserved' || status === 'idle') return 'status-warning';
  if (status === 'alarm' || status === 'error' || status === 'occupied') return 'status-danger';
  return 'status-offline';
}

function getForkliftStatusLabel(status: string): string {
  if (status === 'working') return '作业中';
  if (status === 'idle') return '空闲';
  if (status === 'offline') return '离线';
  return '故障';
}

function getChannelValueClass(level: number): string {
  if (level >= 90) return 'text-red-400';
  if (level >= 70) return 'text-yellow-400';
  return 'text-green-400';
}

function getChannelBarColor(level: number): string {
  if (level >= 90) return 'var(--color-danger)';
  if (level >= 70) return 'var(--color-warning)';
  return 'var(--color-success)';
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
          v-for="forklift in displayedForklifts"
          :key="forklift.id"
          v-memo="[getForkliftMemoKey(forklift)]"
          class="forklift-item"
        >
          <span :class="['status-dot', getStatusClass(forklift.status)]"></span>
          <span class="forklift-code">{{ forklift.code }}</span>
          <span class="forklift-status">{{ getForkliftStatusLabel(forklift.status) }}</span>
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
        <div class="sensor-type-item" v-memo="[sensorCounts.temperature]">
          <span class="sensor-icon temp">🌡️</span>
          <span class="sensor-count">{{ sensorCounts.temperature }}</span>
          <span class="sensor-label">温度</span>
        </div>
        <div class="sensor-type-item" v-memo="[sensorCounts.humidity]">
          <span class="sensor-icon humidity">💧</span>
          <span class="sensor-count">{{ sensorCounts.humidity }}</span>
          <span class="sensor-label">湿度</span>
        </div>
        <div class="sensor-type-item" v-memo="[sensorCounts.smoke]">
          <span class="sensor-icon smoke">🚨</span>
          <span class="sensor-count">{{ sensorCounts.smoke }}</span>
          <span class="sensor-label">烟雾</span>
        </div>
        <div class="sensor-type-item" v-memo="[sensorCounts.door]">
          <span class="sensor-icon door">🚪</span>
          <span class="sensor-count">{{ sensorCounts.door }}</span>
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
          v-memo="[getChannelMemoKey(channel)]"
          class="channel-item"
        >
          <span class="channel-code">{{ channel.code }}</span>
          <div class="channel-bar">
            <div
              class="channel-bar-fill"
              :style="{
                width: `${channel.congestionLevel}%`,
                background: getChannelBarColor(channel.congestionLevel)
              }"
            ></div>
          </div>
          <span class="channel-value font-mono" :class="getChannelValueClass(channel.congestionLevel)">
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
