<template>
  <div class="servers-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务器管理</span>
          <el-button
            v-if="isOperator"
            type="primary"
            @click="handleAdd"
            :icon="Plus"
          >
            添加服务器
          </el-button>
        </div>
      </template>
      <el-table :data="servers" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" width="180">
          <template #default="{ row }">
            <router-link :to="`/servers/${row.id}`" class="server-link">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="hostname" label="主机名" width="180" />
        <el-table-column prop="osType" label="操作系统" width="120" />
        <el-table-column label="配置" width="220">
          <template #default="{ row }">
            {{ row.cpuCores || '-' }}核 / {{ row.totalMemoryGb || '-' }}GB / {{ row.totalDiskGb || '-' }}GB
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="200" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
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
      :title="isEdit ? '编辑服务器' : '添加服务器'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务器名称" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ipAddress">
          <el-input v-model="form.ipAddress" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="主机名">
          <el-input v-model="form.hostname" placeholder="请输入主机名" />
        </el-form-item>
        <el-form-item label="操作系统">
          <el-select v-model="form.osType" placeholder="请选择操作系统" style="width: 100%">
            <el-option label="Linux" value="Linux" />
            <el-option label="Windows" value="Windows" />
            <el-option label="macOS" value="macOS" />
            <el-option label="其他" value="Other" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统版本">
          <el-input v-model="form.osVersion" placeholder="请输入系统版本" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="CPU核心">
              <el-input-number
                v-model="form.cpuCores"
                :min="1"
                :max="256"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内存(GB)">
              <el-input-number
                v-model="form.totalMemoryGb"
                :min="1"
                :max="4096"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="磁盘(GB)">
              <el-input-number
                v-model="form.totalDiskGb"
                :min="1"
                :max="102400"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
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
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { serverApi } from '@/api'

const authStore = useAuthStore()
const isOperator = computed(() => authStore.isOperator)

const loading = ref(false)
const servers = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const submitting = ref(false)

const form = reactive({
  id: null,
  name: '',
  ipAddress: '',
  hostname: '',
  osType: '',
  osVersion: '',
  cpuCores: 4,
  totalMemoryGb: 8,
  totalDiskGb: 100,
  description: '',
  status: 'OFFLINE'
})

const rules = {
  name: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  ipAddress: [
    { required: true, message: '请输入IP地址', trigger: 'blur' }
  ]
}

function getStatusType(status) {
  switch (status) {
    case 'ONLINE': return 'success'
    case 'OFFLINE': return 'info'
    case 'WARNING': return 'warning'
    case 'ERROR': return 'danger'
    case 'CRITICAL': return 'danger'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'ONLINE': return '在线'
    case 'OFFLINE': return '离线'
    case 'WARNING': return '警告'
    case 'ERROR': return '错误'
    case 'CRITICAL': return '严重'
    default: return status
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await serverApi.getList()
    servers.value = res.data || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    name: '',
    ipAddress: '',
    hostname: '',
    osType: '',
    osVersion: '',
    cpuCores: 4,
    totalMemoryGb: 8,
    totalDiskGb: 100,
    description: '',
    status: 'OFFLINE'
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
    `确定要删除服务器 "${row.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await serverApi.delete(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await serverApi.update(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await serverApi.create(form)
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
.servers-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-link {
  color: #409eff;
  text-decoration: none;
}

.server-link:hover {
  text-decoration: underline;
}
</style>
