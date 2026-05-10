<template>
  <div class="page-container">
    <div class="page-header">
      <h3 class="page-title">作业管理</h3>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 布置作业
      </el-button>
    </div>

    <el-table :data="assignments" v-loading="loading">
      <el-table-column label="作业名称" prop="title" />
      <el-table-column label="所属课程" width="180">
        <template #default="scope">
          {{ getCourseName(scope.row.courseId) }}
        </template>
      </el-table-column>
      <el-table-column label="满分" width="80" prop="maxScore" />
      <el-table-column label="截止时间" width="200">
        <template #default="scope">
          {{ formatDate(scope.row.deadline) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="viewAssignment(scope.row.id)">详情</el-button>
          <el-button type="warning" link @click="openDialog(scope.row)">编辑</el-button>
          <el-popconfirm title="确认删除该作业？" @confirm="deleteAssignment(scope.row.id)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && assignments.length === 0" description="暂无作业" />

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑作业' : '布置作业'" 
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="作业名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入作业名称" />
        </el-form-item>
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" style="width: 100%;">
            <el-option 
              v-for="course in courses" 
              :key="course.id" 
              :label="course.title" 
              :value="course.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="满分" prop="maxScore">
          <el-input-number v-model="form.maxScore" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            placeholder="选择截止时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入作业描述"
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
import { getTeacherAssignments, createAssignment, updateAssignment, deleteAssignment as delAssignment } from '@/api/assignment'
import { getTeacherCourses } from '@/api/course'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const assignments = ref([])
const courses = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  title: '',
  courseId: null,
  maxScore: 100,
  deadline: null,
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入作业名称', trigger: 'blur' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  maxScore: [{ required: true, message: '请输入满分', trigger: 'blur' }],
  description: [{ required: true, message: '请输入作业描述', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const [assignRes, courseRes] = await Promise.all([
      getTeacherAssignments(),
      getTeacherCourses()
    ])
    if (assignRes.success) assignments.value = assignRes.data || []
    if (courseRes.success) courses.value = courseRes.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getCourseName = (courseId) => {
  const course = courses.value.find(c => c.id === courseId)
  return course?.title || '-'
}

const formatDate = (date) => {
  if (!date) return '无截止日期'
  return new Date(date).toLocaleString('zh-CN')
}

const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.title = row.title
    form.courseId = row.courseId
    form.maxScore = row.maxScore
    form.deadline = row.deadline
    form.description = row.description || ''
  } else {
    isEdit.value = false
    editId.value = null
    form.title = ''
    form.courseId = courses.value.length ? courses.value[0].id : null
    form.maxScore = 100
    form.deadline = null
    form.description = ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  submitLoading.value = true
  try {
    const data = { ...form, status: 1 }
    if (isEdit.value) {
      const res = await updateAssignment(editId.value, data)
      if (res.success) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      }
    } else {
      const res = await createAssignment(data)
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

const deleteAssignment = async (id) => {
  try {
    const res = await delAssignment(id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const viewAssignment = (id) => {
  router.push(`/teacher/assignments/${id}`)
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
