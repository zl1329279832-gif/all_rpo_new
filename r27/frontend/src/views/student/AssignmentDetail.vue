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
        <span>
          <el-tag :type="getDeadlineTagType(assignment?.deadline)">
            {{ getDeadlineText(assignment?.deadline) }}
          </el-tag>
        </span>
      </div>
      <div class="assignment-desc">
        <h4>作业描述</h4>
        <p>{{ assignment?.description }}</p>
      </div>
    </el-card>

    <el-card v-if="submission" class="submission-card">
      <template #header>
        <div class="card-header">
          <span>我的提交</span>
          <el-tag :type="getStatusTagType(submission.status)">{{ getStatusText(submission.status) }}</el-tag>
        </div>
      </template>
      
      <div v-if="submission.score !== null && submission.score !== undefined" class="grade-section">
        <div class="grade-info">
          <span class="grade-label">得分：</span>
          <span class="grade-value">{{ submission.score }}</span>
          <span class="grade-max"> / {{ assignment?.maxScore }}</span>
        </div>
        <div v-if="submission.feedback" class="feedback-section">
          <h4>教师评语</h4>
          <p>{{ submission.feedback }}</p>
        </div>
      </div>
      
      <div v-if="submission.content" class="content-section">
        <h4>提交内容</h4>
        <p>{{ submission.content }}</p>
      </div>
      
      <div v-if="submission.fileUrl" class="file-section">
        <h4>附件</h4>
        <el-button type="primary" link @click="openFile(submission.fileUrl)">
          查看附件
        </el-button>
      </div>
    </el-card>

    <el-card v-else class="submit-card">
      <template #header>提交作业</template>
      <el-form :model="submitForm" label-position="top">
        <el-form-item label="作业内容">
          <el-input 
            v-model="submitForm.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入作业内容..."
          />
        </el-form-item>
        <el-form-item label="附件链接">
          <el-input 
            v-model="submitForm.fileUrl" 
            placeholder="请输入文件/附件链接（可选）"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button type="primary" @click="submit">提交作业</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssignmentById, getSubmission, submitAssignment, saveDraft } from '@/api/assignment'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Trophy, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const assignmentId = computed(() => route.params.id)

const assignment = ref(null)
const submission = ref(null)

const submitForm = reactive({
  content: '',
  fileUrl: ''
})

const loadData = async () => {
  try {
    const [assignRes, submitRes] = await Promise.all([
      getAssignmentById(assignmentId.value),
      getSubmission(assignmentId.value)
    ])
    if (assignRes.success) assignment.value = assignRes.data
    if (submitRes.success) submission.value = submitRes.data
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getDeadlineTagType = (deadline) => {
  if (!deadline) return 'info'
  const now = new Date()
  const d = new Date(deadline)
  if (now > d) return 'danger'
  const diff = d - now
  if (diff < 24 * 60 * 60 * 1000) return 'warning'
  return 'success'
}

const getDeadlineText = (deadline) => {
  if (!deadline) return '无截止日期'
  const now = new Date()
  const d = new Date(deadline)
  if (now > d) return '已截止'
  const diff = d - now
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days > 0) return `剩余 ${days} 天`
  const hours = Math.floor(diff / (60 * 60 * 1000))
  return `剩余 ${hours} 小时`
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
  return map[status] || '未提交'
}

const openFile = (url) => {
  window.open(url, '_blank')
}

const saveDraft = async () => {
  try {
    const res = await saveDraft(assignmentId.value, {
      content: submitForm.content,
      fileUrl: submitForm.fileUrl
    })
    if (res.success) {
      ElMessage.success('草稿已保存')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const submit = async () => {
  try {
    const res = await submitAssignment(assignmentId.value, {
      content: submitForm.content,
      fileUrl: submitForm.fileUrl
    })
    if (res.success) {
      ElMessage.success('提交成功')
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

.submission-card, .submit-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grade-section {
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.grade-info {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.grade-label {
  color: #606266;
  font-size: 14px;
}

.grade-value {
  font-size: 36px;
  font-weight: bold;
  color: #67c23a;
  margin: 0 4px;
}

.grade-max {
  color: #909399;
  font-size: 14px;
}

.feedback-section h4,
.content-section h4,
.file-section h4 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 14px;
}

.feedback-section p,
.content-section p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.content-section, .file-section {
  margin-top: 20px;
}
</style>
