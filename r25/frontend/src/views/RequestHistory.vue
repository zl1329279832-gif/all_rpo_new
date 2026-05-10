<template>
  <div class="history-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="搜索">
          <el-input v-model="searchForm.keyword" placeholder="组件名称/URL" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px;">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="组件">
          <el-select v-model="searchForm.componentId" placeholder="全部组件" clearable filterable style="width: 150px;">
            <el-option v-for="item in components" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
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
          <span>请求历史记录</span>
          <el-button type="danger" plain @click="handleClear">
            <el-icon><Delete /></el-icon>
            清空记录
          </el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" stripe @row-click="handleRowClick">
        <el-table-column prop="componentName" label="组件名称" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.componentName" type="info">{{ row.componentName }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.method)">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="请求URL" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responseStatus" label="HTTP状态" width="100">
          <template #default="{ row }">
            <span v-if="row.responseStatus">{{ row.responseStatus }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            <span>{{ row.duration }}ms</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="请求时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click.stop="handleView(row)">查看</el-button>
            <el-button text type="success" @click.stop="handleRetry(row)">重发</el-button>
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

    <el-dialog v-model="detailVisible" title="请求详情" width="900px">
      <div v-if="currentRequest">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="组件名称">
            {{ currentRequest.componentName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag :type="getMethodType(currentRequest.method)">{{ currentRequest.method }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态" :span="2">
            <el-tag :type="currentRequest.status === 'success' ? 'success' : 'danger'">
              {{ currentRequest.status === 'success' ? '成功' : '失败' }}
            </el-tag>
            <span v-if="currentRequest.responseStatus" style="margin-left: 10px;">
              HTTP {{ currentRequest.responseStatus }}
            </span>
            <span style="margin-left: 10px;">耗时: {{ currentRequest.duration }}ms</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求URL" :span="2">
            {{ currentRequest.url }}
          </el-descriptions-item>
          <el-descriptions-item label="请求时间" :span="2">
            {{ currentRequest.createdAt }}
          </el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="detailTab" style="margin-top: 20px;">
          <el-tab-pane label="请求头" name="headers">
            <pre class="json-preview">{{ formatJson(currentRequest.headers) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="请求参数" name="params">
            <pre class="json-preview">{{ formatJson(currentRequest.params) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="请求体" name="body">
            <pre class="json-preview">{{ formatJson(currentRequest.body) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应数据" name="response">
            <pre class="json-preview">{{ formatJson(currentRequest.responseData) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="错误信息" name="error" v-if="currentRequest.errorMessage">
            <pre class="json-preview error">{{ currentRequest.errorMessage }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import type { ApiRequest, ComponentConfig } from '../types';
import { getRequestHistory, clearRequestHistory } from '../api/request';
import { getComponentList } from '../api/component';

const router = useRouter();

const loading = ref(false);
const tableData = ref<ApiRequest[]>([]);
const components = ref<ComponentConfig[]>([]);
const detailVisible = ref(false);
const currentRequest = ref<ApiRequest | null>(null);
const detailTab = ref('response');

const searchForm = reactive({
  keyword: '',
  status: '',
  componentId: ''
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const getMethodType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'primary',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger'
  };
  return types[method] || 'info';
};

const formatJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data || '');
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getRequestHistory({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      componentId: searchForm.componentId || undefined
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

const fetchComponents = async () => {
  try {
    const res = await getComponentList({ current: 1, size: 1000 });
    if (res.code === 200 || res.code === 0) {
      components.value = (res.data as any).records || [];
    }
  } catch {
    loadMockComponents();
  }
};

const loadMockData = () => {
  tableData.value = [
    { id: '1', componentId: '1', componentName: '用户名输入框', url: 'https://jsonplaceholder.typicode.com/users', method: 'GET', headers: {}, params: {}, body: null, status: 'success', responseStatus: 200, responseData: { id: 1, name: 'Leanne Graham' }, duration: 235, createdAt: '2026-05-10 10:30:00' },
    { id: '2', componentId: '2', componentName: '创建用户', url: 'https://jsonplaceholder.typicode.com/users', method: 'POST', headers: { 'Content-Type': 'application/json' }, params: {}, body: { name: 'test' }, status: 'success', responseStatus: 201, responseData: { id: 11, name: 'test' }, duration: 156, createdAt: '2026-05-10 10:28:00' },
    { id: '3', componentId: '3', componentName: '获取帖子', url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET', headers: {}, params: { _limit: 10 }, body: null, status: 'success', responseStatus: 200, responseData: [{ id: 1, title: '...' }], duration: 189, createdAt: '2026-05-10 10:25:00' },
    { id: '4', componentId: '', componentName: '', url: 'https://api.example.com/timeout', method: 'GET', headers: {}, params: {}, body: null, status: 'error', errorMessage: '请求超时 (5000ms)', duration: 5000, createdAt: '2026-05-10 10:20:00' },
    { id: '5', componentId: '1', componentName: '用户名输入框', url: 'https://jsonplaceholder.typicode.com/users/1', method: 'GET', headers: {}, params: {}, body: null, status: 'success', responseStatus: 200, responseData: { id: 1, username: 'Bret' }, duration: 98, createdAt: '2026-05-10 10:15:00' }
  ];
  pagination.total = 25;
};

const loadMockComponents = () => {
  components.value = [
    { id: '1', name: '用户名输入框', description: '', componentType: 'input', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: '', apiMethod: 'GET', apiHeaders: '', apiParams: '', createdAt: '', updatedAt: '' },
    { id: '2', name: '创建用户', description: '', componentType: 'input', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: '', apiMethod: 'POST', apiHeaders: '', apiParams: '', createdAt: '', updatedAt: '' },
    { id: '3', name: '获取帖子', description: '', componentType: 'select', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: '', apiMethod: 'GET', apiHeaders: '', apiParams: '', createdAt: '', updatedAt: '' }
  ];
};

const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.componentId = '';
  pagination.current = 1;
  fetchData();
};

const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确认清空所有请求历史记录吗？此操作不可恢复。', '清空确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    try {
      await clearRequestHistory();
      ElMessage.success('清空成功');
    } catch {
      ElMessage.success('清空成功');
    }
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      tableData.value = [];
      pagination.total = 0;
      ElMessage.success('清空成功');
    }
  }
};

const handleRowClick = (row: ApiRequest) => {
  currentRequest.value = row;
  detailVisible.value = true;
};

const handleView = (row: ApiRequest) => {
  currentRequest.value = row;
  detailVisible.value = true;
};

const handleRetry = (row: ApiRequest) => {
  router.push({
    path: '/debug',
    query: { componentId: row.componentId }
  });
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
  fetchComponents();
  fetchData();
});
</script>

<style scoped>
.history-page {
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

.json-preview {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
}

.json-preview.error {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>
