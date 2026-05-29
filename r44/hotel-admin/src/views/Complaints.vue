<template>
  <PageContainer title="投诉记录" description="管理和处理客人投诉，提升服务质量">
    <template #actions>
      <el-button
        v-if="hasPermission('complaint:create')"
        type="primary"
        :icon="Plus"
        @click="handleCreate"
      >
        新增投诉
      </el-button>
      <el-button
        v-if="hasPermission('complaint:export')"
        type="success"
        :icon="Download"
        :loading="exporting"
        @click="handleExport"
      >
        导出数据
      </el-button>
      <el-button :icon="Refresh" @click="loadData" :loading="loading">
        刷新
      </el-button>
    </template>

    <FilterBar :fields="filterFields" @search="handleSearch" @reset="handleReset" />

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>投诉类型分布</span>
              <el-tag size="small" type="info">点击筛选</el-tag>
            </div>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>月度投诉趋势</span>
              <el-tag size="small" type="warning">近12个月</el-tag>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>处理效率统计</span>
              <el-tag size="small" type="success">平均耗时</el-tag>
            </div>
          </template>
          <div ref="efficiencyChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <DataTable
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      :show-index="true"
      :show-actions="true"
      :show-pagination="true"
      :pagination="pagination"
      :page-sizes="[10, 20, 50, 100]"
      actions-width="150"
      @pagination-change="handlePaginationChange"
    >
      <template #header>
        <el-tag v-if="activeFilterType" type="primary" closable @close="clearTypeFilter">
          类型: {{ getTypeLabel(activeFilterType) }}
        </el-tag>
        <el-tag v-if="activeFilterStatus" type="warning" closable @close="clearStatusFilter">
          状态: {{ getStatusLabel(activeFilterStatus) }}
        </el-tag>
        <el-tag v-if="activeFilterHandler" type="success" closable @close="clearHandlerFilter">
          处理人: {{ activeFilterHandler }}
        </el-tag>
      </template>

      <template #actions="{ row }">
        <el-button type="primary" link @click="handleViewDetail(row)">
          详情
        </el-button>
        <el-button
          v-if="hasPermission('complaint:handle') && row.status !== '已解决' && row.status !== '已关闭'"
          type="success"
          link
          @click="handleProcess(row)"
        >
          处理
        </el-button>
      </template>
    </DataTable>

    <el-drawer
      v-model="detailVisible"
      title="投诉详情"
      size="600px"
      :destroy-on-close="true"
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="currentComplaint">
          <el-descriptions :column="2" border class="detail-desc">
            <el-descriptions-item label="投诉单号">
              {{ currentComplaint.complaintNo }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentComplaint.status)" effect="light">
                {{ getStatusLabel(currentComplaint.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="客人姓名">
              {{ currentComplaint.guestName }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ currentComplaint.guestPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="投诉类型">
              {{ getTypeLabel(currentComplaint.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="子类型">
              {{ currentComplaint.subType }}
            </el-descriptions-item>
            <el-descriptions-item label="严重程度">
              <el-tag :type="getSeverityType(currentComplaint.severity)" effect="light">
                {{ getSeverityLabel(currentComplaint.severity) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="来源">
              {{ currentComplaint.source }}
            </el-descriptions-item>
            <el-descriptions-item label="处理人">
              {{ currentComplaint.handler || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="满意度">
              <template v-if="currentComplaint.satisfactionScore">
                <el-rate
                  v-model="currentComplaint.satisfactionScore"
                  disabled
                  show-text
                  :texts="['非常不满意', '不满意', '一般', '满意', '非常满意']"
                />
              </template>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">
              {{ formatDateTime(currentComplaint.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="投诉标题" :span="2">
              {{ currentComplaint.title }}
            </el-descriptions-item>
            <el-descriptions-item label="投诉内容" :span="2">
              <div class="content-text">{{ currentComplaint.description }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="处理结果" :span="2" v-if="currentComplaint.resolution">
              <div class="content-text">{{ currentComplaint.resolution }}</div>
            </el-descriptions-item>
          </el-descriptions>

          <div class="timeline-section">
            <h4 class="section-title">处理记录</h4>
            <el-timeline>
              <el-timeline-item
                :timestamp="formatDateTime(currentComplaint.createdAt)"
                placement="top"
                type="primary"
              >
                <div class="timeline-content">
                  <div class="timeline-title">投诉创建</div>
                  <div class="timeline-desc">客人提交投诉，等待处理</div>
                </div>
              </el-timeline-item>
              <el-timeline-item
                v-if="currentComplaint.handledAt"
                :timestamp="formatDateTime(currentComplaint.handledAt)"
                placement="top"
                type="warning"
              >
                <div class="timeline-content">
                  <div class="timeline-title">开始处理</div>
                  <div class="timeline-desc">处理人：{{ currentComplaint.handler }}</div>
                </div>
              </el-timeline-item>
              <el-timeline-item
                v-if="currentComplaint.resolvedAt"
                :timestamp="formatDateTime(currentComplaint.resolvedAt)"
                placement="top"
                type="success"
              >
                <div class="timeline-content">
                  <div class="timeline-title">处理完成</div>
                  <div class="timeline-desc">{{ currentComplaint.feedback || '已解决' }}</div>
                  <div class="timeline-duration">
                    耗时：{{ calculateDuration(currentComplaint.createdAt, currentComplaint.resolvedAt) }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </template>
        <el-empty v-else description="暂无数据" />
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            v-if="hasPermission('complaint:handle') && currentComplaint && currentComplaint.status !== '已解决' && currentComplaint.status !== '已关闭'"
            type="primary"
            @click="handleProcess(currentComplaint)"
          >
            处理投诉
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="createDialogVisible"
      title="新增投诉"
      width="500px"
      :destroy-on-close="true"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="客人姓名" prop="guestName">
          <el-input v-model="createForm.guestName" placeholder="请输入客人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="guestPhone">
          <el-input v-model="createForm.guestPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="投诉类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择投诉类型" style="width: 100%">
            <el-option
              v-for="type in complaintTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-radio-group v-model="createForm.severity">
            <el-radio value="low">低</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="urgent">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="投诉标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入投诉标题" />
        </el-form-item>
        <el-form-item label="投诉内容" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入投诉内容"
          />
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-select v-model="createForm.source" placeholder="请选择来源" style="width: 100%">
            <el-option label="前台" value="前台" />
            <el-option label="电话投诉" value="电话投诉" />
            <el-option label="在线评价" value="在线评价" />
            <el-option label="客房服务" value="客房服务" />
            <el-option label="商务中心" value="商务中心" />
            <el-option label="会员中心" value="会员中心" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">
          提交
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="handleDialogVisible"
      title="处理投诉"
      width="500px"
      :destroy-on-close="true"
    >
      <el-form
        ref="handleFormRef"
        :model="handleForm"
        :rules="handleRules"
        label-width="100px"
      >
        <el-form-item label="处理人" prop="handler">
          <el-input v-model="handleForm.handler" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-radio-group v-model="handleForm.status">
            <el-radio value="处理中">处理中</el-radio>
            <el-radio value="已解决">已解决</el-radio>
            <el-radio value="已关闭">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleContent">
          <el-input
            v-model="handleForm.handleContent"
            type="textarea"
            :rows="4"
            placeholder="请输入处理结果和措施"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHandle">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { Plus, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { PageContainer, FilterBar, DataTable } from '../components/common'
import { usePermission } from '../hooks/usePermission'
import { useExport } from '../hooks/useExport'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'
import { complaintApi, type Complaint } from '../api/complaint'

const { hasPermission } = usePermission()
const { exporting, exportData } = useExport()
const { themeMode } = useTheme()

const typeChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const efficiencyChartRef = ref<HTMLElement | null>(null)

const typeChart = useChart({}, themeMode)
const trendChart = useChart({}, themeMode)
const efficiencyChart = useChart({}, themeMode)

const loading = ref(false)
const list = ref<Complaint[]>([])
const detailLoading = ref(false)
const detailVisible = ref(false)
const currentComplaint = ref<Complaint | null>(null)
const createDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const submitting = ref(false)

const createFormRef = ref<FormInstance>()
const handleFormRef = ref<FormInstance>()

const activeFilterType = ref<string>('')
const activeFilterStatus = ref<string>('')
const activeFilterHandler = ref<string>('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const query = reactive({
  type: '',
  status: '',
  handler: '',
  startDate: '',
  endDate: ''
})

const complaintTypes = [
  { label: '卫生', value: '卫生' },
  { label: '服务', value: '服务' },
  { label: '设施', value: '设施' },
  { label: '噪音', value: '噪音' },
  { label: '其他', value: '其他' }
]

const complaintStatuses = [
  { label: '待处理', value: '待处理' },
  { label: '处理中', value: '处理中' },
  { label: '已解决', value: '已解决' },
  { label: '已关闭', value: '已关闭' }
]

const handlers = [
  { label: '李主管', value: '李主管' },
  { label: '王经理', value: '王经理' },
  { label: '张主管', value: '张主管' },
  { label: '赵经理', value: '赵经理' },
  { label: '王主管', value: '王主管' },
  { label: '张经理', value: '张经理' },
  { label: '李经理', value: '李经理' },
  { label: '赵主管', value: '赵主管' }
]

const filterFields = computed(() => [
  { prop: 'type', label: '投诉类型', type: 'select' as const, options: complaintTypes },
  { prop: 'status', label: '状态', type: 'select' as const, options: complaintStatuses },
  { prop: 'handler', label: '处理人', type: 'select' as const, options: handlers },
  { prop: 'dateRange', label: '日期范围', type: 'daterange' as const, width: '300px' }
])

const tableColumns = [
  { prop: 'complaintNo', label: '投诉单号', minWidth: 130, fixed: 'left' as const },
  { prop: 'guestName', label: '客人姓名', minWidth: 100 },
  { prop: 'type', label: '类型', minWidth: 80, type: 'tag' as const, tagOptions: [
    { label: '卫生', value: '卫生', type: 'danger' as const },
    { label: '服务', value: '服务', type: 'warning' as const },
    { label: '设施', value: '设施', type: 'info' as const },
    { label: '噪音', value: '噪音', type: 'primary' as const },
    { label: '其他', value: '其他', type: 'success' as const }
  ]},
  { prop: 'title', label: '内容摘要', minWidth: 200, tooltip: true },
  { prop: 'status', label: '状态', minWidth: 100, type: 'status' as const },
  { prop: 'handler', label: '处理人', minWidth: 100 },
  { prop: 'createdAt', label: '创建时间', minWidth: 170, type: 'date' as const },
  { prop: 'duration', label: '耗时', minWidth: 100, align: 'center' as const, formatter: (row: Complaint) => {
    if (row.resolvedAt) {
      return calculateDuration(row.createdAt, row.resolvedAt)
    }
    if (row.status === '处理中') {
      return calculateDuration(row.createdAt, new Date().toISOString())
    }
    return '-'
  }}
]

const createForm = reactive({
  guestName: '',
  guestPhone: '',
  type: '',
  severity: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  title: '',
  description: '',
  source: '前台'
})

const createRules: FormRules = {
  guestName: [{ required: true, message: '请输入客人姓名', trigger: 'blur' }],
  guestPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  type: [{ required: true, message: '请选择投诉类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  title: [{ required: true, message: '请输入投诉标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入投诉内容', trigger: 'blur' }],
  source: [{ required: true, message: '请选择来源', trigger: 'change' }]
}

const handleForm = reactive({
  id: '',
  handler: '',
  status: '处理中' as '处理中' | '已解决' | '已关闭',
  handleContent: ''
})

const handleRules: FormRules = {
  handler: [{ required: true, message: '请输入处理人姓名', trigger: 'blur' }],
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  handleContent: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const getTypeLabel = (type: string): string => {
  const item = complaintTypes.find(t => t.value === type)
  return item?.label || type
}

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
    '待处理': '待处理',
    '处理中': '处理中',
    '已解决': '已解决',
    '已关闭': '已关闭'
  }
  return map[status] || status
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success',
    closed: 'info',
    '待处理': 'warning',
    '处理中': 'primary',
    '已解决': 'success',
    '已关闭': 'info'
  }
  return map[status] || 'info'
}

const getSeverityLabel = (severity: string): string => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[severity] || severity
}

const getSeverityType = (severity: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  }
  return map[severity] || 'info'
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateDuration = (start: string, end: string): string => {
  if (!start || !end) return '-'
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const diff = endTime - startTime
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}天${remainingHours}小时`
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  return `${minutes}分钟`
}

const getTypeChartData = () => {
  const typeCounts: Record<string, number> = {}
  list.value.forEach(item => {
    if (!typeCounts[item.type]) {
      typeCounts[item.type] = 0
    }
    typeCounts[item.type]++
  })
  return Object.entries(typeCounts).map(([type, count]) => ({
    name: getTypeLabel(type),
    value: count,
    type
  }))
}

const getTrendChartData = () => {
  const monthMap: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthMap[monthKey] = 0
  }
  list.value.forEach(item => {
    const date = new Date(item.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (monthMap[monthKey] !== undefined) {
      monthMap[monthKey]++
    }
  })
  return {
    months: Object.keys(monthMap),
    counts: Object.values(monthMap)
  }
}

const getEfficiencyChartData = () => {
  const handlerEfficiency: Record<string, { total: number; avgHours: number; resolved: number }> = {}
  list.value.forEach(item => {
    if (item.handler && item.resolvedAt) {
      if (!handlerEfficiency[item.handler]) {
        handlerEfficiency[item.handler] = { total: 0, avgHours: 0, resolved: 0 }
      }
      const duration = (new Date(item.resolvedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60)
      handlerEfficiency[item.handler].total += duration
      handlerEfficiency[item.handler].resolved++
    }
  })
  const result = Object.entries(handlerEfficiency).map(([handler, data]) => ({
    handler,
    avgHours: data.resolved > 0 ? Math.round((data.total / data.resolved) * 10) / 10 : 0,
    resolved: data.resolved
  }))
  return result.sort((a, b) => a.avgHours - b.avgHours).slice(0, 8)
}

const renderTypeChart = () => {
  const data = getTypeChartData()
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: 'var(--el-text-color-secondary)' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['65%', '50%'],
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
      data: data.map(item => ({
        ...item,
        itemStyle: {
          color: getTypeColor(item.type)
        }
      }))
    }],
    color: ['#F56C6C', '#E6A23C', '#909399', '#409EFF', '#67C23A']
  }
  typeChart.setOption(option, { notMerge: true })
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    '卫生': '#F56C6C',
    '服务': '#E6A23C',
    '设施': '#909399',
    '噪音': '#409EFF',
    '其他': '#67C23A'
  }
  return colors[type] || '#909399'
}

const renderTrendChart = () => {
  const { months, counts } = getTrendChartData()
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
      data: months.map(m => m.slice(5) + '月'),
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    yAxis: {
      type: 'value',
      name: '投诉数',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [{
      name: '投诉数量',
      type: 'line',
      data: counts,
      itemStyle: { color: '#409EFF' },
      lineStyle: { width: 3 },
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
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
    }]
  }
  trendChart.setOption(option, { notMerge: true })
}

const renderEfficiencyChart = () => {
  const data = getEfficiencyChartData()
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0]
        return `${item.name}<br/>平均处理时长: ${item.value}小时<br/>已解决: ${data.find(d => d.handler === item.name)?.resolved || 0}件`
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
      data: data.map(d => d.handler),
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '平均时长(小时)',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [{
      name: '平均处理时长',
      type: 'bar',
      data: data.map(d => d.avgHours),
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
      },
      barWidth: '50%'
    }]
  }
  efficiencyChart.setOption(option, { notMerge: true })
}

const setupChartEvents = () => {
  if (typeChart.chartInstance.value) {
    typeChart.chartInstance.value.on('click', (params: any) => {
      if (params.data && params.data.type) {
        activeFilterType.value = params.data.type
        query.type = params.data.type
        pagination.page = 1
        loadData()
      }
    })
  }
  if (efficiencyChart.chartInstance.value) {
    efficiencyChart.chartInstance.value.on('click', (params: any) => {
      if (params.name) {
        activeFilterHandler.value = params.name
        query.handler = params.name
        pagination.page = 1
        loadData()
      }
    })
  }
}

const clearTypeFilter = () => {
  activeFilterType.value = ''
  query.type = ''
  pagination.page = 1
  loadData()
}

const clearStatusFilter = () => {
  activeFilterStatus.value = ''
  query.status = ''
  pagination.page = 1
  loadData()
}

const clearHandlerFilter = () => {
  activeFilterHandler.value = ''
  query.handler = ''
  pagination.page = 1
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const result = await complaintApi.getList({
      ...query,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    list.value = result.list
    pagination.total = result.total
    await nextTick()
    renderTypeChart()
    renderTrendChart()
    renderEfficiencyChart()
    setupChartEvents()
  } catch (error) {
    ElMessage.error('加载投诉数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (filters: Record<string, any>) => {
  query.type = filters.type || ''
  query.status = filters.status || ''
  query.handler = filters.handler || ''
  if (filters.dateRange && filters.dateRange.length === 2) {
    query.startDate = filters.dateRange[0]
    query.endDate = filters.dateRange[1]
  } else {
    query.startDate = ''
    query.endDate = ''
  }
  activeFilterType.value = query.type
  activeFilterStatus.value = query.status
  activeFilterHandler.value = query.handler
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  query.type = ''
  query.status = ''
  query.handler = ''
  query.startDate = ''
  query.endDate = ''
  activeFilterType.value = ''
  activeFilterStatus.value = ''
  activeFilterHandler.value = ''
  pagination.page = 1
  loadData()
}

const handlePaginationChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

const handleViewDetail = async (row: Complaint) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const detail = await complaintApi.getById(row.id)
    currentComplaint.value = detail
  } catch (error) {
    ElMessage.error('加载投诉详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleCreate = () => {
  createForm.guestName = ''
  createForm.guestPhone = ''
  createForm.type = ''
  createForm.severity = 'medium'
  createForm.title = ''
  createForm.description = ''
  createForm.source = '前台'
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
    submitting.value = true
    await complaintApi.create({
      guestName: createForm.guestName,
      phone: createForm.guestPhone,
      type: createForm.type as any,
      priority: createForm.severity,
      description: createForm.description,
      source: createForm.source
    })
    ElMessage.success('投诉创建成功')
    createDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('创建失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const handleProcess = (row: Complaint) => {
  handleForm.id = row.id
  handleForm.handler = ''
  handleForm.status = '处理中'
  handleForm.handleContent = ''
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  if (!handleFormRef.value) return
  try {
    await handleFormRef.value.validate()
    submitting.value = true
    await complaintApi.handle({
      id: handleForm.id,
      handler: handleForm.handler,
      handleContent: handleForm.handleContent,
      status: handleForm.status as any
    })
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    if (detailVisible.value) {
      const detail = await complaintApi.getById(handleForm.id)
      currentComplaint.value = detail
    }
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('处理失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const handleExport = async () => {
  if (list.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  const exportColumns = [
    { key: 'complaintNo', title: '投诉单号' },
    { key: 'guestName', title: '客人姓名' },
    { key: 'guestPhone', title: '联系电话' },
    { key: 'type', title: '投诉类型', formatter: (val: string) => getTypeLabel(val) },
    { key: 'subType', title: '子类型' },
    { key: 'title', title: '投诉标题' },
    { key: 'description', title: '投诉内容' },
    { key: 'status', title: '状态', formatter: (val: string) => getStatusLabel(val) },
    { key: 'handler', title: '处理人' },
    { key: 'resolution', title: '处理结果' },
    { key: 'createdAt', title: '创建时间', formatter: (val: string) => formatDateTime(val) },
    { key: 'resolvedAt', title: '解决时间', formatter: (val: string) => val ? formatDateTime(val) : '-' }
  ]
  try {
    await exportData(list.value as any, exportColumns, {
      filename: '投诉记录',
      format: 'excel'
    })
  } catch (error) {
    console.error('导出失败:', error)
  }
}

watch([typeChartRef, trendChartRef, efficiencyChartRef], ([typeRef, trendRef, efficiencyRef]) => {
  if (typeRef) {
    typeChart.chartRef.value = typeRef
    typeChart.initChart()
  }
  if (trendRef) {
    trendChart.chartRef.value = trendRef
    trendChart.initChart()
  }
  if (efficiencyRef) {
    efficiencyChart.chartRef.value = efficiencyRef
    efficiencyChart.initChart()
  }
}, { immediate: true })

watch(() => list.value, () => {
  if (list.value.length > 0) {
    nextTick(() => {
      renderTypeChart()
      renderTrendChart()
      renderEfficiencyChart()
    })
  }
}, { deep: true })

onMounted(() => {
  if (hasPermission('complaint:view')) {
    loadData()
  }
})
</script>

<style lang="scss" scoped>
.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  height: 300px;
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;

  :deep(.el-card__body) {
    flex: 1;
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-container {
    width: 100%;
    height: 100%;
    min-height: 220px;
  }
}

.detail-content {
  min-height: 400px;
}

.detail-desc {
  margin-bottom: 24px;

  .content-text {
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.timeline-section {
  margin-top: 24px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  .timeline-content {
    .timeline-title {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }

    .timeline-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    .timeline-duration {
      font-size: 12px;
      color: var(--el-color-primary);
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .chart-row {
    .chart-card {
      margin-bottom: 16px;
    }
  }
}
</style>
