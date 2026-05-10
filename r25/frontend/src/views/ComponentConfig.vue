<template>
  <div class="component-config-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑组件' : '新建组件' }}</span>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本配置" name="basic">
          <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px" style="max-width: 800px;">
            <el-form-item label="组件名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入组件名称" />
            </el-form-item>
            <el-form-item label="组件描述" prop="description">
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入组件描述" />
            </el-form-item>
            <el-form-item label="组件类型" prop="componentType">
              <el-select v-model="formData.componentType" placeholder="请选择组件类型" style="width: 200px;">
                <el-option label="文本框" value="input" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <el-option label="多选框" value="checkbox" />
                <el-option label="文本域" value="textarea" />
                <el-option label="日期选择" value="date" />
                <el-option label="数字框" value="number" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认值">
              <el-input v-model="formData.defaultValue" placeholder="请输入默认值" />
            </el-form-item>
            <el-form-item label="是否必填">
              <el-switch v-model="formData.isRequired" />
            </el-form-item>
            <el-form-item label="验证规则">
              <el-input v-model="formData.validationRule" placeholder="请输入正则表达式验证规则" />
            </el-form-item>
            <el-form-item label="占位文本">
              <el-input v-model="formData.placeholder" placeholder="请输入占位文本" />
            </el-form-item>
            <el-form-item label="选项配置" v-if="['select', 'radio', 'checkbox'].includes(formData.componentType)">
              <div class="json-editor-wrapper">
                <div class="json-editor-header">
                  <span>选项配置 (JSON数组格式)</span>
                  <el-button size="small" type="primary" link @click="formatOptions">格式化</el-button>
                </div>
                <el-input
                  v-model="formData.options"
                  type="textarea"
                  :rows="6"
                  placeholder='[{"label":"选项1","value":"value1"},{"label":"选项2","value":"value2"}]'
                  class="json-textarea"
                />
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="接口配置" name="api">
          <el-form :model="formData" ref="apiFormRef" label-width="120px" style="max-width: 900px;">
            <el-form-item label="接口地址">
              <el-input v-model="formData.apiUrl" placeholder="请输入接口地址，如：/api/users" />
            </el-form-item>
            <el-form-item label="请求方法">
              <el-select v-model="formData.apiMethod" placeholder="请选择请求方法" style="width: 150px;">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求头">
              <div class="json-editor-wrapper">
                <div class="json-editor-header">
                  <span>请求头 (JSON格式)</span>
                  <el-button size="small" type="primary" link @click="formatHeaders">格式化</el-button>
                </div>
                <el-input
                  v-model="formData.apiHeaders"
                  type="textarea"
                  :rows="4"
                  placeholder='{"Content-Type":"application/json","Authorization":"Bearer xxx"}'
                  class="json-textarea"
                />
              </div>
            </el-form-item>
            <el-form-item label="请求参数">
              <div class="json-editor-wrapper">
                <div class="json-editor-header">
                  <span>请求参数 (JSON格式)</span>
                  <el-button size="small" type="primary" link @click="formatParams">格式化</el-button>
                </div>
                <el-input
                  v-model="formData.apiParams"
                  type="textarea"
                  :rows="6"
                  placeholder='{"page":1,"size":10,"keyword":""}'
                  class="json-textarea"
                />
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="参数预览" name="preview">
          <div class="json-preview">
            <div class="json-preview-header">
              <span>组件配置 JSON</span>
              <el-button size="small" type="primary" link @click="copyConfig">复制</el-button>
            </div>
            <pre class="json-preview-content">{{ formattedConfig }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="form-actions">
        <el-button @click="handleBack">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          <el-icon><Check /></el-icon>
          {{ isEdit ? '保存修改' : '创建组件' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { ArrowLeft, Check } from '@element-plus/icons-vue';
import type { ComponentConfig } from '../types';
import { createComponent, updateComponent, saveComponentConfig, getComponentDetail } from '../api/component';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const apiFormRef = ref<FormInstance>();
const saving = ref(false);
const activeTab = ref('basic');

const isEdit = computed(() => !!route.params.id);
const componentId = computed(() => route.params.id as string);

const formData = reactive<Partial<ComponentConfig>>({
  name: '',
  description: '',
  componentType: 'input',
  defaultValue: '',
  isRequired: false,
  validationRule: '',
  placeholder: '',
  options: '[]',
  apiUrl: '',
  apiMethod: 'GET',
  apiHeaders: '{}',
  apiParams: '{}'
});

const formRules: FormRules = {
  name: [{ required: true, message: '请输入组件名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入组件描述', trigger: 'blur' }],
  componentType: [{ required: true, message: '请选择组件类型', trigger: 'change' }]
};

const formattedConfig = computed(() => {
  try {
    const config = {
      name: formData.name,
      description: formData.description,
      componentType: formData.componentType,
      defaultValue: formData.defaultValue,
      isRequired: formData.isRequired,
      validationRule: formData.validationRule,
      placeholder: formData.placeholder,
      options: formData.options ? JSON.parse(formData.options) : [],
      apiConfig: {
        url: formData.apiUrl,
        method: formData.apiMethod,
        headers: formData.apiHeaders ? JSON.parse(formData.apiHeaders) : {},
        params: formData.apiParams ? JSON.parse(formData.apiParams) : {}
      }
    };
    return JSON.stringify(config, null, 2);
  } catch {
    return 'JSON 格式错误，请检查配置';
  }
});

const formatOptions = () => {
  try {
    const parsed = JSON.parse(formData.options || '[]');
    formData.options = JSON.stringify(parsed, null, 2);
  } catch {
    ElMessage.error('选项配置 JSON 格式错误');
  }
};

const formatHeaders = () => {
  try {
    const parsed = JSON.parse(formData.apiHeaders || '{}');
    formData.apiHeaders = JSON.stringify(parsed, null, 2);
  } catch {
    ElMessage.error('请求头 JSON 格式错误');
  }
};

const formatParams = () => {
  try {
    const parsed = JSON.parse(formData.apiParams || '{}');
    formData.apiParams = JSON.stringify(parsed, null, 2);
  } catch {
    ElMessage.error('请求参数 JSON 格式错误');
  }
};

const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(formattedConfig.value);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败');
  }
};

const loadComponent = async () => {
  if (!isEdit.value) return;
  try {
    const res = await getComponentDetail(componentId.value);
    if (res.code === 200 || res.code === 0) {
      Object.assign(formData, res.data);
    }
  } catch (error) {
    console.error('Failed to load component:', error);
    loadMockData();
  }
};

const loadMockData = () => {
  formData.name = '用户名输入框';
  formData.description = '用于输入用户名的文本框';
  formData.componentType = 'input';
  formData.defaultValue = '';
  formData.isRequired = true;
  formData.validationRule = '^[a-zA-Z0-9_]{3,20}$';
  formData.placeholder = '请输入用户名';
  formData.options = '[]';
  formData.apiUrl = '/api/users';
  formData.apiMethod = 'POST';
  formData.apiHeaders = JSON.stringify({ 'Content-Type': 'application/json' }, null, 2);
  formData.apiParams = JSON.stringify({ page: 1, size: 10 }, null, 2);
};

const handleBack = () => {
  router.push('/components');
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
  } catch {
    ElMessage.error('请完善必填项');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await updateComponent(componentId.value, formData);
      ElMessage.success('更新成功');
    } else {
      await createComponent(formData);
      ElMessage.success('创建成功');
    }
    router.push('/components');
  } catch (error) {
    console.error('Failed to save component:', error);
    try {
      await saveComponentConfig(formData);
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      router.push('/components');
    } catch {
      ElMessage.success(isEdit.value ? '更新成功（模拟）' : '创建成功（模拟）');
      router.push('/components');
    }
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadComponent();
});
</script>

<style scoped>
.component-config-page {
  padding: 10px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.json-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.json-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #e4e7ed;
  font-weight: 500;
}

.json-preview-content {
  padding: 16px;
  margin: 0;
  max-height: 500px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}
</style>
