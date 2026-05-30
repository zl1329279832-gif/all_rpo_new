<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">配送进度</span>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            创建配送单
          </el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="配送单号">
            <el-input v-model="queryForm.deliveryNo" placeholder="请输入配送单号" clearable />
          </el-form-item>
          <el-form-item label="配送线路">
            <el-input v-model="queryForm.routeName" placeholder="请输入线路名称" clearable />
          </el-form-item>
          <el-form-item label="司机">
            <el-input v-model="queryForm.driverName" placeholder="请输入司机姓名" clearable />
          </el-form-item>
          <el-form-item label="配送状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="待发货" :value="0" />
              <el-option label="配送中" :value="1" />
              <el-option label="已到达" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="getDeliveryList">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="deliveryNo" label="配送单号" width="160" />
        <el-table-column prop="routeName" label="配送线路" />
        <el-table-column prop="driverName" label="司机" width="100" />
        <el-table-column prop="driverPhone" label="联系电话" width="130" />
        <el-table-column prop="activityName" label="活动名称" />
        <el-table-column prop="sortNo" label="分拣单号" width="160" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="departTime" label="发车时间" width="160" />
        <el-table-column prop="arriveTime" label="到达时间" width="160" />
        <el-table-column prop="completeTime" label="完成时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              type="warning"
              link
              size="small"
              @click="handleDepart(row)"
            >发车</el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              link
              size="small"
              @click="handleArrive(row)"
            >到达</el-button>
            <el-button
              v-if="row.status === 2"
              type="primary"
              link
              size="small"
              @click="openCompleteDialog(row)"
            >完成配送</el-button>
            <el-button
              v-if="row.status === 0"
              type="danger"
              link
              size="small"
              @click="handleCancel(row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      title="创建配送单"
      width="700px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="配送线路" prop="routeId">
          <el-select
            v-model="createForm.routeId"
            placeholder="请选择配送线路"
            style="width: 100%"
            filterable
            @change="handleRouteChange"
          >
            <el-option
              v-for="item in routeList"
              :key="item.id"
              :label="item.routeName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedRoute" label="线路详情">
          <span>{{ selectedRoute.routeName }} - {{ selectedRoute.remark || '暂无描述' }}</span>
        </el-form-item>
        <el-form-item label="司机" prop="driverId">
          <el-select
            v-model="createForm.driverId"
            placeholder="请选择司机"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="item in driverList"
              :key="item.id"
              :label="`${item.driverName} (${item.driverPhone})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联活动" prop="activityId">
          <el-select
            v-model="createForm.activityId"
            placeholder="请选择活动"
            style="width: 100%"
            filterable
            @change="handleActivityChange"
          >
            <el-option
              v-for="item in activityList"
              :key="item.id"
              :label="item.activityName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联分拣单" prop="sortId">
          <el-select
            v-model="createForm.sortId"
            placeholder="请选择分拣单"
            style="width: 100%"
            filterable
            :disabled="!createForm.activityId"
          >
            <el-option
              v-for="item in sortList"
              :key="item.id"
              :label="`${item.sortNo} (${statusText[item.status]})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedSort" label="分拣单信息">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="分拣单号">{{ selectedSort.sortNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[selectedSort.status]" size="small">
                {{ statusText[selectedSort.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单数">{{ selectedSort.orderCount }}</el-descriptions-item>
            <el-descriptions-item label="商品总数">{{ selectedSort.totalQuantity }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">创建配送单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="配送详情"
      width="900px"
    >
      <el-descriptions :column="3" border v-if="deliveryDetail">
        <el-descriptions-item label="配送单号">{{ deliveryDetail.deliveryNo }}</el-descriptions-item>
        <el-descriptions-item label="配送线路">{{ deliveryDetail.routeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType[deliveryDetail.status]" size="small">
            {{ statusText[deliveryDetail.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="司机">{{ deliveryDetail.driverName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ deliveryDetail.driverPhone }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ deliveryDetail.activityName }}</el-descriptions-item>
        <el-descriptions-item label="分拣单号">{{ deliveryDetail.sortNo }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ deliveryDetail.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ deliveryDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="发车时间">{{ deliveryDetail.departTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="到达时间">{{ deliveryDetail.arriveTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ deliveryDetail.completeTime || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">配送明细</el-divider>
      <el-table :data="deliveryItemList" border stripe v-loading="detailLoading">
        <el-table-column prop="skuName" label="商品名称" />
        <el-table-column prop="skuCode" label="商品编码" width="120" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="planQuantity" label="计划数量" width="100" align="center" />
        <el-table-column prop="actualQuantity" label="实际数量" width="100" align="center" />
        <el-table-column prop="shortageQuantity" label="缺货数量" width="100" align="center">
          <template #default="{ row }">
            <span class="text-danger">{{ row.shortageQuantity || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shortageReason" label="缺货原因" />
      </el-table>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="completeDialogVisible"
      title="完成配送"
      width="900px"
      @close="resetCompleteForm"
    >
      <el-alert
        title="请录入实际配送数量，如有缺货请填写缺货数量和原因"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />
      <el-table :data="completeItemList" border stripe>
        <el-table-column prop="skuName" label="商品名称" />
        <el-table-column prop="skuCode" label="商品编码" width="120" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="planQuantity" label="计划数量" width="100" align="center" />
        <el-table-column label="实际数量" width="150" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.actualQuantity"
              :min="0"
              :max="row.planQuantity"
              :precision="0"
              style="width: 100%"
              @change="handleActualQuantityChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="缺货数量" width="100" align="center">
          <template #default="{ row }">
            <span class="text-danger">{{ row.shortageQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="缺货原因">
          <template #default="{ row }">
            <el-input
              v-model="row.shortageReason"
              placeholder="如有缺货请填写原因"
              :disabled="row.shortageQuantity === 0"
            />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeLoading" @click="handleComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDeliveryPage,
  getDeliveryDetail,
  createDelivery,
  departDelivery,
  arriveDelivery,
  completeDelivery,
  getDeliveryItemList,
  getRouteList,
  cancelDelivery
} from '@/api/delivery'
import { getActivityPage } from '@/api/activity'
import { getSortPage } from '@/api/sort'

const loading = ref(false)
const createLoading = ref(false)
const completeLoading = ref(false)
const detailLoading = ref(false)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  deliveryNo: '',
  routeName: '',
  driverName: '',
  status: null
})

const total = ref(0)
const tableData = ref([])

const statusType = {
  0: 'info',
  1: 'warning',
  2: 'primary',
  3: 'success',
  4: 'danger'
}

const statusText = {
  0: '待发货',
  1: '配送中',
  2: '已到达',
  3: '已完成',
  4: '已取消'
}

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  routeId: null,
  driverId: null,
  activityId: null,
  sortId: null
})

const createRules = {
  routeId: [{ required: true, message: '请选择配送线路', trigger: 'change' }],
  driverId: [{ required: true, message: '请选择司机', trigger: 'change' }],
  activityId: [{ required: true, message: '请选择活动', trigger: 'change' }],
  sortId: [{ required: true, message: '请选择分拣单', trigger: 'change' }]
}

const routeList = ref([])
const driverList = ref([
  { id: 1, driverName: '张三', driverPhone: '13800138001' },
  { id: 2, driverName: '李四', driverPhone: '13800138002' },
  { id: 3, driverName: '王五', driverPhone: '13800138003' }
])
const activityList = ref([])
const sortList = ref([])

const selectedRoute = computed(() => {
  return routeList.value.find(item => item.id === createForm.routeId) || null
})

const selectedSort = computed(() => {
  return sortList.value.find(item => item.id === createForm.sortId) || null
})

const detailDialogVisible = ref(false)
const deliveryDetail = ref(null)
const deliveryItemList = ref([])

const completeDialogVisible = ref(false)
const currentDeliveryId = ref(null)
const completeItemList = ref([])

function getDeliveryList() {
  loading.value = true
  getDeliveryPage(queryForm)
    .then(res => {
      tableData.value = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function resetQuery() {
  queryForm.deliveryNo = ''
  queryForm.routeName = ''
  queryForm.driverName = ''
  queryForm.status = null
  queryForm.pageNum = 1
  getDeliveryList()
}

function handlePageChange(page) {
  queryForm.pageNum = page
  getDeliveryList()
}

function handleSizeChange(size) {
  queryForm.pageSize = size
  queryForm.pageNum = 1
  getDeliveryList()
}

function loadRouteList() {
  getRouteList()
    .then(res => {
      routeList.value = res.data || []
    })
}

function loadActivityList() {
  getActivityPage({ pageNum: 1, pageSize: 100, status: 1 })
    .then(res => {
      activityList.value = res.data.records || res.data.list || []
    })
}

function openCreateDialog() {
  loadRouteList()
  loadActivityList()
  createDialogVisible.value = true
}

function resetCreateForm() {
  createForm.routeId = null
  createForm.driverId = null
  createForm.activityId = null
  createForm.sortId = null
  sortList.value = []
  createFormRef.value?.resetFields()
}

function handleRouteChange() {
}

function handleActivityChange() {
  createForm.sortId = null
  if (createForm.activityId) {
    getSortPage({ pageNum: 1, pageSize: 100, activityId: createForm.activityId })
      .then(res => {
        sortList.value = (res.data.records || res.data.list || []).filter(
          item => item.status === 3 || item.status === 1
        )
      })
  } else {
    sortList.value = []
  }
}

function handleCreate() {
  createFormRef.value.validate(valid => {
    if (valid) {
      createLoading.value = true
      createDelivery(createForm)
        .then(() => {
          ElMessage.success('配送单创建成功')
          createDialogVisible.value = false
          getDeliveryList()
        })
        .finally(() => {
          createLoading.value = false
        })
    }
  })
}

function handleDepart(row) {
  ElMessageBox.confirm('确认发车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    departDelivery(row.id)
      .then(() => {
        ElMessage.success('已发车')
        getDeliveryList()
      })
  }).catch(() => {})
}

function handleArrive(row) {
  ElMessageBox.confirm('确认已到达目的地吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    arriveDelivery(row.id)
      .then(() => {
        ElMessage.success('已确认到达')
        getDeliveryList()
      })
  }).catch(() => {})
}

function handleCancel(row) {
  ElMessageBox.confirm('确认取消该配送单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    cancelDelivery(row.id)
      .then(() => {
        ElMessage.success('已取消')
        getDeliveryList()
      })
  }).catch(() => {})
}

function viewDetail(row) {
  detailLoading.value = true
  Promise.all([
    getDeliveryDetail(row.id),
    getDeliveryItemList(row.id)
  ]).then(([detailRes, itemRes]) => {
    deliveryDetail.value = detailRes.data
    deliveryItemList.value = itemRes.data || []
    detailDialogVisible.value = true
  }).finally(() => {
    detailLoading.value = false
  })
}

function openCompleteDialog(row) {
  currentDeliveryId.value = row.id
  detailLoading.value = true
  getDeliveryItemList(row.id)
    .then(res => {
      completeItemList.value = (res.data || []).map(item => ({
        ...item,
        actualQuantity: item.planQuantity,
        shortageQuantity: 0,
        shortageReason: ''
      }))
      completeDialogVisible.value = true
    })
    .finally(() => {
      detailLoading.value = false
    })
}

function handleActualQuantityChange(row) {
  row.shortageQuantity = row.planQuantity - row.actualQuantity
  if (row.shortageQuantity === 0) {
    row.shortageReason = ''
  }
}

function resetCompleteForm() {
  currentDeliveryId.value = null
  completeItemList.value = []
}

function handleComplete() {
  const hasShortageWithoutReason = completeItemList.value.some(
    item => item.shortageQuantity > 0 && !item.shortageReason
  )

  if (hasShortageWithoutReason) {
    ElMessage.warning('存在缺货的商品请填写缺货原因')
    return
  }

  const items = completeItemList.value.map(item => ({
    id: item.id,
    actualQuantity: item.actualQuantity,
    shortageQuantity: item.shortageQuantity,
    shortageReason: item.shortageReason
  }))

  completeLoading.value = true
  completeDelivery(currentDeliveryId.value, items)
    .then(() => {
      ElMessage.success('配送完成')
      completeDialogVisible.value = false
      getDeliveryList()
    })
    .finally(() => {
      completeLoading.value = false
    })
}

onMounted(() => {
  getDeliveryList()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    text-align: right;
  }

  .text-danger {
    color: #f56c6c;
  }

  .text-warning {
    color: #e6a23c;
  }
}
</style>
