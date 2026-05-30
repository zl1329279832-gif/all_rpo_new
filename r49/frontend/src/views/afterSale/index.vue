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
          <el-form-item label="售后状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="待审核" :value="0" />
              <el-option label="审核通过" :value="1" />
              <el-option label="审核驳回" :value="2" />
              <el-option label="已完成" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="afterSaleNo" label="售后单号" width="160" />
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="userName" label="用户名称" />
        <el-table-column prop="leaderName" label="团长名称" />
        <el-table-column prop="afterSaleTypeName" label="售后类型" width="100" />
        <el-table-column prop="refundAmount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.refundAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="afterSaleStatusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.afterSaleStatus]" size="small">
              {{ row.afterSaleStatusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link size="small">详情</el-button>
            <el-button type="success" link size="small">审核</el-button>
            <el-button type="warning" link size="small">完成</el-button>
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
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  afterSaleNo: '',
  orderNo: '',
  status: null
})

const total = ref(0)
const tableData = ref([])

const statusType = {
  0: 'warning',
  1: 'primary',
  2: 'danger',
  3: 'success'
}

function resetQuery() {
  queryForm.afterSaleNo = ''
  queryForm.orderNo = ''
  queryForm.status = null
}
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
</style>
