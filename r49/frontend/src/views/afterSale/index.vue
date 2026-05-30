<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">售后处理</span>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="售后单号">
            <el-input v-model="queryForm.afterSaleNo" placeholder="请输入售后单号" clearable />
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="queryForm.orderNo" placeholder="请输入订单号" clearable />
          </el-form-item>
          <el-form-item label="用户名称">
            <el-input v-model="queryForm.userName" placeholder="请输入用户名称" clearable />
          </el-form-item>
          <el-form-item label="售后类型">
            <el-select v-model="queryForm.afterSaleType" placeholder="请选择" clearable>
              <el-option label="仅退款" :value="1" />
              <el-option label="退货退款" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="售后状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="待审核" :value="0" />
              <el-option label="审核通过" :value="1" />
              <el-option label="审核拒绝" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="申请时间">
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="afterSaleNo" label="售后单号" width="160" />
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="userName" label="用户" />
        <el-table-column prop="leaderName" label="团长" />
        <el-table-column prop="afterSaleType" label="售后类型" width="100">
          <template #default="{ row }">
            {{ afterSaleTypeText[row.afterSaleType] }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.refundAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              link
              size="small"
              @click="handleAudit(row)"
            >审核</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              size="small"
              @click="handleComplete(row)"
            >完成</el-button>
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="售后详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="afterSaleDetail" class="after-sale-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="售后单号">{{ afterSaleDetail.afterSaleNo }}</el-descriptions-item>
            <el-descriptions-item label="订单号">{{ afterSaleDetail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="用户">{{ afterSaleDetail.userName }}</el-descriptions-item>
            <el-descriptions-item label="团长">{{ afterSaleDetail.leaderName }}</el-descriptions-item>
            <el-descriptions-item label="售后类型">
              {{ afterSaleTypeText[afterSaleDetail.afterSaleType] }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[afterSaleDetail.status]" size="small">
                {{ statusText[afterSaleDetail.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款金额">
              <span class="text-red">¥{{ afterSaleDetail.refundAmount?.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ afterSaleDetail.applyTime }}</el-descriptions-item>
            <el-descriptions-item label="审核意见" v-if="afterSaleDetail.auditRemark">
              {{ afterSaleDetail.auditRemark }}
            </el-descriptions-item>
            <el-descriptions-item label="审核时间" v-if="afterSaleDetail.auditTime">
              {{ afterSaleDetail.auditTime }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>售后原因</h4>
          <div class="reason-content">{{ afterSaleDetail.reason || '-' }}</div>
        </div>

        <div class="detail-section">
          <h4>售后商品明细</h4>
          <el-table :data="afterSaleItems" border stripe>
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="specs" label="规格" width="120" />
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.unitPrice?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="refundAmount" label="退款金额" width="120">
              <template #default="{ row }">
                ¥{{ row.refundAmount?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="auditVisible"
      title="审核售后"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditResult">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAfterSalePage,
  getAfterSaleDetail,
  getAfterSaleItems,
  auditAfterSale,
  completeAfterSale
} from '@/api/afterSale'

const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const tableData = ref([])

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  afterSaleNo: '',
  orderNo: '',
  userName: '',
  afterSaleType: null,
  status: null,
  dateRange: []
})

const afterSaleTypeText = {
  1: '仅退款',
  2: '退货退款'
}

const statusType = {
  0: 'warning',
  1: 'primary',
  2: 'danger',
  3: 'success',
  4: 'info'
}

const statusText = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
  3: '已完成',
  4: '已取消'
}

const detailVisible = ref(false)
const auditVisible = ref(false)
const afterSaleDetail = ref(null)
const afterSaleItems = ref([])
const currentAfterSale = ref(null)

const auditForm = reactive({
  auditResult: 1,
  auditRemark: ''
})

async function getList() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange
    const res = await getAfterSalePage(params)
    tableData.value = res.data.records || res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取售后列表失败:', error)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.pageNum = 1
  queryForm.pageSize = 10
  queryForm.afterSaleNo = ''
  queryForm.orderNo = ''
  queryForm.userName = ''
  queryForm.afterSaleType = null
  queryForm.status = null
  queryForm.dateRange = []
  getList()
}

function handleSizeChange() {
  queryForm.pageNum = 1
  getList()
}

function handleCurrentChange() {
  getList()
}

async function handleViewDetail(row) {
  try {
    const [detailRes, itemsRes] = await Promise.all([
      getAfterSaleDetail(row.id),
      getAfterSaleItems(row.id)
    ])
    afterSaleDetail.value = detailRes.data
    afterSaleItems.value = itemsRes.data || []
    detailVisible.value = true
  } catch (error) {
    console.error('获取售后详情失败:', error)
  }
}

function handleAudit(row) {
  currentAfterSale.value = row
  auditForm.auditResult = 1
  auditForm.auditRemark = ''
  auditVisible.value = true
}

async function confirmAudit() {
  if (auditForm.auditResult === 2 && !auditForm.auditRemark.trim()) {
    ElMessage.warning('拒绝时请填写审核意见')
    return
  }
  submitting.value = true
  try {
    await auditAfterSale(currentAfterSale.value.id, {
      auditResult: auditForm.auditResult,
      auditRemark: auditForm.auditRemark
    })
    ElMessage.success('审核成功')
    auditVisible.value = false
    getList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    submitting.value = false
  }
}

async function handleComplete(row) {
  ElMessageBox.confirm('确定要完成该售后并执行退款操作吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await completeAfterSale(row.id)
      ElMessage.success('售后完成，退款已执行')
      getList()
    } catch (error) {
      console.error('完成售后失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
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
}

.after-sale-detail {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .reason-content {
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #606266;
    }
  }
}

.text-red {
  color: #f56c6c;
  font-weight: 600;
}
</style>
