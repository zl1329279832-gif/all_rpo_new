<template>
  <PageContainer title="价格策略" description="管理酒店客房价格策略，支持动态定价和优惠活动">
    <template #actions>
      <el-button
        v-if="hasPermission('priceStrategy:create')"
        type="primary"
        :icon="Plus"
        @click="handleCreate"
      >
        新增策略
      </el-button>
      <el-button
        v-if="hasPermission('priceStrategy:refresh')"
        :icon="Refresh"
        @click="loadData"
      >
        刷新
      </el-button>
    </template>

    <FilterBar :fields="filterFields" @search="handleSearch" @reset="handleReset" />

    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <DataTable
          :columns="tableColumns"
          :data="strategies"
          :loading="loading"
          :show-index="true"
          :show-actions="true"
          :show-pagination="true"
          :pagination="pagination"
          :page-sizes="[10, 20, 50]"
          actions-width="200"
          @pagination-change="handlePaginationChange"
        >
          <template #actions="{ row }">
            <el-button
              v-if="hasPermission('priceStrategy:view')"
              type="primary"
              link
              @click="handleViewTimeline(row)"
            >
              时间轴
            </el-button>
            <el-button
              v-if="hasPermission('priceStrategy:update')"
              type="primary"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-switch
              v-if="hasPermission('priceStrategy:update')"
              v-model="row.isActive"
              active-text="启用"
              inactive-text="禁用"
              @change="(val) => handleToggleStatus(row, val)"
            />
            <el-button
              v-if="hasPermission('priceStrategy:delete')"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </DataTable>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card class="timeline-card" shadow="never">
          <template #header>
            <div class="timeline-header">
              <span class="timeline-title">
                <el-icon><Clock /></el-icon>
                策略生效时间轴
              </span>
              <el-tag v-if="selectedStrategy" size="small" type="primary">
                {{ selectedStrategy.name }}
              </el-tag>
            </div>
          </template>
          <div v-if="loading" class="timeline-loading">
            <el-loading :fullscreen="false" text="加载中..." />
          </div>
          <div v-else-if="!selectedStrategy" class="timeline-empty">
            <el-empty description="请点击左侧策略查看时间轴" :image-size="80" />
          </div>
          <div v-else class="timeline-content">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in timelineItems"
                :key="index"
                :timestamp="item.timestamp"
                :type="item.type"
                :color="item.color"
                placement="top"
              >
                <el-card class="timeline-item-card" shadow="never" :body-style="{ padding: '12px' }">
                  <h4 class="item-title">{{ item.title }}</h4>
                  <p class="item-desc">{{ item.description }}</p>
                  <div class="item-meta">
                    <el-tag v-if="item.weekdays && item.weekdays.length > 0" size="small" type="info">
                      {{ formatWeekdays(item.weekdays) }}
                    </el-tag>
                    <el-tag v-if="item.price" size="small" type="success">
                      ¥{{ item.price }}
                    </el-tag>
                    <el-tag v-if="item.discountRate && item.discountRate !== 100" size="small" type="warning">
                      {{ item.discountRate }}%
                    </el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑价格策略' : '新增价格策略'"
      width="800px"
      :close-on-click-modal="false"
      @close="handleFormClose"
    >
      <PriceAdjustForm
        ref="priceFormRef"
        :room-types="roomTypes"
        :initial-data="formInitialData"
        :show-actions="false"
      />
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建策略' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="timelineDialogVisible"
      title="策略生效时间轴"
      width="600px"
    >
      <div v-if="selectedStrategy" class="full-timeline">
        <h3 class="strategy-name">{{ selectedStrategy.name }}</h3>
        <p class="strategy-desc">{{ selectedStrategy.remarks || '暂无备注' }}</p>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in fullTimelineItems"
            :key="index"
            :timestamp="item.timestamp"
            :type="item.type"
            :color="item.color"
            placement="top"
          >
            <el-card class="timeline-item-card" shadow="never" :body-style="{ padding: '12px' }">
              <h4 class="item-title">{{ item.title }}</h4>
              <p class="item-desc">{{ item.description }}</p>
              <div class="item-meta">
                <el-tag v-if="item.weekdays && item.weekdays.length > 0" size="small" type="info">
                  {{ formatWeekdays(item.weekdays) }}
                </el-tag>
                <el-tag v-if="item.price" size="small" type="success">
                  ¥{{ item.price }}
                </el-tag>
                <el-tag v-if="item.discountRate && item.discountRate !== 100" size="small" type="warning">
                  {{ item.discountRate }}%
                </el-tag>
                <el-tag v-if="item.minStay" size="small">
                  最少{{ item.minStay }}晚
                </el-tag>
                <el-tag v-if="item.priority" size="small" type="primary">
                  优先级: {{ item.priority }}
                </el-tag>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Plus, Refresh, Clock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PageContainer, FilterBar, DataTable, PriceAdjustForm } from '../components/common'
import { usePermission } from '../hooks/usePermission'
import { useLoading } from '../hooks/useLoading'
import { priceStrategyApi, type PriceStrategyQuery } from '../api/priceStrategy'
import { roomTypeApi } from '../api/roomType'
import type { PriceStrategy, RoomType } from '../types'

const { hasPermission } = usePermission()
const { loading, withLoading } = useLoading()

const strategies = ref<PriceStrategy[]>([])
const roomTypes = ref<RoomType[]>([])
const selectedStrategy = ref<PriceStrategy | null>(null)
const formDialogVisible = ref(false)
const timelineDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const priceFormRef = ref<InstanceType<typeof PriceAdjustForm> | null>(null)
const formInitialData = ref<Record<string, any> | undefined>(undefined)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
]

const filterFields = computed(() => [
  { prop: 'name', label: '策略名称', type: 'input' as const, placeholder: '请输入策略名称' },
  { prop: 'roomTypeId', label: '房型', type: 'select' as const, options: roomTypes.value.map(r => ({ label: r.name, value: r.id })) },
  { prop: 'status', label: '状态', type: 'select' as const, options: statusOptions }
])

const tableColumns = [
  { prop: 'name', label: '策略名称', minWidth: 140, fixed: 'left' as const },
  { prop: 'type', label: '类型', minWidth: 100, type: 'tag' as const, tagOptions: getTypeOptions() },
  { prop: 'roomTypeName', label: '适用房型', minWidth: 100 },
  { prop: 'priceDisplay', label: '折扣/价格', minWidth: 120, align: 'right' as const, formatter: formatPriceDisplay },
  { prop: 'startDate', label: '开始日期', minWidth: 120, type: 'date' as const },
  { prop: 'endDate', label: '结束日期', minWidth: 120, type: 'date' as const },
  { prop: 'isActive', label: '状态', minWidth: 80, type: 'status' as const, formatter: formatStatus }
]

function getTypeOptions() {
  return [
    { label: '旺季', value: 'peak_season', type: 'danger' as const },
    { label: '淡季', value: 'off_season', type: 'info' as const },
    { label: '周末', value: 'weekend', type: 'warning' as const },
    { label: '节假日', value: 'holiday', type: 'danger' as const },
    { label: '会员专享', value: 'member_exclusive', type: 'primary' as const },
    { label: '长住优惠', value: 'long_stay', type: 'success' as const },
    { label: '提前预订', value: 'advance_booking', type: 'success' as const }
  ]
}

function formatPriceDisplay(row: any) {
  if (row.discountRate && row.discountRate !== 100) {
    const adjustment = row.discountRate > 100 ? `+${row.discountRate - 100}` : `${row.discountRate - 100}`
    return `${adjustment}%`
  }
  if (row.basePrice) {
    return `¥${row.basePrice}`
  }
  return '-'
}

function formatStatus(row: any) {
  return row.isActive ? 'active' : 'inactive'
}

const timelineItems = computed(() => {
  if (!selectedStrategy.value) return []
  return generateTimelineItems(selectedStrategy.value)
})

const fullTimelineItems = computed(() => {
  if (!selectedStrategy.value) return []
  return generateTimelineItems(selectedStrategy.value, true)
})

function generateTimelineItems(strategy: PriceStrategy, full = false) {
  const items: Array<{
    timestamp: string
    title: string
    description: string
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    color: string
    weekdays?: number[]
    price?: number
    discountRate?: number
    minStay?: number
    priority?: number
  }> = []

  items.push({
    timestamp: strategy.startDate || '长期有效',
    title: '策略生效开始',
    description: `策略"${strategy.name}"开始生效`,
    type: 'success',
    color: '#67c23a',
    weekdays: strategy.weekdays,
    price: strategy.basePrice,
    discountRate: strategy.discountRate,
    minStay: strategy.minStay,
    priority: strategy.priority
  })

  if (strategy.weekendPrice && strategy.weekendPrice !== strategy.basePrice) {
    items.push({
      timestamp: '每周末',
      title: '周末价格调整',
      description: `周末价格调整为 ¥${strategy.weekendPrice}`,
      type: 'warning',
      color: '#e6a23c',
      weekdays: [5, 6],
      price: strategy.weekendPrice
    })
  }

  if (strategy.holidayPrice && strategy.holidayPrice !== strategy.basePrice) {
    items.push({
      timestamp: '节假日',
      title: '节假日价格调整',
      description: `节假日价格调整为 ¥${strategy.holidayPrice}`,
      type: 'danger',
      color: '#f56c6c',
      price: strategy.holidayPrice
    })
  }

  if (full && strategy.minStay && strategy.minStay > 1) {
    items.push({
      timestamp: '入住限制',
      title: '最少入住限制',
      description: `最少需入住 ${strategy.minStay} 晚`,
      type: 'info',
      color: '#909399',
      minStay: strategy.minStay
    })
  }

  if (full && strategy.maxStay && strategy.maxStay < 90) {
    items.push({
      timestamp: '入住限制',
      title: '最多入住限制',
      description: `最多可入住 ${strategy.maxStay} 晚`,
      type: 'info',
      color: '#909399'
    })
  }

  items.push({
    timestamp: strategy.endDate || '长期有效',
    title: '策略生效结束',
    description: `策略"${strategy.name}"结束生效`,
    type: 'info',
    color: '#909399'
  })

  return items
}

function formatWeekdays(weekdays: number[]) {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  if (weekdays.length === 7) return '每天'
  if (weekdays.length === 5 && weekdays.every(d => d >= 1 && d <= 5)) return '工作日'
  if (weekdays.length === 2 && weekdays.includes(5) && weekdays.includes(6)) return '周末'
  return weekdays.map(d => dayNames[d]).join('、')
}

const loadData = async () => {
  await withLoading(async () => {
    const query: PriceStrategyQuery = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const result = await priceStrategyApi.getList(query)
    strategies.value = result.list
    pagination.total = result.total
  }, {
    errorMessage: '加载价格策略失败',
    showMessage: true
  })
}

const loadRoomTypes = async () => {
  try {
    roomTypes.value = await roomTypeApi.getAll()
  } catch (error) {
    console.error('加载房型数据失败:', error)
  }
}

const handleSearch = (filters: Record<string, any>) => {
  const query: PriceStrategyQuery = {}
  if (filters.name) query.name = filters.name
  if (filters.roomTypeId) query.roomTypeId = filters.roomTypeId
  if (filters.status) query.status = filters.status
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  pagination.page = 1
  loadData()
}

const handlePaginationChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
  pagination.page = page
  pagination.pageSize = pageSize
  loadData()
}

const handleCreate = () => {
  isEdit.value = false
  formInitialData.value = undefined
  formDialogVisible.value = true
}

const handleEdit = (row: PriceStrategy) => {
  isEdit.value = true
  formInitialData.value = {
    id: row.id,
    roomTypeId: row.roomTypeId,
    name: row.name,
    dateRange: row.startDate && row.endDate ? [new Date(row.startDate), new Date(row.endDate)] : null,
    weekdays: row.weekdays || [1, 2, 3, 4, 5, 6, 0],
    basePrice: row.basePrice || 0,
    weekendPrice: row.weekendPrice || 0,
    holidayPrice: row.holidayPrice || 0,
    discountRate: row.discountRate || 100,
    minStay: row.minStay || 1,
    maxStay: row.maxStay || 30,
    priority: row.priority || 1,
    isActive: row.isActive,
    remarks: row.remarks || ''
  }
  formDialogVisible.value = true
}

const handleViewTimeline = (row: PriceStrategy) => {
  selectedStrategy.value = row
  timelineDialogVisible.value = true
}

const handleToggleStatus = async (row: PriceStrategy, val: boolean) => {
  try {
    await ElMessageBox.confirm(
      `确定要${val ? '启用' : '禁用'}策略"${row.name}"吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await priceStrategyApi.toggleStatus(row.id)
    ElMessage.success(`策略已${val ? '启用' : '禁用'}`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      row.isActive = !val
      ElMessage.error('状态变更失败')
    } else {
      row.isActive = !val
    }
  }
}

const handleDelete = async (row: PriceStrategy) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除策略"${row.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'danger',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await priceStrategyApi.remove(row.id)
    ElMessage.success('删除成功')
    if (selectedStrategy.value?.id === row.id) {
      selectedStrategy.value = null
    }
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!priceFormRef.value) return

  try {
    await priceFormRef.value.validate()
    const formData = priceFormRef.value.formData

    submitting.value = true

    const startDate = formData.dateRange && formData.dateRange[0]
      ? formData.dateRange[0].toISOString().split('T')[0]
      : null
    const endDate = formData.dateRange && formData.dateRange[1]
      ? formData.dateRange[1].toISOString().split('T')[0]
      : null

    const roomType = roomTypes.value.find(r => r.id === formData.roomTypeId)

    if (isEdit.value && formData.id) {
      await priceStrategyApi.update({
        id: formData.id,
        name: formData.name,
        roomTypeId: formData.roomTypeId,
        roomTypeName: roomType?.name || '',
        startDate: startDate || '',
        endDate: endDate || '',
        basePrice: formData.basePrice,
        weekendPrice: formData.weekendPrice,
        holidayPrice: formData.holidayPrice,
        minDays: formData.minStay,
        maxDays: formData.maxStay,
        discount: formData.discountRate,
        status: formData.isActive ? 'active' : 'inactive'
      })
      ElMessage.success('策略更新成功')
    } else {
      await priceStrategyApi.create({
        name: formData.name,
        roomTypeId: formData.roomTypeId,
        roomTypeName: roomType?.name || '',
        startDate: startDate || '',
        endDate: endDate || '',
        basePrice: formData.basePrice,
        weekendPrice: formData.weekendPrice,
        holidayPrice: formData.holidayPrice,
        minDays: formData.minStay,
        maxDays: formData.maxStay,
        discount: formData.discountRate,
        status: formData.isActive ? 'active' : 'inactive'
      })
      ElMessage.success('策略创建成功')
    }

    formDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleFormClose = () => {
  priceFormRef.value?.resetFields()
  formInitialData.value = undefined
}

watch(strategies, (newVal) => {
  if (newVal.length > 0 && !selectedStrategy.value) {
    selectedStrategy.value = newVal[0]
  }
}, { immediate: true })

onMounted(async () => {
  await loadRoomTypes()
  await loadData()
})
</script>

<style lang="scss" scoped>
.timeline-card {
  height: 600px;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .timeline-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .timeline-loading,
  .timeline-empty {
    height: 100%;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeline-content {
    padding: 8px 0;

    :deep(.el-timeline-item__timestamp) {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.timeline-item-card {
  margin-bottom: 8px;
  background-color: var(--el-fill-color-light);

  .item-title {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .item-desc {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.full-timeline {
  .strategy-name {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .strategy-desc {
    margin: 0 0 24px 0;
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 4px;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

@media (max-width: 992px) {
  .timeline-card {
    margin-top: 16px;
    height: auto;
    min-height: 400px;
  }
}
</style>
