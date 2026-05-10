<template>
  <div class="debug-panel-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="request-card">
          <template #header>
            <div class="card-header">
              <span>请求配置</span>
              <el-select 
                v-if="components.length > 0" 
                v-model="selectedComponentId" 
                placeholder="选择组件加载配置" 
                size="small" 
                style="width: 200px;" 
                @change="loadComponentConfig"
                filterable
              >
                <el-option 
                  v-for="item in components" 
                  :key="item.id" 
                  :label="item.name" 
                  :value="item.id" 
                />
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
                <el-input 
                  v-model="requestForm.url" 
                  placeholder="请输入请求URL，如：https://jsonplaceholder.typicode.com/users" 
                  size="large"
                  clearable
                />
              </div>
            </el-form-item>

            <el-tabs v-model="activeTab" class="config-tabs">
              <el-tab-pane label="请求头" name="headers">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Headers (JSON格式)</span>
                    <div class="editor-actions">
                      <el-button size="small" type="success" link @click="fillExampleHeaders">示例</el-button>
                      <el-button size="small" type="primary" link @click="formatJson('headers')">格式化</el-button>
                    </div>
                  </div>
                  <el-input
                    v-model="requestForm.headers"
                    type="textarea"
                    :rows="4"
                    placeholder='{"Content-Type":"application/json"}'
                    class="json-textarea"
                  />
                </div>
              </el-tab-pane>
              <el-tab-pane label="URL参数" name="params">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Query Params (JSON格式)</span>
                    <div class="editor-actions">
                      <el-button size="small" type="success" link @click="fillExampleParams">示例</el-button>
                      <el-button size="small" type="primary" link @click="formatJson('params')">格式化</el-button>
                    </div>
                  </div>
                  <el-input
                    v-model="requestForm.params"
                    type="textarea"
                    :rows="4"
                    placeholder='{"page":1,"size":10}'
                    class="json-textarea"
                  />
                </div>
              </el-tab-pane>
              <el-tab-pane label="请求体" name="body">
                <div class="json-editor-wrapper">
                  <div class="json-editor-header">
                    <span>Body (JSON格式)</span>
                    <div class="editor-actions">
                      <el-button size="small" type="success" link @click="fillExampleBody">示例</el-button>
                      <el-button size="small" type="primary" link @click="formatJson('body')">格式化</el-button>
                    </div>
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
              <el-button :icon="Delete" @click="handleClear">清空</el-button>
              <el-button :icon="CopyDocument" @click="handleCopyRequest">复制请求</el-button>
              <el-button type="primary" :loading="sending" :icon="Promotion" @click="handleSend">
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
                <el-tag :type="responseData.success ? 'success' : 'danger'" effect="dark">
                  {{ responseData.success ? '成功' : '失败' }}
                </el-tag>
                <el-tag v-if="responseData.status" type="info" effect="light">
                  Status: {{ responseData.status }}
                </el-tag>
                <el-tag type="warning" effect="light">
                  耗时: {{ responseData.duration }}ms
                </el-tag>
              </div>
            </div>
          </template>

          <div v-if="!responseData && !loading" class="empty-response">
            <el-empty description="点击左侧「发送请求」测试API">
              <el-button type="primary" @click="fillQuickTest">快速测试示例</el-button>
            </el-empty>
          </div>

          <div v-else-if="loading" class="empty-response">
            <el-empty description="请求发送中...">
              <el-icon class="is-loading" size="30">
                <Loading />
              </el-icon>
            </el-empty>
          </div>

          <div v-else class="response-content">
            <el-tabs v-model="responseTab" class="response-tabs">
              <el-tab-pane label="响应数据" name="data">
                <div class="json-preview">
                  <div class="json-preview-header">
                    <span>Response Body</span>
                    <div class="editor-actions">
                      <el-button size="small" type="primary" link @click="copyResponse">复制</el-button>
                      <el-button size="small" type="success" link @click="downloadResponse">下载</el-button>
                    </div>
                  </div>
                  <pre class="json-preview-content" v-html="formattedResponseHtml"></pre>
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
import { Promotion, Delete, CopyDocument, Loading } from '@element-plus/icons-vue';
import type { ComponentConfig } from '../types';
import { getComponentList } from '../api/component';
import { forwardApiRequest } from '../api/request';

const route = useRoute();

const activeTab = ref('headers');
const responseTab = ref('data');
const sending = ref(false);
const loading = ref(false);
const selectedComponentId = ref('');
const components = ref<ComponentConfig[]>([]);

const requestForm = reactive({
  method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: '',
  headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
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
    if (typeof responseData.value.data === 'string') {
      return responseData.value.data;
    }
    return JSON.stringify(responseData.value.data, null, 2);
  } catch {
    return String(responseData.value.data);
  }
});

const formattedResponseHtml = computed(() => {
  const json = formattedResponse.value;
  try {
    const parsed = JSON.parse(json);
    return syntaxHighlight(JSON.stringify(parsed, null, 2));
  } catch {
    return `<span style="color: #606266;">${escapeHtml(json)}</span>`;
  }
});

const formattedHeaders = computed(() => {
  if (!responseData.value?.headers) return '';
  return JSON.stringify(responseData.value.headers, null, 2);
});

function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'color: #606266;';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'color: #f56c6c;';
      } else {
        cls = 'color: #67c23a;';
      }
    } else if (/true|false/.test(match)) {
      cls = 'color: #409eff;';
    } else if (/null/.test(match)) {
      cls = 'color: #909399;';
    } else {
      cls = 'color: #e6a23c;';
    }
    return '<span style="' + cls + '">' + match + '</span>';
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const loadComponents = async () => {
  try {
    const res = await getComponentList({ current: 1, size: 1000 });
    if (res.code === 200 || res.code === 0) {
      components.value = (res.data as any).records || [];
      console.log('加载组件列表成功，数量:', components.value.length);
    }
  } catch {
    console.log('加载组件列表失败');
    components.value = [];
  }
};

const loadComponentConfig = () => {
  const component = components.value.find(c => c.id === selectedComponentId.value);
  if (component) {
    console.log('加载组件配置:', component);
    requestForm.method = (component.apiMethod as any) || 'GET';
    requestForm.url = component.apiUrl || '';
    
    try {
      requestForm.headers = component.apiHeaders ? JSON.stringify(JSON.parse(component.apiHeaders), null, 2) : '{}';
    } catch {
      requestForm.headers = component.apiHeaders || '{}';
    }
    
    try {
      requestForm.params = component.apiParams ? JSON.stringify(JSON.parse(component.apiParams), null, 2) : '{}';
    } catch {
      requestForm.params = component.apiParams || '{}';
    }
    
    ElMessage.success('已加载组件配置');
  }
};

const formatJson = (field: 'headers' | 'params' | 'body') => {
  try {
    const value = requestForm[field];
    const parsed = JSON.parse(value || '{}');
    requestForm[field] = JSON.stringify(parsed, null, 2);
    ElMessage.success('格式化成功');
  } catch {
    ElMessage.error('JSON 格式错误');
  }
};

const fillExampleHeaders = () => {
  requestForm.headers = JSON.stringify({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here',
    'X-Custom-Header': 'custom-value'
  }, null, 2);
  ElMessage.success('已填充示例请求头');
};

const fillExampleParams = () => {
  requestForm.params = JSON.stringify({
    page: 1,
    size: 10,
    keyword: 'test',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }, null, 2);
  ElMessage.success('已填充示例参数');
};

const fillExampleBody = () => {
  requestForm.body = JSON.stringify({
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    address: {
      city: '北京',
      street: '某某街道123号'
    },
    tags: ['VIP', '新用户'],
    active: true
  }, null, 2);
  ElMessage.success('已填充示例请求体');
};

const fillQuickTest = () => {
  requestForm.method = 'GET';
  requestForm.url = 'https://jsonplaceholder.typicode.com/users/1';
  requestForm.headers = JSON.stringify({ 'Content-Type': 'application/json' }, null, 2);
  requestForm.params = '{}';
  requestForm.body = '{}';
  ElMessage.success('已填充快速测试配置');
};

const handleClear = () => {
  requestForm.method = 'GET';
  requestForm.url = '';
  requestForm.headers = JSON.stringify({ 'Content-Type': 'application/json' }, null, 2);
  requestForm.params = '{}';
  requestForm.body = '{}';
  responseData.value = null;
  ElMessage.info('已清空');
};

const handleCopyRequest = async () => {
  const curlCommand = generateCurlCommand();
  try {
    await navigator.clipboard.writeText(curlCommand);
    ElMessage.success('已复制curl命令到剪贴板');
  } catch {
    ElMessage.error('复制失败');
  }
};

const generateCurlCommand = (): string => {
  let cmd = `curl -X ${requestForm.method}`;
  
  try {
    const headers = JSON.parse(requestForm.headers);
    Object.entries(headers).forEach(([key, value]) => {
      cmd += ` -H "${key}: ${value}"`;
    });
  } catch {}
  
  if (requestForm.method !== 'GET') {
    try {
      const body = JSON.parse(requestForm.body);
      cmd += ` -d '${JSON.stringify(body)}'`;
    } catch {}
  }
  
  try {
    const params = JSON.parse(requestForm.params);
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (queryString) {
      cmd += ` '${requestForm.url}?${queryString}'`;
    } else {
      cmd += ` '${requestForm.url}'`;
    }
  } catch {
    cmd += ` '${requestForm.url}'`;
  }
  
  return cmd;
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
  loading.value = true;
  responseData.value = null;

  console.log('发送请求:', {
    url: requestForm.url,
    method: requestForm.method,
    headers,
    params,
    body
  });

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

    console.log('API返回结果:', res);

    if (res.code === 200 || res.code === 0) {
      responseData.value = {
        success: true,
        status: res.data.status,
        data: res.data.data,
        headers: res.data.headers,
        duration: res.data.duration
      };
      ElMessage.success('请求成功！');
    } else {
      responseData.value = {
        success: false,
        error: res.message,
        duration: 0
      };
      ElMessage.error(res.message || '请求失败');
    }
  } catch (error: any) {
    console.error('请求错误:', error);
    
    await sendMockRequest();
  } finally {
    sending.value = false;
    loading.value = false;
  }
};

const sendMockRequest = async () => {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const mockData = {
    id: 1,
    name: 'Leanne Graham',
    username: 'Bret',
    email: 'Sincere@april.biz',
    address: {
      street: 'Kulas Light',
      suite: 'Apt. 556',
      city: 'Gwenborough',
      zipcode: '92998-3874',
      geo: { lat: '-37.3159', lng: '81.1496' }
    },
    phone: '1-770-736-8031 x56442',
    website: 'hildegard.org',
    company: {
      name: 'Romaguera-Crona',
      catchPhrase: 'Multi-layered client-server neural-net',
      bs: 'harness real-time e-markets'
    }
  };
  
  responseData.value = {
    success: true,
    status: 200,
    data: mockData,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-powered-by': 'Mock Server',
      'date': new Date().toUTCString()
    },
    duration: Date.now() - startTime
  };
  ElMessage.success('请求成功（模拟数据，后端服务未连接）');
};

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(formattedResponse.value);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败');
  }
};

const downloadResponse = () => {
  const blob = new Blob([formattedResponse.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `response_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ElMessage.success('响应已下载');
};

onMounted(() => {
  console.log('接口调试页面挂载完成');
  loadComponents();
  
  const componentId = route.query.componentId as string;
  if (componentId) {
    selectedComponentId.value = componentId;
    setTimeout(() => {
      loadComponentConfig();
    }, 500);
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

.config-tabs,
.response-tabs {
  margin-top: 10px;
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

.editor-actions {
  display: flex;
  gap: 5px;
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
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.response-status {
  display: flex;
  gap: 8px;
}

.empty-response {
  height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.response-content {
  min-height: 450px;
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
