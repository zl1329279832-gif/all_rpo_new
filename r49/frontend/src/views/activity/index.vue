<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">活动管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增活动
          </el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="queryForm" @submit.prevent>
          <el-form-item label="活动名称">
            <el-input v-model="queryForm.activityName" placeholder="请输入活动名称" clearable />
          </el-form-item>
          <el-form-item label="活动状态">
            <el-select v-model="queryForm.status" placeholder="请选择" clearable>
              <el-option label="草稿" :value="0" />
              <el-option label="已发布" :value="1" />
              <el-option label="进行中" :value="2" />
              <el-option label="已结束" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="activityName" label="活动名称" />
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column prop="cutoffTime" label="截单时间" width="160" />
        <el-table-column prop="deliveryDate" label="配送日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">
              {{ statusText[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)" :disabled="row.status === 2 || row.status === 3">编辑</el-button>
            <el-button 
              v-if="row.status === 0 || row.status === 4" 
              type="success" 
              link 
              size="small" 
              @click="handleStatus(row, 1)"
            >上架</el-button>
            <el-button 
              v-if="row.status === 1 || row.status === 2" 
              type="warning" 
              link 
              size="small" 
              @click="handleStatus(row, 4)"
            >下架</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动名称" prop="activityName">
              <el-input v-model="formData.activityName" placeholder="请输入活动名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配送日期" prop="deliveryDate">
              <el-date-picker
                v-model="formData.deliveryDate"
                type="date"
                placeholder="请选择配送日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="formData.startTime"
                type="datetime"
                placeholder="请选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="formData.endTime"
                type="datetime"
                placeholder="请选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="截单时间" prop="cutoffTime">
              <el-date-picker
                v-model="formData.cutoffTime"
                type="datetime"
                placeholder="请选择截单时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="活动商品">
          <div class="sku-list">
            <div class="sku-header">
              <span class="sku-title">商品列表</span>
              <el-button type="primary" link :icon="Plus" @click="addSkuItem">添加商品</el-button>
            </div>
            <el-table :data="formData.skuList" border size="small">
              <el-table-column label="商品" min-width="180">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`skuList.${$index}.productId`"
                    :rules="{ required: true, message: '请选择商品', trigger: 'change' }"
                  >
                    <el-select
                      v-model="row.productId"
                      placeholder="请选择商品"
                      filterable
                      remote
                      :remote-method="(query) => searchProduct(query, $index)"
                      :loading="productLoading[$index]"
                      style="width: 100%"
                      @change="(val) => handleProductChange(val, $index)"
                    >
                      <el-option
                        v-for="item in productOptions[$index]"
                        :key="item.id"
                        :label="item.productName"
                        :value="item.id"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="批次" min-width="150">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`skuList.${$index}.batchId`"
                    :rules="{ required: true, message: '请选择批次', trigger: 'change' }"
                  >
                    <el-select
                      v-model="row.batchId"
                      placeholder="请选择批次"
                      style="width: 100%"
                      :disabled="!row.productId"
                      @change="(val) => handleBatchChange(val, $index)"
                    >
                      <el-option
                        v-for="item in batchOptions[$index]"
                        :key="item.id"
                        :label="`${item.batchNo} (库存:${item.stock})`"
                        :value="item.id"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="活动价格" width="120">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`skuList.${$index}.activityPrice`"
                    :rules="{ required: true, message: '请输入活动价格', trigger: 'blur' }"
                  >
                    <el-input-number
                      v-model="row.activityPrice"
                      :min="0"
                      :precision="2"
                      :step="1"
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="佣金比例(%)" width="130">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`skuList.${$index}.commissionRate`"
                    :rules="{ required: true, message: '请输入佣金比例', trigger: 'blur' }"
                  >
                    <el-input-number
                      v-model="row.commissionRate"
                      :min="0"
                      :max="100"
                      :precision="2"
                      :step="1"
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="活动库存" width="120">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`skuList.${$index}.activityStock`"
                    :rules="{ required: true, message: '请输入活动库存', trigger: 'blur' }"
                  >
                    <el-input-number
                      v-model="row.activityStock"
                      :min="1"
                      :max="row.maxStock || 99999"
                      :step="1"
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    link
                    :icon="Delete"
                    @click="removeSkuItem($index)"
                    :disabled="formData.skuList.length <= 1"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="活动详情"
      width="800px"
    >
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="活动名称">{{ detailData.activityName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType[detailData.status]" size="small">
            {{ statusText[detailData.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailData.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detailData.endTime }}</el-descriptions-item>
        <el-descriptions-item label="截单时间">{{ detailData.cutoffTime }}</el-descriptions-item>
        <el-descriptions-item label="配送日期">{{ detailData.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">{{ detailData.description || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <div class="detail-sku-title">活动商品</div>
      <el-table :data="detailSkuList" border size="small" v-loading="detailLoading">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="batchNo" label="批次号" width="120" />
        <el-table-column prop="activityPrice" label="活动价格" width="120">
          <template #default="{ row }">¥{{ row.activityPrice }}</template>
        </el-table-column>
        <el-table-column prop="commissionRate" label="佣金比例(%)" width="120" />
        <el-table-column prop="activityStock" label="活动库存" width="100" />
        <el-table-column prop="soldStock" label="已售库存" width="100" />
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getActivityPage,
  getActivityDetail,
  getActivitySkuList,
  createActivity,
  updateActivity,
  deleteActivity,
  updateActivityStatus
} from '@/api/activity'
import { getProductList, getProductBatchList } from '@/api/product'

const loading = ref(false)
const submitLoading = ref(false)
const detailLoading = ref(false)

const queryForm = reactive({
  pageNum: 1,
  pageSize: 10,
  activityName: '',
  status: null
})

const total = ref(0)
const tableData = ref([])

const statusType = {
  0: 'info',
  1: 'primary',
  2: 'success',
  3: 'danger',
  4: 'warning'
}

const statusText = {
  0: '草稿',
  1: '已发布',
  2: '进行中',
  3: '已结束',
  4: '已取消'
}

const dialogVisible = ref(false)
const dialogTitle = ref('新增活动')
const isEdit = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  activityName: '',
  startTime: '',
  endTime: '',
  cutoffTime: '',
  deliveryDate: '',
  description: '',
  skuList: []
})

const formRules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { max: 50, message: '活动名称不能超过50个字符', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  cutoffTime: [
    { required: true, message: '请选择截单时间', trigger: 'change' }
  ],
  deliveryDate: [
    { required: true, message: '请选择配送日期', trigger: 'change' }
  ]
}

const productLoading = ref({})
const productOptions = ref({})
const batchOptions = ref({})

const detailVisible = ref(false)
const detailData = ref(null)
const detailSkuList = ref([])

function fetchList() {
  loading.value = true
  getActivityPage(queryForm)
    .then((res) => {
      tableData.value = res.data.records || res.data.list || []
      total.value = res.data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function resetQuery() {
  queryForm.activityName = ''
  queryForm.status = null
  queryForm.pageNum = 1
  fetchList()
}

function initFormData() {
  formData.id = null
  formData.activityName = ''
  formData.startTime = ''
  formData.endTime = ''
  formData.cutoffTime = ''
  formData.deliveryDate = ''
  formData.description = ''
  formData.skuList = [
    {
      productId: null,
      batchId: null,
      activityPrice: null,
      commissionRate: null,
      activityStock: null,
      maxStock: null
    }
  ]
  productOptions.value = {}
  batchOptions.value = {}
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增活动'
  initFormData()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑活动'
  initFormData()
  
  getActivityDetail(row.id).then((res) => {
    const data = res.data
    formData.id = data.id
    formData.activityName = data.activityName
    formData.startTime = data.startTime
    formData.endTime = data.endTime
    formData.cutoffTime = data.cutoffTime
    formData.deliveryDate = data.deliveryDate
    formData.description = data.description
  })
  
  getActivitySkuList(row.id).then((res) => {
    const skuList = res.data || []
    formData.skuList = skuList.map((sku, index) => {
      productOptions.value[index] = [{ id: sku.productId, productName: sku.productName }]
      batchOptions.value[index] = [{ id: sku.batchId, batchNo: sku.batchNo, stock: sku.activityStock }]
      return {
        productId: sku.productId,
        batchId: sku.batchId,
        activityPrice: sku.activityPrice,
        commissionRate: sku.commissionRate,
        activityStock: sku.activityStock,
        maxStock: sku.activityStock + sku.remainStock || 99999
      }
    })
  })
  
  dialogVisible.value = true
}

function handleView(row) {
  detailData.value = null
  detailSkuList.value = []
  detailVisible.value = true
  
  getActivityDetail(row.id).then((res) => {
    detailData.value = res.data
  })
  
  detailLoading.value = true
  getActivitySkuList(row.id)
    .then((res) => {
      detailSkuList.value = res.data || []
    })
    .finally(() => {
      detailLoading.value = false
    })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除活动"${row.activityName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deleteActivity(row.id).then(() => {
        ElMessage.success('删除成功')
        fetchList()
      })
    })
    .catch(() => {})
}

function handleStatus(row, status) {
  const action = status === 1 ? '上架' : '下架'
  ElMessageBox.confirm(`确定要${action}活动"${row.activityName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      updateActivityStatus(row.id, status).then(() => {
        ElMessage.success(`${action}成功`)
        fetchList()
      })
    })
    .catch(() => {})
}

function addSkuItem() {
  formData.skuList.push({
    productId: null,
    batchId: null,
    activityPrice: null,
    commissionRate: null,
    activityStock: null,
    maxStock: null
  })
}

function removeSkuItem(index) {
  if (formData.skuList.length > 1) {
    formData.skuList.splice(index, 1)
  }
}

function searchProduct(query, index) {
  if (!query) {
    productOptions.value[index] = []
    return
  }
  productLoading.value[index] = true
  getProductList({ productName: query })
    .then((res) => {
      productOptions.value[index] = res.data || []
    })
    .finally(() => {
      productLoading.value[index] = false
    })
}

function handleProductChange(productId, index) {
  formData.skuList[index].batchId = null
  formData.skuList[index].maxStock = null
  batchOptions.value[index] = []
  
  if (productId) {
    getProductBatchList(productId).then((res) => {
      batchOptions.value[index] = res.data || []
    })
  }
}

function handleBatchChange(batchId, index) {
  const batchList = batchOptions.value[index] || []
  const batch = batchList.find((b) => b.id === batchId)
  if (batch) {
    formData.skuList[index].maxStock = batch.stock
    if (formData.skuList[index].activityStock > batch.stock) {
      formData.skuList[index].activityStock = batch.stock
    }
  }
}

function validateTime() {
  const startTime = new Date(formData.startTime).getTime()
  const endTime = new Date(formData.endTime).getTime()
  const cutoffTime = new Date(formData.cutoffTime).getTime()
  
  if (endTime <= startTime) {
    ElMessage.error('结束时间必须晚于开始时间')
    return false
  }
  if (cutoffTime >= endTime) {
    ElMessage.error('截单时间必须早于结束时间')
    return false
  }
  return true
}

function handleSubmit() {
  if (!formRef.value) return
  
  formRef.value.validate((valid) => {
    if (valid) {
      if (!validateTime()) return
      
      if (formData.skuList.length === 0) {
        ElMessage.error('请至少添加一个活动商品')
        return
      }
      
      submitLoading.value = true
      const request = isEdit.value ? updateActivity : createActivity
      
      request(formData)
        .then(() => {
          ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
          dialogVisible.value = false
          fetchList()
        })
        .finally(() => {
          submitLoading.value = false
        })
    }
  })
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    text-align: right;
  }

  .sku-list {
    width: 100%;

    .sku-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .sku-title {
        font-weight: 500;
        font-size: 14px;
      }
    }
  }

  .detail-sku-title {
    font-weight: 500;
    font-size: 14px;
    margin: 20px 0 10px;
  }
}
</style>
