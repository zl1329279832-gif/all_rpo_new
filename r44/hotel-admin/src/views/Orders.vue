<template>
  <PageContainer title="订单管理" description="查看和管理酒店所有订单信息">
    <template #actions>
      <el-button
        v-if="hasPermission('order:export')"
        type="success"
        :icon="Download"
        :loading="exporting"
        :disabled="selectedOrders.length === 0"
        @click="handleExportSelected"
      >
        导出选中 ({{ selectedOrders.length }})
      </el-button>
      <el-button
        v-if="hasPermission('order:export')"
        :icon="Download"
        :loading="exporting"
        @click="handleExportAll"
      >
        导出全部
      </el-button>
    </template>

    <FilterBar :fields="filterFields" @search="handleSearch" @reset="handleReset" />

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :sm="12" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
              <el-tag size="small" type="info">点击筛选</el-tag>
            </div>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>渠道分布</span>
              <el-tag size="small" type="info">点击筛选</el-tag>
            </div>
          </template>
          <div ref="channelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <DataTable
      :columns="tableColumns"
      :data="orderStore.list"
      :loading="orderStore.loading"
      :show-selection="hasPermission('order:export')"
      :show-index="true"
      :show-actions="true"
      :show-pagination="true"
      :pagination="pagination"
      :page-sizes="[10, 20, 50, 100]"
      actions-width="120"
      @selection-change="handleSelectionChange"
      @pagination-change="handlePaginationChange"
    >
      <template #header>
        <el-button
          v-if="hasPermission('order:refresh')"
          :icon="Refresh"
          @click="loadData"
        >
          刷新
        </el-button>
        <el-tag v-if="activeFilterStatus" type="primary" closable @close="clearStatusFilter">
          状态: {{ getStatusLabel(activeFilterStatus) }}
        </el-tag>
        <el-tag v-if="activeFilterChannel" type="success" closable @close="clearChannelFilter">
          渠道: {{ activeFilterChannel }}
        </el-tag>
      </template>

      <template #actions="{ row }">
        <el-button type="primary" link @click="handleViewDetail(row)">
          详情
        </el-button>
        <el-dropdown
          v-if="hasPermission('order:update')"
          @command="(cmd) => handleStatusChange(row, cmd)"
        >
          <el-button type="primary" link>
            状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="status in availableStatuses"
                :key="status.value"
                :command="status.value"
                :disabled="row.status === status.value"
              >
                {{ status.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </DataTable>

    <DetailDrawer
      v-model="detailVisible"
      title="订单详情"
      size="600px"
      :loading="detailLoading"
      :detail="orderDetail"
      :fields="detailFields"
      :column="2"
    >
      <template #footer-extra>
        <el-button
          v-if="hasPermission('order:update') && orderDetail"
          type="primary"
          @click="handleEditOrder"
        >
          编辑订单
        </el-button>
      </template>
    </DetailDrawer>

    <el-dialog
      v-model="exportDialogVisible"
      title="导出设置"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="csv">CSV</el-radio>
            <el-radio value="excel">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件名称">
          <el-input v-model="exportFilename" placeholder="订单数据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="confirmExport">
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PageContainer, FilterBar, DataTable, DetailDrawer } from '../components/common'
import { usePermission } from '../hooks/usePermission'
import { useExport } from '../hooks/useExport'
import { useChart } from '../hooks/useChart'
import { useOrderStore } from '../stores/order'
import { roomTypeApi } from '../api/roomType'
import { channelApi } from '../api/channel'
import type { Order, OrderStatus } from '../types'
import type { EChartsOption } from 'echarts'

const { hasPermission } = usePermission()
const { exporting, exportData } = useExport()
const orderStore = useOrderStore()

const statusChartRef = ref<HTMLElement | null>(null)
const channelChartRef = ref<HTMLElement | null>(null)

const statusChart = useChart({ theme: 'light' })
const channelChart = useChart({ theme: 'light' })

const selectedOrders = ref<Order[]>([])
const detailVisible = ref(false)
const detailLoading = ref(false)
const orderDetail = ref<Order | null>(null)
const exportDialogVisible = ref(false)
const exportFormat = ref<'csv' | 'excel'>('csv')
const exportFilename = ref('订单数据')
const exportType = ref<'selected' | 'all'>('all')
const activeFilterStatus = ref<string>('')
const activeFilterChannel = ref<string>('')

const roomTypes = ref<Array<{ id: string; name: string }>>([])
const channels = ref<Array<{ id: string; name: string; code: string }>>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

watch(() => orderStore.total, (total) => {
  pagination.total = total
})

const statusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已入住', value: 'checkedIn' },
  { label: '已退房', value: 'checkedOut' },
  { label: '已取消', value: 'cancelled' },
  { label: '未入住', value: 'noShow' }
]

const availableStatuses = computed(() => {
  return statusOptions
})

const filterFields = computed(() => [
  { prop: 'orderNo', label: '订单号', type: 'input' as const, placeholder: '请输入订单号' },
  { prop: 'guestName', label: '客人姓名', type: 'input' as const, placeholder: '请输入客人姓名' },
  { prop: 'channel', label: '渠道', type: 'select' as const, options: channels.value.map(c => ({ label: c.name, value: c.code })) },
  { prop: 'roomTypeId', label: '房型', type: 'select' as const, options: roomTypes.value.map(r => ({ label: r.name, value: r.id })) },
  { prop: 'status', label: '状态', type: 'select' as const, options: statusOptions },
  { prop: 'dateRange', label: '日期范围', type: 'daterange' as const, width: '300px' }
])

const tableColumns = [
  { prop: 'orderNo', label: '订单号', minWidth: 140, fixed: 'left' as const },
  { prop: 'guestName', label: '客人姓名', minWidth: 100 },
  { prop: 'phone', label: '联系电话', minWidth: 130 },
  { prop: 'roomTypeName', label: '房型', minWidth: 100 },
  { prop: 'checkInDate', label: '入住日期', minWidth: 120, type: 'date' as const },
  { prop: 'checkOutDate', label: '退房日期', minWidth: 120, type: 'date' as const },
  { prop: 'nights', label: '晚数', width: 70, align: 'center' as const },
  { prop: 'channel', label: '渠道', minWidth: 100, type: 'tag' as const, tagOptions: channels.value.map(c => ({ label: c.name, value: c.code, type: 'info' as const })) },
  { prop: 'totalAmount', label: '总金额', minWidth: 100, type: 'money' as const, align: 'right' as const },
  { prop: 'status', label: '状态', minWidth: 100, type: 'status' as const }
]

const detailFields = [
  { prop: 'orderNo', label: '订单号', span: 1 },
  { prop: 'status', label: '订单状态', type: 'status' as const, span: 1 },
  { prop: 'guestName', label: '客人姓名', span: 1 },
  { prop: 'phone', label: '联系电话', span: 1 },
  { prop: 'idCard', label: '身份证号', span: 2 },
  { prop: 'roomTypeName', label: '房型', span: 1 },
  { prop: 'roomNo', label: '房号', span: 1 },
  { prop: 'checkInDate', label: '入住日期', type: 'date' as const, span: 1 },
  { prop: 'checkOutDate', label: '退房日期', type: 'date' as const, span: 1 },
  { prop: 'nights', label: '入住晚数', span: 1 },
  { prop: 'guests', label: '入住人数', span: 1 },
  { prop: 'channel', label: '预订渠道', span: 1 },
  { prop: 'channelOrderNo', label: '渠道订单号', span: 1 },
  { prop: 'totalAmount', label: '总金额', type: 'money' as const, span: 1 },
  { prop: 'paidAmount', label: '已付金额', type: 'money' as const, span: 1 },
  { prop: 'paymentMethod', label: '支付方式', span: 1 },
  { prop: 'remark', label: '备注', span: 2 },
  { prop: 'createdAt', label: '创建时间', type: 'date' as const, span: 1 },
  { prop: 'updatedAt', label: '更新时间', type: 'date' as const, span: 1 }
]

const exportColumns = [
  { key: 'orderNo', title: '订单号' },
  { key: 'guestName', title: '客人姓名' },
  { key: 'phone', title: '联系电话' },
  { key: 'roomTypeName', title: '房型' },
  { key: 'roomNo', title: '房号' },
  { key: 'checkInDate', title: '入住日期' },
  { key: 'checkOutDate', title: '退房日期' },
  { key: 'nights', title: '晚数' },
  { key: 'channel', title: '渠道', formatter: (val: string) => getChannelName(val) },
  { key: 'totalAmount', title: '总金额(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
  { key: 'status', title: '状态', formatter: (val: string) => getStatusLabel(val) },
  { key: 'paymentMethod', title: '支付方式' },
  { key: 'remark', title: '备注' }
]

const getStatusLabel = (status: string) => {
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

const getChannelName = (code: string) => {
  const channel = channels.value.find(c => c.code === code)
  return channel?.name || code
}

const getStatusChartData = () => {
  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    checkedIn: 0,
    checkedOut: 0,
    cancelled: 0,
    noShow: 0
  }
  orderStore.list.forEach(order => {
    if (statusCounts[order.status] !== undefined) {
      statusCounts[order.status]++
    }
  })
  return Object.entries(statusCounts).map(([status, count]) => ({
    name: getStatusLabel(status),
    value: count,
    status
  })).filter(item => item.value > 0)
}

const getChannelChartData = () => {
  const channelCounts: Record<string, number> = {}
  orderStore.list.forEach(order => {
    if (!channelCounts[order.channel]) {
      channelCounts[order.channel] = 0
    }
    channelCounts[order.channel]++
  })
  return Object.entries(channelCounts).map(([channel, count]) => ({
    name: getChannelName(channel),
    value: count,
    channel
  }))
}

const renderStatusChart = () => {
  const data = getStatusChartData()
  const option: EChartsOption = {
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
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
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
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: getStatusColor(item.status)
          }
        }))
      }
    ]
  }
  statusChart.setOption(option, { notMerge: true })
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: '#e6a23c',
    confirmed: '#409eff',
    checkedIn: '#67c23a',
    checkedOut: '#909399',
    cancelled: '#f56c6c',
    noShow: '#f56c6c'
  }
  return colors[status] || '#909399'
}

const renderChannelChart = () => {
  const data = getChannelChartData()
  const option: EChartsOption = {
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
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
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
        data: data
      }
    ]
  }
  channelChart.setOption(option, { notMerge: true })
}

const setupChartEvents = () => {
  if (statusChart.chartInstance.value) {
    statusChart.chartInstance.value.on('click', (params: any) => {
      if (params.data && params.data.status) {
        activeFilterStatus.value = params.data.status
        orderStore.setQuery({ status: params.data.status })
        loadData()
      }
    })
  }
  if (channelChart.chartInstance.value) {
    channelChart.chartInstance.value.on('click', (params: any) => {
      if (params.data && params.data.channel) {
        activeFilterChannel.value = params.data.name
        orderStore.setQuery({ channel: params.data.channel })
        loadData()
      }
    })
  }
}

const clearStatusFilter = () => {
  activeFilterStatus.value = ''
  orderStore.setQuery({ status: undefined })
  loadData()
}

const clearChannelFilter = () => {
  activeFilterChannel.value = ''
  orderStore.setQuery({ channel: undefined })
  loadData()
}

const loadData = async () => {
  try {
    await orderStore.fetchList()
    await nextTick()
    renderStatusChart()
    renderChannelChart()
    setupChartEvents()
  } catch (error) {
    ElMessage.error('加载订单数据失败')
  }
}

const loadRoomTypes = async () => {
  try {
    const list = await roomTypeApi.getAll()
    roomTypes.value = list.map(item => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('加载房型数据失败:', error)
  }
}

const loadChannels = async () => {
  try {
    const list = await channelApi.getAll()
    channels.value = list
  } catch (error) {
    console.error('加载渠道数据失败:', error)
  }
}

const handleSearch = (filters: Record<string, any>) => {
  const query: any = {}
  if (filters.orderNo) query.orderNo = filters.orderNo
  if (filters.guestName) query.guestName = filters.guestName
  if (filters.channel) query.channel = filters.channel
  if (filters.roomTypeId) query.roomTypeId = filters.roomTypeId
  if (filters.status) query.status = filters.status
  if (filters.dateRange && filters.dateRange.length === 2) {
    query.startDate = filters.dateRange[0]
    query.endDate = filters.dateRange[1]
  }
  pagination.page = 1
  orderStore.setQuery(query)
  loadData()
}

const handleReset = () => {
  activeFilterStatus.value = ''
  activeFilterChannel.value = ''
  pagination.page = 1
  orderStore.resetQuery()
  loadData()
}

const handlePaginationChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
  pagination.page = page
  pagination.pageSize = pageSize
  orderStore.setQuery({ page, pageSize })
  loadData()
}

const handleSelectionChange = (selection: any[]) => {
  selectedOrders.value = selection
}

const handleViewDetail = async (row: Order) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const detail = await orderStore.fetchById(row.id)
    orderDetail.value = detail
  } catch (error) {
    ElMessage.error('加载订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleStatusChange = async (row: Order, newStatus: OrderStatus) => {
  try {
    await ElMessageBox.confirm(
      `确定要将订单 ${row.orderNo} 状态改为"${getStatusLabel(newStatus)}"吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await orderStore.updateStatus(row.id, newStatus)
    ElMessage.success('状态更新成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('状态更新失败')
    }
  }
}

const handleExportSelected = () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择要导出的订单')
    return
  }
  exportType.value = 'selected'
  exportDialogVisible.value = true
}

const handleExportAll = () => {
  exportType.value = 'all'
  exportDialogVisible.value = true
}

const confirmExport = async () => {
  const data = exportType.value === 'selected'
    ? selectedOrders.value
    : orderStore.list

  if (data.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  try {
    await exportData(data as any, exportColumns, {
      filename: exportFilename.value,
      format: exportFormat.value
    })
    exportDialogVisible.value = false
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const handleEditOrder = () => {
  ElMessage.info('编辑功能开发中')
}

watch([statusChartRef, channelChartRef], ([statusRef, channelRef]) => {
  if (statusRef) {
    statusChart.chartRef.value = statusRef
    statusChart.initChart()
  }
  if (channelRef) {
    channelChart.chartRef.value = channelRef
    channelChart.initChart()
  }
}, { immediate: true })

watch(() => orderStore.list, () => {
  if (orderStore.list.length > 0) {
    nextTick(() => {
      renderStatusChart()
      renderChannelChart()
    })
  }
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    loadRoomTypes(),
    loadChannels()
  ])
  await nextTick()
  loadData()
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

@media (max-width: 768px) {
  .chart-row {
    .chart-card {
      margin-bottom: 16px;
    }
  }
}
</style>
