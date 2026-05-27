<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, View, SwitchButton, CircleClose } from '@element-plus/icons-vue'
import { getDeviceList, restartDevice } from '../../api/device'
import type { Device, DeviceParams, DeviceStatus } from '../../types'
import { useTable } from '../../hooks/useTable'
import { useExport } from '../../hooks/useExport'
import { usePermission } from '../../hooks/usePermission'

const { hasRoleAccess } = usePermission()

const filterForm = reactive({
  stationId: '',
  status: '',
  keyword: ''
})

const deviceStatusOptions = [
  { label: '空闲', value: 'idle' },
  { label: '充电中', value: 'charging' },
  { label: '离线', value: 'offline' },
  { label: '故障', value: 'fault' },
  { label: '告警中', value: 'alarm' }
]

const {
  loading,
  data: deviceList,
  total,
  params,
  fetchData,
  handleSizeChange,
  handleCurrentChange,
  updateParams
} = useTable<Device, DeviceParams>({
  apiFn: getDeviceList
})

const { exporting, handleExport } = useExport<Device>(
  [
    { key: 'name', title: '设备名称' },
    { key: 'code', title: '设备编号' },
    { key: 'stationName', title: '所属站点' },
    { key: 'type', title: '类型', format: (v: string) => v === 'dc' ? '直流桩' : '交流桩' },
    { key: 'power', title: '功率(kW)' },
    { key: 'status', title: '状态', format: (v: DeviceStatus) => {
      const map: Record<DeviceStatus, string> = {
        idle: '空闲',
        charging: '充电中',
        offline: '离线',
        fault: '故障',
        alarm: '告警中'
      }
      return map[v]
    }},
    { key: 'todayElectricity', title: '今日充电量(kWh)' },
    { key: 'createTime', title: '创建时间' }
  ],
  `设备列表_${new Date().toLocaleDateString()}.xlsx`
)

const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)

function handleSearch() {
  updateParams({
    stationId: filterForm.stationId,
    status: filterForm.status as DeviceStatus,
    keyword: filterForm.keyword
  } as any)
}

function handleReset() {
  filterForm.stationId = ''
  filterForm.status = ''
  filterForm.keyword = ''
  updateParams({ stationId: '', status: undefined, keyword: '' } as any)
}

function openView(row: Device) {
  currentDevice.value = row
  drawerVisible.value = true
}

async function handleRestart(row: Device) {
  try {
    await ElMessageBox.confirm(`确定要重启设备 ${row.name} 吗？`, '确认重启', {
      type: 'warning'
    })
    await restartDevice(row.id)
    ElMessage.success('重启指令已发送')
    fetchData()
  } catch {
    // cancelled
  }
}

function getStatusClass(status: DeviceStatus) {
  return `status-${status}`
}

function getStatusText(status: DeviceStatus) {
  const map: Record<DeviceStatus, string> = {
    idle: '空闲',
    charging: '充电中',
    offline: '离线',
    fault: '故障',
    alarm: '告警中'
  }
  return map[status]
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">设备详情</h2>
      <el-button :icon="Download" @click="handleExport(deviceList)" :loading="exporting">
        导出
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">关键词:</span>
        <el-input
          v-model="filterForm.keyword"
          placeholder="设备名称/编号"
          clearable
          style="width: 200px"
        />
      </div>
      <div class="filter-item">
        <span class="filter-label">状态:</span>
        <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px">
          <el-option
            v-for="opt in deviceStatusOptions"
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
      <div class="stats-row mb-20">
        <el-row :gutter="16">
          <el-col :span="6" v-for="status in deviceStatusOptions" :key="status.value">
            <div class="stat-item">
              <div class="stat-label">{{ status.label }}</div>
              <div class="stat-value">
                {{ deviceList.filter(d => d.status === status.value).length }}
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table
        :data="deviceList"
        v-loading="loading"
        stripe
        border
      >
        <el-table-column prop="name" label="设备名称" min-width="180" />
        <el-table-column prop="code" label="设备编号" width="140" />
        <el-table-column prop="stationName" label="所属站点" min-width="180" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ row.type === 'dc' ? '直流桩' : '交流桩' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="power" label="功率" width="100" align="center">
          <template #default="{ row }">{{ row.power }}kW</template>
        </el-table-column>
        <el-table-column label="当前功率" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.status === 'charging'" class="text-charging">
              {{ row.currentPower }}kW
            </span>
            <span v-else class="text-idle">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :class="getStatusClass(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="todayElectricity" label="今日电量" width="120" align="center">
          <template #default="{ row }">{{ row.todayElectricity.toFixed(2) }}kWh</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openView(row)">详情</el-button>
            <el-button
              v-if="hasRoleAccess(['super_admin', 'maintenance'])"
              link
              type="warning"
              :icon="SwitchButton"
              @click="handleRestart(row)"
            >
              重启
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

    <el-drawer
      v-model="drawerVisible"
      title="设备详情"
      size="500px"
      :before-close="() => drawerVisible = false"
    >
      <el-descriptions :column="1" border v-if="currentDevice">
        <el-descriptions-item label="设备名称">{{ currentDevice.name }}</el-descriptions-item>
        <el-descriptions-item label="设备编号">{{ currentDevice.code }}</el-descriptions-item>
        <el-descriptions-item label="所属站点">{{ currentDevice.stationName }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">
          {{ currentDevice.type === 'dc' ? '直流充电桩' : '交流充电桩' }}
        </el-descriptions-item>
        <el-descriptions-item label="额定功率">{{ currentDevice.power }}kW</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :class="getStatusClass(currentDevice.status)" size="small">
            {{ getStatusText(currentDevice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前功率">
          {{ currentDevice.currentPower || 0 }}kW
        </el-descriptions-item>
        <el-descriptions-item label="累计充电量">
          {{ currentDevice.totalElectricity.toFixed(2) }}kWh
        </el-descriptions-item>
        <el-descriptions-item label="今日充电量">
          {{ currentDevice.todayElectricity.toFixed(2) }}kWh
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentDevice.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后在线时间">
          {{ currentDevice.lastOnlineTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.stats-row {
  padding: 16px;
  background: var(--bg-color);
  border-radius: 8px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.text-charging {
  color: var(--primary-color);
  font-weight: 500;
}

.text-idle {
  color: var(--text-secondary);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
