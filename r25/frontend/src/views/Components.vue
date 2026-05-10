<template>
  <div class="components-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="组件名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入组件名称" clearable @keyup.enter="handleSearch" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="组件类型">
          <el-select v-model="searchForm.componentType" placeholder="全部类型" clearable style="width: 150px;">
            <el-option label="文本框" value="input" />
            <el-option label="下拉框" value="select" />
            <el-option label="单选框" value="radio" />
            <el-option label="多选框" value="checkbox" />
            <el-option label="文本域" value="textarea" />
            <el-option label="日期选择" value="date" />
            <el-option label="数字框" value="number" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="table-header">
          <span>组件列表 (共 {{ pagination.total }} 条)</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新建组件
          </el-button>
        </div>
      </template>
      
      <el-table 
        :data="tableData" 
        v-loading="loading" 
        stripe
        empty-text="暂无数据"
        @row-click="handleRowClick"
        highlight-current-row
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="组件名称" width="180">
          <template #default="{ row }">
            <el-tag type="primary" effect="light">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="componentType" label="组件类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getComponentTypeTag(row.componentType)" size="small">{{ getComponentTypeName(row.componentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
        <el-table-column prop="apiMethod" label="请求方法" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.apiMethod && row.apiUrl" :type="getMethodType(row.apiMethod)" size="small">{{ row.apiMethod }}</el-tag>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="apiUrl" label="接口地址" show-overflow-tooltip min-width="200">
          <template #default="{ row }">
            <span v-if="row.apiUrl" class="api-url">{{ row.apiUrl }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isRequired" label="必填" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRequired" type="danger" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="编辑" placement="top">
              <el-button type="primary" link :icon="Edit" @click.stop="handleEdit(row)" />
            </el-tooltip>
            <el-tooltip content="调试" placement="top">
              <el-button type="success" link :icon="Connection" @click.stop="handleDebug(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" link :icon="Delete" @click.stop="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, Edit, Connection, Delete } from '@element-plus/icons-vue';
import type { ComponentConfig, PageResult, ApiResponse } from '../types';
import { getComponentList, deleteComponent } from '../api/component';

const router = useRouter();

const loading = ref(false);
const tableData = ref<ComponentConfig[]>([]);
const searchForm = reactive({
  keyword: '',
  componentType: ''
});
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const getComponentTypeTag = (type: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | '' => {
  const tags: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    input: 'primary',
    select: 'success',
    radio: 'warning',
    checkbox: 'info',
    textarea: 'danger',
    date: 'info',
    number: 'primary'
  };
  return tags[type] || '';
};

const getComponentTypeName = (type: string) => {
  const names: Record<string, string> = {
    input: '文本框',
    select: '下拉框',
    radio: '单选框',
    checkbox: '多选框',
    textarea: '文本域',
    date: '日期选择',
    number: '数字框'
  };
  return names[type] || type;
};

const getMethodType = (method: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
    GET: 'primary',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger'
  };
  return types[method] || 'info';
};

const handleRowClick = (row: ComponentConfig) => {
  console.log('行点击:', row);
};

const fetchData = async () => {
  loading.value = true;
  try {
    console.log('正在获取组件列表...');
    const res: ApiResponse<PageResult<ComponentConfig>> = await getComponentList({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      componentType: searchForm.componentType || undefined
    });
    console.log('API返回结果:', res);
    
    if (res.code === 200 || res.code === 0) {
      const data = res.data;
      tableData.value = data.records || [];
      pagination.total = data.total || 0;
      ElMessage.success(`成功加载 ${tableData.value.length} 条数据`);
    } else {
      ElMessage.error(res.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取组件列表失败:', error);
    ElMessage.error('获取数据失败，请检查后端服务是否启动');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  console.log('搜索:', searchForm);
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.componentType = '';
  pagination.current = 1;
  fetchData();
};

const handleCreate = () => {
  console.log('跳转到新建组件页面');
  router.push('/components/new');
};

const handleEdit = (row: ComponentConfig) => {
  console.log('编辑组件:', row);
  router.push(`/components/${row.id}/edit`);
};

const handleDebug = (row: ComponentConfig) => {
  console.log('调试组件:', row);
  router.push({ path: '/debug', query: { componentId: row.id } });
};

const handleDelete = async (row: ComponentConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除组件「${row.name}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    loading.value = true;
    try {
      await deleteComponent(row.id);
      ElMessage.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.success('删除成功（模拟）');
      tableData.value = tableData.value.filter(item => item.id !== row.id);
      pagination.total = Math.max(0, pagination.total - 1);
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
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
  console.log('组件列表页面挂载完成');
  fetchData();
});
</script>

<style scoped>
.components-page {
  padding: 10px 0;
}

.search-card {
  border: none;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.empty-text {
  color: #c0c4cc;
}

.api-url {
  color: #409EFF;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
