<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon blue"><Grid /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.componentCount }}</div>
              <div class="stat-label">组件总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon green"><Connection /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.requestCount }}</div>
              <div class="stat-label">今日请求</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon orange"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.historyCount }}</div>
              <div class="stat-label">历史记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon purple"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.logCount }}</div>
              <div class="stat-label">操作日志</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近操作</span>
              <el-button text @click="$router.push('/logs')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentLogs" stripe>
            <el-table-column prop="username" label="用户" width="100" />
            <el-table-column prop="action" label="操作" width="100" />
            <el-table-column prop="module" label="模块" width="100" />
            <el-table-column prop="detail" label="详情" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近请求</span>
              <el-button text @click="$router.push('/history')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentRequests" stripe>
            <el-table-column prop="componentName" label="组件" width="120" />
            <el-table-column prop="method" label="方法" width="80">
              <template #default="{ row }">
                <el-tag :type="getMethodType(row.method)">{{ row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="url" label="URL" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>组件分布</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6" v-for="(count, type) in componentTypeStats" :key="type">
              <div class="type-stat">
                <el-tag :type="getComponentTypeColor(type)" size="large">
                  {{ getComponentTypeName(type) }}
                </el-tag>
                <div class="type-count">{{ count }} 个</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Grid, Connection, Clock, Document } from '@element-plus/icons-vue';
import type { OperationLog, ApiRequest } from '../types';

const stats = ref({
  componentCount: 0,
  requestCount: 0,
  historyCount: 0,
  logCount: 0
});

const recentLogs = ref<OperationLog[]>([]);
const recentRequests = ref<ApiRequest[]>([]);
const componentTypeStats = ref<Record<string, number>>({});

const formatTime = (time: string) => {
  return time || '-';
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

const getComponentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    input: 'primary',
    select: 'success',
    radio: 'warning',
    checkbox: 'info',
    textarea: 'danger',
    date: '',
    number: 'primary'
  };
  return colors[type] || '';
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

onMounted(() => {
  stats.value = {
    componentCount: 12,
    requestCount: 156,
    historyCount: 892,
    logCount: 2345
  };
  componentTypeStats.value = {
    input: 4,
    select: 3,
    radio: 2,
    checkbox: 1,
    textarea: 1,
    number: 1
  };
  recentLogs.value = [
    { id: '1', userId: '1', username: '管理员', action: '新建', module: '组件', detail: '创建了组件「用户名称输入框」', ip: '192.168.1.1', createdAt: '2026-05-10 10:30:00' },
    { id: '2', userId: '1', username: '管理员', action: '修改', module: '组件', detail: '修改了组件「性别选择」', ip: '192.168.1.1', createdAt: '2026-05-10 10:25:00' },
    { id: '3', userId: '1', username: '管理员', action: '调试', module: '接口', detail: '测试了「获取用户列表」接口', ip: '192.168.1.1', createdAt: '2026-05-10 10:20:00' }
  ];
  recentRequests.value = [
    { id: '1', componentId: '1', componentName: '用户列表', url: '/api/users', method: 'GET', headers: {}, params: {}, body: null, status: 'success', responseStatus: 200, duration: 120, createdAt: '2026-05-10 10:30:00' },
    { id: '2', componentId: '2', componentName: '创建用户', url: '/api/users', method: 'POST', headers: {}, params: {}, body: {}, status: 'error', errorMessage: '请求超时', duration: 5000, createdAt: '2026-05-10 10:28:00' },
    { id: '3', componentId: '3', componentName: '性别选择', url: '/api/options/gender', method: 'GET', headers: {}, params: {}, body: null, status: 'success', responseStatus: 200, duration: 85, createdAt: '2026-05-10 10:25:00' }
  ];
});
</script>

<style scoped>
.dashboard {
  padding: 10px 0;
}

.stat-card {
  border: none;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.stat-icon.blue {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}

.stat-icon.green {
  color: #67C23A;
  background-color: rgba(103, 194, 58, 0.1);
}

.stat-icon.orange {
  color: #E6A23C;
  background-color: rgba(230, 162, 60, 0.1);
}

.stat-icon.purple {
  color: #909399;
  background-color: rgba(144, 147, 153, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
}

.type-count {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
</style>
