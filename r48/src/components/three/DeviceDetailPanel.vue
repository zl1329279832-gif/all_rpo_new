<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { DeviceData } from '@/types'
import { ALARM_LEVEL_COLORS, ALARM_LEVEL_LABELS, DEVICE_TYPE_LABELS, MAINTENANCE_TYPE_LABELS, STATUS_LABELS } from '@/types'
import { X, AlertTriangle, Clock, Wrench, Calendar, Factory, TrendingUp, Activity } from 'lucide-vue-next'

const props = defineProps<{
  device: DeviceData | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  locate: [deviceId: string]
}>()

const activeTab = ref<'params' | 'maintenance' | 'trend'>('params')

function formatDate(ts: number): string {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function daysBetween(ts: number): number {
  return Math.ceil((ts - Date.now()) / (24 * 3600 * 1000))
}

const maintenanceUrgency = computed(() => {
  if (!props.device) return ''
  const days = daysBetween(props.device.maintenance.nextMaintenanceDate)
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'normal'
})
</script>

<template>
  <Transition name="slide">
    <div v-if="visible && device" class="detail-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="status-dot" :class="device.status"></span>
          <span>{{ device.name }}</span>
          <span class="status-tag" :class="device.status">{{ STATUS_LABELS[device.status] }}</span>
        </div>
        <div class="header-actions">
          <button class="locate-btn" @click="emit('locate', device.id)">
            <TrendingUp :size="14" />
            定位
          </button>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>
      </div>

      <div class="device-info">
        <div class="info-item">
          <Factory :size="14" />
          <span>类型: {{ DEVICE_TYPE_LABELS[device.type] }}</span>
        </div>
        <div class="info-item">
          <span>型号: {{ device.model }}</span>
        </div>
        <div class="info-item">
          <span>厂家: {{ device.manufacturer }}</span>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'params' }" @click="activeTab = 'params'">
          <Activity :size="14" />
          实时参数
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'maintenance' }" @click="activeTab = 'maintenance'">
          <Wrench :size="14" />
          维护记录
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'trend' }" @click="activeTab = 'trend'">
          <TrendingUp :size="14" />
          关联趋势
        </button>
      </div>

      <div class="panel-section" v-show="activeTab === 'params'">
        <div class="section-title">运行参数</div>
        <div class="params-grid">
          <div v-for="(value, key) in device.params" :key="key" class="param-item">
            <span class="param-key">{{ key }}</span>
            <span class="param-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <div class="panel-section" v-show="activeTab === 'maintenance'">
        <div class="section-title">维护状态</div>
        <div class="maintenance-summary">
          <div class="summary-item">
            <span class="summary-label">故障次数</span>
            <span class="summary-value alert">{{ device.maintenance.faultCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">上次保养</span>
            <span class="summary-value">{{ formatDate(device.maintenance.lastMaintenanceDate) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">下次保养</span>
            <span class="summary-value" :class="maintenanceUrgency">
              {{ formatDate(device.maintenance.nextMaintenanceDate) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">安装日期</span>
            <span class="summary-value">{{ formatDate(device.installDate) }}</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 16px">维护记录</div>
        <div v-if="device.maintenance.maintenanceRecords.length === 0" class="empty">
          暂无维护记录
        </div>
        <div class="maintenance-list">
          <div v-for="record in device.maintenance.maintenanceRecords" :key="record.id" class="maintenance-item">
            <div class="record-header">
              <span class="record-type">{{ MAINTENANCE_TYPE_LABELS[record.type] }}</span>
              <span class="record-cost">¥{{ record.cost.toLocaleString() }}</span>
            </div>
            <div class="record-content">{{ record.description }}</div>
            <div class="record-footer">
              <Calendar :size="12" />
              {{ formatDate(record.date) }}
              <span style="margin-left: auto">操作人: {{ record.operator }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-section" v-show="activeTab === 'trend'">
        <div class="section-title">关联告警趋势</div>
        <div v-if="device.alarms.length === 0" class="empty">
          暂无告警记录
        </div>
        <div class="alarm-list">
          <div v-for="alarm in device.alarms" :key="alarm.id" class="alarm-item">
            <span class="alarm-level-dot" :style="{ background: ALARM_LEVEL_COLORS[alarm.level] }"></span>
            <div class="alarm-content">
              <div class="alarm-msg">{{ alarm.message }}</div>
              <div class="alarm-time">
                <Clock :size="12" />
                {{ formatTime(alarm.timestamp) }}
              </div>
            </div>
            <span class="alarm-level-tag" :style="{ color: ALARM_LEVEL_COLORS[alarm.level] }">
              {{ ALARM_LEVEL_LABELS[alarm.level] }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 340px;
  height: 100%;
  background: linear-gradient(180deg, rgba(10, 22, 40, 0.98), rgba(8, 18, 35, 0.99));
  border-left: 1px solid rgba(30, 144, 255, 0.2);
  backdrop-filter: blur(16px);
  overflow-y: auto;
  z-index: 50;
  padding: 16px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.15);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #e6f7ff;
}
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.status-tag.running { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
.status-tag.alarm { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }
.status-tag.maintenance { background: rgba(250, 173, 20, 0.2); color: #faad14; }
.status-tag.offline { background: rgba(67, 67, 67, 0.4); color: #8c8c8c; }
.status-tag.stopped { background: rgba(89, 89, 89, 0.3); color: #8c8c8c; }
.status-tag.recovering { background: rgba(19, 194, 194, 0.2); color: #13c2c2; }
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-dot.running { background: #52c41a; box-shadow: 0 0 6px rgba(82, 196, 26, 0.5); }
.status-dot.stopped { background: #595959; }
.status-dot.alarm { background: #ff4d4f; animation: pulse-dot 1s infinite; }
.status-dot.maintenance { background: #fadb14; }
.status-dot.offline { background: #434343; }
.status-dot.recovering { background: #13c2c2; animation: pulse-dot 1s infinite; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.locate-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(30, 144, 255, 0.3);
  border-radius: 4px;
  background: rgba(30, 144, 255, 0.1);
  color: #00e5ff;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.locate-btn:hover {
  background: rgba(30, 144, 255, 0.2);
}
.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 5px;
  background: transparent;
  color: #8cb8d8;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.4);
  color: #ff4d4f;
}
.device-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px;
  background: rgba(30, 144, 255, 0.04);
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 11px;
  color: #8cb8d8;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: rgba(10, 22, 40, 0.6);
  border-radius: 6px;
  padding: 3px;
}
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8cb8d8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active {
  background: rgba(30, 144, 255, 0.2);
  color: #00e5ff;
}
.panel-section {
  margin-bottom: 12px;
}
.section-title {
  font-size: 12px;
  color: #8cb8d8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.param-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  background: rgba(30, 144, 255, 0.05);
  border: 1px solid rgba(30, 144, 255, 0.1);
  border-radius: 5px;
}
.param-key {
  font-size: 10px;
  color: #6a8caa;
  text-transform: uppercase;
}
.param-value {
  font-size: 16px;
  font-weight: 700;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
}
.maintenance-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: rgba(30, 144, 255, 0.05);
  border-radius: 5px;
}
.summary-label {
  font-size: 10px;
  color: #6a8caa;
}
.summary-value {
  font-size: 13px;
  font-weight: 600;
  color: #e6f7ff;
  word-break: break-all;
}
.summary-value.alert { color: #ff4d4f; }
.summary-value.urgent { color: #faad14; }
.summary-value.soon { color: #faad14; }
.summary-value.overdue { color: #ff4d4f; }
.maintenance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.maintenance-item {
  padding: 8px;
  background: rgba(30, 144, 255, 0.04);
  border: 1px solid rgba(30, 144, 255, 0.08);
  border-radius: 5px;
}
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.record-type {
  padding: 2px 6px;
  background: rgba(30, 144, 255, 0.15);
  color: #00e5ff;
  border-radius: 3px;
  font-size: 10px;
}
.record-cost {
  font-size: 12px;
  font-weight: 600;
  color: #52c41a;
}
.record-content {
  font-size: 11px;
  color: #e6f7ff;
  margin-bottom: 4px;
}
.record-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #6a8caa;
}
.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 77, 79, 0.04);
  border: 1px solid rgba(255, 77, 79, 0.12);
  border-radius: 5px;
}
.alarm-level-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}
.alarm-content {
  flex: 1;
}
.alarm-msg {
  font-size: 11px;
  color: #e6f7ff;
  margin-bottom: 2px;
}
.alarm-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #6a8caa;
}
.alarm-level-tag {
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}
.empty {
  padding: 20px;
  text-align: center;
  color: #6a8caa;
  font-size: 12px;
  background: rgba(30, 144, 255, 0.03);
  border-radius: 5px;
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
