<template>
  <div class="page-container">
    <el-button link :icon="ArrowLeft" @click="goBack">返回</el-button>
    
    <el-card class="assignment-card">
      <h2 class="assignment-title">{{ assignment?.title }}</h2>
      <div class="assignment-meta">
        <span><el-icon><Trophy /></el-icon> 满分：{{ assignment?.maxScore }} 分</span>
        <span v-if="assignment?.deadline">
          <el-icon><Clock /></el-icon> 截止：{{ formatDate(assignment.deadline) }}
        </span>
        <span><el-icon><Collection /></el-icon> 所属课程：{{ courseName }}</span>
      </div>
      <div class="assignment-desc">
        <h4>作业描述</h4>
        <p>{{ assignment?.description }}</p>
      </div>
    </el-card>

    <el-card class="submissions-card">
      <template #header>
        <div class="card-header">
          <span>学生提交记录</span>
          <el-tag type="info">已提交 {{ submittedCount }} / {{ totalCount }} 人</el-tag>
        </div>
      </template>
      <el-table :data="submissions" v-loading="loading">
        <el-table-column label="学生" prop="student.nickname" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.submittedAt) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="得分" width="120">
          <template #default="scope">
            <span v-if="scope.row.score !== null && scope.row.score !== undefined" class="score">
              {{ scope.row.score }} / {{ assignment?.maxScore }}
            </span>
            <el-tag v-else type="info" effect="plain">待批改</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status !== 'DRAFT'" 
              type="primary" 
              link 
              @click="openGradeDialog(scope.row)"
            >
              {{ scope.row.score !== null && scope.row.score !== undefined ? '查看/编辑' : '批改' }}
            </el-button>
            <span v-else class="text-muted">未提交</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && submissions.length === 0" description="暂无提交记录" />
    </el-card>

    <el-dialog 
      v-model="gradeDialogVisible" 
      :title="currentSubmission?.score !== null && currentSubmission?.score !== undefined ? '查看/编辑评语' : '批改作业'" 
      width="500px"
    >
      <div v-if="currentSubmission">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="学生">
            {{ currentSubmission.student?.nickname || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交内容" v-if="currentSubmission.content">
            <div class="submission-content">{{ currentSubmission.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="附件" v-if="currentSubmission.fileUrl">
            <a :href="currentSubmission.fileUrl" target="_blank" class="link">
              {{ currentSubmission.fileUrl }}
            </a>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentSubmission.submittedAt) || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="gradeForm" label-width="80px" style="margin-top: 24px;">
          <el-form-item label="分数">
            <el-input-number 
              v-model="gradeForm.score" 
              :min="0" 
              :max="assignment?.maxScore || 100" 
            />
            <span class="max-score"> / {{ assignment?.maxScore }} 分</span>
          </el-form-item>
          <el-form-item label="评语">
            <el-input 
              v-model="gradeForm.feedback" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入评语..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="gradeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="gradeLoading" @click="submitGrade">
          确认批改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTeacherAssignmentById, getAssignmentSubmissions, gradeSubmission } from '@/api/assignment'
import { getTeacherCourses } from '@/api/course'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Trophy, Clock, Collection } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const assignmentId = computed(() => route.params.id)

const loading = ref(false)
const gradeLoading = ref(false)
const assignment = ref(null)
const submissions = ref([])
const courses = ref([])
const gradeDialogVisible = ref(false)
const currentSubmission = ref(null)

const gradeForm = reactive({
  score: 0,
  feedback: ''
})

const courseName = computed(() => {
  if (!assignment.value) return '-'
  const course = courses.value.find(c => c.id === assignment.value.courseId)
  return course?.title || '-'
})

const totalCount = computed(() => submissions.value.length)
const submittedCount = computed(() => 
  submissions.value.filter(s => s.status !== 'DRAFT').length
)

const loadData = async () => {
  loading.value = true
  try {
    const [assignRes, submitRes, courseRes] = await Promise.all([
      getTeacherAssignmentById(assignmentId.value),
      getAssignmentSubmissions(assignmentId.value),
      getTeacherCourses()
    ])
    if (assignRes.success) assignment.value = assignRes.data
    if (submitRes.success) submissions.value = submitRes.data || []
    if (courseRes.success) courses.value = courseRes.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusTagType = (status) => {
  const map = {
    DRAFT: 'info',
    SUBMITTED: 'primary',
    GRADED: 'success',
    LATE: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    GRADED: '已批改',
    LATE: '迟交'
  }
  return map[status] || '未知'
}

const openGradeDialog = (submission) => {
  currentSubmission.value = submission
  gradeForm.score = submission.score || 0
  gradeForm.feedback = submission.feedback || ''
  gradeDialogVisible.value = true
}

const submitGrade = async () => {
  if (!currentSubmission.value) return
  
  gradeLoading.value = true
  try {
    const res = await gradeSubmission(currentSubmission.value.id, {
      score: gradeForm.score,
      feedback: gradeForm.feedback
    })
    if (res.success) {
      ElMessage.success('批改成功')
      gradeDialogVisible.value = false
      loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    gradeLoading.value = false
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

.assignment-card {
  margin-top: 16px;
}

.assignment-title {
  margin: 0 0 12px;
  color: #303133;
}

.assignment-meta {
  display: flex;
  gap: 24px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.assignment-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.assignment-desc h4 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 14px;
}

.assignment-desc p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.submissions-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score {
  font-size: 14px;
  font-weight: bold;
  color: #67c23a;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.submission-content {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

.link {
  color: #409eff;
  text-decoration: none;
}

.max-score {
  color: #909399;
  margin-left: 8px;
}
</style>
