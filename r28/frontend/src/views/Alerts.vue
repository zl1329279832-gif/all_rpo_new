<template>
  <div class="alerts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警记录</span>
          <div class="filters">
            <el-select v-model="filterStatus" placeholder="状态" style="width: 140px; margin-right: 10px;" @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="活跃" value="ACTIVE" />
              <el-option label="已确认" value="ACKNOWLEDGED" />
              <el-option label="已处理" value="RESOLVED" />
            </el-select>
            <el-select v-model="filterLevel" placeholder="级别" style="width: 120px; margin-right: 10px;" @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="信息" :value="1" />
              <el-option label="警告" :value="2" />
              <el-option label="错误" :value="3" />
              <el-option label="严重" :value="4" />
            </el-select>
            <el-button type="primary" @click="loadData" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="alerts" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="serverId" label="服务器ID" width="100" />
        <el-table-column prop="metricType" label="指标类型" width="100">
          <template #default="{ row }">
            {{ getMetricTypeName(row.metricType) }}
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :class="`alert-level-${row.alertLevel}`" size="small">
              {{ getAlertLevelName(row.alertLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="告警信息" min-width="200" />
        <el-table-column label="当前值/阈值" width="160">
          <template #default="{ row }">
            {{ row.currentValue }} / {{ row.thresholdValue }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occurredAt" label="发生时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'ACTIVE' && isOperator">
              <el-button
                type="primary"
                link
                size="small"
                @click="acknowledgeAlert(row)"
              >
                确认
              </el-button>
            </template>
            <template v-if="row.status !== 'RESOLVED' && isOperator">
              <el-button
                type="success"
                link
                size="small"
                @click="resolveAlert(row)"
              >
                处理
              </el-button>
            </template>
            <el-dropdown v-if="isOperator" @command="(cmd) => changeLevel(row, cmd)">
              <el-button type="warning" link size="small">
                调整级别 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">信息</el-dropdown-item>
                  <el-dropdown-item :command="2">警告</el-dropdown-item>
                  <el-dropdown-item :command="3">错误</el-dropdown-item>
                  <el-dropdown-item :command="4">严重</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { alertApi } from '@/api'

const authStore = useAuthStore()
const isOperator = computed(() => authStore.isOperator)

const loading = ref(false)
const alerts = ref([])
const filterStatus = ref('')
const filterLevel = ref('')

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

function getStatusType(status) {
  switch (status) {
    case 'ACTIVE': return 'danger'
    case 'ACKNOWLEDGED': return 'warning'
    case 'RESOLVED': return 'success'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'ACTIVE': return '活跃'
    case 'ACKNOWLEDGED': return '已确认'
    case 'RESOLVED': return '已处理'
    default: return status
  }
}

async function loadData() {
  loading.value = true
  try {
    let res
    if (filterStatus.value) {
      res = await alertApi.getByStatus(filterStatus.value)
    } else if (filterLevel.value) {
      res = await alertApi.getByLevel(filterLevel.value)
    } else {
      res = await alertApi.getRecent(168)
    }
    alerts.value = res.data || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function acknowledgeAlert(row) {
  try {
    await alertApi.acknowledge(row.id)
    ElMessage.success('已确认告警')
    loadData()
  } catch (e) {
  }
}

async function resolveAlert(row) {
  try {
    await alertApi.resolve(row.id)
    ElMessage.success('已标记为已处理')
    loadData()
  } catch (e) {
  }
}

async function changeLevel(row, newLevel) {
  try {
    await alertApi.updateLevel(row.id, newLevel)
    ElMessage.success('告警级别已更新')
    loadData()
  } catch (e) {
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.alerts-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  align-items: center;
}
</style>
