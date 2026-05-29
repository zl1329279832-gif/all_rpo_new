<template>
  <PageContainer title="每日房态" description="查看和管理酒店每日房态信息">
    <template #actions>
      <el-button :icon="Refresh" @click="handleRefresh" :loading="loading">
        刷新
      </el-button>
      <el-button
        v-if="hasPermission('room:export')"
        :icon="Download"
        @click="handleExport"
      >
        导出
      </el-button>
    </template>

    <div v-loading="loading" element-loading-text="加载中..." class="daily-status-content">
      <el-card class="filter-card" shadow="never">
        <el-row :gutter="16" align="middle">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="month-picker-wrapper">
              <el-button :icon="ArrowLeft" circle @click="prevMonth" />
              <el-date-picker
                v-model="currentDate"
                type="month"
                format="YYYY年MM月"
                value-format="YYYY-MM"
                :clearable="false"
                class="month-picker"
                @change="handleMonthChange"
              />
              <el-button :icon="ArrowRight" circle @click="nextMonth" />
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="selectedRoomTypeId"
              placeholder="选择房型"
              clearable
              style="width: 100%"
              @change="handleRoomTypeChange"
            >
              <el-option label="全部房型" value="" />
              <el-option
                v-for="rt in roomTypes"
                :key="rt.id"
                :label="rt.name"
                :value="rt.id"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color status-full"></span>
                <span>满房(≥95%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color status-tight"></span>
                <span>紧张(70%-94%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color status-normal"></span>
                <span>正常(30%-69%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color status-empty"></span>
                <span>空房(&lt;30%)</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="16" :lg="16">
          <el-card class="calendar-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">日历房态</span>
                <el-tag size="small" type="info">{{ currentMonthText }}</el-tag>
              </div>
            </template>

            <div v-if="error" class="error-container">
              <el-result icon="error" :title="error" sub-title="数据加载失败">
                <template #extra>
                  <el-button type="primary" @click="fetchData">重新加载</el-button>
                </template>
              </el-result>
            </div>

            <div v-else class="calendar-container">
              <div class="calendar-weekdays">
                <div v-for="day in weekDays" :key="day" class="weekday">
                  {{ day }}
                </div>
              </div>

              <div class="calendar-grid">
                <div
                  v-for="(cell, index) in calendarCells"
                  :key="index"
                  class="calendar-cell"
                  :class="{
                    'other-month': !cell.currentMonth,
                    'is-today': cell.isToday,
                    'is-selected': selectedDate === cell.date,
                    [`status-${cell.status}`]: cell.currentMonth
                  }"
                  @click="cell.currentMonth && handleDateClick(cell)"
                >
                  <div class="cell-header">
                    <span class="cell-date">{{ cell.day }}</span>
                    <span v-if="cell.isToday" class="today-badge">今天</span>
                  </div>
                  <div v-if="cell.currentMonth && cell.data" class="cell-content">
                    <div class="occupancy">
                      <span class="occupancy-value">{{ cell.data.occupancy }}%</span>
                      <span class="occupancy-label">入住率</span>
                    </div>
                    <div class="room-info">
                      <span>{{ cell.data.soldRooms }}/{{ cell.data.totalRooms }}</span>
                      <span class="price">¥{{ cell.data.price }}</span>
                    </div>
                  </div>
                  <div v-else-if="cell.currentMonth" class="cell-empty">
                    <span class="no-data">暂无数据</span>
                  </div>
                </div>
              </div>

              <el-empty v-if="calendarCells.length === 0" description="暂无房态数据" />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">本月趋势</span>
                <el-radio-group v-model="chartType" size="small">
                  <el-radio-button value="occupancy">入住率</el-radio-button>
                  <el-radio-button value="price">价格</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>

          <el-card class="summary-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">本月汇总</span>
              </div>
            </template>
            <div v-if="summary" class="summary-content">
              <el-row :gutter="12">
                <el-col :span="12">
                  <div class="summary-item">
                    <div class="summary-value primary">{{ summary.avgOccupancy }}%</div>
                    <div class="summary-label">平均入住率</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="summary-item">
                    <div class="summary-value success">¥{{ summary.avgPrice }}</div>
                    <div class="summary-label">平均房价</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value">{{ summary.totalRooms }}</div>
                    <div class="summary-label">总房数</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value warning">{{ summary.soldRooms }}</div>
                    <div class="summary-label">已售</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="summary-item">
                    <div class="summary-value info">{{ summary.availableRooms }}</div>
                    <div class="summary-label">可用</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <el-empty v-else description="暂无汇总数据" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-card class="list-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  {{ selectedDateText }} 房态详情
                  <el-tag v-if="selectedRoomTypeName" size="small" type="info" class="ml-8">
                    {{ selectedRoomTypeName }}
                  </el-tag>
                </span>
              </div>
            </template>

            <el-table
              :data="selectedDateData"
              style="width: 100%"
              max-height="350"
              @row-click="handleRowClick"
            >
              <el-table-column prop="roomTypeName" label="房型" min-width="120" />
              <el-table-column prop="totalRooms" label="总房数" width="100" align="center" />
              <el-table-column prop="soldRooms" label="已售" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSoldRoomsTagType(row.occupancy)" effect="light" size="small">
                    {{ row.soldRooms }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="availableRooms" label="可用" width="100" align="center" />
              <el-table-column prop="outOfService" label="维修" width="100" align="center" />
              <el-table-column prop="occupancy" label="入住率" width="120" align="center">
                <template #default="{ row }">
                  <div class="occupancy-bar">
                    <el-progress
                      :percentage="row.occupancy"
                      :color="getOccupancyColor(row.occupancy)"
                      :stroke-width="10"
                      :show-text="false"
                    />
                    <span class="occupancy-text">{{ row.occupancy }}%</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="price" label="房价" width="120" align="center">
                <template #default="{ row }">
                  <span class="price-text">¥{{ row.price }}</span>
                </template>
              </el-table-column>
              <el-table-column label="房态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getRoomStatusTagType(row.occupancy)" effect="light" size="small">
                    {{ getRoomStatusLabel(row.occupancy) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click.stop="handleRowClick(row)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-empty v-if="selectedDateData.length === 0" description="请选择日期查看详情" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <DetailDrawer
      v-model="detailDrawerVisible"
      :title="detailTitle"
      size="500px"
      :loading="detailLoading"
      :detail="currentDetail"
      :fields="detailFields"
      :column="1"
    >
      <template #default="{ detail }">
        <div class="detail-content">
          <div class="detail-section">
            <h4 class="section-title">房态概览</h4>
            <el-row :gutter="12">
              <el-col :span="12">
                <div class="stat-item">
                  <div class="stat-value" :style="{ color: getOccupancyColor(detail.occupancy) }">
                    {{ detail.occupancy }}%
                  </div>
                  <div class="stat-label">入住率</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-item">
                  <div class="stat-value">¥{{ detail.price }}</div>
                  <div class="stat-label">当日房价</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="detail-section">
            <h4 class="section-title">房间分布</h4>
            <div class="room-distribution">
              <div class="distribution-item">
                <div class="distribution-bar">
                  <div
                    class="distribution-fill sold"
                    :style="{ width: `${(detail.soldRooms / detail.totalRooms) * 100}%` }"
                  ></div>
                  <div
                    class="distribution-fill available"
                    :style="{ width: `${(detail.availableRooms / detail.totalRooms) * 100}%` }"
                  ></div>
                  <div
                    class="distribution-fill out-of-service"
                    :style="{ width: `${(detail.outOfService / detail.totalRooms) * 100}%` }"
                  ></div>
                </div>
                <div class="distribution-legend">
                  <span><i class="legend-dot sold"></i>已售 {{ detail.soldRooms }}</span>
                  <span><i class="legend-dot available"></i>可用 {{ detail.availableRooms }}</span>
                  <span><i class="legend-dot out-of-service"></i>维修 {{ detail.outOfService }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">操作建议</h4>
            <el-alert
              :title="getSuggestion(detail).title"
              :type="getSuggestion(detail).type"
              :description="getSuggestion(detail).description"
              show-icon
              :closable="false"
            />
          </div>
        </div>
      </template>
    </DetailDrawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import { PageContainer, DetailDrawer } from '../components/common'
import { dailyStatusApi } from '../api/dailyStatus'
import { roomTypeApi } from '../api/roomType'
import { usePermission } from '../hooks/usePermission'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'
import { useExport } from '../hooks/useExport'
import type { DailyStatus, RoomType } from '../types'

const { hasPermission } = usePermission()
const { themeMode } = useTheme()
const { exportToExcel } = useExport()

const loading = ref(false)
const error = ref<string | null>(null)
const detailLoading = ref(false)

const currentDate = ref<string>(new Date().toISOString().slice(0, 7))
const selectedRoomTypeId = ref('')
const selectedDate = ref<string>('')
const chartType = ref<'occupancy' | 'price'>('occupancy')

const roomTypes = ref<RoomType[]>([])
const dailyStatusData = ref<DailyStatus[]>([])
const selectedDateData = ref<DailyStatus[]>([])

const summary = ref<{
  totalRooms: number
  soldRooms: number
  availableRooms: number
  avgOccupancy: number
  avgPrice: number
} | null>(null)

const { chartRef: trendChartRef, setOption: setTrendOption, initChart: initTrendChart, dispose: disposeTrendChart } = useChart({}, themeMode)

const detailDrawerVisible = ref(false)
const detailTitle = ref('房态详情')
const currentDetail = ref<DailyStatus | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

interface CalendarCell {
  date: string
  day: number
  currentMonth: boolean
  isToday: boolean
  status: 'full' | 'tight' | 'normal' | 'empty' | null
  data: DailyStatus | null
}

const currentMonthText = computed(() => {
  const [year, month] = currentDate.value.split('-')
  return `${year}年${month}月`
})

const selectedDateText = computed(() => {
  if (!selectedDate.value) return '请选择日期'
  const d = new Date(selectedDate.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const selectedRoomTypeName = computed(() => {
  if (!selectedRoomTypeId.value) return ''
  const rt = roomTypes.value.find(r => r.id === selectedRoomTypeId.value)
  return rt?.name || ''
})

const calendarCells = computed<CalendarCell[]>(() => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const today = new Date().toISOString().slice(0, 10)

  const cells: CalendarCell[] = []

  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = `${year}-${String(month - 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      date,
      day,
      currentMonth: false,
      isToday: date === today,
      status: null,
      data: null
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = getDateData(date)
    let status: 'full' | 'tight' | 'normal' | 'empty' | null = null

    if (dayData) {
      if (dayData.occupancy >= 95) status = 'full'
      else if (dayData.occupancy >= 70) status = 'tight'
      else if (dayData.occupancy >= 30) status = 'normal'
      else status = 'empty'
    }

    cells.push({
      date,
      day,
      currentMonth: true,
      isToday: date === today,
      status,
      data: dayData
    })
  }

  const remainingCells = 42 - cells.length
  for (let day = 1; day <= remainingCells; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      date,
      day,
      currentMonth: false,
      isToday: date === today,
      status: null,
      data: null
    })
  }

  return cells
})

const detailFields = [
  { prop: 'date', label: '日期' },
  { prop: 'roomTypeName', label: '房型' },
  { prop: 'totalRooms', label: '总房数' },
  { prop: 'soldRooms', label: '已售房数' },
  { prop: 'availableRooms', label: '可用房数' },
  { prop: 'outOfService', label: '维修房数' },
  { prop: 'occupancy', label: '入住率', formatter: (v: number) => `${v}%` },
  { prop: 'price', label: '当日房价', type: 'money' }
]

const getDateData = (date: string): DailyStatus | null => {
  let data = dailyStatusData.value.filter(d => d.date === date)
  if (selectedRoomTypeId.value) {
    data = data.filter(d => d.roomTypeId === selectedRoomTypeId.value)
  }

  if (data.length === 0) return null

  const totalRooms = data.reduce((sum, d) => sum + (d.totalRooms || 0), 0)
  const soldRooms = data.reduce((sum, d) => sum + (d.soldRooms || 0), 0)
  const availableRooms = data.reduce((sum, d) => sum + (d.availableRooms || 0), 0)
  const outOfService = data.reduce((sum, d) => sum + (d.outOfService || 0), 0)
  const avgPrice = Math.round(data.reduce((sum, d) => sum + (d.price || 0), 0) / data.length)
  const occupancy = totalRooms > 0 ? Math.round((soldRooms / totalRooms) * 100) : 0

  return {
    date,
    roomTypeId: '',
    roomTypeName: selectedRoomTypeName.value || '全部房型',
    totalRooms,
    soldRooms,
    availableRooms,
    outOfService,
    price: avgPrice,
    occupancy,
    checkIns: 0,
    checkOuts: 0,
    newBookings: 0,
    cancellations: 0,
    walkIns: 0,
    noShows: 0,
    avgDailyRate: avgPrice,
    revenuePerAvailableRoom: 0,
    totalRevenue: 0,
    maintenanceRooms: 0,
    updatedAt: ''
  } as DailyStatus
}

const getOccupancyColor = (occupancy: number): string => {
  if (occupancy >= 95) return '#F56C6C'
  if (occupancy >= 70) return '#E6A23C'
  if (occupancy >= 30) return '#67C23A'
  return '#409EFF'
}

const getSoldRoomsTagType = (occupancy: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  if (occupancy >= 95) return 'danger'
  if (occupancy >= 70) return 'warning'
  if (occupancy >= 30) return 'success'
  return 'info'
}

const getRoomStatusTagType = (occupancy: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  if (occupancy >= 95) return 'danger'
  if (occupancy >= 70) return 'warning'
  if (occupancy >= 30) return 'success'
  return 'info'
}

const getRoomStatusLabel = (occupancy: number): string => {
  if (occupancy >= 95) return '满房'
  if (occupancy >= 70) return '紧张'
  if (occupancy >= 30) return '正常'
  return '空房'
}

const getSuggestion = (detail: DailyStatus): { title: string; description: string; type: 'success' | 'warning' | 'info' | 'error' } => {
  if (detail.occupancy >= 95) {
    return {
      title: '房源紧张',
      description: '当前入住率较高，建议适当提高房价或限制渠道库存，确保收益最大化。',
      type: 'warning'
    }
  }
  if (detail.occupancy >= 70) {
    return {
      title: '房态良好',
      description: '当前入住率处于健康水平，可保持现有价格策略，关注渠道表现。',
      type: 'success'
    }
  }
  if (detail.occupancy >= 30) {
    return {
      title: '需求不足',
      description: '当前入住率偏低，建议开展促销活动或加强渠道推广，提升入住率。',
      type: 'info'
    }
  }
  return {
    title: '库存充足',
    description: '当前入住率很低，建议加大促销力度，考虑与OTA合作增加曝光。',
    type: 'error'
  }
}

const fetchRoomTypes = async () => {
  try {
    roomTypes.value = await roomTypeApi.getAll()
  } catch (err) {
    console.error('获取房型列表失败', err)
  }
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const [year, month] = currentDate.value.split('-').map(Number)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    const [dataRes, summaryRes] = await Promise.all([
      dailyStatusApi.getByDateRange(startDate, endDate),
      dailyStatusApi.getSummary(
        startDate,
        endDate,
        selectedRoomTypeId.value || undefined
      )
    ])

    dailyStatusData.value = dataRes
    summary.value = summaryRes

    initTrendChart()
    updateTrendChart()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取数据失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const updateTrendChart = () => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates: string[] = []
  const values: number[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    dates.push(String(day))
    const dayData = getDateData(date)
    if (dayData) {
      values.push(chartType.value === 'occupancy' ? dayData.occupancy : dayData.price)
    } else {
      values.push(0)
    }
  }

  const isOccupancy = chartType.value === 'occupancy'
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const data = params[0]
        const value = isOccupancy ? `${data.value}%` : `¥${data.value}`
        return `${year}年${month}月${data.name}日<br/>${isOccupancy ? '入住率' : '房价'}: ${value}`
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
      data: dates,
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        interval: 3
      }
    },
    yAxis: {
      type: 'value',
      name: isOccupancy ? '入住率(%)' : '房价(元)',
      max: isOccupancy ? 100 : undefined,
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        formatter: isOccupancy ? '{value}%' : '{value}'
      },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [{
      name: isOccupancy ? '入住率' : '房价',
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: isOccupancy ? '#67C23A' : '#E6A23C'
      },
      lineStyle: {
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: isOccupancy ? [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ] : [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ]
        }
      },
      markLine: {
        silent: true,
        data: isOccupancy ? [
          { yAxis: 95, lineStyle: { color: '#F56C6C', type: 'dashed' } },
          { yAxis: 70, lineStyle: { color: '#E6A23C', type: 'dashed' } },
          { yAxis: 30, lineStyle: { color: '#409EFF', type: 'dashed' } }
        ] : []
      }
    }]
  }

  setTrendOption(option)
}

const prevMonth = () => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const newDate = new Date(year, month - 2, 1)
  currentDate.value = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
}

const nextMonth = () => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const newDate = new Date(year, month, 1)
  currentDate.value = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
}

const handleMonthChange = () => {
  selectedDate.value = ''
  selectedDateData.value = []
  fetchData()
}

const handleRoomTypeChange = () => {
  fetchData()
  if (selectedDate.value) {
    loadSelectedDateData()
  }
}

const handleDateClick = (cell: CalendarCell) => {
  selectedDate.value = cell.date
  loadSelectedDateData()
}

const loadSelectedDateData = () => {
  let data = dailyStatusData.value.filter(d => d.date === selectedDate.value)
  if (selectedRoomTypeId.value) {
    data = data.filter(d => d.roomTypeId === selectedRoomTypeId.value)
  }
  selectedDateData.value = data
}

const handleRowClick = (row: DailyStatus) => {
  currentDetail.value = row
  detailTitle.value = `${row.date} - ${row.roomTypeName}`
  detailDrawerVisible.value = true
}

const handleRefresh = () => {
  fetchData()
  if (selectedDate.value) {
    loadSelectedDateData()
  }
  ElMessage.success('刷新成功')
}

const handleExport = () => {
  const columns = [
    { key: '日期', title: '日期' },
    { key: '房型', title: '房型' },
    { key: '总房数', title: '总房数' },
    { key: '已售', title: '已售' },
    { key: '可用', title: '可用' },
    { key: '维修', title: '维修' },
    { key: '入住率(%)', title: '入住率(%)' },
    { key: '房价(元)', title: '房价(元)' }
  ]
  const exportData = dailyStatusData.value.map(item => ({
    '日期': item.date,
    '房型': item.roomTypeName,
    '总房数': item.totalRooms,
    '已售': item.soldRooms,
    '可用': item.availableRooms,
    '维修': item.outOfService,
    '入住率(%)': item.occupancy,
    '房价(元)': item.price
  }))
  exportToExcel(exportData, columns, { filename: `每日房态_${currentDate.value}` })
}

watch(chartType, () => {
  updateTrendChart()
})

watch(themeMode, () => {
  initTrendChart()
  updateTrendChart()
})

onMounted(() => {
  fetchRoomTypes()
  fetchData()
})

onUnmounted(() => {
  disposeTrendChart()
})
</script>

<style lang="scss" scoped>
.daily-status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  .month-picker-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;

    .month-picker {
      :deep(.el-input__wrapper) {
        text-align: center;
      }

      :deep(.el-input__inner) {
        text-align: center;
        font-weight: 600;
        font-size: 16px;
      }
    }
  }

  .legend {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;

      &.status-full {
        background-color: #F56C6C;
      }

      &.status-tight {
        background-color: #E6A23C;
      }

      &.status-normal {
        background-color: #67C23A;
      }

      &.status-empty {
        background-color: #409EFF;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }
}

.calendar-card {
  .error-container {
    padding: 40px 0;
  }

  .calendar-container {
    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--el-border-color-lighter);
      margin-bottom: 8px;

      .weekday {
        text-align: center;
        padding: 12px 0;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }

    .calendar-cell {
      min-height: 90px;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 4px;
      @include theme-transition;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.other-month {
        opacity: 0.3;
        cursor: not-allowed;

        &:hover {
          transform: none;
          box-shadow: none;
        }
      }

      &.is-today {
        border-color: var(--el-color-primary);

        .today-badge {
          background-color: var(--el-color-primary);
          color: #fff;
          padding: 1px 6px;
          border-radius: 10px;
          font-size: 10px;
          margin-left: 4px;
        }
      }

      &.is-selected {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }

      &.status-full {
        background: linear-gradient(135deg, rgba(245, 108, 108, 0.15), rgba(245, 108, 108, 0.05));
        border-left: 4px solid #F56C6C;
      }

      &.status-tight {
        background: linear-gradient(135deg, rgba(230, 162, 60, 0.15), rgba(230, 162, 60, 0.05));
        border-left: 4px solid #E6A23C;
      }

      &.status-normal {
        background: linear-gradient(135deg, rgba(103, 194, 58, 0.15), rgba(103, 194, 58, 0.05));
        border-left: 4px solid #67C23A;
      }

      &.status-empty {
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
        border-left: 4px solid #409EFF;
      }

      .cell-header {
        display: flex;
        align-items: center;

        .cell-date {
          font-size: 16px;
          font-weight: 700;
          color: var(--el-text-color-primary);
        }
      }

      .cell-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .occupancy {
          .occupancy-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1.2;
          }

          .occupancy-label {
            font-size: 11px;
            color: var(--el-text-color-secondary);
            margin-left: 2px;
          }
        }

        .room-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--el-text-color-secondary);

          .price {
            font-weight: 600;
            color: var(--el-color-danger);
          }
        }
      }

      .cell-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        .no-data {
          font-size: 11px;
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }
}

.chart-card {
  margin-bottom: 16px;

  .chart-container {
    height: 220px;
    width: 100%;
  }
}

.summary-card {
  .summary-content {
    .summary-item {
      text-align: center;
      padding: 12px 0;
      background-color: var(--el-bg-color-page);
      border-radius: 8px;
      margin-bottom: 12px;

      .summary-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;

        &.primary {
          color: var(--el-color-primary);
        }

        &.success {
          color: var(--el-color-success);
        }

        &.warning {
          color: var(--el-color-warning);
        }

        &.info {
          color: var(--el-color-info);
        }
      }

      .stat-label,
      .summary-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.list-card {
  .occupancy-bar {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-progress) {
      flex: 1;
    }

    .occupancy-text {
      font-weight: 600;
      font-size: 13px;
      min-width: 45px;
    }
  }

  .price-text {
    font-weight: 600;
    color: var(--el-color-danger);
  }

  .ml-8 {
    margin-left: 8px;
  }
}

.detail-content {
  .detail-section {
    margin-bottom: 20px;

    .section-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .stat-item {
    text-align: center;
    padding: 16px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .room-distribution {
    .distribution-item {
      .distribution-bar {
        height: 24px;
        background-color: var(--el-border-color-lighter);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        margin-bottom: 12px;

        .distribution-fill {
          height: 100%;
          transition: width 0.3s ease;

          &.sold {
            background: linear-gradient(90deg, #F56C6C, #F78989);
          }

          &.available {
            background: linear-gradient(90deg, #67C23A, #85CE61);
          }

          &.out-of-service {
            background: linear-gradient(90deg, #909399, #A6A9AD);
          }
        }
      }

      .distribution-legend {
        display: flex;
        justify-content: space-around;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;

          &.sold {
            background-color: #F56C6C;
          }

          &.available {
            background-color: #67C23A;
          }

          &.out-of-service {
            background-color: #909399;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .filter-card {
    .legend {
      justify-content: center;
      gap: 12px;
      margin-top: 12px;
    }

    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .calendar-card {
    .calendar-container {
      .calendar-cell {
        min-height: 70px;
        padding: 6px;

        .cell-header {
          .cell-date {
            font-size: 14px;
          }

          .today-badge {
            display: none;
          }
        }

        .cell-content {
          .occupancy {
            .occupancy-value {
              font-size: 16px;
            }
          }

          .room-info {
            flex-direction: column;
            align-items: flex-start;
            font-size: 10px;
          }
        }
      }

      .calendar-weekdays {
        .weekday {
          font-size: 12px;
          padding: 8px 0;
        }
      }
    }
  }
}
</style>
