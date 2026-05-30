<template>
  <div class="page-container">
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
                较上月
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
              <span>月度销售趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="sales">销售额</el-radio-button>
                <el-radio-button value="order">订单量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>商品分类销售占比</span>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>团长业绩排行</span>
          </template>
          <div ref="leaderChartRef" class="chart-container"></div>
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

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const leaderChartRef = ref(null)
const chartType = ref('sales')

let trendChart = null
let categoryChart = null
let leaderChart = null

const statCards = [
  { title: '总订单数', value: '12,456', trend: 15.3, color: '#409eff', icon: ShoppingCart },
  { title: '总销售额', value: '¥1,256,800', trend: 12.8, color: '#67c23a', icon: Money },
  { title: '团长总数', value: '156', trend: 8.5, color: '#e6a23c', icon: User },
  { title: '商品总数', value: '386', trend: 5.2, color: '#f56c6c', icon: Goods }
]

function initTrendChart() {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const salesData = [85000, 92000, 101000, 134000, 129000, 153000, 175000, 182000, 168000, 195000, 210000, 235000]
  const orderData = [520, 580, 630, 820, 780, 950, 1080, 1120, 1050, 1200, 1320, 1450]

  const data = chartType.value === 'sales' ? salesData : orderData
  const name = chartType.value === 'sales' ? '销售额(元)' : '订单数'

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
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      name: name
    },
    series: [
      {
        type: 'bar',
        data: data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%'
      }
    ]
  }

  trendChart.setOption(option)
}

function initCategoryChart() {
  if (!categoryChartRef.value) return

  categoryChart = echarts.init(categoryChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%'
        },
        data: [
          { value: 35, name: '蔬菜水果', itemStyle: { color: '#67c23a' } },
          { value: 25, name: '肉类水产', itemStyle: { color: '#f56c6c' } },
          { value: 20, name: '粮油米面', itemStyle: { color: '#e6a23c' } },
          { value: 12, name: '休闲零食', itemStyle: { color: '#409eff' } },
          { value: 8, name: '其他', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }

  categoryChart.setOption(option)
}

function initLeaderChart() {
  if (!leaderChartRef.value) return

  leaderChart = echarts.init(leaderChartRef.value)

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
      type: 'value',
      name: '销售额(元)'
    },
    yAxis: {
      type: 'category',
      data: ['刘团长', '陈团长', '杨团长', '黄团长', '周团长', '吴团长', '郑团长', '孙团长', '李团长', '张团长']
    },
    series: [
      {
        type: 'bar',
        data: [85000, 92000, 101000, 115000, 128000, 135000, 148000, 162000, 185000, 210000],
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

  leaderChart.setOption(option)
}

function resizeCharts() {
  trendChart?.resize()
  categoryChart?.resize()
  leaderChart?.resize()
}

watch(chartType, () => {
  nextTick(() => {
    initTrendChart()
  })
})

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initCategoryChart()
    initLeaderChart()
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
</style>
