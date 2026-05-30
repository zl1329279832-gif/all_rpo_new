<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">团长结算</span>
          <el-button type="primary" :icon="Plus">
            生成结算单
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
              <el-option label="已审核" :value="1" />
              <el-option label="已打款" :value="2" />
              <el-option label="已驳回" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="settlementNo" label="结算单号" width="160" />
        <el-table-column prop="leaderName" label="团长名称" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column prop="totalAmount" label="订单总额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="commissionAmount" label="佣金金额" width="120">
          <template #default="{ row }">
            ¥{{ row.commissionAmount?.toFixed(2) }}
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link size="small">详情</el-button>
            <el-button type="success" link size="small">审核</el-button>
            <el-button type="warning" link size="small">打款</el-button>
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
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  settlementNo: '',
  leaderName: '',
  status: null
})

const total = ref(0)
const tableData = ref([])

const statusType = {
  0: 'warning',
  1: 'primary',
  2: 'success',
  3: 'danger'
}

const statusText = {
  0: '待审核',
  1: '已审核',
  2: '已打款',
  3: '已驳回'
}

function resetQuery() {
  queryForm.settlementNo = ''
  queryForm.leaderName = ''
  queryForm.status = null
}
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
</style>
