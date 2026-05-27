<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, Edit, View, Download } from '@element-plus/icons-vue'
import { getStationList, createStation, updateStation, deleteStations, getAreas } from '../../api/station'
import type { Station, StationParams } from '../../types'
import { useTable } from '../../hooks/useTable'
import { useExport } from '../../hooks/useExport'
import { usePermission } from '../../hooks/usePermission'

const { hasRoleAccess } = usePermission()

const filterForm = reactive({
  keyword: '',
  area: '',
  status: ''
})

const areas = ref<string[]>([])

const {
  loading,
  data: stationList,
  total,
  params,
  fetchData,
  handleSizeChange,
  handleCurrentChange,
  updateParams
} = useTable<Station, StationParams>({
  apiFn: getStationList
})

const { exporting, handleExport } = useExport<Station>(
  [
    { key: 'name', title: '站点名称' },
    { key: 'address', title: '地址' },
    { key: 'area', title: '区域' },
    { key: 'deviceCount', title: '设备数量' },
    { key: 'onlineRate', title: '在线率(%)' },
    { key: 'status', title: '状态', format: (v: string) => v === 'active' ? '启用' : '停用' },
    { key: 'createTime', title: '创建时间' }
  ],
  `站点列表_${new Date().toLocaleDateString()}.xlsx`
)

const selectedIds = ref<string[]>([])
const drawerVisible = ref(false)
const drawerMode = ref<'view' | 'create' | 'edit'>('view')
const currentStation = ref<Partial<Station>>({})

async function loadAreas() {
  const res = await getAreas()
  areas.value = res.data
}

function handleSearch() {
  updateParams({
    keyword: filterForm.keyword,
    area: filterForm.area,
    status: filterForm.status
  } as any)
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.area = ''
  filterForm.status = ''
  updateParams({ keyword: '', area: '', status: '' } as any)
}

function handleSelectionChange(selection: Station[]) {
  selectedIds.value = selection.map(s => s.id)
}

function openCreate() {
  drawerMode.value = 'create'
  currentStation.value = {
    name: '',
    address: '',
    area: '',
    status: 'active'
  }
  drawerVisible.value = true
}

function openEdit(row: Station) {
  drawerMode.value = 'edit'
  currentStation.value = { ...row }
  drawerVisible.value = true
}

function openView(row: Station) {
  drawerMode.value = 'view'
  currentStation.value = { ...row }
  drawerVisible.value = true
}

async function handleSave() {
  try {
    if (drawerMode.value === 'create') {
      await createStation(currentStation.value)
      ElMessage.success('创建成功')
    } else {
      await updateStation(currentStation.value)
      ElMessage.success('更新成功')
    }
    drawerVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row: Station) {
  try {
    await ElMessageBox.confirm('确定要删除该站点吗？', '确认删除', {
      type: 'warning'
    })
    await deleteStations([row.id])
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // cancelled
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的站点')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个站点吗？`, '确认删除', {
      type: 'warning'
    })
    await deleteStations(selectedIds.value)
    ElMessage.success('批量删除成功')
    fetchData()
    selectedIds.value = []
  } catch {
    // cancelled
  }
}

function getStatusClass(status: string) {
  return status === 'active' ? 'status-idle' : 'status-offline'
}

loadAreas()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">站点管理</h2>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport(stationList)" :loading="exporting">
          导出
        </el-button>
        <el-button
          v-if="hasRoleAccess(['super_admin', 'operation_admin'])"
          type="primary"
          :icon="Plus"
          @click="openCreate"
        >
          新增站点
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">关键词:</span>
        <el-input
          v-model="filterForm.keyword"
          placeholder="站点名称/地址"
          clearable
          style="width: 200px"
        />
      </div>
      <div class="filter-item">
        <span class="filter-label">区域:</span>
        <el-select v-model="filterForm.area" placeholder="全部区域" clearable style="width: 150px">
          <el-option v-for="area in areas" :key="area" :label="area" :value="area" />
        </el-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">状态:</span>
        <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option label="启用" value="active" />
          <el-option label="停用" value="inactive" />
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
            v-if="hasRoleAccess(['super_admin', 'operation_admin'])"
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除 ({{ selectedIds.length }})
          </el-button>
        </div>
        <div class="table-info">
          共 {{ total }} 条记录
        </div>
      </div>

      <el-table
        :data="stationList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="站点名称" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="area" label="区域" width="100" />
        <el-table-column prop="deviceCount" label="设备数" width="80" align="center" />
        <el-table-column label="在线率" width="100" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.onlineRate" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :class="getStatusClass(row.status)" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openView(row)">查看</el-button>
            <el-button
              v-if="hasRoleAccess(['super_admin', 'operation_admin'])"
              link
              type="primary"
              :icon="Edit"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasRoleAccess(['super_admin', 'operation_admin'])"
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
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
      :title="drawerMode === 'view' ? '站点详情' : drawerMode === 'create' ? '新增站点' : '编辑站点'"
      size="600px"
      :before-close="() => drawerVisible = false"
    >
      <el-form
        :model="currentStation" label-width="100px">
        <el-form-item label="站点名称">
          <el-input v-model="currentStation.name" :disabled="drawerMode === 'view'" />
        </el-form-item>
        <el-form-item label="所在区域">
          <el-select v-model="currentStation.area" :disabled="drawerMode === 'view'" style="width: 100%">
          <el-option v-for="area in areas" :key="area" :label="area" :value="area" />
        </el-select>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="currentStation.address" type="textarea" :rows="3" :disabled="drawerMode === 'view'" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentStation.status"
            active-value="active"
            inactive-value="inactive"
            :disabled="drawerMode === 'view'"
          />
        </el-form-item>
        <el-form-item v-if="drawerMode === 'view'" label="设备数量">
          <span>{{ currentStation.deviceCount || 0 }} 台</span>
        </el-form-item>
        <el-form-item v-if="drawerMode === 'view'" label="在线率">
          <span>{{ currentStation.onlineRate || 0 }}%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
        <el-button
          v-if="drawerMode !== 'view'"
          type="primary"
          @click="handleSave"
        >
          保存
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.header-actions {
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
