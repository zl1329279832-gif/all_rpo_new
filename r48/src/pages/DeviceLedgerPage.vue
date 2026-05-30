<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore, useAlarmStore } from '@/stores'
import { DEVICE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, AREA_LABELS, SCENARIO_LABELS, MAINTENANCE_TYPE_LABELS } from '@/types'
import type { DeviceData, DeviceType, AreaType, ScenarioType } from '@/types'
import TopToolbar from '@/components/ui/TopToolbar.vue'
import { ArrowLeft, Search, Filter, MapPin, Calendar, Wrench, AlertTriangle, Activity, Settings, Package, Cpu, BarChart3, Play } from 'lucide-vue-next'

const router = useRouter()
const deviceStore = useDeviceStore()
const alarmStore = useAlarmStore()

const selectedDevice = ref<DeviceData | null>(null)
const typeFilter = ref<DeviceType | null>(null)
const areaFilter = ref<AreaType | null>(null)
const statusFilter = ref<string | null>(null)
const searchKeyword = ref('')

const filteredDevices = computed(() => {
  return deviceStore.devices.filter(d => {
    if (typeFilter.value && d.type !== typeFilter.value) return false
    if (areaFilter.value && d.area !== areaFilter.value) return false
    if (statusFilter.value && d.status !== statusFilter.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      return d.name.toLowerCase().includes(kw) ||
             d.id.toLowerCase().includes(kw) ||
             d.model.toLowerCase().includes(kw) ||
             d.manufacturer.toLowerCase().includes(kw)
    }
    return true
  })
})

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getStatusColor(status: string): string {
  return '#' + (STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 0x8c8c8c).toString(16).padStart(6, '0')
}

function selectDevice(device: DeviceData) {
  selectedDevice.value = device
}

function locateToDevice(device: DeviceData) {
  deviceStore.locateDevice(device.id)
  router.push('/')
}

function applyScenario(scenario: ScenarioType) {
  deviceStore.applyScenario(scenario)
  alarmStore.refreshAlarms()
}
</script>

<template>
  <div class="device-ledger-page">
    <TopToolbar />
    <div class="page-body">
      <div class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/')">
            <ArrowLeft :size="16" />
            返回监控
          </button>
          <h1 class="page-title">设备台账</h1>
        </div>
        <div class="header-right">
          <span class="scenario-label">场景模拟:</span>
          <div class="scenario-buttons">
            <button
              v-for="(label, key) in SCENARIO_LABELS"
              :key="key"
              class="scenario-btn"
              :class="{ active: deviceStore.currentScenario === key }"
              @click="applyScenario(key as ScenarioType)"
            >
              {{ label }}
            </button>
          </div>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="device-list-panel">
          <div class="panel-header">
            <h2 class="panel-title">设备列表</h2>
            <span class="device-count">共 {{ filteredDevices.length }} 台设备</span>
          </div>

          <div class="filter-bar">
            <div class="search-box">
              <Search :size="14" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索设备名称、ID、型号、厂家..."
                class="search-input"
              />
            </div>
            <div class="filter-group">
              <Filter :size="14" />
              <select v-model="typeFilter" class="filter-select">
                <option :value="null">全部类型</option>
                <option v-for="(label, key) in DEVICE_TYPE_LABELS" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
              <select v-model="areaFilter" class="filter-select">
                <option :value="null">全部区域</option>
                <option v-for="(label, key) in AREA_LABELS" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
              <select v-model="statusFilter" class="filter-select">
                <option :value="null">全部状态</option>
                <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div class="device-table-wrapper">
            <table class="device-table">
              <thead>
                <tr>
                  <th>设备名称</th>
                  <th>类型</th>
                  <th>区域</th>
                  <th>状态</th>
                  <th>型号</th>
                  <th>厂家</th>
                  <th>故障次数</th>
                  <th>安装日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="device in filteredDevices"
                  :key="device.id"
                  class="device-row"
                  :class="{ selected: selectedDevice?.id === device.id }"
                  @click="selectDevice(device)"
                >
                  <td>
                    <div class="device-name-cell">
                      <span class="device-icon">
                        <Cpu :size="14" v-if="device.type === 'cabinet'" />
                        <Settings :size="14" v-else-if="device.type === 'pump'" />
                        <Package :size="14" v-else-if="device.type === 'valve'" />
                        <Activity :size="14" v-else />
                      </span>
                      <span>{{ device.name }}</span>
                    </div>
                  </td>
                  <td>{{ DEVICE_TYPE_LABELS[device.type] }}</td>
                  <td>{{ AREA_LABELS[device.area] }}</td>
                  <td>
                    <span class="status-badge" :style="{ background: getStatusColor(device.status) + '20', color: getStatusColor(device.status) }">
                      {{ STATUS_LABELS[device.status] }}
                    </span>
                  </td>
                  <td>{{ device.model }}</td>
                  <td>{{ device.manufacturer }}</td>
                  <td>
                    <span class="fault-count" :class="{ danger: device.maintenance.faultCount > 0 }">
                      {{ device.maintenance.faultCount }}
                    </span>
                  </td>
                  <td>{{ formatDate(device.installDate) }}</td>
                  <td>
                    <button class="action-btn" @click.stop="locateToDevice(device)" title="定位设备">
                      <MapPin :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedDevice" class="device-detail-panel">
          <div class="panel-header">
            <h2 class="panel-title">设备详情</h2>
          </div>

          <div class="detail-section">
            <h3 class="section-title">基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">设备ID</span>
                <span class="info-value">{{ selectedDevice.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">设备名称</span>
                <span class="info-value">{{ selectedDevice.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">设备类型</span>
                <span class="info-value">{{ DEVICE_TYPE_LABELS[selectedDevice.type] }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">所属区域</span>
                <span class="info-value">{{ AREA_LABELS[selectedDevice.area] }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前状态</span>
                <span class="info-value status-badge" :style="{ background: getStatusColor(selectedDevice.status) + '20', color: getStatusColor(selectedDevice.status) }">
                  {{ STATUS_LABELS[selectedDevice.status] }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">设备型号</span>
                <span class="info-value">{{ selectedDevice.model }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">生产厂家</span>
                <span class="info-value">{{ selectedDevice.manufacturer }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">安装日期</span>
                <span class="info-value">{{ formatDate(selectedDevice.installDate) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">维护状态</h3>
            <div class="maintenance-stats">
              <div class="stat-item">
                <div class="stat-icon fault"><AlertTriangle :size="20" /></div>
                <div class="stat-info">
                  <span class="stat-label">故障次数</span>
                  <span class="stat-value">{{ selectedDevice.maintenance.faultCount }}</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon last"><Calendar :size="20" /></div>
                <div class="stat-info">
                  <span class="stat-label">上次保养</span>
                  <span class="stat-value">{{ formatDate(selectedDevice.maintenance.lastMaintenanceDate) }}</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon next"><Wrench :size="20" /></div>
                <div class="stat-info">
                  <span class="stat-label">下次保养</span>
                  <span class="stat-value">{{ formatDate(selectedDevice.maintenance.nextMaintenanceDate) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">实时参数</h3>
            <div class="params-grid">
              <div v-for="(value, key) in selectedDevice.params" :key="key" class="param-item">
                <span class="param-label">{{ key }}</span>
                <span class="param-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">维护记录</h3>
            <div v-if="selectedDevice.maintenance.maintenanceRecords.length > 0" class="maintenance-list">
              <div
                v-for="record in selectedDevice.maintenance.maintenanceRecords"
                :key="record.id"
                class="maintenance-item"
              >
                <div class="maintenance-header">
                  <span class="maintenance-type">{{ MAINTENANCE_TYPE_LABELS[record.type] }}</span>
                  <span class="maintenance-date">{{ formatDateTime(record.date) }}</span>
                </div>
                <div class="maintenance-content">
                  <p class="maintenance-desc">{{ record.description }}</p>
                  <div class="maintenance-footer">
                    <span class="maintenance-operator">操作人: {{ record.operator }}</span>
                    <span class="maintenance-cost">费用: ¥{{ record.cost.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <Wrench :size="32" />
              <p>暂无维护记录</p>
            </div>
          </div>

          <div class="detail-actions">
            <button class="action-primary" @click="locateToDevice(selectedDevice)">
              <MapPin :size="16" />
              定位到三维场景
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-ledger-page {
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scenario-label {
  font-size: 12px;
  color: #6a8caa;
}

.scenario-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  max-width: 600px;
}

.scenario-btn {
  padding: 4px 10px;
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #6a8caa;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.scenario-btn:hover {
  color: #8cb8d8;
}

.scenario-btn.active {
  background: rgba(0, 229, 255, 0.15);
  border-color: rgba(0, 229, 255, 0.4);
  color: #00e5ff;
}

.content-wrapper {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.device-list-panel {
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

.device-count {
  font-size: 12px;
  color: #6a8caa;
}

.filter-bar {
  display: flex;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.08);
  background: rgba(13, 31, 60, 0.4);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  color: #6a8caa;
}

.search-input {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: #e6f7ff;
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: #4a6a8a;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6a8caa;
}

.filter-select {
  padding: 8px 10px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: rgba(10, 22, 40, 0.8);
  color: #e6f7ff;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: rgba(0, 229, 255, 0.4);
}

.device-table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table thead {
  position: sticky;
  top: 0;
  background: rgba(13, 31, 60, 0.9);
  z-index: 1;
}

.device-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #8cb8d8;
  border-bottom: 1px solid rgba(30, 144, 255, 0.1);
  white-space: nowrap;
}

.device-table td {
  padding: 12px 16px;
  font-size: 12px;
  color: #e6f7ff;
  border-bottom: 1px solid rgba(30, 144, 255, 0.05);
}

.device-row {
  cursor: pointer;
  transition: background 0.15s;
}

.device-row:hover {
  background: rgba(13, 31, 60, 0.6);
}

.device-row.selected {
  background: rgba(0, 229, 255, 0.08);
}

.device-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(30, 144, 255, 0.1);
  color: #1890ff;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.fault-count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #52c41a;
}

.fault-count.danger {
  color: #ff4d4f;
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
  background: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.3);
}

.device-detail-panel {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: #6a8caa;
}

.info-value {
  font-size: 13px;
  color: #e6f7ff;
}

.maintenance-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 8px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.stat-icon.fault {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
}

.stat-icon.last {
  background: rgba(24, 144, 255, 0.15);
  color: #1890ff;
}

.stat-icon.next {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-info .stat-label {
  font-size: 11px;
  color: #6a8caa;
}

.stat-info .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #e6f7ff;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 6px;
}

.param-label {
  font-size: 12px;
  color: #6a8caa;
}

.param-value {
  font-size: 13px;
  font-weight: 600;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
}

.maintenance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.maintenance-item {
  padding: 12px;
  background: rgba(13, 31, 60, 0.5);
  border-left: 3px solid #1890ff;
  border-radius: 0 6px 6px 0;
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.maintenance-type {
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.15);
  color: #1890ff;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.maintenance-date {
  font-size: 11px;
  color: #6a8caa;
}

.maintenance-desc {
  font-size: 12px;
  color: #8cb8d8;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.maintenance-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6a8caa;
}

.maintenance-cost {
  color: #faad14;
  font-weight: 500;
}

.detail-actions {
  padding: 16px 18px;
}

.action-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 6px;
  background: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-primary:hover {
  background: rgba(0, 229, 255, 0.25);
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
</style>
