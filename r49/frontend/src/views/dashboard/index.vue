<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index">
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

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="week">本周</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="salesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单统计</span>
            </div>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>热门商品</span>
          </template>
          <div ref="productChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>团长业绩排行</span>
          </template>
          <el-table :data="leaderRank" size="small">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <el-tag
                  :type="$index < 3 ? ['danger', 'warning', 'success'][$index] : 'info'"
                  size="small"
                >
                  {{ $index + 1 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="团长" />
            <el-table-column prop="orders" label="订单数" align="center" />
            <el-table-column prop="amount" label="销售额" align="center">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="orderNo" label="订单号" />
            <el-table-column prop="userName" label="用户" />
            <el-table-column prop="amount" label="金额" align="center">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType[row.status]" size="small">
                  {{ statusText[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  ShoppingCart,
  Money,
  User,
  Goods,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'

const salesChartRef = ref(null)
const orderChartRef = ref(null)
const productChartRef = ref(null)
const chartType = ref('week')

let salesChart = null
let orderChart = null
let productChart = null

const statCards = [
  { title: '今日订单', value: '128', trend: 12.5, color: '#409eff', icon: ShoppingCart },
  { title: '今日销售额', value: '¥15,680', trend: 8.2, color: '#67c23a', icon: Money },
  { title: '活跃用户', value: '2,456', trend: -2.3, color: '#e6a23c', icon: User },
  { title: '商品总数', value: '386', trend: 5.1, color: '#f56c6c', icon: Goods }
]

const leaderRank = [
  { name: '张团长', orders: 156, amount: 23580 },
  { name: '李团长', orders: 142, amount: 21360 },
  { name: '王团长', orders: 128, amount: 19850 },
  { name: '赵团长', orders: 115, amount: 17620 },
  { name: '刘团长', orders: 98, amount: 15230 }
]

const recentOrders = [
  { orderNo: '202405300001', userName: '张三', amount: 128.5, status: 1 },
  { orderNo: '202405300002', userName: '李四', amount: 86.0, status: 2 },
  { orderNo: '202405300003', userName: '王五', amount: 256.8, status: 1 },
  { orderNo: '202405300004', userName: '赵六', amount: 68.0, status: 3 },
  { orderNo: '202405300005', userName: '孙七', amount: 158.0, status: 0 }
]

const statusType = {
  0: 'info',
  1: 'primary',
  2: 'success',
  3: 'warning'
}

const statusText = {
  0: '待支付',
  1: '已支付',
  2: '已完成',
  3: '待收货'
}

function initSalesChart() {
  if (!salesChartRef.value) return

  salesChart = echarts.init(salesChartRef.value)

  const weekData = {
    xData: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    salesData: [12000, 13200, 10100, 13400, 9000, 23000, 21000],
    orderData: [82, 93, 78, 95, 65, 156, 142]
  }

  const monthData = {
    xData: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    salesData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15000) + 8000),
    orderData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50)
  }

  const data = chartType.value === 'week' ? weekData : monthData

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['销售额', '订单数'],
      top: 0
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
      data: data.xData
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额(元)',
        position: 'left'
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: data.salesData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        itemStyle: { color: '#409eff' }
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.orderData,
        itemStyle: { color: '#67c23a' }
      }
    ]
  }

  salesChart.setOption(option)
}

function initOrderChart() {
  if (!orderChartRef.value) return

  orderChart = echarts.init(orderChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '待支付', itemStyle: { color: '#909399' } },
          { value: 735, name: '已支付', itemStyle: { color: '#409eff' } },
          { value: 580, name: '配送中', itemStyle: { color: '#e6a23c' } },
          { value: 484, name: '待自提', itemStyle: { color: '#67c23a' } },
          { value: 300, name: '已完成', itemStyle: { color: '#67c23a' } }
        ]
      }
    ]
  }

  orderChart.setOption(option)
}

function initProductChart() {
  if (!productChartRef.value) return

  productChart = echarts.init(productChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['有机蔬菜', '新鲜水果', '肉类水产', '粮油米面', '休闲零食']
    },
    series: [
      {
        type: 'bar',
        data: [320, 302, 341, 374, 390],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        },
        barWidth: '50%'
      }
    ]
  }

  productChart.setOption(option)
}

function resizeCharts() {
  salesChart?.resize()
  orderChart?.resize()
  productChart?.resize()
}

watch(chartType, () => {
  nextTick(() => {
    initSalesChart()
  })
})

onMounted(() => {
  nextTick(() => {
    initSalesChart()
    initOrderChart()
    initProductChart()
    window.addEventListener('resize', resizeCharts)
  })
})
</script>

<style lang="scss" scoped>
.dashboard {
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
    height: 300px;
    width: 100%;
  }
}
</style>
