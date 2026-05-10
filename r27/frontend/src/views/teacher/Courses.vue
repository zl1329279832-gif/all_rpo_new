<template>
  <div class="page-container">
    <div class="page-header">
      <h3 class="page-title">课程管理</h3>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 发布课程
      </el-button>
    </div>

    <el-table :data="courses" v-loading="loading">
      <el-table-column label="课程名称" prop="title" />
      <el-table-column label="分类" prop="category" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="viewCourse(scope.row.id)">查看</el-button>
          <el-button type="warning" link @click="openDialog(scope.row)">编辑</el-button>
          <el-popconfirm title="确认删除该课程？" @confirm="deleteCourse(scope.row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && courses.length === 0" description="暂无课程" />

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑课程' : '发布课程'" 
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="课程名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%;">
            <el-option label="编程语言" value="编程语言" />
            <el-option label="后端开发" value="后端开发" />
            <el-option label="前端开发" value="前端开发" />
            <el-option label="数据库" value="数据库" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <el-input v-model="form.coverImage" placeholder="请输入封面图片链接（可选）" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入课程描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherCourses, createCourse, updateCourse, deleteCourse as delCourse } from '@/api/course'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const courses = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  title: '',
  category: '',
  coverImage: '',
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  description: [{ required: true, message: '请输入课程描述', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTeacherCourses()
    if (res.success) courses.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.title = row.title
    form.category = row.category || ''
    form.coverImage = row.coverImage || ''
    form.description = row.description || ''
  } else {
    isEdit.value = false
    editId.value = null
    form.title = ''
    form.category = ''
    form.coverImage = ''
    form.description = ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  submitLoading.value = true
  try {
    if (isEdit.value) {
      const res = await updateCourse(editId.value, form)
      if (res.success) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      }
    } else {
      const res = await createCourse({ ...form, status: 1 })
      if (res.success) {
        ElMessage.success('发布成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const deleteCourse = async (id) => {
  try {
    const res = await delCourse(id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const viewCourse = (id) => {
  router.push(`/teacher/courses/${id}`)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
</style>
