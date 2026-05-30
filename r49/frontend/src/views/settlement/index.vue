<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">团长结算</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            创建结算单
          </el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="结算单号">
            <el-input v-model="queryForm.settlementNo" placeholder="请输入结算单号" clearable />
          </el-form-item>
          <el-form-item label="团长名称">
            <el-input v-model="queryForm.leaderName" placeholder="请输入团长名称" clearable />
          </el-form-item>
          <el-form-item label="结算状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="待审核" :value="0" />
              <el-option label="审核通过" :value="1" />
              <el-option label="审核拒绝" :value="2" />
              <el-option label="已结算" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
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
        <el-table-column prop="settlementNo" label="结算单号" width="160" />
        <el-table-column prop="leaderName" label="团长" />
        <el-table-column prop="period" label="周期" width="200" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column prop="commissionTotal" label="佣金总额" width="120">
          <template #default="{ row }">
            <span class="text-red">¥{{ row.commissionTotal?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
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
            >打款</el-button>
            <el-button
              v-if="row.status === 3"
              type="info"
              link
              size="small"
              @click="handleExport(row)"
            >导出</el-button>
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
      v-model="createVisible"
      title="创建结算单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择团长" required>
          <el-select
            v-model="createForm.leaderId"
            placeholder="请选择团长"
            style="width: 100%"
            @change="handleLeaderChange"
          >
            <el-option
              v-for="leader in leaderList"
              :key="leader.id"
              :label="leader.name"
              :value="leader.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="结算周期" required>
          <el-date-picker
            v-model="createForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handlePeriodChange"
          />
        </el-form-item>
        <el-form-item v-if="previewData" label="预计信息">
          <div class="preview-info">
            <p>订单数：<span>{{ previewData.orderCount }}</span></p>
            <p>佣金总额：<span class="text-red">¥{{ previewData.commissionTotal?.toFixed(2) }}</span></p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmCreate">确定创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="结算详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="settlementDetail" class="settlement-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="结算单号">{{ settlementDetail.settlementNo }}</el-descriptions-item>
            <el-descriptions-item label="团长">{{ settlementDetail.leaderName }}</el-descriptions-item>
            <el-descriptions-item label="结算周期">{{ settlementDetail.period }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[settlementDetail.status]" size="small">
                {{ statusText[settlementDetail.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单数">{{ settlementDetail.orderCount }}</el-descriptions-item>
            <el-descriptions-item label="佣金总额">
              <span class="text-red">¥{{ settlementDetail.commissionTotal?.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ settlementDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="审核意见" v-if="settlementDetail.auditRemark">
              {{ settlementDetail.auditRemark }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>结算明细</h4>
          <el-table :data="settlementItems" border stripe>
            <el-table-column prop="orderNo" label="订单号" width="160" />
            <el-table-column prop="goodsName" label="商品" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="orderAmount" label="订单金额" width="120">
              <template #default="{ row }">
                ¥{{ row.orderAmount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金" width="120">
              <template #default="{ row }">
                ¥{{ row.commission?.toFixed(2) }}
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
      title="审核结算单"
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
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSettlementPage,
  getSettlementDetail,
  getSettlementItems,
  createSettlement,
  auditSettlement,
  completeSettlement,
  exportSettlement,
  getLeaderList,
  getUnsettledOrders
} from '@/api/settlement'

const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const tableData = ref([])
const leaderList = ref([])
const previewData = ref(null)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  settlementNo: '',
  leaderName: '',
  status: null,
  dateRange: []
})

const statusType = {
  0: 'warning',
  1: 'primary',
  2: 'danger',
  3: 'success'
}

const statusText = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
  3: '已结算'
}

const createVisible = ref(false)
const detailVisible = ref(false)
const auditVisible = ref(false)
const settlementDetail = ref(null)
const settlementItems = ref([])
const currentSettlement = ref(null)

const createForm = reactive({
  leaderId: null,
  dateRange: []
})

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
    const res = await getSettlementPage(params)
    tableData.value = res.data.records || res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取结算列表失败:', error)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.pageNum = 1
  queryForm.pageSize = 10
  queryForm.settlementNo = ''
  queryForm.leaderName = ''
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

async function loadLeaderList() {
  try {
    const res = await getLeaderList()
    leaderList.value = res.data || []
  } catch (error) {
    console.error('获取团长列表失败:', error)
  }
}

function handleCreate() {
  createForm.leaderId = null
  createForm.dateRange = []
  previewData.value = null
  createVisible.value = true
}

async function handleLeaderChange() {
  await loadPreviewData()
}

async function handlePeriodChange() {
  await loadPreviewData()
}

async function loadPreviewData() {
  if (!createForm.leaderId || !createForm.dateRange || createForm.dateRange.length !== 2) {
    previewData.value = null
    return
  }
  try {
    const res = await getUnsettledOrders(
      createForm.leaderId,
      createForm.dateRange[0],
      createForm.dateRange[1]
    )
    previewData.value = res.data || { orderCount: 0, commissionTotal: 0 }
  } catch (error) {
    console.error('获取预览数据失败:', error)
  }
}

async function confirmCreate() {
  if (!createForm.leaderId) {
    ElMessage.warning('请选择团长')
    return
  }
  if (!createForm.dateRange || createForm.dateRange.length !== 2) {
    ElMessage.warning('请选择结算周期')
    return
  }
  if (!previewData.value || previewData.value.orderCount === 0) {
    ElMessage.warning('该周期内没有可结算的订单')
    return
  }
  submitting.value = true
  try {
    await createSettlement({
      leaderId: createForm.leaderId,
      startDate: createForm.dateRange[0],
      endDate: createForm.dateRange[1]
    })
    ElMessage.success('结算单创建成功')
    createVisible.value = false
    getList()
  } catch (error) {
    console.error('创建结算单失败:', error)
  } finally {
    submitting.value = false
  }
}

async function handleViewDetail(row) {
  try {
    const [detailRes, itemsRes] = await Promise.all([
      getSettlementDetail(row.id),
      getSettlementItems(row.id)
    ])
    settlementDetail.value = detailRes.data
    settlementItems.value = itemsRes.data || []
    detailVisible.value = true
  } catch (error) {
    console.error('获取结算详情失败:', error)
  }
}

function handleAudit(row) {
  currentSettlement.value = row
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
    await auditSettlement(currentSettlement.value.id, {
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
  ElMessageBox.confirm('确定要执行打款操作吗？', '提示', {
    confirmButtonText: '确定打款',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await completeSettlement(row.id)
      ElMessage.success('打款成功，结算已完成')
      getList()
    } catch (error) {
      console.error('结算打款失败:', error)
    }
  }).catch(() => {})
}

async function handleExport(row) {
  try {
    const res = await exportSettlement(row.id)
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `结算单_${row.settlementNo}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

onMounted(() => {
  getList()
  loadLeaderList()
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
}

.settlement-detail {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.preview-info {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;

  p {
    margin: 0 0 8px 0;
    color: #606266;

    &:last-child {
      margin-bottom: 0;
    }

    span {
      color: #303133;
      font-weight: 500;
    }
  }
}

.text-red {
  color: #f56c6c;
  font-weight: 600;
}
</style>
