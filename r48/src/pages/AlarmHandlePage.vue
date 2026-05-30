<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAlarmStore, useDeviceStore } from '@/stores'
import { ALARM_LEVEL_LABELS, ALARM_LEVEL_COLORS, ALARM_STATUS_LABELS, ALARM_STATUS_COLORS, DEVICE_TYPE_LABELS } from '@/types'
import type { AlarmInfo, AlarmLevel, AlarmStatus } from '@/types'
import TopToolbar from '@/components/ui/TopToolbar.vue'
import { AlertTriangle, CheckCircle, Clock, XCircle, User, Calendar, MapPin, MessageSquare, ArrowLeft, Activity, Filter } from 'lucide-vue-next'

const router = useRouter()
const alarmStore = useAlarmStore()
const deviceStore = useDeviceStore()

const selectedAlarm = ref<AlarmInfo | null>(null)
const showDisposalModal = ref(false)
const disposalAction = ref('')
const disposalDescription = ref('')
const operatorName = ref('系统管理员')

const stats = computed(() => alarmStore.stats)

function getDeviceName(deviceId: string): string {
  const device = deviceStore.devices.find(d => d.id === deviceId)
  return device?.name || deviceId
}

function getDeviceType(deviceId: string): string {
  const device = deviceStore.devices.find(d => d.id === deviceId)
  return device ? DEVICE_TYPE_LABELS[device.type] : '-'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function formatDuration(start: number, end?: number): string {
  const ms = (end || Date.now()) - start
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时${mins % 60}分钟`
  return `${mins}分钟`
}

function selectAlarm(alarm: AlarmInfo) {
  selectedAlarm.value = alarm
  alarmStore.selectAlarm(alarm)
}

function locateToDevice(alarm: AlarmInfo) {
  alarmStore.selectAlarm(alarm)
  router.push('/')
}

function confirmAlarm(alarm: AlarmInfo) {
  alarmStore.confirmAlarmAction(alarm.id, operatorName.value)
}

function openDisposalModal(alarm: AlarmInfo, action: string) {
  selectedAlarm.value = alarm
  disposalAction.value = action
  disposalDescription.value = ''
  showDisposalModal.value = true
}

function submitDisposal() {
  if (!selectedAlarm.value || !disposalAction.value || !disposalDescription.value) return
  
  if (disposalAction.value === 'recover') {
    alarmStore.recoverAlarmAction(selectedAlarm.value.id, operatorName.value)
  } else {
    alarmStore.addDisposalRecord(selectedAlarm.value.id, operatorName.value, disposalAction.value, disposalDescription.value)
  }
  
  showDisposalModal.value = false
  disposalAction.value = ''
  disposalDescription.value = ''
}

function closeAlarm(alarm: AlarmInfo) {
  alarmStore.closeAlarmAction(alarm.id, operatorName.value)
}

function filterByLevel(level: AlarmLevel | null) {
  alarmStore.setLevelFilter(level)
}

function filterByStatus(status: AlarmStatus | null) {
  alarmStore.setStatusFilter(status)
}
</script>

<template>
  <div class="alarm-handle-page">
    <TopToolbar />
    <div class="page-body">
      <div class="page-header">
        <button class="back-btn" @click="router.push('/')">
          <ArrowLeft :size="16" />
          返回监控
        </button>
        <h1 class="page-title">告警处置中心</h1>
      </div>

      <div class="stats-cards">
        <div class="stat-card total">
          <div class="stat-icon"><AlertTriangle :size="24" /></div>
          <div class="stat-info">
            <span class="stat-label">告警总数</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon"><Clock :size="24" /></div>
          <div class="stat-info">
            <span class="stat-label">待确认</span>
            <span class="stat-value">{{ stats.pending }}</span>
          </div>
        </div>
        <div class="stat-card processing">
          <div class="stat-icon"><Activity :size="24" /></div>
          <div class="stat-info">
            <span class="stat-label">处置中</span>
            <span class="stat-value">{{ stats.processing }}</span>
          </div>
        </div>
        <div class="stat-card recovered">
          <div class="stat-icon"><CheckCircle :size="24" /></div>
          <div class="stat-info">
            <span class="stat-label">已恢复</span>
            <span class="stat-value">{{ stats.recovered }}</span>
          </div>
        </div>
        <div class="stat-card closed">
          <div class="stat-icon"><XCircle :size="24" /></div>
          <div class="stat-info">
            <span class="stat-label">已关闭</span>
            <span class="stat-value">{{ stats.closed }}</span>
          </div>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="alarm-list-panel">
          <div class="panel-header">
            <h2 class="panel-title">告警列表</h2>
            <div class="filter-group">
              <Filter :size="14" />
              <div class="filter-buttons">
                <button
                  v-for="level in (['critical', 'major', 'minor', 'info', null] as (AlarmLevel | null)[])"
                  :key="level || 'all'"
                  class="filter-btn"
                  :class="{ active: alarmStore.levelFilter === level }"
                  @click="filterByLevel(level)"
                >
                  {{ level ? ALARM_LEVEL_LABELS[level] : '全部' }}
                </button>
              </div>
              <div class="filter-buttons">
                <button
                  v-for="status in (['pending', 'confirmed', 'processing', 'recovered', 'closed', null] as (AlarmStatus | null)[])"
                  :key="status || 'all'"
                  class="filter-btn status"
                  :class="{ active: alarmStore.statusFilter === status }"
                  @click="filterByStatus(status)"
                >
                  {{ status ? ALARM_STATUS_LABELS[status] : '全部状态' }}
                </button>
              </div>
            </div>
          </div>

          <div class="alarm-list">
            <div
              v-for="alarm in alarmStore.filteredAlarms"
              :key="alarm.id"
              class="alarm-item"
              :class="{ selected: selectedAlarm?.id === alarm.id }"
              @click="selectAlarm(alarm)"
            >
              <div class="alarm-level" :style="{ background: ALARM_LEVEL_COLORS[alarm.level] }">
                {{ ALARM_LEVEL_LABELS[alarm.level] }}
              </div>
              <div class="alarm-content">
                <div class="alarm-header">
                  <span class="alarm-message">{{ alarm.message }}</span>
                  <span class="alarm-status" :style="{ color: ALARM_STATUS_COLORS[alarm.status] }">
                    {{ ALARM_STATUS_LABELS[alarm.status] }}
                  </span>
                </div>
                <div class="alarm-meta">
                  <span class="meta-item">
                    <MapPin :size="12" />
                    {{ getDeviceName(alarm.deviceId) }}
                  </span>
                  <span class="meta-item">
                    <Calendar :size="12" />
                    {{ formatTime(alarm.timestamp) }}
                  </span>
                  <span v-if="alarm.triggerValue !== undefined" class="meta-item">
                    触发值: {{ alarm.triggerValue }}{{ alarm.threshold ? ` / 阈值: ${alarm.threshold}` : '' }}
                  </span>
                </div>
              </div>
              <div class="alarm-actions">
                <button class="action-btn locate" @click.stop="locateToDevice(alarm)" title="定位设备">
                  <MapPin :size="14" />
                </button>
                <button
                  v-if="alarm.status === 'pending'"
                  class="action-btn confirm"
                  @click.stop="confirmAlarm(alarm)"
                  title="确认告警"
                >
                  <CheckCircle :size="14" />
                </button>
                <button
                  v-if="alarm.status === 'confirmed'"
                  class="action-btn process"
                  @click.stop="openDisposalModal(alarm, '处理中')"
                  title="开始处置"
                >
                  <Activity :size="14" />
                </button>
                <button
                  v-if="alarm.status === 'processing'"
                  class="action-btn recover"
                  @click.stop="openDisposalModal(alarm, 'recover')"
                  title="标记恢复"
                >
                  <CheckCircle :size="14" />
                </button>
                <button
                  v-if="alarm.status === 'recovered'"
                  class="action-btn close"
                  @click.stop="closeAlarm(alarm)"
                  title="关闭告警"
                >
                  <XCircle :size="14" />
                </button>
              </div>
            </div>
            <div v-if="alarmStore.filteredAlarms.length === 0" class="empty-state">
              <CheckCircle :size="48" />
              <p>暂无符合条件的告警</p>
            </div>
          </div>
        </div>

        <div v-if="selectedAlarm" class="alarm-detail-panel">
          <div class="panel-header">
            <h2 class="panel-title">告警详情</h2>
          </div>

          <div class="detail-section">
            <h3 class="section-title">基本信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">告警等级</span>
                <span class="detail-value" :style="{ color: ALARM_LEVEL_COLORS[selectedAlarm.level] }">
                  {{ ALARM_LEVEL_LABELS[selectedAlarm.level] }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">告警状态</span>
                <span class="detail-value" :style="{ color: ALARM_STATUS_COLORS[selectedAlarm.status] }">
                  {{ ALARM_STATUS_LABELS[selectedAlarm.status] }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">告警描述</span>
                <span class="detail-value">{{ selectedAlarm.message }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">来源设备</span>
                <button class="detail-link" @click="locateToDevice(selectedAlarm)">
                  <MapPin :size="12" />
                  {{ getDeviceName(selectedAlarm.deviceId) }}
                </button>
              </div>
              <div class="detail-item">
                <span class="detail-label">设备类型</span>
                <span class="detail-value">{{ getDeviceType(selectedAlarm.deviceId) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">触发时间</span>
                <span class="detail-value">{{ formatTime(selectedAlarm.timestamp) }}</span>
              </div>
              <div v-if="selectedAlarm.triggerValue !== undefined" class="detail-item">
                <span class="detail-label">触发值</span>
                <span class="detail-value">{{ selectedAlarm.triggerValue }}</span>
              </div>
              <div v-if="selectedAlarm.threshold !== undefined" class="detail-item">
                <span class="detail-label">阈值</span>
                <span class="detail-value">{{ selectedAlarm.threshold }}</span>
              </div>
              <div v-if="selectedAlarm.confirmedAt" class="detail-item">
                <span class="detail-label">确认时间</span>
                <span class="detail-value">{{ formatTime(selectedAlarm.confirmedAt) }}</span>
              </div>
              <div v-if="selectedAlarm.confirmedBy" class="detail-item">
                <span class="detail-label">确认人</span>
                <span class="detail-value">{{ selectedAlarm.confirmedBy }}</span>
              </div>
              <div v-if="selectedAlarm.recoveredAt" class="detail-item">
                <span class="detail-label">恢复时间</span>
                <span class="detail-value">{{ formatTime(selectedAlarm.recoveredAt) }}</span>
              </div>
              <div v-if="selectedAlarm.recoveryValue !== undefined" class="detail-item">
                <span class="detail-label">恢复值</span>
                <span class="detail-value">{{ selectedAlarm.recoveryValue }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">持续时间</span>
                <span class="detail-value">{{ formatDuration(selectedAlarm.timestamp, selectedAlarm.recoveredAt) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">处置记录</h3>
            <div v-if="selectedAlarm.disposalRecords.length > 0" class="disposal-list">
              <div
                v-for="record in selectedAlarm.disposalRecords"
                :key="record.id"
                class="disposal-item"
              >
                <div class="disposal-time">{{ formatTime(record.timestamp) }}</div>
                <div class="disposal-content">
                  <div class="disposal-header">
                    <span class="disposal-action">{{ record.action }}</span>
                    <span class="disposal-operator">
                      <User :size="12" />
                      {{ record.operator }}
                    </span>
                  </div>
                  <p class="disposal-description">{{ record.description }}</p>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <MessageSquare :size="32" />
              <p>暂无处置记录</p>
            </div>
          </div>

          <div class="detail-actions">
            <button
              v-if="selectedAlarm.status === 'pending'"
              class="action-primary"
              @click="confirmAlarm(selectedAlarm)"
            >
              <CheckCircle :size="16" />
              确认告警
            </button>
            <button
              v-if="selectedAlarm.status === 'confirmed'"
              class="action-primary"
              @click="openDisposalModal(selectedAlarm, '处理中')"
            >
              <Activity :size="16" />
              开始处置
            </button>
            <button
              v-if="selectedAlarm.status === 'processing'"
              class="action-primary success"
              @click="openDisposalModal(selectedAlarm, 'recover')"
            >
              <CheckCircle :size="16" />
              标记恢复
            </button>
            <button
              v-if="selectedAlarm.status === 'recovered'"
              class="action-primary"
              @click="closeAlarm(selectedAlarm)"
            >
              <XCircle :size="16" />
              关闭告警
            </button>
            <button class="action-secondary" @click="locateToDevice(selectedAlarm)">
              <MapPin :size="16" />
              定位设备
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDisposalModal" class="modal-overlay" @click.self="showDisposalModal = false">
      <div class="modal-content">
        <h3 class="modal-title">
          {{ disposalAction === 'recover' ? '标记恢复' : '添加处置记录' }}
        </h3>
        <div class="form-group">
          <label>操作人</label>
          <input v-model="operatorName" type="text" class="form-input" placeholder="请输入操作人姓名" />
        </div>
        <div v-if="disposalAction !== 'recover'" class="form-group">
          <label>处置动作</label>
          <input v-model="disposalAction" type="text" class="form-input" placeholder="如：现场检查、设备重启、参数调整等" />
        </div>
        <div class="form-group">
          <label>处置描述</label>
          <textarea
            v-model="disposalDescription"
            class="form-textarea"
            :placeholder="disposalAction === 'recover' ? '请描述恢复情况' : '请详细描述处置过程和结果'"
            rows="4"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDisposalModal = false">取消</button>
          <button class="btn-primary" @click="submitDisposal" :disabled="!disposalDescription">
            确认提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alarm-handle-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  overflow: hidden;
}

.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid rgba(30, 144, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #00e5ff;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #e6f7ff;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(8px);
}

.stat-card .stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(30, 144, 255, 0.1);
  color: #1890ff;
}

.stat-card.total .stat-icon { background: rgba(24, 144, 255, 0.15); color: #1890ff; }
.stat-card.pending .stat-icon { background: rgba(255, 77, 79, 0.15); color: #ff4d4f; }
.stat-card.processing .stat-icon { background: rgba(24, 144, 255, 0.15); color: #1890ff; }
.stat-card.recovered .stat-icon { background: rgba(82, 196, 26, 0.15); color: #52c41a; }
.stat-card.closed .stat-icon { background: rgba(140, 140, 140, 0.15); color: #8c8c8c; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6a8caa;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #e6f7ff;
  font-variant-numeric: tabular-nums;
}

.content-wrapper {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.alarm-list-panel {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.1);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #e6f7ff;
  margin: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6a8caa;
}

.filter-buttons {
  display: flex;
  gap: 4px;
}

.filter-btn {
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #6a8caa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: #8cb8d8;
}

.filter-btn.active {
  background: rgba(30, 144, 255, 0.15);
  border-color: rgba(30, 144, 255, 0.3);
  color: #00e5ff;
}

.alarm-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(13, 31, 60, 0.5);
  border: 1px solid rgba(30, 144, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.alarm-item:hover {
  background: rgba(13, 31, 60, 0.8);
  border-color: rgba(30, 144, 255, 0.2);
}

.alarm-item.selected {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.3);
}

.alarm-level {
  padding: 4px 10px;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.alarm-content {
  flex: 1;
  min-width: 0;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.alarm-message {
  font-size: 13px;
  color: #e6f7ff;
  font-weight: 500;
}

.alarm-status {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.alarm-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6a8caa;
}

.alarm-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #6a8caa;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #00e5ff;
}

.action-btn.confirm:hover { background: rgba(82, 196, 26, 0.15); color: #52c41a; border-color: rgba(82, 196, 26, 0.3); }
.action-btn.process:hover { background: rgba(24, 144, 255, 0.15); color: #1890ff; border-color: rgba(24, 144, 255, 0.3); }
.action-btn.recover:hover { background: rgba(82, 196, 26, 0.15); color: #52c41a; border-color: rgba(82, 196, 26, 0.3); }
.action-btn.close:hover { background: rgba(140, 140, 140, 0.15); color: #8c8c8c; border-color: rgba(140, 140, 140, 0.3); }
.action-btn.locate:hover { background: rgba(0, 229, 255, 0.15); color: #00e5ff; border-color: rgba(0, 229, 255, 0.3); }

.alarm-detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.detail-section {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.08);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #00e5ff;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.15);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: #6a8caa;
}

.detail-value {
  font-size: 13px;
  color: #e6f7ff;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 4px;
  background: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
  font-size: 12px;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s;
}

.detail-link:hover {
  background: rgba(0, 229, 255, 0.2);
}

.disposal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.disposal-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: rgba(13, 31, 60, 0.5);
  border-left: 3px solid #1890ff;
  border-radius: 0 6px 6px 0;
}

.disposal-time {
  font-size: 11px;
  color: #6a8caa;
  white-space: nowrap;
  padding-top: 2px;
}

.disposal-content {
  flex: 1;
}

.disposal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.disposal-action {
  font-size: 13px;
  font-weight: 600;
  color: #e6f7ff;
}

.disposal-operator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8cb8d8;
}

.disposal-description {
  font-size: 12px;
  color: #8cb8d8;
  margin: 0;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 10px;
  padding: 16px 18px;
}

.action-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid rgba(30, 144, 255, 0.4);
  border-radius: 6px;
  background: rgba(30, 144, 255, 0.15);
  color: #00e5ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-primary:hover {
  background: rgba(30, 144, 255, 0.25);
}

.action-primary.success {
  border-color: rgba(82, 196, 26, 0.4);
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
}

.action-primary.success:hover {
  background: rgba(82, 196, 26, 0.25);
}

.action-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-secondary:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #00e5ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6a8caa;
  gap: 12px;
}

.empty-state.small {
  padding: 20px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 480px;
  max-width: 90vw;
  background: #0d1f3c;
  border: 1px solid rgba(30, 144, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #e6f7ff;
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #8cb8d8;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: rgba(10, 22, 40, 0.8);
  color: #e6f7ff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: rgba(0, 229, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.1);
}

.form-textarea {
  min-height: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(30, 144, 255, 0.1);
}

.btn-primary {
  padding: 8px 20px;
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 6px;
  background: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.25);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
