<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Refresh, Download, View } from '@element-plus/icons-vue'
import { getOrderList } from '../../api/order'
import type { Order, OrderParams, OrderStatus } from '../../types'
import { useTable } from '../../hooks/useTable'
import { useExport } from '../../hooks/useExport'

const filterForm = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: ''
})

const statusOptions = [
  { label: '充电中', value: 'charging' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '异常', value: 'exception' }
]

const {
  loading,
  data: orderList,
  total,
  params,
  fetchData,
  handleSizeChange,
  handleCurrentChange,
  updateParams
} = useTable<Order, OrderParams>({
  apiFn: getOrderList
})

const { exporting, handleExport } = useExport<Order>(
  [
    { key: 'orderNo', title: '订单编号' },
    { key: 'stationName', title: '充电站' },
    { key: 'deviceName', title: '充电桩' },
    { key: 'userName', title: '用户' },
    { key: 'startTime', title: '开始时间' },
    { key: 'duration', title: '充电时长(分钟)' },
    { key: 'electricity', title: '充电量(kWh)' },
    { key: 'amount', title: '金额(元)' },
    { key: 'status', title: '状态', format: (v: OrderStatus) => {
      const map: Record<OrderStatus, string> = {
        charging: '充电中',
        completed: '已完成',
        cancelled: '已取消',
        exception: '异常'
      }
      return map[v]
    }}
  ],
  `订单列表_${new Date().toLocaleDateString()}.xlsx`
)

const drawerVisible = ref(false)
const currentOrder = ref<Order | null>(null)

function handleSearch() {
  updateParams({
    keyword: filterForm.keyword,
    status: filterForm.status as OrderStatus,
    startDate: filterForm.startDate,
    endDate: filterForm.endDate
  } as any)
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.startDate = ''
  filterForm.endDate = ''
  updateParams({ keyword: '', status: undefined, startDate: '', endDate: '' } as any)
}

function openDetail(row: Order) {
  currentOrder.value = row
  drawerVisible.value = true
}

function getStatusClass(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    charging: 'status-charging',
    completed: 'status-idle',
    cancelled: 'status-offline',
    exception: 'status-fault'
  }
  return map[status]
}

function getStatusText(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    charging: '充电中',
    completed: '已完成',
    cancelled: '已取消',
    exception: '异常'
  }
  return map[status]
}

function getPayStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    refunded: '已退款'
  }
  return map[status] || status
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">订单查询</h2>
      <el-button :icon="Download" @click="handleExport(orderList)" :loading="exporting">
        导出订单
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">关键词:</span>
        <el-input
          v-model="filterForm.keyword"
          placeholder="订单号/用户/设备"
          clearable
          style="width: 200px"
        />
      </div>
      <div class="filter-item">
        <span class="filter-label">状态:</span>
        <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">日期:</span>
        <el-date-picker
          v-model="filterForm.startDate"
          type="date"
          placeholder="开始日期"
          style="width: 140px"
        />
        <span style="padding: 0 8px;">至</span>
        <el-date-picker
          v-model="filterForm.endDate"
          type="date"
          placeholder="结束日期"
          style="width: 140px"
        />
      </div>
      <div class="filter-item">
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="table-info">共 {{ total }} 条记录</div>
      </div>

      <el-table
        :data="orderList"
        v-loading="loading"
        stripe
        border
      >
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="stationName" label="充电站" min-width="160" />
        <el-table-column prop="deviceName" label="充电桩" width="160" />
        <el-table-column prop="userName" label="用户" width="100" />
        <el-table-column label="电量(SOC)" width="120" align="center">
          <template #default="{ row }">
            {{ row.startSoc }}% → {{ row.endSoc || '-' }}%
          </template>
        </el-table-column>
        <el-table-column label="充电时长" width="100" align="center">
          <template #default="{ row }">{{ row.duration || '-' }}分钟</template>
        </el-table-column>
        <el-table-column label="充电量" width="100" align="center">
          <template #default="{ row }">{{ row.electricity.toFixed(2) }}kWh</template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="center">
          <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :class="getStatusClass(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.payStatus === 'paid' ? 'success' : row.payStatus === 'refunded' ? 'info' : 'warning'"
              size="small"
            >
              {{ getPayStatusText(row.payStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="params.page"
          v-model:page-size="params.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      title="订单详情"
      size="500px"
      :before-close="() => drawerVisible = false"
    >
      <el-descriptions :column="1" border v-if="currentOrder">
        <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="充电站">{{ currentOrder.stationName }}</el-descriptions-item>
        <el-descriptions-item label="充电桩">{{ currentOrder.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="充电用户">{{ currentOrder.userName }}</el-descriptions-item>
        <el-descriptions-item label="开始SOC">{{ currentOrder.startSoc }}%</el-descriptions-item>
        <el-descriptions-item label="结束SOC">{{ currentOrder.endSoc || '-' }}%</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentOrder.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ currentOrder.endTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="充电时长">{{ currentOrder.duration || '-' }} 分钟</el-descriptions-item>
        <el-descriptions-item label="充电量">{{ currentOrder.electricity.toFixed(2) }} kWh</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ currentOrder.amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :class="getStatusClass(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag
            :type="currentOrder.payStatus === 'paid' ? 'success' : currentOrder.payStatus === 'refunded' ? 'info' : 'warning'"
            size="small"
          >
            {{ getPayStatusText(currentOrder.payStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
