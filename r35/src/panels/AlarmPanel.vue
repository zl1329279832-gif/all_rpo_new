<script setup lang="ts">
import { computed, ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { useWarehouseStore } from '@/data/warehouseStore';
import type { AlarmData, AlarmLevel } from '@/types';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Clock, User } from 'lucide-vue-next';
import { formatDateTime, getAlarmLevelColor, debounce } from '@/utils';

const store = useWarehouseStore();

const emit = defineEmits<{
  (e: 'locateAlarm', alarm: AlarmData): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const visibleStart = ref(0);
const visibleEnd = ref(20);
const itemHeight = 72;
const overscan = 5;
const maxVisibleItems = 20;

const criticalCount = computed(() => {
  const alarms = store.alarms;
  let count = 0;
  for (let i = 0; i < alarms.length; i++) {
    const a = alarms[i];
    if (a.level === 'critical' && a.status !== 'resolved') count++;
  }
  return count;
});

const warningCount = computed(() => {
  const alarms = store.alarms;
  let count = 0;
  for (let i = 0; i < alarms.length; i++) {
    const a = alarms[i];
    if (a.level === 'warning' && a.status !== 'resolved') count++;
  }
  return count;
});

const infoCount = computed(() => {
  const alarms = store.alarms;
  let count = 0;
  for (let i = 0; i < alarms.length; i++) {
    const a = alarms[i];
    if (a.level === 'info' && a.status !== 'resolved') count++;
  }
  return count;
});

const displayedAlarms = computed(() => {
  const alarms = store.filteredAlarms;
  const end = Math.min(visibleEnd.value, alarms.length);
  return alarms.slice(visibleStart.value, end);
});

const totalHeight = computed(() => {
  return store.filteredAlarms.length * itemHeight;
});

const offsetY = computed(() => {
  return visibleStart.value * itemHeight;
});

const handleScroll = debounce(() => {
  if (!scrollContainer.value) return;

  const container = scrollContainer.value;
  const top = container.scrollTop;
  const height = container.clientHeight;

  const start = Math.max(0, Math.floor(top / itemHeight) - overscan);
  const end = Math.min(
    store.filteredAlarms.length,
    Math.ceil((top + height) / itemHeight) + overscan
  );

  if (start !== visibleStart.value || end !== visibleEnd.value) {
    visibleStart.value = start;
    visibleEnd.value = end;
  }
}, 16);

function getAlarmIcon(level: AlarmLevel) {
  switch (level) {
    case 'critical':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
}

function getAlarmTypeLabel(type: string): string {
  const map: Record<string, string> = {
    temperature: '温度异常',
    humidity: '湿度异常',
    offline: '设备离线',
    congestion: '通道拥堵',
    capacity: '容量告警',
    smoke: '烟雾告警',
    door: '门禁异常',
  };
  return map[type] || type;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    unhandled: '待处理',
    processing: '处理中',
    resolved: '已解决',
  };
  return map[status] || status;
}

function handleAlarm(alarm: AlarmData) {
  store.handleAlarm(alarm.id);
}

function locateAlarm(alarm: AlarmData) {
  emit('locateAlarm', alarm);
}

function getAlarmMemoKey(alarm: AlarmData) {
  return `${alarm.id}-${alarm.status}-${alarm.timestamp}`;
}

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<template>
  <div class="alarm-panel glass-panel animate-slide-in-right">
    <div class="panel-header">
      <h3 class="panel-title">
        <Bell :size="18" />
        <span>告警中心</span>
      </h3>
      <div class="alarm-summary">
        <div v-if="criticalCount > 0" class="alarm-count critical">
          <span class="count">{{ criticalCount }}</span>
          <span class="label">严重</span>
        </div>
        <div v-if="warningCount > 0" class="alarm-count warning">
          <span class="count">{{ warningCount }}</span>
          <span class="label">警告</span>
        </div>
        <div v-if="infoCount > 0" class="alarm-count info">
          <span class="count">{{ infoCount }}</span>
          <span class="label">提示</span>
        </div>
      </div>
    </div>

    <div class="alarm-tabs">
      <button
        v-for="filter in ['unhandled', 'processing', 'resolved']"
        :key="filter"
        :class="['tab-btn', { active: store.alarmFilter === filter }]"
        @click="store.setAlarmFilter(filter as any)"
      >
        {{ getStatusLabel(filter) }}
        <span class="tab-count">
          {{ store.alarms.filter(a => a.status === filter).length }}
        </span>
      </button>
    </div>

    <div class="alarm-list" ref="scrollContainer">
      <div class="alarm-list-spacer" :style="{ height: `${totalHeight}px` }">
        <div class="alarm-list-viewport" :style="{ transform: `translateY(${offsetY}px)` }">
          <div
            v-for="alarm in displayedAlarms"
            :key="alarm.id"
            v-memo="[getAlarmMemoKey(alarm)]"
            :class="['alarm-item', `level-${alarm.level}`]"
          >
            <div class="alarm-icon">
            <component
              :is="getAlarmIcon(alarm.level)"
              :size="20"
              :style="{ color: getAlarmLevelColor(alarm.level) }"
            />
          </div>

          <div class="alarm-content">
            <div class="alarm-header">
              <span class="alarm-type">{{ getAlarmTypeLabel(alarm.type) }}</span>
              <span
                :class="['alarm-status', alarm.status]"
              >
                {{ getStatusLabel(alarm.status) }}
              </span>
            </div>
            <p class="alarm-message">{{ alarm.message }}</p>
            <div class="alarm-meta">
              <span class="alarm-time">
                <Clock :size="12" />
                {{ formatDateTime(alarm.timestamp) }}
              </span>
              <span v-if="alarm.handledBy" class="alarm-handler">
                <User :size="12" />
                {{ alarm.handledBy }}
              </span>
            </div>
          </div>

          <div class="alarm-actions">
            <button
              v-if="alarm.status !== 'resolved'"
              class="action-btn locate"
              title="定位"
              @click="locateAlarm(alarm)"
            >
              📍
            </button>
            <button
              v-if="alarm.status === 'unhandled'"
              class="action-btn handle"
              title="处理"
              @click="handleAlarm(alarm)"
            >
              <CheckCircle :size="16" />
            </button>
            <button
              v-if="alarm.status === 'processing'"
              class="action-btn resolve"
              title="解决"
              @click="handleAlarm(alarm)"
            >
              ✅
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.filteredAlarms.length === 0" class="empty-state">
      <CheckCircle :size="48" class="empty-icon" />
      <p>暂无告警信息</p>
    </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.alarm-panel {
  position: absolute;
  top: 92px;
  right: 16px;
  width: 360px;
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

  .alarm-summary {
    display: flex;
    gap: 8px;

    .alarm-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      min-width: 48px;

      &.critical {
        background: rgba(255, 77, 79, 0.15);
        border: 1px solid rgba(255, 77, 79, 0.3);

        .count {
          color: var(--color-danger);
        }
      }

      &.warning {
        background: rgba(250, 173, 20, 0.15);
        border: 1px solid rgba(250, 173, 20, 0.3);

        .count {
          color: var(--color-warning);
        }
      }

      &.info {
        background: rgba(24, 144, 255, 0.15);
        border: 1px solid rgba(24, 144, 255, 0.3);

        .count {
          color: var(--color-primary);
        }
      }

      .count {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 16px;
      }

      .label {
        font-size: 10px;
        color: var(--text-tertiary);
      }
    }
  }
}

.alarm-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  background: var(--bg-tertiary);
  border-radius: 6px;

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--text-primary);
    }

    &.active {
      background: var(--color-primary);
      color: white;
    }

    .tab-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      opacity: 0.8;
    }
  }
}

.alarm-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-behavior: smooth;
  will-change: transform;

  .alarm-list-spacer {
    position: relative;
    width: 100%;
  }

  .alarm-list-viewport {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    will-change: transform;
  }
}

.alarm-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-glass-light);
    transform: translateX(-4px);
  }

  &.level-critical {
    border-left-color: var(--color-danger);
  }

  &.level-warning {
    border-left-color: var(--color-warning);
  }

  &.level-info {
    border-left-color: var(--color-primary);
  }

  .alarm-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .alarm-content {
    flex: 1;
    min-width: 0;

    .alarm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;

      .alarm-type {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .alarm-status {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;

        &.unhandled {
          background: rgba(255, 77, 79, 0.2);
          color: var(--color-danger);
        }

        &.processing {
          background: rgba(250, 173, 20, 0.2);
          color: var(--color-warning);
        }

        &.resolved {
          background: rgba(82, 196, 26, 0.2);
          color: var(--color-success);
        }
      }
    }

    .alarm-message {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .alarm-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--text-tertiary);

      .alarm-time,
      .alarm-handler {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .alarm-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .action-btn {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: var(--bg-glass-light);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-size: 14px;
      color: var(--text-secondary);

      &:hover {
        transform: scale(1.1);

        &.locate {
          background: rgba(24, 144, 255, 0.2);
          color: var(--color-primary);
        }

        &.handle {
          background: rgba(250, 173, 20, 0.2);
          color: var(--color-warning);
        }

        &.resolve {
          background: rgba(82, 196, 26, 0.2);
          color: var(--color-success);
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-tertiary);

  .empty-icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    font-size: 13px;
  }
}

.alarm-enter-active,
.alarm-leave-active {
  transition: all 0.3s ease;
}

.alarm-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.alarm-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.alarm-move {
  transition: transform 0.3s ease;
}
</style>
