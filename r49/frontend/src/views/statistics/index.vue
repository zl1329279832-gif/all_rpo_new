<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="4" v-for="(item, index) in overviewCards" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">{{ item.title }}</p>
              <p class="stat-value">{{ item.value }}</p>
              <p class="stat-desc">
                <span :class="item.trend > 0 ? 'up' : 'down'">
                  <el-icon>
                    <CaretTop v-if="item.trend > 0" />
                    <CaretBottom v-else />
                  </el-icon>
                  {{ Math.abs(item.trend) }}%
                </span>
                较昨日
              </p>
            </div>
            <div class="stat-icon" :style="{ background: item.color }">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售趋势（近30天）</span>
              <el-radio-group v-model="trendType" size="small">
                <el-radio-button value="order">订单数</el-radio-button>
                <el-radio-button value="sales">销售额</el-radio-button>
                <el-radio-button value="commission">佣金</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品销量排行 Top10</span>
              <el-radio-group v-model="productSortBy" size="small" @change="initProductChart">
                <el-radio-button value="quantity">按销量</el-radio-button>
                <el-radio-button value="sales">按销售额</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="productChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>团长业绩排行 Top10</span>
          </template>
          <div ref="leaderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>售后统计</span>
          </template>
          <div ref="afterSaleChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, reactive } from 'vue'
import * as echarts from 'echarts'
import {
  ShoppingCart,
  Money,
  User,
  UserFilled,
  Document,
  Coin,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import {
  getBusinessOverview,
  getSalesTrend,
  getProductRank,
  getLeaderRank,
  getAfterSaleStatistics
} from '@/api/statistics'

const trendChartRef = ref(null)
const productChartRef = ref(null)
const leaderChartRef = ref(null)
const afterSaleChartRef = ref(null)
const trendType = ref('order')
const productSortBy = ref('quantity')

let trendChart = null
let productChart = null
let leaderChart = null
let afterSaleChart = null

const overviewData = reactive({
  totalOrders: 0,
  totalSales: 0,
  totalUsers: 0,
  totalLeaders: 0,
  todayOrders: 0,
  todaySales: 0
})

const overviewCards = ref([
  { title: '订单总数', value: '0', trend: 0, color: '#409eff', icon: ShoppingCart },
  { title: '销售总额', value: '¥0', trend: 0, color: '#67c23a', icon: Money },
  { title: '用户总数', value: '0', trend: 0, color: '#e6a23c', icon: User },
  { title: '团长总数', value: '0', trend: 0, color: '#909399', icon: UserFilled },
  { title: '今日订单', value: '0', trend: 0, color: '#f56c6c', icon: Document },
  { title: '今日销售额', value: '¥0', trend: 0, color: '#6c5ce7', icon: Coin }
])

async function loadOverviewData() {
  try {
    const res = await getBusinessOverview()
    const data = res.data || {}
    overviewData.totalOrders = data.totalOrders || 0
    overviewData.totalSales = data.totalSales || 0
    overviewData.totalUsers = data.totalUsers || 0
    overviewData.totalLeaders = data.totalLeaders || 0
    overviewData.todayOrders = data.todayOrders || 0
    overviewData.todaySales = data.todaySales || 0

    overviewCards.value = [
      { title: '订单总数', value: formatNumber(overviewData.totalOrders), trend: data.orderTrend || 0, color: '#409eff', icon: ShoppingCart },
      { title: '销售总额', value: formatMoney(overviewData.totalSales), trend: data.salesTrend || 0, color: '#67c23a', icon: Money },
      { title: '用户总数', value: formatNumber(overviewData.totalUsers), trend: data.userTrend || 0, color: '#e6a23c', icon: User },
      { title: '团长总数', value: formatNumber(overviewData.totalLeaders), trend: data.leaderTrend || 0, color: '#909399', icon: UserFilled },
      { title: '今日订单', value: formatNumber(overviewData.todayOrders), trend: data.todayOrderTrend || 0, color: '#f56c6c', icon: Document },
      { title: '今日销售额', value: formatMoney(overviewData.todaySales), trend: data.todaySalesTrend || 0, color: '#6c5ce7', icon: Coin }
    ]
  } catch (error) {
    console.error('获取概览数据失败:', error)
  }
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

function formatMoney(num) {
  if (num >= 10000) {
    return '¥' + (num / 10000).toFixed(1) + 'w'
  }
  return '¥' + num.toFixed(2)
}

async function initTrendChart() {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 29)

    const res = await getSalesTrend(
      formatDate(startDate),
      formatDate(endDate)
    )
    const data = res.data || []
    const dates = data.map(item => item.date)
    const orderData = data.map(item => item.orderCount)
    const salesData = data.map(item => item.salesAmount)
    const commissionData = data.map(item => item.commission)

    let seriesData = []
    let yAxisName = ''

    if (trendType.value === 'order') {
      seriesData = orderData
      yAxisName = '订单数'
    } else if (trendType.value === 'sales') {
      seriesData = salesData
      yAxisName = '销售额(元)'
    } else {
      seriesData = commissionData
      yAxisName = '佣金(元)'
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: yAxisName
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: seriesData,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ])
          },
          lineStyle: {
            color: '#1890ff',
            width: 2
          },
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    }

    trendChart.setOption(option)
  } catch (error) {
    console.error('加载趋势数据失败:', error)
  }
}

async function initProductChart() {
  if (!productChartRef.value) return

  if (!productChart) {
    productChart = echarts.init(productChartRef.value)
  }

  try {
    const res = await getProductRank(10, productSortBy.value)
    const data = res.data || []
    const names = data.map(item => item.productName).reverse()
    const values = data.map(item => productSortBy.value === 'quantity' ? item.quantity : item.salesAmount).reverse()

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const item = params[0]
          const label = productSortBy.value === 'quantity' ? '销量' : '销售额'
          const value = productSortBy.value === 'quantity' ? item.value : '¥' + item.value.toFixed(2)
          return `${item.name}<br/>${label}: ${value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: productSortBy.value === 'quantity' ? '销量' : '销售额(元)'
      },
      yAxis: {
        type: 'category',
        data: names
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#95d475' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '60%'
        }
      ]
    }

    productChart.setOption(option)
  } catch (error) {
    console.error('加载商品排行失败:', error)
  }
}

async function initLeaderChart() {
  if (!leaderChartRef.value) return

  if (!leaderChart) {
    leaderChart = echarts.init(leaderChartRef.value)
  }

  try {
    const res = await getLeaderRank(10)
    const data = res.data || []
    const names = data.map(item => item.leaderName).reverse()
    const values = data.map(item => item.salesAmount).reverse()

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          return `${params[0].name}<br/>销售额: ¥${params[0].value.toFixed(2)}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '销售额(元)'
      },
      yAxis: {
        type: 'category',
        data: names
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#83bff6' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '60%'
        }
      ]
    }

    leaderChart.setOption(option)
  } catch (error) {
    console.error('加载团长排行失败:', error)
  }
}

async function initAfterSaleChart() {
  if (!afterSaleChartRef.value) return

  if (!afterSaleChart) {
    afterSaleChart = echarts.init(afterSaleChartRef.value)
  }

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)

    const res = await getAfterSaleStatistics(
      formatDate(startDate),
      formatDate(endDate)
    )
    const data = res.data || {}

    const statusNames = ['待审核', '审核通过', '审核拒绝', '已完成', '已取消']
    const statusCounts = [
      data.pendingCount || 0,
      data.approvedCount || 0,
      data.rejectedCount || 0,
      data.completedCount || 0,
      data.cancelledCount || 0
    ]
    const colors = ['#e6a23c', '#409eff', '#f56c6c', '#67c23a', '#909399']

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{c}件'
          },
          data: statusNames.map((name, index) => ({
            value: statusCounts[index],
            name: name,
            itemStyle: { color: colors[index] }
          }))
        }
      ]
    }

    afterSaleChart.setOption(option)
  } catch (error) {
    console.error('加载售后统计失败:', error)
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resizeCharts() {
  trendChart?.resize()
  productChart?.resize()
  leaderChart?.resize()
  afterSaleChart?.resize()
}

watch(trendType, () => {
  nextTick(() => {
    initTrendChart()
  })
})

watch(productSortBy, () => {
  nextTick(() => {
    initProductChart()
  })
})

onMounted(() => {
  nextTick(() => {
    loadOverviewData()
    initTrendChart()
    initProductChart()
    initLeaderChart()
    initAfterSaleChart()
    window.addEventListener('resize', resizeCharts)
  })
})
</script>

<style lang="scss" scoped>
.page-container {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .stat-info {
        .stat-title {
          font-size: 14px;
          color: #909399;
          margin: 0 0 8px 0;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin: 0 0 8px 0;
        }

        .stat-desc {
          font-size: 12px;
          color: #909399;
          margin: 0;

          .up {
            color: #67c23a;
            margin-right: 5px;
          }

          .down {
            color: #f56c6c;
            margin-right: 5px;
          }
        }
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 30px;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
  }

  .chart-container {
    height: 350px;
    width: 100%;
  }
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
