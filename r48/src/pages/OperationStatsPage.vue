<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSceneStore, useDeviceStore, useAlarmStore } from '@/stores'
import TopToolbar from '@/components/ui/TopToolbar.vue'
import FlowChart from '@/components/charts/FlowChart.vue'
import EnergyChart from '@/components/charts/EnergyChart.vue'
import OnlineRateChart from '@/components/charts/OnlineRateChart.vue'
import AlarmTrendChart from '@/components/charts/AlarmTrendChart.vue'
import { ArrowLeft, Activity, Zap, Droplets, Gauge, AlertTriangle, CheckCircle, Clock, Wrench, TrendingUp, Server, Cpu, HardDrive } from 'lucide-vue-next'

const router = useRouter()
const sceneStore = useSceneStore()
const deviceStore = useDeviceStore()
const alarmStore = useAlarmStore()

const metrics = computed(() => sceneStore.stationMetrics)
const stats = computed(() => sceneStore.operationStats)
const alarmStats = computed(() => alarmStore.stats)

const deviceStats = computed(() => {
  const devices = deviceStore.devices
  return {
    total: devices.length,
    running: devices.filter(d => d.status === 'running').length,
    alarm: devices.filter(d => d.status === 'alarm').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
    offline: devices.filter(d => d.status === 'offline').length,
    stopped: devices.filter(d => d.status === 'stopped').length,
    recovering: devices.filter(d => d.status === 'recovering').length,
  }
})

const maintenanceStats = computed(() => {
  const devices = deviceStore.devices
  let totalMaintenance = 0
  let totalFaults = 0
  let totalCost = 0
  
  devices.forEach(d => {
    totalFaults += d.maintenance.faultCount
    d.maintenance.maintenanceRecords.forEach(r => {
      totalMaintenance++
      totalCost += r.cost
    })
  })
  
  return {
    totalMaintenance,
    totalFaults,
    totalCost,
    avgCost: totalMaintenance > 0 ? totalCost / totalMaintenance : 0,
  }
})

function formatNumber(num: number, decimals = 0): string {
  return num.toFixed(decimals)
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="operation-stats-page">
    <TopToolbar />
    <div class="page-body">
      <div class="page-header">
        <button class="back-btn" @click="router.push('/')">
          <ArrowLeft :size="16" />
          返回监控
        </button>
        <h1 class="page-title">运维统计</h1>
      </div>

      <div v-if="stats" class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon devices"><Server :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">设备总数</span>
            <span class="stat-value">{{ stats.totalDevices }}</span>
            <div class="stat-sub">
              <span class="stat-sub-label">运行中</span>
              <span class="stat-sub-value running">{{ stats.runningDevices }} 台</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon online"><Activity :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">设备在线率</span>
            <span class="stat-value">{{ formatPercent(stats.onlineRate) }}</span>
            <div class="stat-sub">
              <span class="stat-sub-label">故障率</span>
              <span class="stat-sub-value fault">{{ formatPercent(stats.faultRate) }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon alarm"><AlertTriangle :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">告警总数</span>
            <span class="stat-value">{{ stats.totalAlarms }}</span>
            <div class="stat-sub">
              <span class="stat-sub-label">处置率</span>
              <span class="stat-sub-value success">{{ formatPercent(stats.alarmHandlingRate) }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon energy"><Zap :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">累计能耗</span>
            <span class="stat-value">{{ formatNumber(stats.totalEnergy) }}<small>kWh</small></span>
            <div class="stat-sub">
              <span class="stat-sub-label">总流量</span>
              <span class="stat-sub-value">{{ formatNumber(stats.totalFlow) }} m³</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pressure"><Gauge :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">平均压力</span>
            <span class="stat-value">{{ stats.averagePressure.toFixed(2) }}<small>MPa</small></span>
            <div class="stat-sub">
              <span class="stat-sub-label">已处置</span>
              <span class="stat-sub-value">{{ stats.handledAlarms }} 条</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon maintenance"><Wrench :size="24" /></div>
          <div class="stat-content">
            <span class="stat-label">维护次数</span>
            <span class="stat-value">{{ maintenanceStats.totalMaintenance }}</span>
            <div class="stat-sub">
              <span class="stat-sub-label">总费用</span>
              <span class="stat-sub-value cost">¥{{ formatNumber(maintenanceStats.totalCost, 2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="device-status-section">
        <h2 class="section-title">设备状态分布</h2>
        <div class="device-status-grid">
          <div class="status-item running">
            <div class="status-icon"><Cpu :size="20" /></div>
            <div class="status-info">
              <span class="status-label">运行中</span>
              <span class="status-count">{{ deviceStats.running }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.running / deviceStats.total) * 100}%` }" />
            </div>
          </div>
          <div class="status-item alarm">
            <div class="status-icon"><AlertTriangle :size="20" /></div>
            <div class="status-info">
              <span class="status-label">告警</span>
              <span class="status-count">{{ deviceStats.alarm }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.alarm / deviceStats.total) * 100}%` }" />
            </div>
          </div>
          <div class="status-item maintenance">
            <div class="status-icon"><Wrench :size="20" /></div>
            <div class="status-info">
              <span class="status-label">检修</span>
              <span class="status-count">{{ deviceStats.maintenance }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.maintenance / deviceStats.total) * 100}%` }" />
            </div>
          </div>
          <div class="status-item offline">
            <div class="status-icon"><HardDrive :size="20" /></div>
            <div class="status-info">
              <span class="status-label">离线</span>
              <span class="status-count">{{ deviceStats.offline }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.offline / deviceStats.total) * 100}%` }" />
            </div>
          </div>
          <div class="status-item stopped">
            <div class="status-icon"><Clock :size="20" /></div>
            <div class="status-info">
              <span class="status-label">停机</span>
              <span class="status-count">{{ deviceStats.stopped }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.stopped / deviceStats.total) * 100}%` }" />
            </div>
          </div>
          <div class="status-item recovering">
            <div class="status-icon"><TrendingUp :size="20" /></div>
            <div class="status-info">
              <span class="status-label">恢复中</span>
              <span class="status-count">{{ deviceStats.recovering }}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" :style="{ width: `${(deviceStats.recovering / deviceStats.total) * 100}%` }" />
            </div>
          </div>
        </div>
      </div>

      <div class="alarm-stats-section">
        <h2 class="section-title">告警统计</h2>
        <div class="alarm-stats-grid">
          <div class="alarm-stat-card critical">
            <span class="alarm-stat-label">紧急告警</span>
            <span class="alarm-stat-value">{{ alarmStats.critical }}</span>
          </div>
          <div class="alarm-stat-card major">
            <span class="alarm-stat-label">重要告警</span>
            <span class="alarm-stat-value">{{ alarmStats.major }}</span>
          </div>
          <div class="alarm-stat-card minor">
            <span class="alarm-stat-label">一般告警</span>
            <span class="alarm-stat-value">{{ alarmStats.minor }}</span>
          </div>
          <div class="alarm-stat-card info">
            <span class="alarm-stat-label">提示信息</span>
            <span class="alarm-stat-value">{{ alarmStats.info }}</span>
          </div>
        </div>
        <div class="alarm-status-grid">
          <div class="alarm-status-card pending">
            <Clock :size="18" />
            <span class="alarm-status-label">待确认</span>
            <span class="alarm-status-value">{{ alarmStats.pending }}</span>
          </div>
          <div class="alarm-status-card confirmed">
            <CheckCircle :size="18" />
            <span class="alarm-status-label">已确认</span>
            <span class="alarm-status-value">{{ alarmStats.confirmed }}</span>
          </div>
          <div class="alarm-status-card processing">
            <Activity :size="18" />
            <span class="alarm-status-label">处置中</span>
            <span class="alarm-status-value">{{ alarmStats.processing }}</span>
          </div>
          <div class="alarm-status-card recovered">
            <CheckCircle :size="18" />
            <span class="alarm-status-label">已恢复</span>
            <span class="alarm-status-value">{{ alarmStats.recovered }}</span>
          </div>
          <div class="alarm-status-card closed">
            <CheckCircle :size="18" />
            <span class="alarm-status-label">已关闭</span>
            <span class="alarm-status-value">{{ alarmStats.closed }}</span>
          </div>
        </div>
      </div>

      <div class="charts-section">
        <h2 class="section-title">数据趋势</h2>
        <div class="charts-grid">
          <FlowChart :flow-in="metrics.flowIn" :flow-out="metrics.flowOut" />
          <EnergyChart :daily="metrics.energyDaily" :monthly="metrics.energyMonthly" />
          <OnlineRateChart :online="metrics.onlineRate.online" :offline="metrics.onlineRate.offline" />
          <AlarmTrendChart :trend="metrics.alarmTrend" :distribution="metrics.alarmDistribution" />
        </div>
      </div>

      <div class="maintenance-summary">
        <h2 class="section-title">维护概览</h2>
        <div class="maintenance-grid">
          <div class="maintenance-item">
            <span class="maintenance-label">总故障次数</span>
            <span class="maintenance-value danger">{{ maintenanceStats.totalFaults }} 次</span>
          </div>
          <div class="maintenance-item">
            <span class="maintenance-label">总维护次数</span>
            <span class="maintenance-value">{{ maintenanceStats.totalMaintenance }} 次</span>
          </div>
          <div class="maintenance-item">
            <span class="maintenance-label">总维护费用</span>
            <span class="maintenance-value cost">¥{{ formatNumber(maintenanceStats.totalCost, 2) }}</span>
          </div>
          <div class="maintenance-item">
            <span class="maintenance-label">平均单次费用</span>
            <span class="maintenance-value">¥{{ formatNumber(maintenanceStats.avgCost, 2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operation-stats-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  overflow: hidden;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
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

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #e6f7ff;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.15);
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 24px;
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

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.stat-icon.devices { background: rgba(24, 144, 255, 0.15); color: #1890ff; }
.stat-icon.online { background: rgba(82, 196, 26, 0.15); color: #52c41a; }
.stat-icon.alarm { background: rgba(255, 77, 79, 0.15); color: #ff4d4f; }
.stat-icon.energy { background: rgba(235, 47, 150, 0.15); color: #eb2f96; }
.stat-icon.pressure { background: rgba(250, 173, 20, 0.15); color: #faad14; }
.stat-icon.maintenance { background: rgba(19, 194, 194, 0.15); color: #13c2c2; }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6a8caa;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #e6f7ff;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-value small {
  font-size: 12px;
  color: #6a8caa;
  font-weight: 400;
  margin-left: 2px;
}

.stat-sub {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(30, 144, 255, 0.08);
}

.stat-sub-label {
  font-size: 11px;
  color: #6a8caa;
}

.stat-sub-value {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-sub-value.running { color: #52c41a; }
.stat-sub-value.fault { color: #ff4d4f; }
.stat-sub-value.success { color: #52c41a; }
.stat-sub-value.cost { color: #faad14; }

.device-status-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
}

.device-status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 8px;
  border-left: 3px solid;
}

.status-item.running { border-left-color: #52c41a; }
.status-item.alarm { border-left-color: #ff4d4f; }
.status-item.maintenance { border-left-color: #fadb14; }
.status-item.offline { border-left-color: #434343; }
.status-item.stopped { border-left-color: #595959; }
.status-item.recovering { border-left-color: #13c2c2; }

.status-item.running .status-icon { color: #52c41a; }
.status-item.alarm .status-icon { color: #ff4d4f; }
.status-item.maintenance .status-icon { color: #fadb14; }
.status-item.offline .status-icon { color: #434343; }
.status-item.stopped .status-icon { color: #595959; }
.status-item.recovering .status-icon { color: #13c2c2; }

.status-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  display: block;
  font-size: 12px;
  color: #8cb8d8;
  margin-bottom: 2px;
}

.status-count {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #e6f7ff;
  font-variant-numeric: tabular-nums;
}

.status-bar {
  width: 60px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.status-item.running .status-bar-fill { background: #52c41a; }
.status-item.alarm .status-bar-fill { background: #ff4d4f; }
.status-item.maintenance .status-bar-fill { background: #fadb14; }
.status-item.offline .status-bar-fill { background: #434343; }
.status-item.stopped .status-bar-fill { background: #595959; }
.status-item.recovering .status-bar-fill { background: #13c2c2; }

.alarm-stats-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
}

.alarm-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.alarm-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 8px;
  border: 1px solid;
}

.alarm-stat-card.critical { border-color: rgba(255, 77, 79, 0.3); }
.alarm-stat-card.major { border-color: rgba(250, 173, 20, 0.3); }
.alarm-stat-card.minor { border-color: rgba(24, 144, 255, 0.3); }
.alarm-stat-card.info { border-color: rgba(140, 140, 140, 0.3); }

.alarm-stat-label {
  font-size: 12px;
  color: #8cb8d8;
}

.alarm-stat-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.alarm-stat-card.critical .alarm-stat-value { color: #ff4d4f; }
.alarm-stat-card.major .alarm-stat-value { color: #faad14; }
.alarm-stat-card.minor .alarm-stat-value { color: #1890ff; }
.alarm-stat-card.info .alarm-stat-value { color: #8c8c8c; }

.alarm-status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.alarm-status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 6px;
}

.alarm-status-card.pending { color: #ff4d4f; }
.alarm-status-card.confirmed { color: #faad14; }
.alarm-status-card.processing { color: #1890ff; }
.alarm-status-card.recovered { color: #52c41a; }
.alarm-status-card.closed { color: #8c8c8c; }

.alarm-status-label {
  font-size: 11px;
  color: #8cb8d8;
}

.alarm-status-value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.charts-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.maintenance-summary {
  padding: 20px;
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 10px;
  margin-bottom: 20px;
}

.maintenance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.maintenance-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(13, 31, 60, 0.5);
  border-radius: 8px;
  text-align: center;
}

.maintenance-label {
  font-size: 12px;
  color: #6a8caa;
}

.maintenance-value {
  font-size: 20px;
  font-weight: 700;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
}

.maintenance-value.danger { color: #ff4d4f; }
.maintenance-value.cost { color: #faad14; }

@media (max-width: 1400px) {
  .stats-overview {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  .device-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .alarm-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .alarm-status-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .maintenance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
