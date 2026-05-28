<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">☀️</div>
      <div class="title">光伏电站运维系统</div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">光伏方阵</div>
      <div 
        v-for="array in arrays" 
        :key="array.id"
        class="array-item"
        :class="{ active: selectedArray === array.id }"
        @click="handleArrayClick(array.id)"
      >
        <div class="array-icon">📦</div>
        <div class="array-info">
          <div class="array-name">{{ array.name }}</div>
          <div class="array-stats">
            <span :style="{ color: getStatusColor(array.status) }">●</span>
            {{ array.deviceCount }} 台设备
          </div>
        </div>
        <div class="array-power">{{ array.totalPower.toFixed(1) }} kW</div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">状态筛选</div>
      <div class="filter-buttons">
        <button 
          class="filter-btn"
          :class="{ active: selectedStatus === null }"
          @click="handleFilterClick(null)"
        >
          全部
        </button>
        <button 
          v-for="status in statusList" 
          :key="status.value"
          class="filter-btn"
          :class="{ active: selectedStatus === status.value }"
          :style="{ '--status-color': status.color }"
          @click="handleFilterClick(status.value)"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">巡检路线</div>
      <div 
        v-for="route in patrolRoutes" 
        :key="route.id"
        class="route-item"
        :class="{ active: selectedRoute === route.id }"
        @click="handleRouteClick(route.id)"
      >
        <div class="route-icon">🛣️</div>
        <div class="route-info">
          <div class="route-name">{{ route.name }}</div>
          <div class="route-stats">
            {{ route.points.length }} 个巡检点 · {{ route.estimatedTime }} 分钟
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="footer-stats">
        <div class="stat">
          <div class="stat-value">{{ totalDevices }}</div>
          <div class="stat-label">设备总数</div>
        </div>
        <div class="stat">
          <div class="stat-value" :style="{ color: '#e74c3c' }">{{ faultCount }}</div>
          <div class="stat-label">故障设备</div>
        </div>
        <div class="stat">
          <div class="stat-value" :style="{ color: '#2ecc71' }">{{ (onlineRate * 100).toFixed(1) }}%</div>
          <div class="stat-label">在线率</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArrayData, PatrolRoute } from '@/types'
import { DeviceStatus, STATUS_COLORS } from '@/types'

defineProps<{
  arrays: ArrayData[]
  patrolRoutes: PatrolRoute[]
  selectedArray: string | null
  selectedStatus: DeviceStatus | null
  selectedRoute: string | null
  totalDevices: number
  faultCount: number
  onlineRate: number
}>()

const emit = defineEmits<{
  (e: 'array-click', arrayId: string): void
  (e: 'filter-change', status: DeviceStatus | null): void
  (e: 'route-click', routeId: string): void
}>()

const statusList: { value: DeviceStatus; label: string; color: string }[] = [
  { value: DeviceStatus.NORMAL, label: '正常', color: '#2ecc71' },
  { value: DeviceStatus.LOW_POWER, label: '发电偏低', color: '#f39c12' },
  { value: DeviceStatus.TEMP_ABNORMAL, label: '温度异常', color: '#e74c3c' },
  { value: DeviceStatus.OFFLINE, label: '离线', color: '#7f8c8d' },
  { value: DeviceStatus.MAINTENANCE, label: '待维修', color: '#3498db' }
]

const getStatusColor = (status: DeviceStatus) => {
  return `#${STATUS_COLORS[status].toString(16).padStart(6, '0')}`
}

const handleArrayClick = (arrayId: string) => {
  emit('array-click', arrayId)
}

const handleFilterClick = (status: DeviceStatus | null) => {
  emit('filter-change', status)
}

const handleRouteClick = (routeId: string) => {
  emit('route-click', routeId)
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100%;
  background: #1e293b;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #334155;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.logo {
  font-size: 32px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid #334155;
}

.section-title {
  font-size: 12px;
  font-weight: bold;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.array-item,
.route-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.array-item:hover,
.route-item:hover {
  background: #334155;
}

.array-item.active,
.route-item.active {
  background: #3b82f6;
}

.array-icon,
.route-icon {
  font-size: 24px;
}

.array-info,
.route-info {
  flex: 1;
  min-width: 0;
}

.array-name,
.route-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.array-stats,
.route-stats {
  font-size: 11px;
  color: #94a3b8;
}

.array-power {
  font-size: 12px;
  font-weight: bold;
  color: #2ecc71;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #475569;
  background: transparent;
  color: #cbd5e1;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #334155;
}

.filter-btn.active {
  background: var(--status-color, #3b82f6);
  border-color: var(--status-color, #3b82f6);
  color: #fff;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  background: #0f172a;
}

.footer-stats {
  display: flex;
  justify-content: space-around;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
}
</style>
