<template>
  <div class="alert-rules-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警规则配置</span>
          <el-button
            v-if="isOperator"
            type="primary"
            @click="handleAdd"
            :icon="Plus"
          >
            添加规则
          </el-button>
        </div>
      </template>
      <el-table :data="rules" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="规则名称" width="200" />
        <el-table-column prop="metricType" label="指标类型" width="100">
          <template #default="{ row }">
            {{ getMetricTypeName(row.metricType) }}
          </template>
        </el-table-column>
        <el-table-column label="条件" width="200">
          <template #default="{ row }">
            {{ getMetricTypeName(row.metricType) }} {{ row.operator }} {{ row.threshold }}%
          </template>
        </el-table-column>
        <el-table-column label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag :class="`alert-level-${row.alertLevel}`" size="small">
              {{ getAlertLevelName(row.alertLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="作用范围" width="120">
          <template #default="{ row }">
            {{ row.serverId ? `服务器 #${row.serverId}` : '全局' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              active-text="启用"
              inactive-text="禁用"
              @change="toggleEnabled(row)"
              :disabled="!isOperator"
            />
          </template>
        </el-table-column>
        <el-table-column label="静默" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.silenced"
              active-text="静默"
              inactive-text="正常"
              @change="toggleSilenced(row)"
              :disabled="!isOperator"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="isOperator"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="isOperator"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规则' : '添加规则'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="指标类型" prop="metricType">
          <el-select v-model="form.metricType" placeholder="请选择指标类型" style="width: 100%">
            <el-option label="CPU使用率" value="CPU" />
            <el-option label="内存使用率" value="MEMORY" />
            <el-option label="磁盘使用率" value="DISK" />
            <el-option label="网络带宽" value="NETWORK" />
          </el-select>
        </el-form-item>
        <el-form-item label="比较符" prop="operator">
          <el-select v-model="form.operator" placeholder="请选择比较符" style="width: 100%">
            <el-option label="大于 (>)" value=">" />
            <el-option label="大于等于 (>=)" value=">=" />
            <el-option label="小于 (<)" value="<" />
            <el-option label="小于等于 (<=)" value="<=" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number
            v-model="form.threshold"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="告警级别" prop="alertLevel">
          <el-select v-model="form.alertLevel" placeholder="请选择告警级别" style="width: 100%">
            <el-option label="信息" :value="1" />
            <el-option label="警告" :value="2" />
            <el-option label="错误" :value="3" />
            <el-option label="严重" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标服务器">
          <el-select
            v-model="form.serverId"
            placeholder="留空则为全局规则"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="server in servers"
              :key="server.id"
              :label="`${server.name} (${server.ipAddress})`"
              :value="server.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入规则描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { alertApi, serverApi } from '@/api'

const authStore = useAuthStore()
const isOperator = computed(() => authStore.isOperator)

const loading = ref(false)
const rules = ref([])
const servers = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const submitting = ref(false)

const form = reactive({
  id: null,
  name: '',
  metricType: 'CPU',
  operator: '>',
  threshold: 80,
  alertLevel: 2,
  serverId: null,
  description: '',
  enabled: true,
  silenced: false
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  metricType: [{ required: true, message: '请选择指标类型', trigger: 'change' }],
  operator: [{ required: true, message: '请选择比较符', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }],
  alertLevel: [{ required: true, message: '请选择告警级别', trigger: 'change' }]
}

function getMetricTypeName(type) {
  switch (type) {
    case 'CPU': return 'CPU'
    case 'MEMORY': return '内存'
    case 'DISK': return '磁盘'
    case 'NETWORK': return '网络'
    default: return type
  }
}

function getAlertLevelName(level) {
  switch (level) {
    case 1: return '信息'
    case 2: return '警告'
    case 3: return '错误'
    case 4: return '严重'
    default: return '未知'
  }
}

async function loadData() {
  loading.value = true
  try {
    const [rulesRes, serversRes] = await Promise.all([
      alertApi.getRules(),
      serverApi.getList().catch(() => ({ data: [] }))
    ])
    rules.value = rulesRes.data || []
    servers.value = serversRes.data || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    metricType: 'CPU',
    operator: '>',
    threshold: 80,
    alertLevel: 2,
    serverId: null,
    description: '',
    enabled: true,
    silenced: false
  })
}

function handleAdd() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除规则 "${row.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await alertApi.deleteRule(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

async function toggleEnabled(row) {
  try {
    await alertApi.updateRule(row.id, { enabled: row.enabled })
    ElMessage.success('状态已更新')
  } catch (e) {
    row.enabled = !row.enabled
  }
}

async function toggleSilenced(row) {
  try {
    await alertApi.updateRule(row.id, { silenced: row.silenced })
    ElMessage.success('状态已更新')
  } catch (e) {
    row.silenced = !row.silenced
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await alertApi.updateRule(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await alertApi.createRule(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.alert-rules-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
