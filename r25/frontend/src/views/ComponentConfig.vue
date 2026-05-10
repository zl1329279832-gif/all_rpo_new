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

      <el-steps :active="activeStep" finish-status="success" style="margin-bottom: 30px;">
        <el-step title="基本配置" />
        <el-step title="接口配置" />
        <el-step title="预览确认" />
      </el-steps>

      <div v-if="activeStep === 0" class="step-content">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px" style="max-width: 800px;">
          <el-form-item label="组件名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入组件名称（必填）" />
          </el-form-item>
          <el-form-item label="组件描述" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入组件描述（必填）" />
          </el-form-item>
          <el-form-item label="组件类型" prop="componentType">
            <el-select v-model="formData.componentType" placeholder="请选择组件类型" style="width: 200px;">
              <el-option label="文本框 (input)" value="input" />
              <el-option label="下拉框 (select)" value="select" />
              <el-option label="单选框 (radio)" value="radio" />
              <el-option label="多选框 (checkbox)" value="checkbox" />
              <el-option label="文本域 (textarea)" value="textarea" />
              <el-option label="日期选择 (date)" value="date" />
              <el-option label="数字框 (number)" value="number" />
            </el-select>
          </el-form-item>
          <el-form-item label="默认值">
            <el-input v-model="formData.defaultValue" placeholder="请输入默认值（可选）" />
          </el-form-item>
          <el-form-item label="是否必填">
            <el-switch v-model="formData.isRequired" active-text="是" inactive-text="否" />
          </el-form-item>
          <el-form-item label="验证规则">
            <el-input v-model="formData.validationRule" placeholder="请输入正则表达式验证规则（可选）" />
          </el-form-item>
          <el-form-item label="占位文本">
            <el-input v-model="formData.placeholder" placeholder="请输入占位文本（可选）" />
          </el-form-item>
          <el-form-item label="选项配置" v-if="['select', 'radio', 'checkbox'].includes(formData.componentType)">
            <div class="json-editor-wrapper">
              <div class="json-editor-header">
                <span>选项配置 (JSON数组格式)</span>
                <el-button size="small" type="primary" link @click="formatOptions">格式化</el-button>
                <el-button size="small" type="success" link @click="fillExampleOptions">填充示例</el-button>
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

        <div class="step-actions">
          <el-button @click="handleBack">取消</el-button>
          <el-button type="primary" @click="handleNextStep">下一步</el-button>
        </div>
      </div>

      <div v-if="activeStep === 1" class="step-content">
        <el-form :model="formData" ref="apiFormRef" label-width="120px" style="max-width: 900px;">
          <el-alert
            title="接口配置用于组件的API调用，可根据需要配置"
            type="info"
            show-icon
            :closable="false"
            style="margin-bottom: 20px;"
          />
          <el-form-item label="接口地址">
            <el-input v-model="formData.apiUrl" placeholder="请输入接口地址，如：https://api.example.com/users" />
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

        <div class="step-actions">
          <el-button @click="handlePrevStep">上一步</el-button>
          <el-button type="primary" @click="handleNextStep">下一步</el-button>
        </div>
      </div>

      <div v-if="activeStep === 2" class="step-content">
        <div class="json-preview">
          <div class="json-preview-header">
            <span>组件配置预览</span>
            <el-button size="small" type="primary" link @click="copyConfig">复制配置</el-button>
          </div>
          <pre class="json-preview-content">{{ formattedConfig }}</pre>
        </div>

        <div class="step-actions">
          <el-button @click="handlePrevStep">上一步</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            {{ isEdit ? '保存修改' : '创建组件' }}
          </el-button>
        </div>
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
import { createComponent, updateComponent, getComponentDetail } from '../api/component';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const apiFormRef = ref<FormInstance>();
const saving = ref(false);
const activeStep = ref(0);

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
  apiHeaders: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
  apiParams: '{}'
});

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入组件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入组件描述', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  componentType: [
    { required: true, message: '请选择组件类型', trigger: 'change' }
  ]
};

const formattedConfig = computed(() => {
  try {
    let options = [];
    let headers = {};
    let params = {};

    try {
      options = JSON.parse(formData.options || '[]');
    } catch { options = []; }
    try {
      headers = JSON.parse(formData.apiHeaders || '{}');
    } catch { headers = {}; }
    try {
      params = JSON.parse(formData.apiParams || '{}');
    } catch { params = {}; }

    const config = {
      name: formData.name,
      description: formData.description,
      componentType: formData.componentType,
      defaultValue: formData.defaultValue,
      isRequired: formData.isRequired,
      validationRule: formData.validationRule,
      placeholder: formData.placeholder,
      options,
      apiConfig: {
        url: formData.apiUrl,
        method: formData.apiMethod,
        headers,
        params
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
    ElMessage.success('格式化成功');
  } catch {
    ElMessage.error('选项配置 JSON 格式错误');
  }
};

const fillExampleOptions = () => {
  const examples: Record<string, any[]> = {
    select: [
      { label: '选项1', value: 'option1' },
      { label: '选项2', value: 'option2' },
      { label: '选项3', value: 'option3' }
    ],
    radio: [
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' }
    ],
    checkbox: [
      { label: '查看', value: 'view' },
      { label: '编辑', value: 'edit' },
      { label: '删除', value: 'delete' }
    ]
  };
  formData.options = JSON.stringify(examples[formData.componentType || 'select'] || [], null, 2);
  ElMessage.success('已填充示例数据');
};

const formatHeaders = () => {
  try {
    const parsed = JSON.parse(formData.apiHeaders || '{}');
    formData.apiHeaders = JSON.stringify(parsed, null, 2);
    ElMessage.success('格式化成功');
  } catch {
    ElMessage.error('请求头 JSON 格式错误');
  }
};

const formatParams = () => {
  try {
    const parsed = JSON.parse(formData.apiParams || '{}');
    formData.apiParams = JSON.stringify(parsed, null, 2);
    ElMessage.success('格式化成功');
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
  console.log('加载组件详情，ID:', componentId.value);
  
  try {
    const res = await getComponentDetail(componentId.value);
    console.log('API返回结果:', res);
    
    if (res.code === 200 || res.code === 0) {
      Object.assign(formData, res.data);
      ElMessage.success('加载成功');
    }
  } catch (error) {
    console.error('加载组件失败:', error);
    ElMessage.warning('加载组件详情失败，使用默认表单');
  }
};

const handleBack = () => {
  if (!saving.value) {
    router.push('/components');
  }
};

const handleNextStep = async () => {
  if (activeStep.value === 0) {
    if (!formRef.value) return;
    
    try {
      await formRef.value.validate();
      activeStep.value = 1;
    } catch {
      ElMessage.error('请完善必填项');
      return;
    }
  } else if (activeStep.value === 1) {
    activeStep.value = 2;
  }
};

const handlePrevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
};

const handleSubmit = async () => {
  saving.value = true;
  console.log('提交表单数据:', formData);
  
  try {
    let result;
    if (isEdit.value) {
      console.log('更新组件，ID:', componentId.value);
      result = await updateComponent(componentId.value, formData);
      console.log('更新结果:', result);
      ElMessage.success('更新成功！');
    } else {
      console.log('创建新组件');
      result = await createComponent(formData);
      console.log('创建结果:', result);
      ElMessage.success('创建成功！');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/components');
  } catch (error) {
    console.error('保存失败:', error);
    
    await ElMessageBox.confirm(
      '保存失败，可能是后端服务未启动。是否继续返回列表？',
      '保存提示',
      {
        confirmButtonText: '返回列表',
        cancelButtonText: '继续编辑',
        type: 'warning'
      }
    );
    router.push('/components');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  console.log('组件配置页面挂载完成');
  console.log('当前模式:', isEdit.value ? '编辑模式' : '新建模式');
  console.log('组件ID:', componentId.value);
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

.step-content {
  min-height: 400px;
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
  max-height: 400px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
