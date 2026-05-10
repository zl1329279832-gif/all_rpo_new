<template>
  <div class="page-container">
    <el-button link :icon="ArrowLeft" @click="goBack">返回</el-button>
    
    <div class="course-header" v-if="course">
      <h2 class="course-title">{{ course.title }}</h2>
      <div class="course-meta">
        <span><el-icon><Collection /></el-icon> 分类：{{ course.category }}</span>
        <span><el-icon><Clock /></el-icon> 创建时间：{{ formatDate(course.createdAt) }}</span>
      </div>
      <p class="course-desc">{{ course.description }}</p>
    </div>

    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="课程资料" name="materials">
        <div class="tab-header">
          <el-button type="primary" @click="openMaterialDialog()">
            <el-icon><Plus /></el-icon> 添加资料
          </el-button>
        </div>
        <el-table :data="materials" v-loading="loading">
          <el-table-column label="资料名称" prop="title" />
          <el-table-column label="类型" width="120">
            <template #default="scope">
              <el-tag>{{ getMaterialTypeName(scope.row.materialType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="链接" min-width="200">
            <template #default="scope">
              <a v-if="scope.row.fileUrl" :href="scope.row.fileUrl" target="_blank" class="link">
                {{ scope.row.fileUrl }}
              </a>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="80" prop="sortOrder" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-popconfirm title="确认删除该资料？" @confirm="deleteMaterial(scope.row.id)">
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && materials.length === 0" description="暂无资料" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog 
      v-model="materialDialogVisible" 
      title="添加课程资料" 
      width="500px"
    >
      <el-form :model="materialForm" :rules="materialRules" ref="materialFormRef" label-width="80px">
        <el-form-item label="资料名称" prop="title">
          <el-input v-model="materialForm.title" placeholder="请输入资料名称" />
        </el-form-item>
        <el-form-item label="资料类型" prop="materialType">
          <el-select v-model="materialForm.materialType" placeholder="请选择类型" style="width: 100%;">
            <el-option label="文档" value="DOCUMENT" />
            <el-option label="视频" value="VIDEO" />
            <el-option label="链接" value="LINK" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件链接" prop="fileUrl">
          <el-input v-model="materialForm.fileUrl" placeholder="请输入文件/资料链接" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="materialForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="materialForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="materialDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="materialSubmitLoading" @click="submitMaterial">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourseById, getCourseMaterials, addCourseMaterial, deleteCourseMaterial } from '@/api/course'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Collection, Clock, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const courseId = computed(() => route.params.id)

const activeTab = ref('materials')
const course = ref(null)
const materials = ref([])
const loading = ref(false)
const materialDialogVisible = ref(false)
const materialSubmitLoading = ref(false)
const materialFormRef = ref(null)

const materialForm = reactive({
  title: '',
  materialType: 'DOCUMENT',
  fileUrl: '',
  sortOrder: 0,
  description: ''
})

const materialRules = {
  title: [{ required: true, message: '请输入资料名称', trigger: 'blur' }],
  materialType: [{ required: true, message: '请选择资料类型', trigger: 'change' }],
  fileUrl: [{ required: true, message: '请输入文件链接', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const [courseRes, materialRes] = await Promise.all([
      getCourseById(courseId.value),
      getCourseMaterials(courseId.value)
    ])
    if (courseRes.success) course.value = courseRes.data
    if (materialRes.success) materials.value = materialRes.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getMaterialTypeName = (type) => {
  const map = {
    DOCUMENT: '文档',
    VIDEO: '视频',
    LINK: '链接',
    OTHER: '其他'
  }
  return map[type] || '其他'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const openMaterialDialog = () => {
  materialForm.title = ''
  materialForm.materialType = 'DOCUMENT'
  materialForm.fileUrl = ''
  materialForm.sortOrder = 0
  materialForm.description = ''
  materialDialogVisible.value = true
}

const submitMaterial = async () => {
  const valid = await materialFormRef.value?.validate()
  if (!valid) return
  
  materialSubmitLoading.value = true
  try {
    const res = await addCourseMaterial(courseId.value, materialForm)
    if (res.success) {
      ElMessage.success('添加成功')
      materialDialogVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    materialSubmitLoading.value = false
  }
}

const deleteMaterial = async (id) => {
  try {
    const res = await deleteCourseMaterial(id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.course-header {
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 24px;
}

.course-title {
  margin: 16px 0 12px;
  color: #303133;
}

.course-meta {
  display: flex;
  gap: 24px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-desc {
  color: #909399;
  line-height: 1.6;
  margin: 0;
}

.tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.tab-header {
  margin-bottom: 16px;
}

.link {
  color: #409eff;
  text-decoration: none;
}
</style>
