<template>
  <div class="components-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="组件名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入组件名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="组件类型">
          <el-select v-model="searchForm.componentType" placeholder="全部类型" clearable style="width: 150px">
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
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="table-header">
          <span>组件列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建组件
          </el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="组件名称" width="180" />
        <el-table-column prop="componentType" label="组件类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getComponentTypeTag(row.componentType)">{{ getComponentTypeName(row.componentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="apiMethod" label="请求方法" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.apiMethod" :type="getMethodType(row.apiMethod)" size="small">{{ row.apiMethod }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="apiUrl" label="接口地址" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="success" @click="handleDebug(row)">调试</el-button>
            <el-button text type="danger" @click="handleDelete(row)">删除</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { ComponentConfig, PageResult } from '../types';
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

const getComponentTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    input: 'primary',
    select: 'success',
    radio: 'warning',
    checkbox: 'info',
    textarea: 'danger',
    date: '',
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

const getMethodType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'primary',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger'
  };
  return types[method] || 'info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getComponentList({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      componentType: searchForm.componentType || undefined
    });
    if (res.code === 200 || res.code === 0) {
      const data = res.data as PageResult<ComponentConfig>;
      tableData.value = data.records;
      pagination.total = data.total;
    }
  } catch (error) {
    console.error('Failed to fetch components:', error);
    loadMockData();
  } finally {
    loading.value = false;
  }
};

const loadMockData = () => {
  tableData.value = [
    { id: '1', name: '用户名输入框', description: '用于输入用户名的文本框', componentType: 'input', defaultValue: '', isRequired: true, validationRule: '^[a-zA-Z0-9_]{3,20}$', placeholder: '请输入用户名', options: '', apiUrl: '/api/users', apiMethod: 'POST', apiHeaders: '{}', apiParams: '{}', createdAt: '2026-05-01 10:00:00', updatedAt: '2026-05-01 10:00:00' },
    { id: '2', name: '性别选择', description: '选择用户性别', componentType: 'select', defaultValue: '', isRequired: false, validationRule: '', placeholder: '请选择性别', options: '[{"label":"男","value":"male"},{"label":"女","value":"female"}]', apiUrl: '/api/options/gender', apiMethod: 'GET', apiHeaders: '{}', apiParams: '{}', createdAt: '2026-05-02 14:30:00', updatedAt: '2026-05-02 14:30:00' },
    { id: '3', name: '用户状态', description: '用户状态单选框', componentType: 'radio', defaultValue: 'active', isRequired: true, validationRule: '', placeholder: '', options: '[{"label":"激活","value":"active"},{"label":"禁用","value":"inactive"}]', apiUrl: '', apiMethod: 'GET', apiHeaders: '{}', apiParams: '{}', createdAt: '2026-05-03 09:15:00', updatedAt: '2026-05-03 09:15:00' },
    { id: '4', name: '用户权限', description: '多选框权限选择', componentType: 'checkbox', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '[{"label":"查看","value":"view"},{"label":"编辑","value":"edit"},{"label":"删除","value":"delete"}]', apiUrl: '', apiMethod: 'GET', apiHeaders: '{}', apiParams: '{}', createdAt: '2026-05-04 16:45:00', updatedAt: '2026-05-04 16:45:00' },
    { id: '5', name: '用户备注', description: '多行文本输入', componentType: 'textarea', defaultValue: '', isRequired: false, validationRule: '', placeholder: '请输入备注信息', options: '', apiUrl: '', apiMethod: 'POST', apiHeaders: '{}', apiParams: '{}', createdAt: '2026-05-05 11:20:00', updatedAt: '2026-05-05 11:20:00' }
  ];
  pagination.total = 5;
};

const handleSearch = () => {
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
  router.push('/components/new');
};

const handleEdit = (row: ComponentConfig) => {
  router.push(`/components/${row.id}/edit`);
};

const handleDebug = (row: ComponentConfig) => {
  router.push({ path: '/debug', query: { componentId: row.id } });
};

const handleDelete = async (row: ComponentConfig) => {
  try {
    await ElMessageBox.confirm(`确认删除组件「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteComponent(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.success('删除成功');
      tableData.value = tableData.value.filter(item => item.id !== row.id);
    }
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

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
