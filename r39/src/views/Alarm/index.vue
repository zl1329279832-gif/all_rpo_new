<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, Clock, CircleCheck } from '@element-plus/icons-vue'
import { getAlarmList, handleAlarm } from '../../api/alarm'
import type { Alarm, AlarmParams, AlarmLevel, AlarmStatus } from '../../types'
import { useTable } from '../../hooks/useTable'
import { usePermission } from '../../hooks/usePermission'

const { hasRoleAccess } = usePermission()

const filterForm = reactive({
  level: '',
  status: '',
  keyword: ''
})

const levelOptions = [
  { label: '紧急', value: 'critical' },
  { label: '重要', value: 'major' },
  { label: '次要', value: 'minor' },
  { label: '提示', value: 'warning' }
]

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已忽略', value: 'ignored' }
]

const {
  loading,
  data: alarmList,
  total,
  params,
  fetchData,
  handleSizeChange,
  handleCurrentChange,
  updateParams
} = useTable<Alarm, AlarmParams>({
  apiFn: getAlarmList
})

const selectedIds = ref<string[]>([])
const handleDialogVisible = ref(false)
const handleForm = reactive({
  status: 'resolved' as AlarmStatus,
  remark: ''
})

function handleSearch() {
  updateParams({
    level: filterForm.level as AlarmLevel,
    status: filterForm.status as AlarmStatus,
    keyword: filterForm.keyword
  } as any)
}

function handleReset() {
  filterForm.level = ''
  filterForm.status = ''
  filterForm.keyword = ''
  updateParams({ level: undefined, status: undefined, keyword: '' } as any)
}

function handleSelectionChange(selection: Alarm[]) {
  selectedIds.value = selection.map(a => a.id)
}

function openHandleDialog() {
  handleForm.status = 'resolved'
  handleForm.remark = ''
  handleDialogVisible.value = true
}

async function confirmHandle() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要处理的告警')
    return
  }
  try {
    await handleAlarm(selectedIds.value, handleForm.status, handleForm.remark)
    ElMessage.success('处置成功')
    handleDialogVisible.value = false
    fetchData()
    selectedIds.value = []
  } catch (e) {
    console.error(e)
  }
}

async function handleSingle(row: Alarm) {
  try {
    await ElMessageBox.confirm(`确定将告警标记为已解决吗？`, '确认处置', {
      type: 'warning'
    })
    await handleAlarm([row.id], 'resolved', '已处理')
    ElMessage.success('处置成功')
    fetchData()
  } catch {
    // cancelled
  }
}

function getLevelClass(level: AlarmLevel) {
  return `alarm-${level}`
}

function getLevelText(level: AlarmLevel) {
  const map: Record<AlarmLevel, string> = {
    critical: '紧急',
    major: '重要',
    minor: '次要',
    warning: '提示'
  }
  return map[level]
}

function getStatusText(status: AlarmStatus) {
  const map: Record<AlarmStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    ignored: '已忽略'
  }
  return map[status]
}

const pendingCount = computed(() => alarmList.value.filter(a => a.status === 'pending').length)
const processingCount = computed(() => alarmList.value.filter(a => a.status === 'processing').length)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">告警处置</h2>
      <div class="header-stats">
        <el-tag type="danger" effect="dark">待处理: {{ pendingCount }}</el-tag>
        <el-tag type="warning" effect="dark">处理中: {{ processingCount }}</el-tag>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">关键词:</span>
        <el-input
          v-model="filterForm.keyword"
          placeholder="设备名称/告警信息"
          clearable
          style="width: 200px"
        />
      </div>
      <div class="filter-item">
        <span class="filter-label">告警级别:</span>
        <el-select v-model="filterForm.level" placeholder="全部级别" clearable style="width: 120px">
          <el-option
            v-for="opt in levelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">处理状态:</span>
        <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="table-actions">
          <el-button
            v-if="hasRoleAccess(['super_admin', 'maintenance'])"
            type="primary"
            :icon="Check"
            :disabled="selectedIds.length === 0"
            @click="openHandleDialog"
          >
            批量处理 ({{ selectedIds.length }})
          </el-button>
        </div>
        <div class="table-info">共 {{ total }} 条记录</div>
      </div>

      <el-table
        :data="alarmList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="告警级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :class="getLevelClass(row.level)" size="small">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备名称" width="180" />
        <el-table-column prop="stationName" label="所属站点" min-width="180" />
        <el-table-column prop="message" label="告警信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'pending' ? 'danger' : row.status === 'processing' ? 'warning' : 'success'"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100" align="center">
          <template #default="{ row }">{{ row.handler || '-' }}</template>
        </el-table-column>
        <el-table-column prop="alarmTime" label="告警时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending' && hasRoleAccess(['super_admin', 'maintenance'])"
              link
              type="primary"
              :icon="CircleCheck"
              @click="handleSingle(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              link
              type="warning"
              :icon="Clock"
              disabled
            >
              处理中
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="params.page"
          v-model:page-size="params.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="handleDialogVisible"
      title="批量处置告警"
      width="500px"
    >
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理状态">
          <el-radio-group v-model="handleForm.status">
            <el-radio label="resolved">已解决</el-radio>
            <el-radio label="processing">处理中</el-radio>
            <el-radio label="ignored">忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input
            v-model="handleForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确认处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
