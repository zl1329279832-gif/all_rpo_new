<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">订单管理</span>
          <el-button type="primary" :icon="Download" @click="handleExport">导出订单</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="订单号">
            <el-input v-model="queryForm.orderNo" placeholder="请输入订单号" clearable />
          </el-form-item>
          <el-form-item label="用户名称">
            <el-input v-model="queryForm.userName" placeholder="请输入用户名称" clearable />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="queryForm.orderStatus" placeholder="请选择" clearable>
              <el-option label="待支付" :value="0" />
              <el-option label="已支付" :value="1" />
              <el-option label="已取消" :value="2" />
              <el-option label="已完成" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="userName" label="用户名称" />
        <el-table-column prop="activityName" label="活动名称" />
        <el-table-column prop="totalAmount" label="订单金额" width="100">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="payStatusType[row.payStatus]" size="small">
              {{ payStatusText[row.payStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusType[row.orderStatus]" size="small">
              {{ orderStatusText[row.orderStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.orderStatus === 0"
              type="success"
              link
              size="small"
              @click="handlePay(row)"
            >支付</el-button>
            <el-button
              v-if="row.orderStatus === 0"
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderDetail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="orderStatusType[orderDetail.orderStatus]" size="small">
                {{ orderStatusText[orderDetail.orderStatus] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="payStatusType[orderDetail.payStatus]" size="small">
                {{ payStatusText[orderDetail.payStatus] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ orderDetail.payType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ orderDetail.createTime }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ orderDetail.payTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>收货信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ orderDetail.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址">{{ orderDetail.receiverAddress }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>商品明细</h4>
          <el-table :data="orderItems" border stripe>
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="specs" label="规格" width="120" />
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.unitPrice?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="subtotal" label="小计" width="100">
              <template #default="{ row }">
                ¥{{ row.subtotal?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金" width="100">
              <template #default="{ row }">
                ¥{{ row.commission?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="detail-section">
          <div class="total-amount">
            <span>订单金额合计：</span>
            <span class="amount">¥{{ orderDetail.totalAmount?.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cancelVisible"
      title="取消订单"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-input
            v-model="cancelForm.cancelReason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmCancel">确定取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOrderPage,
  getOrderDetail,
  getOrderItemList,
  cancelOrder,
  payOrder
} from '@/api/order'

const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const tableData = ref([])

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  userName: '',
  orderStatus: null
})

const orderStatusType = {
  0: 'warning',
  1: 'primary',
  2: 'info',
  3: 'success'
}

const orderStatusText = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已完成'
}

const payStatusType = {
  0: 'warning',
  1: 'success',
  2: 'info'
}

const payStatusText = {
  0: '未支付',
  1: '已支付',
  2: '已退款'
}

const detailVisible = ref(false)
const cancelVisible = ref(false)
const orderDetail = ref(null)
const orderItems = ref([])
const currentOrder = ref(null)

const cancelForm = reactive({
  cancelReason: ''
})

async function getList() {
  loading.value = true
  try {
    const res = await getOrderPage(queryForm)
    tableData.value = res.data.records || res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.pageNum = 1
  queryForm.pageSize = 10
  queryForm.orderNo = ''
  queryForm.userName = ''
  queryForm.orderStatus = null
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
      getOrderDetail(row.id),
      getOrderItemList(row.id)
    ])
    orderDetail.value = detailRes.data
    orderItems.value = itemsRes.data || []
    detailVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

function handleCancel(row) {
  currentOrder.value = row
  cancelForm.cancelReason = ''
  cancelVisible.value = true
}

async function confirmCancel() {
  if (!cancelForm.cancelReason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }
  submitting.value = true
  try {
    await cancelOrder(currentOrder.value.id, cancelForm.cancelReason)
    ElMessage.success('订单取消成功')
    cancelVisible.value = false
    getList()
  } catch (error) {
    console.error('取消订单失败:', error)
  } finally {
    submitting.value = false
  }
}

async function handlePay(row) {
  ElMessageBox.confirm('确定要模拟支付该订单吗？', '提示', {
    confirmButtonText: '确定支付',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await payOrder(row.id)
      ElMessage.success('支付成功')
      getList()
    } catch (error) {
      console.error('支付失败:', error)
    }
  }).catch(() => {})
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

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

.order-detail {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .total-amount {
    text-align: right;
    font-size: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .amount {
      color: #f56c6c;
      font-weight: 600;
      font-size: 20px;
    }
  }
}
</style>
