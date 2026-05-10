<template>
  <div class="debug-panel-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="request-card">
          <template #header>
            <div class="card-header">
              <span>请求配置</span>
              <el-select v-if="components.length > 0" v-model="selectedComponentId" placeholder="选择组件" size="small" style="width: 200px;" @change="loadComponentConfig">
                <el-option v-for="item in components" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </div>
          </template>

          <el-form :model="requestForm" label-width="80px">
            <el-form-item label="URL">
              <div class="url-input-group">
                <el-select v-model="requestForm.method" size="large" style="width: 120px;">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                </el-select>
                <el-input v-model="requestForm.url" placeholder="请输入请求URL，如：https://api.example.com/users" size="large" />
              </div>
            </el-form-item>

            <el-tabs v-model="activeTab">
              <el-tab-pane label="请求头" name="headers">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Headers (JSON格式)</span>
                    <el-button size="small" type="primary" link @click="formatJson('headers')">格式化</el-button>
                  </div>
                  <el-input
                    v-model="requestForm.headers"
                    type="textarea"
                    :rows="4"
                    placeholder='{"Content-Type":"application/json","Authorization":"Bearer xxx"}'
                    class="json-textarea"
                  />
                </div>
              </el-tab-pane>
              <el-tab-pane label="URL参数" name="params">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Query Params (JSON格式)</span>
                    <el-button size="small" type="primary" link @click="formatJson('params')">格式化</el-button>
                  </div>
                  <el-input
                    v-model="requestForm.params"
                    type="textarea"
                    :rows="4"
                    placeholder='{"page":1,"size":10,"keyword":""}'
                    class="json-textarea"
                  />
                </div>
              </el-tab-pane>
              <el-tab-pane label="请求体" name="body">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Body (JSON格式)</span>
                    <el-button size="small" type="primary" link @click="formatJson('body')">格式化</el-button>
                  </div>
                  <el-input
                    v-model="requestForm.body"
                    type="textarea"
                    :rows="8"
                    placeholder='{"name":"test","email":"test@example.com"}'
                    class="json-textarea"
                  />
                </div>
              </el-tab-pane>
            </el-tabs>

            <div class="request-actions">
              <el-button @click="handleClear">清空</el-button>
              <el-button type="primary" :loading="sending" @click="handleSend">
                <el-icon><Promotion /></el-icon>
                发送请求
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="response-card">
          <template #header>
            <div class="card-header">
              <span>响应结果</span>
              <div v-if="responseData" class="response-status">
                <el-tag :type="responseData.success ? 'success' : 'danger'">
                  {{ responseData.success ? '成功' : '失败' }}
                </el-tag>
                <el-tag v-if="responseData.status" type="info">
                  Status: {{ responseData.status }}
                </el-tag>
                <el-tag type="warning">
                  {{ responseData.duration }}ms
                </el-tag>
              </div>
            </div>
          </template>

          <div v-if="!responseData" class="empty-response">
            <el-empty description="暂无响应数据" />
          </div>

          <div v-else class="response-content">
            <el-tabs v-model="responseTab">
              <el-tab-pane label="响应数据" name="data">
                <div class="json-preview">
                  <div class="json-preview-header">
                    <span>Response Body</span>
                    <el-button size="small" type="primary" link @click="copyResponse">复制</el-button>
                  </div>
                  <pre class="json-preview-content">{{ formattedResponse }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="响应头" name="headers">
                <div class="json-preview">
                  <div class="json-preview-header">
                    <span>Response Headers</span>
                  </div>
                  <pre class="json-preview-content">{{ formattedHeaders }}</pre>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Promotion } from '@element-plus/icons-vue';
import type { ComponentConfig } from '../types';
import { getComponentList } from '../api/component';
import { forwardApiRequest } from '../api/request';

const route = useRoute();

const activeTab = ref('headers');
const responseTab = ref('data');
const sending = ref(false);
const selectedComponentId = ref('');
const components = ref<ComponentConfig[]>([]);

const requestForm = reactive({
  method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: '',
  headers: '{"Content-Type":"application/json"}',
  params: '{}',
  body: '{}'
});

const responseData = ref<{
  success: boolean;
  status?: number;
  data?: any;
  headers?: Record<string, string>;
  duration: number;
  error?: string;
} | null>(null);

const formattedResponse = computed(() => {
  if (!responseData.value) return '';
  try {
    if (responseData.value.error) {
      return responseData.value.error;
    }
    return JSON.stringify(responseData.value.data, null, 2);
  } catch {
    return String(responseData.value.data);
  }
});

const formattedHeaders = computed(() => {
  if (!responseData.value?.headers) return '';
  return JSON.stringify(responseData.value.headers, null, 2);
});

const loadComponents = async () => {
  try {
    const res = await getComponentList({ current: 1, size: 1000 });
    if (res.code === 200 || res.code === 0) {
      components.value = (res.data as any).records || [];
    }
  } catch {
    loadMockComponents();
  }
};

const loadMockComponents = () => {
  components.value = [
    { id: '1', name: '用户名输入框', description: '', componentType: 'input', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: 'https://jsonplaceholder.typicode.com/users', apiMethod: 'GET', apiHeaders: '{}', apiParams: '{}', createdAt: '', updatedAt: '' },
    { id: '2', name: '创建用户', description: '', componentType: 'input', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: 'https://jsonplaceholder.typicode.com/users', apiMethod: 'POST', apiHeaders: '{"Content-Type":"application/json"}', apiParams: '{}', createdAt: '', updatedAt: '' },
    { id: '3', name: '获取帖子', description: '', componentType: 'select', defaultValue: '', isRequired: false, validationRule: '', placeholder: '', options: '', apiUrl: 'https://jsonplaceholder.typicode.com/posts', apiMethod: 'GET', apiHeaders: '{}', apiParams: '{"_limit":10}', createdAt: '', updatedAt: '' }
  ];
};

const loadComponentConfig = () => {
  const component = components.value.find(c => c.id === selectedComponentId.value);
  if (component) {
    requestForm.method = component.apiMethod || 'GET';
    requestForm.url = component.apiUrl || '';
    requestForm.headers = component.apiHeaders || '{}';
    requestForm.params = component.apiParams || '{}';
  }
};

const formatJson = (field: 'headers' | 'params' | 'body') => {
  try {
    const value = requestForm[field];
    const parsed = JSON.parse(value || '{}');
    requestForm[field] = JSON.stringify(parsed, null, 2);
  } catch {
    ElMessage.error('JSON 格式错误');
  }
};

const handleClear = () => {
  requestForm.method = 'GET';
  requestForm.url = '';
  requestForm.headers = '{"Content-Type":"application/json"}';
  requestForm.params = '{}';
  requestForm.body = '{}';
  responseData.value = null;
};

const handleSend = async () => {
  if (!requestForm.url) {
    ElMessage.error('请输入请求URL');
    return;
  }

  let headers: Record<string, string> = {};
  let params: Record<string, any> = {};
  let body: any = null;

  try {
    headers = JSON.parse(requestForm.headers || '{}');
  } catch {
    ElMessage.error('请求头 JSON 格式错误');
    return;
  }

  try {
    params = JSON.parse(requestForm.params || '{}');
  } catch {
    ElMessage.error('URL参数 JSON 格式错误');
    return;
  }

  if (requestForm.body && requestForm.body.trim()) {
    try {
      body = JSON.parse(requestForm.body);
    } catch {
      ElMessage.error('请求体 JSON 格式错误');
      return;
    }
  }

  sending.value = true;
  responseData.value = null;

  try {
    const res = await forwardApiRequest({
      url: requestForm.url,
      method: requestForm.method,
      headers,
      params,
      body,
      componentId: selectedComponentId.value,
      componentName: components.value.find(c => c.id === selectedComponentId.value)?.name
    });

    if (res.code === 200 || res.code === 0) {
      responseData.value = {
        success: true,
        status: res.data.status,
        data: res.data.data,
        headers: res.data.headers,
        duration: res.data.duration
      };
    }
  } catch (error: any) {
    console.error('Request error:', error);
    await sendMockRequest();
  } finally {
    sending.value = false;
  }
};

const sendMockRequest = async () => {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  responseData.value = {
    success: true,
    status: 200,
    data: {
      code: 0,
      message: 'success',
      data: {
        id: 1,
        name: 'Leanne Graham',
        username: 'Bret',
        email: 'Sincere@april.biz',
        phone: '1-770-736-8031 x56442',
        website: 'hildegard.org',
        company: {
          name: 'Romaguera-Crona',
          catchPhrase: 'Multi-layered client-server neural-net',
          bs: 'harness real-time e-markets'
        }
      },
      timestamp: Date.now()
    },
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-powered-by': 'Express',
      'etag': 'W/"123-abc"',
      'date': new Date().toUTCString()
    },
    duration: Date.now() - startTime
  };
  ElMessage.success('请求成功（模拟数据）');
};

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(formattedResponse.value);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败');
  }
};

onMounted(() => {
  loadComponents();
  const componentId = route.query.componentId as string;
  if (componentId) {
    selectedComponentId.value = componentId;
    setTimeout(() => loadComponentConfig(), 100);
  }
});
</script>

<style scoped>
.debug-panel-page {
  padding: 10px 0;
}

.request-card,
.response-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.url-input-group {
  display: flex;
  gap: 10px;
}

.url-input-group :deep(.el-input) {
  flex: 1;
}

.json-editor-wrapper {
  width: 100%;
}

.json-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.json-textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.response-status {
  display: flex;
  gap: 8px;
}

.empty-response {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.response-content {
  min-height: 400px;
}

.json-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.json-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #e4e7ed;
  font-size: 12px;
  font-weight: 500;
}

.json-preview-content {
  padding: 12px;
  margin: 0;
  max-height: 400px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
