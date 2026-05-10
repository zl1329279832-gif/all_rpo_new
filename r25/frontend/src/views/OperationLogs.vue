<template>
  <div class="logs-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="用户名/操作详情" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部模块" clearable style="width: 120px;">
            <el-option label="组件" value="组件" />
            <el-option label="接口" value="接口" />
            <el-option label="配置" value="配置" />
            <el-option label="系统" value="系统" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="searchForm.action" placeholder="全部操作" clearable style="width: 120px;">
            <el-option label="新建" value="新建" />
            <el-option label="修改" value="修改" />
            <el-option label="删除" value="删除" />
            <el-option label="查询" value="查询" />
            <el-option label="调试" value="调试" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="table-header">
          <span>操作日志</span>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.username }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="操作详情" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <div v-if="currentLog">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">
            {{ currentLog.username }}
          </el-descriptions-item>
          <el-descriptions-item label="操作">
            <el-tag :type="getActionType(currentLog.action)">{{ currentLog.action }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ currentLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="操作详情">
            {{ currentLog.detail }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ currentLog.ip }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ currentLog.createdAt }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { OperationLog } from '../types';
import { getOperationLogs } from '../api/log';

const loading = ref(false);
const tableData = ref<OperationLog[]>([]);
const detailVisible = ref(false);
const currentLog = ref<OperationLog | null>(null);

const searchForm = reactive({
  keyword: '',
  module: '',
  action: '',
  dateRange: [] as string[]
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    新建: 'success',
    修改: 'primary',
    删除: 'danger',
    查询: 'info',
    调试: 'warning'
  };
  return types[action] || 'info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getOperationLogs({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      module: searchForm.module || undefined,
      action: searchForm.action || undefined,
      startTime: searchForm.dateRange?.[0],
      endTime: searchForm.dateRange?.[1]
    });
    if (res.code === 200 || res.code === 0) {
      const data = res.data as any;
      tableData.value = data.records || [];
      pagination.total = data.total || 0;
    }
  } catch {
    loadMockData();
  } finally {
    loading.value = false;
  }
};

const loadMockData = () => {
  tableData.value = [
    { id: '1', userId: '1', username: '管理员', action: '新建', module: '组件', detail: '创建了组件「用户名称输入框」', ip: '192.168.1.1', createdAt: '2026-05-10 10:30:00' },
    { id: '2', userId: '1', username: '管理员', action: '修改', module: '组件', detail: '修改了组件「性别选择」的配置', ip: '192.168.1.1', createdAt: '2026-05-10 10:25:00' },
    { id: '3', userId: '1', username: '管理员', action: '删除', module: '组件', detail: '删除了组件「测试组件」', ip: '192.168.1.1', createdAt: '2026-05-10 10:20:00' },
    { id: '4', userId: '1', username: '管理员', action: '调试', module: '接口', detail: '测试了接口「GET /api/users」', ip: '192.168.1.1', createdAt: '2026-05-10 10:15:00' },
    { id: '5', userId: '2', username: '张三', action: '查询', module: '配置', detail: '查看了组件配置列表', ip: '192.168.1.2', createdAt: '2026-05-10 10:10:00' },
    { id: '6', userId: '1', username: '管理员', action: '新建', module: '组件', detail: '创建了组件「用户状态单选框」', ip: '192.168.1.1', createdAt: '2026-05-10 09:45:00' },
    { id: '7', userId: '2', username: '张三', action: '修改', module: '组件', detail: '修改了组件「用户权限多选框」的选项配置', ip: '192.168.1.2', createdAt: '2026-05-10 09:30:00' },
    { id: '8', userId: '1', username: '管理员', action: '调试', module: '接口', detail: '测试了接口「POST /api/users」', ip: '192.168.1.1', createdAt: '2026-05-10 09:15:00' },
    { id: '9', userId: '3', username: '李四', action: '查询', module: '组件', detail: '搜索了包含「用户」的组件', ip: '192.168.1.3', createdAt: '2026-05-10 09:00:00' },
    { id: '10', userId: '1', username: '管理员', action: '新建', module: '系统', detail: '系统初始化完成', ip: '127.0.0.1', createdAt: '2026-05-01 00:00:00' }
  ];
  pagination.total = 45;
};

const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.module = '';
  searchForm.action = '';
  searchForm.dateRange = [];
  pagination.current = 1;
  fetchData();
};

const handleView = (row: OperationLog) => {
  currentLog.value = row;
  detailVisible.value = true;
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  fetchData();
};

const handleCurrentChange = (page: number) => {
  pagination.current = page;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.logs-page {
  padding: 10px 0;
}

.search-card {
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
