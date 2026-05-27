<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Delete, Switch } from '@element-plus/icons-vue'
import { getPriceList, createPrice, updatePrice, deletePrice } from '../../api/price'
import type { PriceStrategy, PageParams } from '../../types'
import { useTable } from '../../hooks/useTable'
import { usePermission } from '../../hooks/usePermission'

const { hasRoleAccess } = usePermission()

const {
  loading,
  data: priceList,
  total,
  params,
  fetchData,
  handleSizeChange,
  handleCurrentChange
} = useTable<PriceStrategy, PageParams>({
  apiFn: getPriceList
})

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const priceForm = reactive<Partial<PriceStrategy>>({
  name: '',
  type: 'time',
  startTime: '00:00',
  endTime: '23:59',
  price: 0,
  serviceFee: 0,
  status: 'active'
})

function openCreate() {
  dialogMode.value = 'create'
  Object.assign(priceForm, {
    name: '',
    type: 'time',
    startTime: '00:00',
    endTime: '23:59',
    price: 0,
    serviceFee: 0,
    status: 'active'
  })
  dialogVisible.value = true
}

function openEdit(row: PriceStrategy) {
  dialogMode.value = 'edit'
  Object.assign(priceForm, row)
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (dialogMode.value === 'create') {
      await createPrice(priceForm)
      ElMessage.success('创建成功')
    } else {
      await updatePrice(priceForm)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row: PriceStrategy) {
  try {
    await ElMessageBox.confirm(`确定要删除价格策略 ${row.name} 吗？`, '确认删除', {
      type: 'warning'
    })
    await deletePrice(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // cancelled
  }
}

async function toggleStatus(row: PriceStrategy) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  await updatePrice({ ...row, status: newStatus })
  ElMessage.success('状态更新成功')
  fetchData()
}

const totalPrice = computed(() => {
  return (priceForm.price || 0) + (priceForm.serviceFee || 0)
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">价格策略</h2>
      <el-button
        v-if="hasRoleAccess(['super_admin', 'operation_admin'])"
        type="primary"
        :icon="Plus"
        @click="openCreate"
      >
        新增策略
      </el-button>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="table-info">共 {{ total }} 条记录</div>
      </div>

      <el-table
        :data="priceList"
        v-loading="loading"
        stripe
        border
      >
        <el-table-column prop="name" label="策略名称" min-width="150" />
        <el-table-column label="时段" width="180" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ row.startTime }} - {{ row.endTime }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电价(元/kWh)" width="120" align="center">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="服务费(元/kWh)" width="120" align="center">
          <template #default="{ row }">¥{{ row.serviceFee.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="合计(元/kWh)" width="120" align="center">
          <template #default="{ row }">
            <span class="total-price">¥{{ (row.price + row.serviceFee).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              :active-text="'启用'"
              :inactive-text="'停用'"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增价格策略' : '编辑价格策略'"
      width="500px"
    >
      <el-form :model="priceForm" label-width="100px">
        <el-form-item label="策略名称">
          <el-input v-model="priceForm.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="priceForm.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="priceForm.endTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="电价">
          <el-input-number
            v-model="priceForm.price"
            :min="0"
            :step="0.01"
            :precision="2"
            style="width: 100%"
          />
          <span class="unit">元/kWh</span>
        </el-form-item>
        <el-form-item label="服务费">
          <el-input-number
            v-model="priceForm.serviceFee"
            :min="0"
            :step="0.01"
            :precision="2"
            style="width: 100%"
          />
          <span class="unit">元/kWh</span>
        </el-form-item>
        <el-form-item label="合计">
          <span class="total-price">¥{{ totalPrice.toFixed(2) }} /kWh</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="priceForm.status"
            active-value="active"
            inactive-value="inactive"
            :active-text="'启用'"
            :inactive-text="'停用'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
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

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.total-price {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
}

.unit {
  margin-left: 8px;
  color: var(--text-secondary);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
