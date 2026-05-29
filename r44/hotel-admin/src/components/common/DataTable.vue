<template>
  <div class="data-table">
    <el-card shadow="never" class="table-card">
      <div v-if="$slots.header || title" class="table-header">
        <div v-if="title" class="table-title">{{ title }}</div>
        <div v-if="$slots.header" class="table-actions">
          <slot name="header" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        :height="height"
        :stripe="stripe"
        :border="border"
        :selection="showSelection"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @current-change="handleCurrentChange"
        element-loading-text="加载中..."
      >
        <el-table-column
          v-if="showSelection"
          type="selection"
          width="50"
          align="center"
          reserve-selection
        />

        <el-table-column
          v-if="showIndex"
          type="index"
          label="序号"
          width="60"
          align="center"
          :index="getIndex"
        />

        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :align="column.align || 'left'"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :show-overflow-tooltip="column.tooltip !== false"
          :formatter="column.formatter"
        >
          <template #default="{ row }" v-if="column.type === 'tag'">
            <el-tag
              :type="getTagType(row[column.prop], column.tagOptions)"
              effect="light"
            >
              {{ getTagLabel(row[column.prop], column.tagOptions) }}
            </el-tag>
          </template>

          <template #default="{ row }" v-else-if="column.type === 'status'">
            <el-tag
              :type="getStatusType(row[column.prop])"
              effect="light"
            >
              {{ getStatusLabel(row[column.prop]) }}
            </el-tag>
          </template>

          <template #default="{ row }" v-else-if="column.type === 'date'">
            {{ formatDate(row[column.prop]) }}
          </template>

          <template #default="{ row }" v-else-if="column.type === 'money'">
            ¥{{ formatMoney(row[column.prop]) }}
          </template>

          <template #default="{ row }" v-else-if="column.slot">
            <slot :name="column.slot" :row="row" />
          </template>
        </el-table-column>

        <el-table-column
          v-if="showActions"
          label="操作"
          :width="actionsWidth"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <slot name="actions" :row="row" />
          </template>
        </el-table-column>
      </el-table>

      <div v-if="showPagination" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pageSizes"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :background="true"
          @size-change="handleSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TagOption {
  label: string
  value: string | number
  type?: 'success' | 'warning' | 'info' | 'danger' | 'primary'
}

interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right' | boolean
  sortable?: boolean | 'custom'
  tooltip?: boolean
  type?: 'tag' | 'status' | 'date' | 'money'
  slot?: string
  tagOptions?: TagOption[]
  formatter?: (row: any, column: any, value: any) => string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

const props = defineProps<{
  title?: string
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  height?: string | number
  stripe?: boolean
  border?: boolean
  showSelection?: boolean
  showIndex?: boolean
  showActions?: boolean
  showPagination?: boolean
  actionsWidth?: number | string
  pagination: Pagination
  pageSizes?: number[]
}>()

const emit = defineEmits<{
  'selection-change': [selection: any[]]
  'sort-change': [{ prop: string; order: string }]
  'current-change': [row: any]
  'pagination-change': [{ page: number; pageSize: number }]
}>()

const tableData = computed(() => props.data)

const getIndex = (index: number) => {
  return (props.pagination.page - 1) * props.pagination.pageSize + index + 1
}

const getTagLabel = (value: any, options?: TagOption[]) => {
  if (!options) return value
  const option = options.find(o => o.value === value)
  return option ? option.label : value
}

const getTagType = (value: any, options?: TagOption[]) => {
  if (!options) return 'info'
  const option = options.find(o => o.value === value)
  return option?.type || 'info'
}

const statusTypeMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  normal: 'success',
  active: 'success',
  confirmed: 'primary',
  checkedIn: 'success',
  checkedOut: 'info',
  pending: 'warning',
  processing: 'warning',
  resolved: 'success',
  closed: 'info',
  cancelled: 'danger',
  unpaid: 'warning',
  partial: 'primary',
  paid: 'success',
  refunded: 'info',
  full: 'danger',
  maintenance: 'warning',
  noShow: 'danger'
}

const statusLabelMap: Record<string, string> = {
  normal: '正常',
  active: '启用',
  confirmed: '已确认',
  checkedIn: '已入住',
  checkedOut: '已退房',
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  cancelled: '已取消',
  unpaid: '未支付',
  partial: '部分支付',
  paid: '已支付',
  refunded: '已退款',
  full: '满房',
  maintenance: '维护中',
  noShow: '未入住'
}

const getStatusType = (status: string) => {
  return statusTypeMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  return statusLabelMap[status] || status
}

const formatDate = (dateStr: string) => {
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

const formatMoney = (value: number) => {
  if (value === null || value === undefined) return '0.00'
  return value.toFixed(2)
}

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  emit('sort-change', { prop, order })
}

const handleCurrentChange = (row: any) => {
  emit('current-change', row)
}

const handleSizeChange = (size: number) => {
  emit('pagination-change', { page: 1, pageSize: size })
}

const handleCurrentPageChange = (page: number) => {
  emit('pagination-change', { page, pageSize: props.pagination.pageSize })
}
</script>

<style lang="scss" scoped>
.data-table {
  .table-card {
    background-color: var(--el-bg-color);
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 0;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .table-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .table-actions {
        display: flex;
        gap: 12px;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}

@media (max-width: 768px) {
  .data-table {
    .table-card {
      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;

        .table-actions {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 4px;
        }
      }

      .pagination-container {
        padding: 12px 16px;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;

        :deep(.el-pagination) {
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }
}
</style>
