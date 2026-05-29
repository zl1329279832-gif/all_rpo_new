<template>
  <PageContainer title="渠道表现" description="多维度分析各销售渠道的业务表现">
    <template #actions>
      <el-button :icon="Refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </template>

    <div class="channel-performance">
      <el-card class="filter-card" shadow="never">
        <el-row :gutter="16" align="middle">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="日期范围" class="filter-item">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :shortcuts="dateShortcuts"
                class="filter-input"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="渠道筛选" class="filter-item">
              <el-select
                v-model="selectedChannels"
                multiple
                placeholder="请选择渠道"
                collapse-tags
                collapse-tags-tooltip
                class="filter-input"
              >
                <el-option
                  v-for="channel in allChannels"
                  :key="channel"
                  :label="channel"
                  :value="channel"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8" class="filter-actions-col">
            <div class="filter-actions">
              <el-button @click="handleReset">重置</el-button>
              <el-button type="primary" @click="handleFilter">查询</el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-row :gutter="16" class="channel-cards-row">
        <el-col
          :xs="24" :sm="12" :md="8" :lg="6"
          v-for="channel in filteredChannels"
          :key="channel.name"
        >
          <el-card
            class="channel-card"
            shadow="hover"
            :class="{ 'card-active': activeChannel === channel.name }"
            @click="handleChannelClick(channel.name)"
          >
            <div class="card-header">
              <div class="channel-info">
                <div class="channel-logo" :style="{ background: channel.color + '20', color: channel.color }">
                  <el-icon :size="24">
                    <component :is="channel.icon" />
                  </el-icon>
                </div>
                <div class="channel-name">{{ channel.name }}</div>
              </div>
              <el-tag :type="getTrendType(channel.trend)" size="small" effect="light">
                <el-icon v-if="channel.trend > 0"><Top /></el-icon>
                <el-icon v-else-if="channel.trend < 0"><Bottom /></el-icon>
                {{ channel.trend >= 0 ? '+' : '' }}{{ channel.trend }}%
              </el-tag>
            </div>
            <div class="card-metrics">
              <div class="metric">
                <div class="metric-label">订单量</div>
                <div class="metric-value">{{ formatNumber(channel.orders) }}</div>
              </div>
              <div class="metric">
                <div class="metric-label">收入</div>
                <div class="metric-value">¥{{ formatNumber(channel.revenue) }}</div>
              </div>
              <div class="metric">
                <div class="metric-label">佣金</div>
                <div class="metric-value">¥{{ formatNumber(channel.commission) }}</div>
              </div>
              <div class="metric">
                <div class="metric-label">转化率</div>
                <div class="metric-value">{{ channel.conversionRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">渠道收入对比</span>
                <el-tag size="small" type="primary">柱状图</el-tag>
              </div>
            </template>
            <div ref="revenueChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">订单量趋势</span>
                <el-tag size="small" type="success">折线图</el-tag>
              </div>
            </template>
            <div ref="orderTrendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">佣金占比</span>
                <el-tag size="small" type="warning">饼图</el-tag>
              </div>
            </template>
            <div ref="commissionPieChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              {{ activeChannel ? activeChannel + ' - ' : '' }}详细数据
            </span>
            <el-tag size="small" type="info" v-if="activeChannel">已选择</el-tag>
          </div>
        </template>
        <el-table :data="tableData" style="width: 100%" stripe>
          <el-table-column prop="date" label="日期" min-width="120" />
          <el-table-column prop="channel" label="渠道" min-width="120">
            <template #default="{ row }">
              <el-tag :type="getChannelTagType(row.channel)" size="small">
                {{ row.channel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="orders" label="订单量" min-width="100" sortable>
            <template #default="{ row }">
              <span class="number-text">{{ formatNumber(row.orders) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="revenue" label="收入" min-width="120" sortable>
            <template #default="{ row }">
              <span class="amount-text">¥{{ formatNumber(row.revenue) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="commission" label="佣金" min-width="120" sortable>
            <template #default="{ row }">
              <span class="commission-text">¥{{ formatNumber(row.commission) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="conversionRate" label="转化率" min-width="100" sortable>
            <template #default="{ row }">
              <span :class="getConversionClass(row.conversionRate)">
                {{ row.conversionRate }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="avgOrderValue" label="客单价" min-width="100" sortable>
            <template #default="{ row }">
              <span class="amount-text">¥{{ row.avgOrderValue.toFixed(0) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Top, Bottom,
  Shop, ShoppingBag, Phone, Monitor,
  User, Goods, DataLine, Money
} from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { PageContainer } from '../components/common'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'

const { themeMode } = useTheme()

interface ChannelData {
  name: string
  icon: any
  color: string
  orders: number
  revenue: number
  commission: number
  conversionRate: number
  trend: number
}

interface TableRow {
  date: string
  channel: string
  orders: number
  revenue: number
  commission: number
  conversionRate: number
  avgOrderValue: number
}

const dateRange = ref<string[]>([])
const selectedChannels = ref<string[]>([])
const activeChannel = ref<string | null>(null)

const allChannels = [
  '携程', '美团', '飞猪', '去哪儿',
  '同程', '艺龙', '官网', '微信小程序'
]

const channelIcons: Record<string, any> = {
  '携程': markRaw(Shop),
  '美团': markRaw(ShoppingBag),
  '飞猪': markRaw(Phone),
  '去哪儿': markRaw(Monitor),
  '同程': markRaw(User),
  '艺龙': markRaw(Goods),
  '官网': markRaw(DataLine),
  '微信小程序': markRaw(Money)
}

const channelColors: Record<string, string> = {
  '携程': '#409EFF',
  '美团': '#67C23A',
  '飞猪': '#E6A23C',
  '去哪儿': '#F56C6C',
  '同程': '#909399',
  '艺龙': '#8e44ad',
  '官网': '#16a085',
  '微信小程序': '#d35400'
}

const dateShortcuts = [
  {
    text: '今日',
    value: () => {
      const date = new Date()
      return [date, date]
    }
  },
  {
    text: '本周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - start.getDay())
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(1)
      return [start, end]
    }
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return [start, end]
    }
  }
]

const generateMockData = (): ChannelData[] => {
  return allChannels.map(name => ({
    name,
    icon: channelIcons[name],
    color: channelColors[name],
    orders: Math.floor(Math.random() * 5000) + 500,
    revenue: Math.floor(Math.random() * 500000) + 50000,
    commission: Math.floor(Math.random() * 50000) + 5000,
    conversionRate: parseFloat((Math.random() * 20 + 5).toFixed(1)),
    trend: parseFloat((Math.random() * 40 - 20).toFixed(1))
  }))
}

const generateTableData = (): TableRow[] => {
  const data: TableRow[] = []
  const channels = activeChannel.value ? [activeChannel.value] : allChannels
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    channels.forEach(channel => {
      const orders = Math.floor(Math.random() * 500) + 50
      const revenue = Math.floor(Math.random() * 50000) + 5000
      data.push({
        date: date.toISOString().split('T')[0],
        channel,
        orders,
        revenue,
        commission: Math.floor(revenue * 0.1),
        conversionRate: parseFloat((Math.random() * 20 + 5).toFixed(1)),
        avgOrderValue: revenue / orders
      })
    })
  }
  return data
}

const channelData = ref<ChannelData[]>(generateMockData())
const tableData = ref<TableRow[]>(generateTableData())

const filteredChannels = computed(() => {
  if (selectedChannels.value.length === 0) {
    return channelData.value
  }
  return channelData.value.filter(c => selectedChannels.value.includes(c.name))
})

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const getTrendType = (trend: number): 'success' | 'danger' | 'info' => {
  if (trend > 0) return 'success'
  if (trend < 0) return 'danger'
  return 'info'
}

const getChannelTagType = (channel: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    '携程': 'primary',
    '美团': 'success',
    '飞猪': 'warning',
    '去哪儿': 'danger',
    '同程': 'info',
    '艺龙': 'primary',
    '官网': 'success',
    '微信小程序': 'warning'
  }
  return types[channel] || 'info'
}

const getConversionClass = (rate: number): string => {
  if (rate >= 15) return 'high-conversion'
  if (rate >= 10) return 'medium-conversion'
  return 'low-conversion'
}

const handleChannelClick = (channelName: string) => {
  activeChannel.value = activeChannel.value === channelName ? null : channelName
  tableData.value = generateTableData()
  updateCharts()
}

const handleRefresh = () => {
  channelData.value = generateMockData()
  tableData.value = generateTableData()
  updateCharts()
  ElMessage.success('数据已刷新')
}

const handleReset = () => {
  dateRange.value = []
  selectedChannels.value = []
  activeChannel.value = null
  tableData.value = generateTableData()
  updateCharts()
}

const handleFilter = () => {
  tableData.value = generateTableData()
  updateCharts()
  ElMessage.success('筛选完成')
}

const { chartRef: revenueChartRef, setOption: setRevenueOption, initChart: initRevenueChart, dispose: disposeRevenueChart } = useChart({}, themeMode)
const { chartRef: orderTrendChartRef, setOption: setOrderTrendOption, initChart: initOrderTrendChart, dispose: disposeOrderTrendChart } = useChart({}, themeMode)
const { chartRef: commissionPieChartRef, setOption: setCommissionPieOption, initChart: initCommissionPieChart, dispose: disposeCommissionPieChart } = useChart({}, themeMode)

const initCharts = () => {
  initRevenueChart()
  initOrderTrendChart()
  initCommissionPieChart()
}

const updateCharts = () => {
  const displayData = filteredChannels.value
  const highlightChannel = activeChannel.value

  const revenueOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>收入: ¥${formatNumber(data.value)}`
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
      data: displayData.map(d => d.name),
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)', rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: '收入',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        formatter: (value: number) => formatNumber(value)
      },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: displayData.map(d => ({
        value: d.revenue,
        itemStyle: {
          color: highlightChannel && d.name !== highlightChannel
            ? d.color + '60'
            : {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: d.color },
                  { offset: 1, color: d.color + '80' }
                ]
              },
          borderRadius: [6, 6, 0, 0]
        }
      })),
      barWidth: '60%'
    }]
  }
  setRevenueOption(revenueOption)

  const trendDates = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trendDates.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }

  const orderTrendOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: displayData.map(d => d.name),
      textStyle: { color: 'var(--el-text-color-secondary)' },
      top: 0,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendDates,
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    yAxis: {
      type: 'value',
      name: '订单量',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: displayData.map(d => ({
      name: d.name,
      type: 'line',
      data: Array.from({ length: 14 }, () => Math.floor(Math.random() * 300) + 100),
      itemStyle: {
        color: d.color,
        opacity: highlightChannel && d.name !== highlightChannel ? 0.3 : 1
      },
      lineStyle: {
        width: highlightChannel && d.name === highlightChannel ? 4 : 2,
        opacity: highlightChannel && d.name !== highlightChannel ? 0.3 : 1
      },
      symbol: highlightChannel && d.name === highlightChannel ? 'circle' : 'none',
      symbolSize: 8,
      smooth: true
    }))
  }
  setOrderTrendOption(orderTrendOption)

  const totalCommission = displayData.reduce((sum, d) => sum + d.commission, 0)
  const commissionPieOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = totalCommission > 0 ? ((params.value / totalCommission) * 100).toFixed(1) : 0
        return `<div style="font-weight: 500; margin-bottom: 6px;">${params.name}</div>
                <div>佣金: ¥${formatNumber(params.value)}</div>
                <div style="color: var(--el-text-color-secondary); font-size: 12px;">占比: ${percentage}%</div>`
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: 'var(--el-text-color-secondary)', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 10
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: 'var(--el-bg-color)',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: displayData.map(d => ({
        value: d.commission,
        name: d.name,
        itemStyle: {
          color: d.color,
          opacity: highlightChannel && d.name !== highlightChannel ? 0.3 : 1
        }
      }))
    }]
  }
  setCommissionPieOption(commissionPieOption)
}

onMounted(() => {
  initCharts()
  updateCharts()
})

onUnmounted(() => {
  disposeRevenueChart()
  disposeOrderTrendChart()
  disposeCommissionPieChart()
})

watch(themeMode, () => {
  initCharts()
  updateCharts()
})

watch([filteredChannels, activeChannel], () => {
  updateCharts()
}, { deep: true })
</script>

<style lang="scss" scoped>
.channel-performance {
  .filter-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px 20px 0 20px;
    }

    .filter-item {
      margin-bottom: 16px;

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .filter-input {
      width: 100%;
    }

    .filter-actions-col {
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;

      @media (max-width: 992px) {
        justify-content: flex-start;
        margin-bottom: 16px;
      }
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
  }

  .channel-cards-row {
    margin-bottom: 16px;
  }

  .channel-card {
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    @include theme-transition;

    &:hover {
      transform: translateY(-4px);
    }

    &.card-active {
      border: 2px solid var(--el-color-primary);

      :deep(.el-card__body) {
        background: var(--el-color-primary-light-9);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .channel-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .channel-logo {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .channel-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }

    .card-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .metric {
        .metric-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  .charts-row {
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
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }
  }

  .detail-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-title {
        font-size: 15px;
      }
    }

    .number-text {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .amount-text {
      color: var(--el-color-success);
      font-weight: 600;
    }

    .commission-text {
      color: var(--el-color-warning);
      font-weight: 600;
    }

    .high-conversion {
      color: var(--el-color-success);
      font-weight: 600;
    }

    .medium-conversion {
      color: var(--el-color-warning);
      font-weight: 600;
    }

    .low-conversion {
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .channel-performance {
    .channel-card {
      .card-metrics {
        .metric {
          .metric-value {
            font-size: 16px;
          }
        }
      }
    }

    .chart-card {
      .chart-container {
        height: 240px;
      }
    }
  }
}
</style>
