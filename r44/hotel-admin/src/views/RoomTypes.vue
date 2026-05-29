<template>
  <PageContainer title="客房类型" description="管理酒店所有房型信息">
    <template #actions>
      <el-button
        v-if="hasPermission('room:add')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增房型
      </el-button>
      <el-button
        v-if="hasPermission('room:export')"
        :icon="Download"
        @click="handleExport"
      >
        导出
      </el-button>
    </template>

    <DataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :show-actions="hasAnyPermission(['room:edit', 'room:delete', 'room:price'])"
      :show-index="true"
      :show-selection="hasPermission('room:batch')"
      actions-width="260"
      @pagination-change="handlePaginationChange"
      @selection-change="handleSelectionChange"
    >
      <template #image="{ row }">
        <el-image
          v-if="row.images && row.images.length > 0"
          :src="getImageUrl(row.images[0])"
          :preview-src-list="row.images.map(getImageUrl)"
          style="width: 60px; height: 60px; border-radius: 4px"
          fit="cover"
        />
        <el-icon v-else class="default-image"><Picture /></el-icon>
      </template>

      <template #facilities="{ row }">
        <div class="facility-tags">
          <el-tag
            v-for="(facility, index) in row.facilities?.slice(0, 3) || []"
            :key="index"
            size="small"
            type="info"
            effect="light"
            class="facility-tag"
          >
            {{ facility }}
          </el-tag>
          <el-tag
            v-if="row.facilities && row.facilities.length > 3"
            size="small"
            type="info"
            effect="plain"
          >
            +{{ row.facilities.length - 3 }}
          </el-tag>
        </div>
      </template>

      <template #price="{ row }">
        <div class="price-info">
          <div class="base-price">¥{{ row.basePrice?.toFixed(2) || '0.00' }}</div>
          <div class="price-range" v-if="row.weekendPrice || row.holidayPrice">
            <span v-if="row.weekendPrice">周末: ¥{{ row.weekendPrice }}</span>
            <span v-if="row.holidayPrice">节假日: ¥{{ row.holidayPrice }}</span>
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <el-tag :type="getStatusType(row.status)" effect="light" size="small">
          {{ getStatusLabel(row.status) }}
        </el-tag>
      </template>

      <template #actions="{ row }">
        <el-button
          v-if="hasPermission('room:view')"
          type="primary"
          link
          size="small"
          @click="handleView(row)"
        >
          详情
        </el-button>
        <el-button
          v-if="hasPermission('room:edit')"
          type="primary"
          link
          size="small"
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="hasPermission('room:price')"
          type="success"
          link
          size="small"
          @click="handlePriceAdjust(row)"
        >
          调价
        </el-button>
        <el-button
          v-if="hasPermission('room:delete')"
          type="danger"
          link
          size="small"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>

      <template #header>
        <div class="filter-bar">
          <el-input
            v-model="searchKey"
            placeholder="搜索房型名称"
            :prefix-icon="Search"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="正常" value="normal" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="关闭" value="closed" />
          </el-select>
          <el-button :icon="Search" type="primary" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
          <el-button
            v-if="hasPermission('room:batch') && selectedRows.length > 0"
            type="danger"
            :icon="Delete"
            @click="handleBatchDelete"
          >
            批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
      </template>
    </DataTable>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="room-type-form"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="房型名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入房型名称" maxlength="30" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="英文名称" prop="nameEn">
              <el-input v-model="formData.nameEn" placeholder="请输入英文名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="床型" prop="bedType">
              <el-select v-model="formData.bedType" placeholder="请选择床型" style="width: 100%">
                <el-option label="大床" value="大床" />
                <el-option label="双床" value="双床" />
                <el-option label="特大床" value="特大床" />
                <el-option label="单人床" value="单人床" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="床尺寸" prop="bedSize">
              <el-input v-model="formData.bedSize" placeholder="如: 1.8m×2.0m" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="formData.area" :min="1" :max="500" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="楼层" prop="floor">
              <el-input v-model="formData.floor" placeholder="如: 2-5层" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="最大入住" prop="maxGuests">
              <el-input-number v-model="formData.maxGuests" :min="1" :max="10" style="width: 100%" />
              <span class="form-unit">人</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="总房数" prop="totalRooms">
              <el-input-number v-model="formData.totalRooms" :min="0" style="width: 100%" />
              <span class="form-unit">间</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="工作日价格" prop="basePrice">
              <el-input-number v-model="formData.basePrice" :min="0" :precision="2" :step="10" style="width: 100%" />
              <span class="form-unit">元</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="周末价格" prop="weekendPrice">
              <el-input-number v-model="formData.weekendPrice" :min="0" :precision="2" :step="10" style="width: 100%" />
              <span class="form-unit">元</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="节假日价格" prop="holidayPrice">
              <el-input-number v-model="formData.holidayPrice" :min="0" :precision="2" :step="10" style="width: 100%" />
              <span class="form-unit">元</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24">
            <el-form-item label="设施服务">
              <el-checkbox-group v-model="formData.facilities" class="facility-checkboxes">
                <el-checkbox value="免费WiFi">免费WiFi</el-checkbox>
                <el-checkbox value="空调">空调</el-checkbox>
                <el-checkbox value="电视">电视</el-checkbox>
                <el-checkbox value="智能电视">智能电视</el-checkbox>
                <el-checkbox value="独立卫浴">独立卫浴</el-checkbox>
                <el-checkbox value="浴缸">浴缸</el-checkbox>
                <el-checkbox value="24小时热水">24小时热水</el-checkbox>
                <el-checkbox value="迷你吧">迷你吧</el-checkbox>
                <el-checkbox value="免费早餐">免费早餐</el-checkbox>
                <el-checkbox value="行政酒廊">行政酒廊</el-checkbox>
                <el-checkbox value="独立客厅">独立客厅</el-checkbox>
                <el-checkbox value="按摩浴缸">按摩浴缸</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="是否含早">
              <el-switch v-model="formData.breakfastIncluded" active-text="含早" inactive-text="不含早" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio value="normal">正常</el-radio>
                <el-radio value="maintenance">维护中</el-radio>
                <el-radio value="closed">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24">
            <el-form-item label="房型图片">
              <el-upload
                :action="uploadAction"
                list-type="picture-card"
                :file-list="fileList"
                :auto-upload="false"
                :limit="5"
                multiple
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">最多上传5张图片，支持JPG、PNG格式</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24">
            <el-form-item label="取消政策" prop="cancellationPolicy">
              <el-select v-model="formData.cancellationPolicy" style="width: 100%">
                <el-option label="免费取消(入住前1天)" value="免费取消(入住前1天)" />
                <el-option label="免费取消(入住前3天)" value="免费取消(入住前3天)" />
                <el-option label="不可取消" value="不可取消" />
                <el-option label="部分退款" value="部分退款" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24">
            <el-form-item label="房型描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入房型描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="priceDialogVisible"
      title="价格调整"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <PriceAdjustForm
        ref="priceFormRef"
        :room-types="roomTypes"
        :initial-data="priceFormInitialData"
        :show-actions="false"
      />
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handlePriceSubmit">确认调整</el-button>
      </template>
    </el-dialog>

    <DetailDrawer
      v-model="detailDrawerVisible"
      :title="detailTitle"
      size="500px"
      :loading="detailLoading"
      :detail="currentDetail"
      :fields="detailFields"
      :column="1"
    >
      <template #default="{ detail }">
        <div class="detail-content">
          <div class="detail-images">
            <el-image
              v-for="(img, index) in detail.images?.map(getImageUrl) || []"
              :key="index"
              :src="img"
              :preview-src-list="detail.images?.map(getImageUrl) || []"
              style="width: 120px; height: 120px; margin-right: 8px; margin-bottom: 8px; border-radius: 8px"
              fit="cover"
            />
          </div>
          <div class="detail-section">
            <h4 class="section-title">设施服务</h4>
            <div class="facility-tags">
              <el-tag
                v-for="(facility, index) in detail.facilities || []"
                :key="index"
                size="small"
                type="info"
                effect="light"
                class="facility-tag"
              >
                {{ facility }}
              </el-tag>
            </div>
          </div>
          <div class="detail-section" v-if="detail.description">
            <h4 class="section-title">房型描述</h4>
            <p class="description">{{ detail.description }}</p>
          </div>
          <div class="detail-section">
            <h4 class="section-title">库存状态</h4>
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="stat-item">
                  <div class="stat-value">{{ detail.totalRooms || 0 }}</div>
                  <div class="stat-label">总房数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item">
                  <div class="stat-value available">{{ detail.availableRooms || 0 }}</div>
                  <div class="stat-label">可用</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item">
                  <div class="stat-value occupied">{{ detail.occupiedRooms || 0 }}</div>
                  <div class="stat-label">已占用</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </template>
      <template #footer-extra>
        <el-button
          v-if="hasPermission('room:edit')"
          type="primary"
          @click="handleEditFromDetail"
        >
          编辑
        </el-button>
      </template>
    </DetailDrawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules, UploadFile, UploadFiles } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Download, Delete, Picture } from '@element-plus/icons-vue'
import type { RoomType } from '../types'
import { PageContainer, DataTable, PriceAdjustForm, DetailDrawer } from '../components/common'
import { roomTypeApi } from '../api/roomType'
import { usePermission } from '../hooks/usePermission'
import { useExport } from '../hooks/useExport'

const { hasPermission, hasAnyPermission } = usePermission()
const { exportToExcel } = useExport()

const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)

const tableData = ref<RoomType[]>([])
const roomTypes = ref<RoomType[]>([])
const selectedRows = ref<RoomType[]>([])

const searchKey = ref('')
const statusFilter = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增房型' : '编辑房型')

const formRef = ref<FormInstance>()
const formData = reactive<Partial<RoomType>>({
  name: '',
  nameEn: '',
  bedType: '',
  bedSize: '',
  area: 28,
  floor: '',
  maxGuests: 2,
  totalRooms: 10,
  basePrice: 0,
  weekendPrice: 0,
  holidayPrice: 0,
  facilities: [],
  breakfastIncluded: false,
  cancellationPolicy: '',
  description: '',
  status: 'normal',
  images: []
})

const fileList = ref<UploadFile[]>([])
const uploadAction = '/api/upload'

const formRules: FormRules = {
  name: [{ required: true, message: '请输入房型名称', trigger: 'blur' }],
  bedType: [{ required: true, message: '请选择床型', trigger: 'change' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  maxGuests: [{ required: true, message: '请输入最大入住人数', trigger: 'blur' }],
  totalRooms: [{ required: true, message: '请输入总房数', trigger: 'blur' }],
  basePrice: [{ required: true, message: '请输入工作日价格', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const priceDialogVisible = ref(false)
const priceFormRef = ref<InstanceType<typeof PriceAdjustForm>>()
const priceFormInitialData = ref<Partial<any>>({})

const detailDrawerVisible = ref(false)
const detailTitle = ref('房型详情')
const currentDetail = ref<RoomType | null>(null)

const columns = [
  { prop: 'images', label: '图片', width: 90, align: 'center', slot: 'image' },
  { prop: 'name', label: '房型名称', minWidth: 120 },
  { prop: 'bedType', label: '床型', width: 100 },
  { prop: 'area', label: '面积', width: 80, align: 'center', formatter: (row: any) => `${row.area}㎡` },
  { prop: 'maxGuests', label: '入住', width: 80, align: 'center', formatter: (row: any) => `${row.maxGuests}人` },
  { prop: 'totalRooms', label: '总房数', width: 80, align: 'center' },
  { prop: 'facilities', label: '设施', minWidth: 180, slot: 'facilities' },
  { prop: 'basePrice', label: '价格', minWidth: 140, slot: 'price' },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' }
]

const detailFields = [
  { prop: 'name', label: '房型名称' },
  { prop: 'nameEn', label: '英文名称' },
  { prop: 'bedType', label: '床型' },
  { prop: 'bedSize', label: '床尺寸' },
  { prop: 'area', label: '面积', type: 'text', formatter: (v: number) => `${v}㎡` },
  { prop: 'floor', label: '楼层' },
  { prop: 'maxGuests', label: '最大入住', formatter: (v: number) => `${v}人` },
  { prop: 'basePrice', label: '工作日价格', type: 'money' },
  { prop: 'weekendPrice', label: '周末价格', type: 'money' },
  { prop: 'holidayPrice', label: '节假日价格', type: 'money' },
  { prop: 'breakfastIncluded', label: '是否含早', formatter: (v: boolean) => v ? '是' : '否' },
  { prop: 'cancellationPolicy', label: '取消政策' },
  { prop: 'status', label: '状态', type: 'status' },
  { prop: 'createdAt', label: '创建时间', type: 'date' },
  { prop: 'updatedAt', label: '更新时间', type: 'date' }
]

const getImageUrl = (path: string): string => {
  if (path.startsWith('http')) return path
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('hotel room modern interior ' + path)}&image_size=square_hd`
}

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    normal: 'success',
    available: 'success',
    maintenance: 'warning',
    closed: 'info',
    disabled: 'danger',
    full: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    available: '正常',
    maintenance: '维护中',
    closed: '关闭',
    disabled: '停用',
    full: '满房'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    const query: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKey.value) query.name = searchKey.value
    if (statusFilter.value) query.status = statusFilter.value

    const res = await roomTypeApi.getList(query)
    tableData.value = res.list
    pagination.total = res.total
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchAllRoomTypes = async () => {
  try {
    roomTypes.value = await roomTypeApi.getAll()
  } catch (err) {
    console.error('获取房型列表失败', err)
  }
}

const handlePaginationChange = ({ page, pageSize }: { page: number; pageSize: number }) => {
  pagination.page = page
  pagination.pageSize = pageSize
  fetchData()
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchKey.value = ''
  statusFilter.value = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: RoomType) => {
  dialogMode.value = 'edit'
  Object.assign(formData, row)
  fileList.value = (row.images || []).map((url, index) => ({
    name: `image-${index}`,
    url: getImageUrl(url),
    status: 'success' as const
  }))
  dialogVisible.value = true
}

const handleEditFromDetail = () => {
  if (currentDetail.value) {
    detailDrawerVisible.value = false
    handleEdit(currentDetail.value)
  }
}

const handleView = async (row: RoomType) => {
  detailLoading.value = true
  detailDrawerVisible.value = true
  try {
    const detail = await roomTypeApi.getById(row.id)
    currentDetail.value = detail
    detailTitle.value = detail?.name || '房型详情'
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleDelete = async (row: RoomType) => {
  try {
    await ElMessageBox.confirm(`确定要删除房型「${row.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await roomTypeApi.remove(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : '删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的房型')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个房型吗？`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    await Promise.all(selectedRows.value.map(row => roomTypeApi.remove(row.id)))
    ElMessage.success('批量删除成功')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : '删除失败')
    }
  }
}

const handlePriceAdjust = (row: RoomType) => {
  priceFormInitialData.value = {
    roomTypeId: row.id,
    name: `${row.name}-调价`,
    basePrice: row.basePrice,
    weekendPrice: row.weekendPrice,
    holidayPrice: row.holidayPrice
  }
  priceDialogVisible.value = true
}

const handlePriceSubmit = async () => {
  if (!priceFormRef.value) return
  try {
    await priceFormRef.value.validate()
    submitting.value = true
    ElMessage.success('价格调整成功')
    priceDialogVisible.value = false
    fetchData()
  } catch (err) {
    console.error('价格调整验证失败', err)
  } finally {
    submitting.value = false
  }
}

const handleExport = () => {
  const columns = [
    { key: '房型名称', title: '房型名称' },
    { key: '床型', title: '床型' },
    { key: '面积(㎡)', title: '面积(㎡)' },
    { key: '楼层', title: '楼层' },
    { key: '最大入住(人)', title: '最大入住(人)' },
    { key: '总房数(间)', title: '总房数(间)' },
    { key: '工作日价格(元)', title: '工作日价格(元)' },
    { key: '周末价格(元)', title: '周末价格(元)' },
    { key: '节假日价格(元)', title: '节假日价格(元)' },
    { key: '设施', title: '设施' },
    { key: '状态', title: '状态' }
  ]
  const exportData = tableData.value.map(item => ({
    '房型名称': item.name,
    '床型': item.bedType,
    '面积(㎡)': item.area,
    '楼层': item.floor,
    '最大入住(人)': item.maxGuests,
    '总房数(间)': item.totalRooms,
    '工作日价格(元)': item.basePrice,
    '周末价格(元)': item.weekendPrice,
    '节假日价格(元)': item.holidayPrice,
    '设施': (item.facilities || []).join(', '),
    '状态': getStatusLabel(item.status)
  }))
  exportToExcel(exportData, columns, { filename: `房型列表_${new Date().toISOString().split('T')[0]}` })
}

const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles
}

const handleFileRemove = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    nameEn: '',
    bedType: '',
    bedSize: '',
    area: 28,
    floor: '',
    maxGuests: 2,
    totalRooms: 10,
    basePrice: 0,
    weekendPrice: 0,
    holidayPrice: 0,
    facilities: [],
    breakfastIncluded: false,
    cancellationPolicy: '',
    description: '',
    status: 'normal',
    images: []
  })
  fileList.value = []
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = {
      ...formData,
      images: fileList.value.map(f => f.url || f.name)
    } as any

    if (dialogMode.value === 'add') {
      await roomTypeApi.create(submitData)
      ElMessage.success('新增成功')
    } else {
      await roomTypeApi.update(submitData)
      ElMessage.success('编辑成功')
    }

    dialogVisible.value = false
    fetchData()
  } catch (err) {
    console.error('提交失败', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchAllRoomTypes()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.default-image {
  font-size: 40px;
  color: var(--el-text-color-placeholder);
}

.facility-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .facility-tag {
    margin-right: 0 !important;
  }
}

.price-info {
  .base-price {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-color-danger);
  }

  .price-range {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;

    span {
      display: block;
    }
  }
}

.room-type-form {
  .form-unit {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }

  .facility-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.detail-content {
  .detail-images {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .detail-section {
    margin-bottom: 20px;

    .section-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .description {
      margin: 0;
      line-height: 1.8;
      color: var(--el-text-color-regular);
    }
  }

  .stat-item {
    text-align: center;
    padding: 16px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;

      &.available {
        color: var(--el-color-success);
      }

      &.occupied {
        color: var(--el-color-warning);
      }
    }

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;

    .el-input,
    .el-select,
    .el-button {
      width: 100% !important;
    }
  }

  .room-type-form {
    :deep(.el-form-item__label) {
      width: auto !important;
      text-align: left;
    }
  }

  .facility-checkboxes {
    gap: 8px !important;
  }
}
</style>
