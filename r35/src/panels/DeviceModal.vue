<script setup lang="ts">
import { computed } from 'vue';
import type { PickedObject, ShelfData, ForkliftData, SensorData, LoadingDockData } from '@/types';
import { X, Package, Truck, Wifi, MapPin, Thermometer, Droplets, Battery, Activity, Clock, User, AlertTriangle } from 'lucide-vue-next';
import { formatNumber, formatPercent, getStatusColor } from '@/utils';

const props = defineProps<{
  pickedObject: PickedObject | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const shelfData = computed(() => props.pickedObject?.type === 'shelf' ? (props.pickedObject.data as ShelfData) : null);
const forkliftData = computed(() => props.pickedObject?.type === 'forklift' ? (props.pickedObject.data as ForkliftData) : null);
const sensorData = computed(() => props.pickedObject?.type === 'sensor' ? (props.pickedObject.data as SensorData) : null);
const dockData = computed(() => props.pickedObject?.type === 'dock' ? (props.pickedObject.data as LoadingDockData) : null);

function getObjectTitle(): string {
  if (!props.pickedObject) return '';
  const data = props.pickedObject.data as any;
  return data.code || data.id || '设备详情';
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    alarm: '告警',
    offline: '离线',
    idle: '空闲',
    working: '作业中',
    error: '故障',
    available: '可用',
    occupied: '占用中',
    reserved: '已预约',
    maintenance: '维护中',
  };
  return map[status] || status;
}

function getSensorTypeLabel(type: string): string {
  const map: Record<string, string> = {
    temperature: '温度传感器',
    humidity: '湿度传感器',
    smoke: '烟雾传感器',
    door: '门禁传感器',
    infrared: '红外传感器',
  };
  return map[type] || type;
}

function getSensorUnit(type: string): string {
  const map: Record<string, string> = {
    temperature: '°C',
    humidity: '%',
    smoke: '%',
    door: '',
    infrared: '',
  };
  return map[type] || '';
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="pickedObject" class="device-modal-overlay" @click.self="emit('close')">
        <div class="device-modal glass-panel">
          <div class="modal-header">
            <div class="modal-title">
              <component
                :is="pickedObject.type === 'shelf' ? Package : pickedObject.type === 'forklift' ? Truck : pickedObject.type === 'sensor' ? Wifi : MapPin"
                :size="20"
              />
              <span>{{ getObjectTitle() }}</span>
            </div>
            <button class="close-btn" @click="emit('close')">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <div v-if="shelfData" class="device-content">
              <div class="status-banner" :style="{ background: `${getStatusColor(shelfData.status)}20`, borderColor: getStatusColor(shelfData.status) }">
                <span :class="['status-dot', shelfData.status === 'normal' ? 'status-normal' : shelfData.status === 'warning' ? 'status-warning' : 'status-danger']"></span>
                <span class="status-text">{{ getStatusText(shelfData.status) }}</span>
                <span class="status-desc">
                  {{ shelfData.status === 'alarm' ? '容量超过警戒线' : shelfData.status === 'warning' ? '容量接近上限' : '运行正常' }}
                </span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">楼层</span>
                  <span class="info-value">{{ shelfData.floor + 1 }} 层</span>
                </div>
                <div class="info-item">
                  <span class="info-label">货架层数</span>
                  <span class="info-value">{{ shelfData.levels }} 层</span>
                </div>
                <div class="info-item">
                  <span class="info-label">每层货位</span>
                  <span class="info-value">{{ shelfData.slotsPerLevel }} 个</span>
                </div>
                <div class="info-item">
                  <span class="info-label">总容量</span>
                  <span class="info-value font-mono">{{ shelfData.capacity }}</span>
                </div>
              </div>

              <div class="metric-section">
                <div class="metric-card">
                  <div class="metric-icon" style="background: rgba(24, 144, 255, 0.15); color: var(--color-primary);">
                    <Package :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">库存利用率</span>
                    <span class="metric-value font-mono">{{ formatPercent(shelfData.utilization) }}</span>
                  </div>
                  <div class="metric-bar">
                    <div class="progress-bar">
                      <div
                        class="progress-bar-fill"
                        :style="{ width: formatPercent(shelfData.utilization) }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="metric-card">
                  <div class="metric-icon" style="background: rgba(255, 77, 79, 0.15); color: var(--color-danger);">
                    <Thermometer :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">温度</span>
                    <span class="metric-value font-mono">{{ formatNumber(shelfData.temperature) }}°C</span>
                  </div>
                  <div class="metric-status" :class="{ warning: shelfData.temperature > 28, danger: shelfData.temperature > 32 }">
                    {{ shelfData.temperature > 32 ? '过高' : shelfData.temperature > 28 ? '偏高' : '正常' }}
                  </div>
                </div>

                <div class="metric-card">
                  <div class="metric-icon" style="background: rgba(19, 194, 194, 0.15); color: var(--color-info);">
                    <Droplets :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">湿度</span>
                    <span class="metric-value font-mono">{{ formatNumber(shelfData.humidity) }}%</span>
                  </div>
                  <div class="metric-status" :class="{ warning: shelfData.humidity > 75, danger: shelfData.humidity > 85 }">
                    {{ shelfData.humidity > 85 ? '过高' : shelfData.humidity > 75 ? '偏高' : '正常' }}
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-label">已用货位</span>
                <span class="detail-value font-mono">{{ shelfData.usedSlots }} / {{ shelfData.capacity }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">空闲货位</span>
                <span class="detail-value font-mono">{{ shelfData.capacity - shelfData.usedSlots }}</span>
              </div>
            </div>

            <div v-else-if="forkliftData" class="device-content">
              <div class="status-banner" :style="{ background: `${getStatusColor(forkliftData.status)}20`, borderColor: getStatusColor(forkliftData.status) }">
                <span :class="['status-dot', forkliftData.status === 'working' ? 'status-normal' : forkliftData.status === 'idle' ? 'status-warning' : forkliftData.status === 'error' ? 'status-danger' : 'status-offline']"></span>
                <span class="status-text">{{ getStatusText(forkliftData.status) }}</span>
                <span class="status-desc">
                  {{ forkliftData.status === 'working' ? `正在执行: ${forkliftData.currentTask}` : forkliftData.status === 'idle' ? '等待任务分配' : forkliftData.status === 'error' ? '设备故障，请检修' : '设备离线' }}
                </span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">设备编号</span>
                  <span class="info-value font-mono">{{ forkliftData.code }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">当前驾驶员</span>
                  <span class="info-value">{{ forkliftData.driver || '未分配' }}</span>
                </div>
              </div>

              <div class="metric-section">
                <div class="metric-card">
                  <div class="metric-icon" style="background: rgba(250, 173, 20, 0.15); color: var(--color-warning);">
                    <Battery :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">电量</span>
                    <span class="metric-value font-mono">{{ formatNumber(forkliftData.battery, 0) }}%</span>
                  </div>
                  <div class="metric-bar">
                    <div class="progress-bar">
                      <div
                        class="progress-bar-fill"
                        :style="{
                          width: `${forkliftData.battery}%`,
                          background: forkliftData.battery < 20 ? 'var(--color-danger)' : forkliftData.battery < 50 ? 'var(--color-warning)' : 'var(--color-success)'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="metric-card">
                  <div class="metric-icon" style="background: rgba(82, 196, 26, 0.15); color: var(--color-success);">
                    <Activity :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">当前速度</span>
                    <span class="metric-value font-mono">{{ formatNumber(forkliftData.speed, 1) }} m/s</span>
                  </div>
                  <div class="metric-status">
                    {{ forkliftData.speed > 4 ? '高速' : forkliftData.speed > 2 ? '正常' : '低速' }}
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-label">当前位置</span>
                <span class="detail-value font-mono text-sm">
                  ({{ formatNumber(forkliftData.position.x, 1) }}, {{ formatNumber(forkliftData.position.z, 1) }})
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">当前任务</span>
                <span class="detail-value">{{ forkliftData.currentTask || '无' }}</span>
              </div>
            </div>

            <div v-else-if="sensorData" class="device-content">
              <div class="status-banner" :style="{ background: `${getStatusColor(sensorData.status)}20`, borderColor: getStatusColor(sensorData.status) }">
                <span :class="['status-dot', sensorData.status === 'normal' ? 'status-normal' : sensorData.status === 'warning' ? 'status-warning' : sensorData.status === 'alarm' ? 'status-danger' : 'status-offline']"></span>
                <span class="status-text">{{ getStatusText(sensorData.status) }}</span>
                <span class="status-desc">
                  {{ sensorData.status === 'alarm' ? '数值超过阈值' : sensorData.status === 'warning' ? '数值接近阈值' : sensorData.status === 'offline' ? '设备连接中断' : '运行正常' }}
                </span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">传感器类型</span>
                  <span class="info-value">{{ getSensorTypeLabel(sensorData.type) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">设备编号</span>
                  <span class="info-value font-mono">{{ sensorData.code }}</span>
                </div>
              </div>

              <div class="metric-section">
                <div class="metric-card full-width">
                  <div class="metric-icon" :style="{ background: `${getStatusColor(sensorData.status)}20`, color: getStatusColor(sensorData.status) }">
                    <Activity :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">当前读数</span>
                    <span class="metric-value font-mono text-2xl">
                      {{ formatNumber(sensorData.value) }}{{ getSensorUnit(sensorData.type) }}
                    </span>
                  </div>
                  <div class="metric-thresholds">
                    <div class="threshold-item">
                      <span class="threshold-label">警告阈值</span>
                      <span class="threshold-value font-mono">{{ sensorData.threshold.warning }}{{ getSensorUnit(sensorData.type) }}</span>
                    </div>
                    <div class="threshold-item">
                      <span class="threshold-label">告警阈值</span>
                      <span class="threshold-value font-mono" style="color: var(--color-danger);">{{ sensorData.threshold.alarm }}{{ getSensorUnit(sensorData.type) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-label">安装位置</span>
                <span class="detail-value font-mono text-sm">
                  ({{ formatNumber(sensorData.position.x, 1) }}, {{ formatNumber(sensorData.position.y, 1) }}, {{ formatNumber(sensorData.position.z, 1) }})
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">最后更新</span>
                <span class="detail-value">
                  <Clock :size="12" style="margin-right: 4px;" />
                  {{ new Date(sensorData.lastUpdate).toLocaleString('zh-CN') }}
                </span>
              </div>
            </div>

            <div v-else-if="dockData" class="device-content">
              <div class="status-banner" :style="{ background: `${getStatusColor(dockData.status)}20`, borderColor: getStatusColor(dockData.status) }">
                <span :class="['status-dot', dockData.status === 'available' ? 'status-normal' : dockData.status === 'occupied' ? 'status-danger' : dockData.status === 'reserved' ? 'status-warning' : 'status-offline']"></span>
                <span class="status-text">{{ getStatusText(dockData.status) }}</span>
                <span class="status-desc">
                  {{ dockData.status === 'occupied' ? `当前车辆: ${dockData.currentVehicle}` : dockData.status === 'reserved' ? '已被预约' : dockData.status === 'maintenance' ? '维护中' : '可使用' }}
                </span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">装卸口编号</span>
                  <span class="info-value font-mono">{{ dockData.code }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">当前车辆</span>
                  <span class="detail-value">{{ dockData.currentVehicle || '无' }}</span>
                </div>
              </div>

              <div v-if="dockData.estimatedDeparture" class="metric-section">
                <div class="metric-card full-width">
                  <div class="metric-icon" style="background: rgba(250, 173, 20, 0.15); color: var(--color-warning);">
                    <Clock :size="20" />
                  </div>
                  <div class="metric-info">
                    <span class="metric-label">预计离开时间</span>
                    <span class="metric-value font-mono">
                      {{ new Date(dockData.estimatedDeparture).toLocaleString('zh-CN') }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-label">位置坐标</span>
                <span class="detail-value font-mono text-sm">
                  ({{ formatNumber(dockData.position.x, 1) }}, {{ formatNumber(dockData.position.z, 1) }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.device-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.device-modal {
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-secondary);

  .modal-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-primary-light);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-glass-light);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid;
  margin-bottom: 20px;

  .status-text {
    font-weight: 600;
    font-size: 14px;
  }

  .status-desc {
    font-size: 12px;
    color: var(--text-secondary);
    margin-left: auto;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  .info-item {
    background: var(--bg-tertiary);
    padding: 12px 16px;
    border-radius: 8px;

    .info-label {
      display: block;
      font-size: 11px;
      color: var(--text-tertiary);
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.metric-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;

  .metric-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;

    &.full-width {
      .metric-info {
        flex: 1;
      }

      .metric-value {
        font-size: 24px;
      }
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .metric-info {
      flex: 1;

      .metric-label {
        display: block;
        font-size: 11px;
        color: var(--text-tertiary);
        margin-bottom: 2px;
      }

      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .metric-bar {
      width: 100px;
    }

    .metric-status {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 12px;
      background: rgba(82, 196, 26, 0.2);
      color: var(--color-success);

      &.warning {
        background: rgba(250, 173, 20, 0.2);
        color: var(--color-warning);
      }

      &.danger {
        background: rgba(255, 77, 79, 0.2);
        color: var(--color-danger);
      }
    }

    .metric-thresholds {
      display: flex;
      gap: 20px;

      .threshold-item {
        display: flex;
        flex-direction: column;

        .threshold-label {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .threshold-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }
    }
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-secondary);

  &:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 12px;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
  }

  .detail-value {
    font-size: 13px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .device-modal {
    transform: scale(0.9) translateY(20px);
  }
}
</style>
