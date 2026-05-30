<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">分拣看板</span>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            生成分拣单
          </el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="分拣单号">
            <el-input v-model="queryForm.sortNo" placeholder="请输入分拣单号" clearable />
          </el-form-item>
          <el-form-item label="活动名称">
            <el-input v-model="queryForm.activityName" placeholder="请输入活动名称" clearable />
          </el-form-item>
          <el-form-item label="分拣状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="待打印" :value="0" />
              <el-option label="待分拣" :value="1" />
              <el-option label="分拣中" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="getSortList">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="sortNo" label="分拣单号" width="160" />
        <el-table-column prop="activityName" label="活动名称" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column prop="totalQuantity" label="商品总数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="printTime" label="打印时间" width="160" />
        <el-table-column prop="sortStartTime" label="开始时间" width="160" />
        <el-table-column prop="sortEndTime" label="完成时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              link
              size="small"
              @click="handlePrint(row)"
            >打印</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              size="small"
              @click="handleStart(row)"
            >开始分拣</el-button>
            <el-button
              v-if="row.status === 2"
              type="primary"
              link
              size="small"
              @click="openCompleteDialog(row)"
            >完成分拣</el-button>
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
      title="生成分拣单"
      width="600px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="选择活动" prop="activityId">
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
        <el-form-item v-if="selectedActivity" label="活动名称">
          <span>{{ selectedActivity.activityName }}</span>
        </el-form-item>
        <el-form-item v-if="selectedActivity" label="开始时间">
          <span>{{ selectedActivity.startTime }}</span>
        </el-form-item>
        <el-form-item v-if="selectedActivity" label="结束时间">
          <span>{{ selectedActivity.endTime }}</span>
        </el-form-item>
        <el-form-item v-if="selectedActivity" label="订单数">
          <span>{{ selectedActivity.orderCount || 0 }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">生成分拣单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="分拣详情"
      width="900px"
    >
      <el-descriptions :column="3" border v-if="sortDetail">
        <el-descriptions-item label="分拣单号">{{ sortDetail.sortNo }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ sortDetail.activityName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType[sortDetail.status]" size="small">
            {{ statusText[sortDetail.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单数">{{ sortDetail.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="商品总数">{{ sortDetail.totalQuantity }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ sortDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="打印时间">{{ sortDetail.printTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ sortDetail.sortStartTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ sortDetail.sortEndTime || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">分拣明细</el-divider>
      <el-table :data="sortItemList" border stripe v-loading="detailLoading">
        <el-table-column prop="skuName" label="商品名称" />
        <el-table-column prop="skuCode" label="商品编码" width="120" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="planQuantity" label="计划数量" width="100" align="center" />
        <el-table-column prop="actualQuantity" label="实际数量" width="100" align="center" />
        <el-table-column label="差异" width="80" align="center">
          <template #default="{ row }">
            <span :class="row.diffQuantity > 0 ? 'text-danger' : row.diffQuantity < 0 ? 'text-warning' : ''">
              {{ row.diffQuantity || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="diffReason" label="差异原因" />
      </el-table>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="completeDialogVisible"
      title="完成分拣"
      width="900px"
      @close="resetCompleteForm"
    >
      <el-alert
        title="请录入实际分拣数量，如有差异请填写差异原因"
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
              :precision="0"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="差异" width="80" align="center">
          <template #default="{ row }">
            <span :class="(row.actualQuantity - row.planQuantity) > 0 ? 'text-danger' : (row.actualQuantity - row.planQuantity) < 0 ? 'text-warning' : ''">
              {{ row.actualQuantity - row.planQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="差异原因">
          <template #default="{ row }">
            <el-input
              v-model="row.diffReason"
              placeholder="如有差异请填写原因"
              :disabled="row.actualQuantity === row.planQuantity"
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
  getSortPage,
  getSortDetail,
  createSort,
  printSort,
  startSort,
  completeSort,
  getSortItemList
} from '@/api/sort'
import { getActivityPage } from '@/api/activity'

const loading = ref(false)
const createLoading = ref(false)
const completeLoading = ref(false)
const detailLoading = ref(false)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  sortNo: '',
  activityName: '',
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
  0: '待打印',
  1: '待分拣',
  2: '分拣中',
  3: '已完成',
  4: '已取消'
}

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  activityId: null
})

const createRules = {
  activityId: [{ required: true, message: '请选择活动', trigger: 'change' }]
}

const activityList = ref([])
const selectedActivity = computed(() => {
  return activityList.value.find(item => item.id === createForm.activityId) || null
})

const detailDialogVisible = ref(false)
const sortDetail = ref(null)
const sortItemList = ref([])

const completeDialogVisible = ref(false)
const currentSortId = ref(null)
const completeItemList = ref([])

function getSortList() {
  loading.value = true
  getSortPage(queryForm)
    .then(res => {
      tableData.value = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function resetQuery() {
  queryForm.sortNo = ''
  queryForm.activityName = ''
  queryForm.status = null
  queryForm.pageNum = 1
  getSortList()
}

function handlePageChange(page) {
  queryForm.pageNum = page
  getSortList()
}

function handleSizeChange(size) {
  queryForm.pageSize = size
  queryForm.pageNum = 1
  getSortList()
}

function getActivityList() {
  getActivityPage({ pageNum: 1, pageSize: 100, status: 1 })
    .then(res => {
      activityList.value = res.data.records || res.data.list || []
    })
}

function openCreateDialog() {
  getActivityList()
  createDialogVisible.value = true
}

function resetCreateForm() {
  createForm.activityId = null
  createFormRef.value?.resetFields()
}

function handleActivityChange() {
}

function handleCreate() {
  createFormRef.value.validate(valid => {
    if (valid) {
      createLoading.value = true
      createSort(createForm)
        .then(() => {
          ElMessage.success('分拣单创建成功')
          createDialogVisible.value = false
          getSortList()
        })
        .finally(() => {
          createLoading.value = false
        })
    }
  })
}

function handlePrint(row) {
  ElMessageBox.confirm('确认打印该分拣单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    printSort(row.id)
      .then(() => {
        ElMessage.success('打印成功')
        getSortList()
      })
  }).catch(() => {})
}

function handleStart(row) {
  ElMessageBox.confirm('确认开始分拣吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    startSort(row.id)
      .then(() => {
        ElMessage.success('已开始分拣')
        getSortList()
      })
  }).catch(() => {})
}

function viewDetail(row) {
  detailLoading.value = true
  Promise.all([
    getSortDetail(row.id),
    getSortItemList(row.id)
  ]).then(([detailRes, itemRes]) => {
    sortDetail.value = detailRes.data
    sortItemList.value = itemRes.data || []
    detailDialogVisible.value = true
  }).finally(() => {
    detailLoading.value = false
  })
}

function openCompleteDialog(row) {
  currentSortId.value = row.id
  detailLoading.value = true
  getSortItemList(row.id)
    .then(res => {
      completeItemList.value = (res.data || []).map(item => ({
        ...item,
        actualQuantity: item.planQuantity,
        diffReason: ''
      }))
      completeDialogVisible.value = true
    })
    .finally(() => {
      detailLoading.value = false
    })
}

function resetCompleteForm() {
  currentSortId.value = null
  completeItemList.value = []
}

function handleComplete() {
  const hasDiffWithoutReason = completeItemList.value.some(
    item => item.actualQuantity !== item.planQuantity && !item.diffReason
  )

  if (hasDiffWithoutReason) {
    ElMessage.warning('存在差异的商品请填写差异原因')
    return
  }

  const items = completeItemList.value.map(item => ({
    id: item.id,
    actualQuantity: item.actualQuantity,
    diffReason: item.diffReason
  }))

  completeLoading.value = true
  completeSort(currentSortId.value, items)
    .then(() => {
      ElMessage.success('分拣完成')
      completeDialogVisible.value = false
      getSortList()
    })
    .finally(() => {
      completeLoading.value = false
    })
}

onMounted(() => {
  getSortList()
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
