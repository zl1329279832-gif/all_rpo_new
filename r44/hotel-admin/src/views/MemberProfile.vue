<template>
  <PageContainer title="会员画像" description="深度分析会员行为特征与消费偏好">
    <template #actions>
      <el-button :icon="Refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </template>

    <div class="member-profile">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="8" :lg="6">
          <el-card class="member-list-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">会员列表</span>
                <el-tag size="small" type="primary">{{ filteredMembers.length }}人</el-tag>
              </div>
            </template>

            <div class="filter-section">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索姓名/手机号"
                :prefix-icon="Search"
                clearable
                class="search-input"
                @input="handleSearch"
              />
              <el-select
                v-model="selectedLevel"
                placeholder="会员等级"
                clearable
                class="level-select"
                @change="handleLevelFilter"
              >
                <el-option
                  v-for="level in memberLevels"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <el-tag :type="level.color" size="small" effect="dark">{{ level.label }}</el-tag>
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="member-list">
              <div
                v-for="member in filteredMembers"
                :key="member.id"
                class="member-item"
                :class="{ 'active': activeMember?.id === member.id }"
                @click="handleMemberClick(member)"
              >
                <el-avatar :size="48" :src="member.avatar" class="member-avatar">
                  {{ member.name.charAt(0) }}
                </el-avatar>
                <div class="member-info">
                  <div class="member-name">
                    {{ member.name }}
                    <el-tag :type="getLevelType(member.level)" size="small" effect="dark">
                      {{ getLevelLabel(member.level) }}
                    </el-tag>
                  </div>
                  <div class="member-meta">
                    <span class="meta-item">
                      <el-icon :size="12"><Coin /></el-icon>
                      {{ member.points }}积分
                    </span>
                    <span class="meta-item">
                      <el-icon :size="12"><Calendar /></el-icon>
                      {{ member.stayCount }}次入住
                    </span>
                  </div>
                </div>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
              <el-empty v-if="filteredMembers.length === 0" description="暂无匹配会员" :image-size="80" />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="16" :lg="18">
          <template v-if="activeMember">
            <el-card class="profile-header-card" shadow="hover">
              <div class="profile-header">
                <el-avatar :size="80" :src="activeMember.avatar" class="profile-avatar">
                  {{ activeMember.name.charAt(0) }}
                </el-avatar>
                <div class="profile-info">
                  <div class="profile-name">
                    {{ activeMember.name }}
                    <el-tag :type="getLevelType(activeMember.level)" size="large" effect="dark">
                      {{ getLevelLabel(activeMember.level) }}
                    </el-tag>
                  </div>
                  <div class="profile-meta">
                    <span class="meta-item">
                      <el-icon><Phone /></el-icon>
                      {{ activeMember.phone }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Message /></el-icon>
                      {{ activeMember.email }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Location /></el-icon>
                      {{ activeMember.city }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      注册于 {{ activeMember.registerDate }}
                    </span>
                  </div>
                  <div class="profile-stats">
                    <div class="stat-item">
                      <div class="stat-value">{{ activeMember.points }}</div>
                      <div class="stat-label">可用积分</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <div class="stat-value">{{ activeMember.stayCount }}</div>
                      <div class="stat-label">入住次数</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <div class="stat-value">{{ activeMember.totalNights }}</div>
                      <div class="stat-label">入住晚数</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <div class="stat-value">¥{{ formatNumber(activeMember.totalSpent) }}</div>
                      <div class="stat-label">累计消费</div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>

            <el-row :gutter="16" class="charts-row">
              <el-col :xs="24" :sm="24" :md="12" :lg="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span class="card-title">会员画像雷达</span>
                      <el-tag size="small" type="primary">雷达图</el-tag>
                    </div>
                  </template>
                  <div ref="radarChartRef" class="chart-container"></div>
                </el-card>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12" :lg="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span class="card-title">消费趋势</span>
                      <el-tag size="small" type="success">柱状图</el-tag>
                    </div>
                  </template>
                  <div ref="consumptionChartRef" class="chart-container"></div>
                </el-card>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12" :lg="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span class="card-title">入住偏好</span>
                      <el-tag size="small" type="warning">饼图</el-tag>
                    </div>
                  </template>
                  <div ref="preferenceChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="history-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">历史入住记录</span>
                  <el-tag size="small" type="info">近6个月</el-tag>
                </div>
              </template>
              <el-table :data="activeMember.stayHistory" style="width: 100%" stripe>
                <el-table-column prop="orderNo" label="订单号" min-width="140" />
                <el-table-column prop="roomTypeName" label="房型" min-width="120">
                  <template #default="{ row }">
                    <el-tag type="primary" size="small">{{ row.roomTypeName }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="checkInDate" label="入住日期" min-width="120" />
                <el-table-column prop="checkOutDate" label="退房日期" min-width="120" />
                <el-table-column prop="nights" label="晚数" min-width="80" align="center" />
                <el-table-column prop="totalAmount" label="消费金额" min-width="120">
                  <template #default="{ row }">
                    <span class="amount-text">¥{{ row.totalAmount.toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="channel" label="渠道" min-width="100">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.channel }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="rating" label="评价" min-width="100">
                  <template #default="{ row }">
                    <el-rate v-model="row.rating" disabled :max="5" :size="14" />
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </template>

          <el-empty
            v-else
            description="请选择左侧会员查看详细画像"
            :image-size="120"
            class="empty-profile"
          />
        </el-col>
      </el-row>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Search, ArrowRight, Phone, Message, Location,
  Calendar, Coin, Star
} from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import { PageContainer } from '../components/common'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'

const { themeMode } = useTheme()

interface StayRecord {
  orderNo: string
  roomTypeName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  totalAmount: number
  channel: string
  rating: number
}

interface Member {
  id: number
  name: string
  avatar: string
  phone: string
  email: string
  city: string
  level: number
  points: number
  stayCount: number
  totalNights: number
  totalSpent: number
  registerDate: string
  radarData: {
    consumption: number
    activity: number
    loyalty: number
    satisfaction: number
  }
  consumptionTrend: number[]
  preferenceData: { name: string; value: number }[]
  stayHistory: StayRecord[]
}

const memberLevels = [
  { value: 1, label: '普通会员', color: 'info' },
  { value: 2, label: '银卡会员', color: '' },
  { value: 3, label: '金卡会员', color: 'warning' },
  { value: 4, label: '白金会员', color: 'primary' },
  { value: 5, label: '钻石会员', color: 'danger' }
]

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高']
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛']
const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆']
const channels = ['携程', '美团', '飞猪', '官网', '微信小程序', '前台']
const roomTypes = ['标准大床房', '豪华双床房', '行政套房', '总统套房', '海景房', '商务大床房']

const generateMockMembers = (): Member[] => {
  const members: Member[] = []
  for (let i = 0; i < 20; i++) {
    const level = Math.floor(Math.random() * 5) + 1
    const stayCount = Math.floor(Math.random() * 50) + 5
    const totalNights = Math.floor(stayCount * (Math.random() * 2 + 1.5))
    const totalSpent = Math.floor(totalNights * (Math.random() * 800 + 400))
    members.push({
      id: i + 1,
      name: firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)],
      avatar: '',
      phone: `1${Math.floor(Math.random() * 9 + 3)}${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')}`,
      email: `member${i + 1}@example.com`,
      city: cities[Math.floor(Math.random() * cities.length)],
      level,
      points: Math.floor(totalSpent * 0.5),
      stayCount,
      totalNights,
      totalSpent,
      registerDate: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      radarData: {
        consumption: Math.floor(Math.random() * 40) + 60,
        activity: Math.floor(Math.random() * 40) + 60,
        loyalty: Math.floor(Math.random() * 40) + 60,
        satisfaction: Math.floor(Math.random() * 30) + 70
      },
      consumptionTrend: Array.from({ length: 6 }, () => Math.floor(Math.random() * 5000) + 1000),
      preferenceData: [
        { name: '商务出行', value: Math.floor(Math.random() * 40) + 20 },
        { name: '休闲度假', value: Math.floor(Math.random() * 30) + 15 },
        { name: '家庭旅游', value: Math.floor(Math.random() * 25) + 10 },
        { name: '会议活动', value: Math.floor(Math.random() * 20) + 5 },
        { name: '其他', value: Math.floor(Math.random() * 15) + 5 }
      ],
      stayHistory: Array.from({ length: Math.min(stayCount, 10) }, (_, idx) => {
        const nights = Math.floor(Math.random() * 4) + 1
        const checkIn = new Date()
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 180) - idx * 15)
        const checkOut = new Date(checkIn)
        checkOut.setDate(checkOut.getDate() + nights)
        return {
          orderNo: `HTL${Date.now()}${String(idx).padStart(4, '0')}`,
          roomTypeName: roomTypes[Math.floor(Math.random() * roomTypes.length)],
          checkInDate: checkIn.toISOString().split('T')[0],
          checkOutDate: checkOut.toISOString().split('T')[0],
          nights,
          totalAmount: nights * (Math.floor(Math.random() * 800) + 400),
          channel: channels[Math.floor(Math.random() * channels.length)],
          rating: Math.floor(Math.random() * 2) + 4
        }
      }).sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
    })
  }
  return members.sort((a, b) => b.level - a.level || b.totalSpent - a.totalSpent)
}

const members = ref<Member[]>(generateMockMembers())
const searchKeyword = ref('')
const selectedLevel = ref<number | null>(null)
const activeMember = ref<Member | null>(null)

const filteredMembers = computed(() => {
  let result = members.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(m =>
      m.name.includes(keyword) || m.phone.includes(keyword)
    )
  }
  if (selectedLevel.value !== null) {
    result = result.filter(m => m.level === selectedLevel.value)
  }
  return result
})

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toLocaleString()
}

const getLevelType = (level: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'info',
    2: '',
    3: 'warning',
    4: 'primary',
    5: 'danger'
  }
  return types[level] || 'info'
}

const getLevelLabel = (level: number): string => {
  const levelConfig = memberLevels.find(l => l.value === level)
  return levelConfig?.label || '普通会员'
}

const handleMemberClick = (member: Member) => {
  activeMember.value = member
  updateCharts()
}

const handleSearch = () => {
  // Search is handled by computed
}

const handleLevelFilter = () => {
  // Filter is handled by computed
}

const handleRefresh = () => {
  members.value = generateMockMembers()
  activeMember.value = null
  ElMessage.success('数据已刷新')
}

const { chartRef: radarChartRef, setOption: setRadarOption, initChart: initRadarChart, dispose: disposeRadarChart } = useChart({}, themeMode)
const { chartRef: consumptionChartRef, setOption: setConsumptionOption, initChart: initConsumptionChart, dispose: disposeConsumptionChart } = useChart({}, themeMode)
const { chartRef: preferenceChartRef, setOption: setPreferenceOption, initChart: initPreferenceChart, dispose: disposePreferenceChart } = useChart({}, themeMode)

const initCharts = () => {
  initRadarChart()
  initConsumptionChart()
  initPreferenceChart()
}

const updateCharts = () => {
  if (!activeMember.value) return

  const radarColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
  const radarOption: EChartsOption = {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '消费能力', max: 100 },
        { name: '活跃度', max: 100 },
        { name: '忠诚度', max: 100 },
        { name: '满意度', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: 'var(--el-text-color-secondary)',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: 'var(--el-border-color-lighter)'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['var(--el-bg-color)', 'var(--el-fill-color-lighter)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'var(--el-border-color-base)'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          activeMember.value.radarData.consumption,
          activeMember.value.radarData.activity,
          activeMember.value.radarData.loyalty,
          activeMember.value.radarData.satisfaction
        ],
        name: activeMember.value.name,
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    }]
  }
  setRadarOption(radarOption)

  const trendMonths = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    trendMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const consumptionOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>消费: ¥${formatNumber(data.value)}`
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
      data: trendMonths,
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    yAxis: {
      type: 'value',
      name: '消费金额',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        formatter: (value: number) => formatNumber(value)
      },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [{
      name: '消费金额',
      type: 'bar',
      data: activeMember.value.consumptionTrend,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#67C23A80' }
          ]
        },
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '60%'
    }]
  }
  setConsumptionOption(consumptionOption)

  const totalPreference = activeMember.value.preferenceData.reduce((sum, d) => sum + d.value, 0)
  const preferenceColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  const preferenceOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = totalPreference > 0 ? ((params.value / totalPreference) * 100).toFixed(1) : 0
        return `<div style="font-weight: 500; margin-bottom: 6px;">${params.name}</div>
                <div>次数: ${params.value}次</div>
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
      data: activeMember.value.preferenceData.map((d, i) => ({
        value: d.value,
        name: d.name,
        itemStyle: { color: preferenceColors[i % preferenceColors.length] }
      }))
    }]
  }
  setPreferenceOption(preferenceOption)
}

onMounted(() => {
  initCharts()
  if (activeMember.value) {
    updateCharts()
  }
})

onUnmounted(() => {
  disposeRadarChart()
  disposeConsumptionChart()
  disposePreferenceChart()
})

watch(themeMode, () => {
  initCharts()
  if (activeMember.value) {
    updateCharts()
  }
})

watch(activeMember, () => {
  if (activeMember.value) {
    updateCharts()
  }
})
</script>

<style lang="scss" scoped>
.member-profile {
  .member-list-card {
    position: sticky;
    top: 16px;

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

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;

      .search-input,
      .level-select {
        width: 100%;
      }
    }

    .member-list {
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      padding-right: 4px;

      .member-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 8px;
        border: 1px solid transparent;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        &.active {
          background-color: var(--el-color-primary-light-9);
          border-color: var(--el-color-primary);

          .member-name {
            color: var(--el-color-primary);
          }

          .arrow-icon {
            color: var(--el-color-primary);
          }
        }

        .member-avatar {
          flex-shrink: 0;
        }

        .member-info {
          flex: 1;
          min-width: 0;

          .member-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            font-size: 14px;

            :deep(.el-tag) {
              flex-shrink: 0;
            }
          }

          .member-meta {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .meta-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }

        .arrow-icon {
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }
      }
    }
  }

  .profile-header-card {
    margin-bottom: 16px;

    .profile-header {
      display: flex;
      gap: 24px;
      align-items: center;

      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
      }

      .profile-avatar {
        flex-shrink: 0;
        border: 4px solid var(--el-color-primary-light-5);
      }

      .profile-info {
        flex: 1;
        min-width: 0;

        .profile-name {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          color: var(--el-text-color-primary);
          margin-bottom: 12px;

          @media (max-width: 768px) {
            justify-content: center;
          }

          :deep(.el-tag) {
            font-size: 14px;
          }
        }

        .profile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;

          @media (max-width: 768px) {
            justify-content: center;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: var(--el-text-color-secondary);

            :deep(.el-icon) {
              color: var(--el-color-primary);
            }
          }
        }

        .profile-stats {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 20px;
          background-color: var(--el-fill-color-lighter);
          border-radius: 12px;

          @media (max-width: 768px) {
            flex-wrap: wrap;
            justify-content: center;
          }

          .stat-item {
            text-align: center;

            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .stat-divider {
            width: 1px;
            height: 40px;
            background-color: var(--el-border-color-base);

            @media (max-width: 768px) {
              display: none;
            }
          }
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
      height: 280px;
      width: 100%;
    }
  }

  .history-card {
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

    .amount-text {
      color: var(--el-color-success);
      font-weight: 600;
    }
  }

  .empty-profile {
    padding: 100px 0;
  }
}

@media (max-width: 992px) {
  .member-profile {
    .member-list-card {
      position: static;

      .member-list {
        max-height: 400px;
      }
    }

    .profile-header-card {
      .profile-header {
        .profile-info {
          .profile-stats {
            gap: 16px;
            padding: 16px;

            .stat-item {
              .stat-value {
                font-size: 20px;
              }
            }
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
