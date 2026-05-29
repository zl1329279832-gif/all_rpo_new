<template>
  <PageContainer title="运营总览" description="实时监控酒店运营核心指标">
    <template #actions>
      <el-button :icon="Refresh" @click="handleRefresh" :loading="dashboardStore.loading">
        刷新数据
      </el-button>
    </template>

    <div v-loading="dashboardStore.loading" element-loading-text="数据加载中..." class="dashboard-content">
      <template v-if="dashboardStore.error">
        <el-card class="error-card">
          <el-result icon="error" :title="dashboardStore.error" sub-title="数据加载失败">
            <template #extra>
              <el-button type="primary" @click="fetchData">重新加载</el-button>
            </template>
          </el-result>
        </el-card>
      </template>

      <template v-else>
        <el-row :gutter="16" class="kpi-row">
          <el-col :xs="12" :sm="12" :md="6" :lg="6" v-for="kpi in displayKpis" :key="kpi.label">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">{{ kpi.label }}</div>
                <div class="kpi-value">
                  <span class="value">{{ formatNumber(kpi.value) }}</span>
                  <span class="unit">{{ kpi.unit }}</span>
                </div>
                <div class="kpi-trend" :class="kpi.trendType">
                  <el-icon v-if="kpi.trendType === 'up'"><Top /></el-icon>
                  <el-icon v-else-if="kpi.trendType === 'down'"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ Math.abs(kpi.trend) }}%</span>
                  <span class="trend-label">较昨日</span>
                </div>
              </div>
              <div class="kpi-icon" :class="getIconClass(kpi.label)">
                <el-icon :size="32">
                  <component :is="getKpiIcon(kpi.label)" />
                </el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="isEmpty" description="暂无数据" class="empty-state" />

        <template v-else>
          <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">渠道占比</span>
                    <el-tag size="small" type="info">今日</el-tag>
                  </div>
                </template>
                <div ref="channelChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">取消趋势</span>
                    <el-tag size="small" type="warning">近14天</el-tag>
                  </div>
                </template>
                <div ref="cancellationChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="8">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">7天预测</span>
                    <el-tag size="small" type="success">预测</el-tag>
                  </div>
                </template>
                <div ref="forecastChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">收入走势</span>
                    <el-radio-group v-model="revenueType" size="small">
                      <el-radio-button value="revenue">总收入</el-radio-button>
                      <el-radio-button value="occupancy">入住率</el-radio-button>
                    </el-radio-group>
                  </div>
                </template>
                <div ref="revenueChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">实时动态</span>
                    <el-badge :value="dashboardStore.realTimeUpdates.length" class="badge" />
                  </div>
                </template>
                <div class="timeline-container">
                  <el-timeline>
                    <el-timeline-item
                      v-for="(item, index) in dashboardStore.realTimeUpdates"
                      :key="index"
                      :timestamp="item.time"
                      placement="top"
                      :type="getTimelineType(item.type)"
                    >
                      <div class="timeline-content">
                        <div class="timeline-title">{{ item.title }}</div>
                        <div class="timeline-desc">{{ item.description }}</div>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                  <el-empty v-if="dashboardStore.realTimeUpdates.length === 0" description="暂无动态" :image-size="80" />
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">近期订单</span>
                    <el-button type="primary" link @click="$router.push('/orders')">查看全部</el-button>
                  </div>
                </template>
                <el-table :data="dashboardStore.recentOrders" style="width: 100%" max-height="300">
                  <el-table-column prop="orderNo" label="订单号" min-width="140" />
                  <el-table-column prop="guestName" label="客人姓名" min-width="100" />
                  <el-table-column prop="roomTypeName" label="房型" min-width="120" />
                  <el-table-column prop="checkInDate" label="入住日期" min-width="120" />
                  <el-table-column prop="checkOutDate" label="退房日期" min-width="120" />
                  <el-table-column prop="totalAmount" label="金额" min-width="100">
                    <template #default="{ row }">
                      <span class="amount">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" min-width="100">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                        {{ getStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-if="dashboardStore.recentOrders.length === 0" description="暂无订单" :image-size="80" />
              </el-card>
            </el-col>
          </el-row>
        </template>
      </template>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Top, Bottom, Minus, DataLine, Money, House, User } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { PageContainer } from '../components/common'
import { useDashboardStore } from '../stores/dashboard'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'

const router = useRouter()
const dashboardStore = useDashboardStore()
const { themeMode } = useTheme()

const revenueType = ref<'revenue' | 'occupancy'>('revenue')

const displayKpis = computed(() => dashboardStore.kpis.slice(0, 4))

const isEmpty = computed(() => {
  return dashboardStore.kpis.length === 0 &&
    dashboardStore.channelShare.length === 0 &&
    dashboardStore.cancellationTrend.length === 0 &&
    dashboardStore.sevenDayForecast.length === 0 &&
    dashboardStore.recentOrders.length === 0
})

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toFixed(num % 1 === 0 ? 0 : 1)
}

const getIconClass = (label: string): string => {
  const map: Record<string, string> = {
    '入住率': 'icon-blue',
    'ADR': 'icon-green',
    'RevPAR': 'icon-purple',
    '今日收入': 'icon-orange',
    '今日入住': 'icon-cyan',
    '今日退房': 'icon-pink',
    '在住客人': 'icon-indigo',
    '待处理投诉': 'icon-red'
  }
  return map[label] || 'icon-blue'
}

const getKpiIcon = (label: string) => {
  const map: Record<string, any> = {
    '入住率': DataLine,
    'ADR': Money,
    'RevPAR': DataLine,
    '今日收入': Money,
    '今日入住': House,
    '今日退房': House,
    '在住客人': User,
    '待处理投诉': User
  }
  return map[label] || DataLine
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    pending: 'warning',
    confirmed: 'primary',
    checkedIn: 'success',
    checkedOut: 'info',
    cancelled: 'danger',
    noShow: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    checkedIn: '已入住',
    checkedOut: '已退房',
    cancelled: '已取消',
    noShow: '未入住'
  }
  return map[status] || status
}

const getTimelineType = (type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    checkIn: 'success',
    checkOut: 'info',
    order: 'primary',
    complaint: 'danger'
  }
  return map[type] || 'info'
}

const { chartRef: channelChartRef, setOption: setChannelOption, initChart: initChannelChart, dispose: disposeChannelChart } = useChart({}, themeMode)
const { chartRef: cancellationChartRef, setOption: setCancellationOption, initChart: initCancellationChart, dispose: disposeCancellationChart } = useChart({}, themeMode)
const { chartRef: forecastChartRef, setOption: setForecastOption, initChart: initForecastChart, dispose: disposeForecastChart } = useChart({}, themeMode)
const { chartRef: revenueChartRef, setOption: setRevenueOption, initChart: initRevenueChart, dispose: disposeRevenueChart } = useChart({}, themeMode)

const initCharts = () => {
  initChannelChart()
  initCancellationChart()
  initForecastChart()
  initRevenueChart()
}

const updateCharts = () => {
  if (dashboardStore.channelShare.length > 0) {
    const channelOption: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: 'var(--el-text-color-secondary)' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--el-bg-color)',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: dashboardStore.channelShare
      }],
      color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
    }
    setChannelOption(channelOption)
  }

  if (dashboardStore.cancellationTrend.length > 0) {
    const cancellationOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['取消数量', '取消率'],
        textStyle: { color: 'var(--el-text-color-secondary)' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dashboardStore.cancellationTrend.map(item => item.date.slice(5)),
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: { color: 'var(--el-text-color-secondary)' }
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
          axisLabel: { color: 'var(--el-text-color-secondary)' },
          splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
        },
        {
          type: 'value',
          name: '率(%)',
          axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
          axisLabel: { color: 'var(--el-text-color-secondary)', formatter: '{value}%' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '取消数量',
          type: 'bar',
          data: dashboardStore.cancellationTrend.map(item => item.count),
          itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '取消率',
          type: 'line',
          yAxisIndex: 1,
          data: dashboardStore.cancellationTrend.map(item => item.rate),
          itemStyle: { color: '#F56C6C' },
          lineStyle: { width: 2 },
          smooth: true
        }
      ]
    }
    setCancellationOption(cancellationOption)
  }

  if (dashboardStore.sevenDayForecast.length > 0) {
    const forecastOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['入住率', '预测收入'],
        textStyle: { color: 'var(--el-text-color-secondary)' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dashboardStore.sevenDayForecast.map(item => item.date.slice(5)),
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: { color: 'var(--el-text-color-secondary)' }
      },
      yAxis: [
        {
          type: 'value',
          name: '入住率(%)',
          max: 100,
          axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
          axisLabel: { color: 'var(--el-text-color-secondary)', formatter: '{value}%' },
          splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
        },
        {
          type: 'value',
          name: '收入(k)',
          axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
          axisLabel: { color: 'var(--el-text-color-secondary)', formatter: '{value}k' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '入住率',
          type: 'bar',
          data: dashboardStore.sevenDayForecast.map(item => item.occupancy),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#67C23A' },
                { offset: 1, color: '#95D475' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '预测收入',
          type: 'line',
          yAxisIndex: 1,
          data: dashboardStore.sevenDayForecast.map(item => Math.round(item.revenue / 1000)),
          itemStyle: { color: '#409EFF' },
          lineStyle: { width: 2 },
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ]
            }
          }
        }
      ]
    }
    setForecastOption(forecastOption)
  }

  updateRevenueChart()
}

const updateRevenueChart = () => {
  if (dashboardStore.sevenDayForecast.length > 0) {
    const isRevenue = revenueType.value === 'revenue'
    const revenueOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const data = params[0]
          const value = isRevenue ? `¥${(data.value / 1000).toFixed(1)}k` : `${data.value}%`
          return `${data.name}<br/>${data.seriesName}: ${value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dashboardStore.sevenDayForecast.map(item => item.date.slice(5)),
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: { color: 'var(--el-text-color-secondary)' }
      },
      yAxis: {
        type: 'value',
        name: isRevenue ? '收入(k)' : '入住率(%)',
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: {
          color: 'var(--el-text-color-secondary)',
          formatter: isRevenue ? '{value}k' : '{value}%'
        },
        splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
      },
      series: [{
        name: isRevenue ? '收入' : '入住率',
        type: 'line',
        data: dashboardStore.sevenDayForecast.map(item => isRevenue ? Math.round(item.revenue / 1000) : item.occupancy),
        itemStyle: { color: isRevenue ? '#F56C6C' : '#67C23A' },
        lineStyle: { width: 3 },
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: isRevenue ? [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
            ] : [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ]
          }
        }
      }]
    }
    setRevenueOption(revenueOption)
  }
}

watch(revenueType, updateRevenueChart)

const fetchData = async () => {
  try {
    await dashboardStore.fetchAll()
    initCharts()
    updateCharts()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '获取数据失败')
  }
}

const handleRefresh = async () => {
  try {
    await dashboardStore.refresh()
    updateCharts()
    ElMessage.success('数据已刷新')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '刷新失败')
  }
}

let pullStartY = 0
let pullDistance = 0
const handleTouchStart = (e: TouchEvent) => {
  if (window.scrollY === 0) {
    pullStartY = e.touches[0].clientY
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (window.scrollY === 0 && pullStartY) {
    pullDistance = e.touches[0].clientY - pullStartY
    if (pullDistance > 0 && pullDistance < 100) {
      e.preventDefault()
    }
  }
}

const handleTouchEnd = async () => {
  if (pullDistance > 60) {
    await handleRefresh()
  }
  pullStartY = 0
  pullDistance = 0
}

onMounted(() => {
  fetchData()
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onUnmounted(() => {
  disposeChannelChart()
  disposeCancellationChart()
  disposeForecastChart()
  disposeRevenueChart()
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})

watch(themeMode, () => {
  initCharts()
  updateCharts()
})
</script>

<style lang="scss" scoped>
.dashboard-content {
  min-height: calc(100vh - 120px);
}

.error-card {
  margin-bottom: 16px;
}

.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  @include theme-transition;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .kpi-content {
    position: relative;
    z-index: 1;

    .kpi-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .kpi-value {
      margin-bottom: 8px;

      .value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .unit {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;

      &.up {
        color: var(--el-color-success);
      }

      &.down {
        color: var(--el-color-danger);
      }

      &.flat {
        color: var(--el-text-color-secondary);
      }

      .trend-label {
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }
  }

  .kpi-icon {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;

    &.icon-blue {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.05));
      color: var(--el-color-primary);
    }

    &.icon-green {
      background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.05));
      color: var(--el-color-success);
    }

    &.icon-orange {
      background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.05));
      color: var(--el-color-warning);
    }

    &.icon-purple {
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.05));
      color: #9b59b6;
    }

    &.icon-cyan {
      background: linear-gradient(135deg, rgba(26, 188, 156, 0.2), rgba(26, 188, 156, 0.05));
      color: #1abc9c;
    }

    &.icon-pink {
      background: linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 105, 180, 0.05));
      color: #ff69b4;
    }

    &.icon-indigo {
      background: linear-gradient(135deg, rgba(75, 0, 130, 0.2), rgba(75, 0, 130, 0.05));
      color: #4b0082;
    }

    &.icon-red {
      background: linear-gradient(135deg, rgba(245, 108, 108, 0.2), rgba(245, 108, 108, 0.05));
      color: var(--el-color-danger);
    }
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .card-title {
      font-size: 15px;
    }

    .badge {
      margin-left: auto;
    }
  }

  .chart-container {
    height: 280px;
    width: 100%;
  }

  .timeline-container {
    max-height: 280px;
    overflow-y: auto;
    padding: 10px 0;

    .timeline-content {
      .timeline-title {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 2px;
      }

      .timeline-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .amount {
    color: var(--el-color-success);
    font-weight: 600;
  }
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .kpi-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    .kpi-content {
      .kpi-value {
        .value {
          font-size: 22px;
        }
      }
    }

    .kpi-icon {
      right: 12px;
      width: 48px;
      height: 48px;

      :deep(svg) {
        width: 24px !important;
        height: 24px !important;
      }
    }
  }

  .chart-card {
    .chart-container {
      height: 220px;
    }

    .timeline-container {
      max-height: 220px;
    }
  }
}
</style>
