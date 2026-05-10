<template>
  <div class="page-container">
    <div class="course-header">
      <el-button link :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="course-title">{{ course?.title }}</h2>
      <div class="course-meta">
        <span><el-icon><User /></el-icon> 授课教师：{{ course?.teacherName }}</span>
        <span><el-icon><Collection /></el-icon> 分类：{{ course?.category }}</span>
      </div>
      <p class="course-desc">{{ course?.description }}</p>
    </div>

    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="课程资料" name="materials">
        <el-card v-for="material in materials" :key="material.id" class="material-card">
          <div class="material-header">
            <el-icon :size="24" class="material-icon" :class="getIconClass(material.materialType)">
              <component :is="getMaterialIcon(material.materialType)" />
            </el-icon>
            <div class="material-info">
              <h3>{{ material.title }}</h3>
              <span class="material-type">{{ getMaterialTypeName(material.materialType) }}</span>
            </div>
            <div class="material-actions">
              <el-button 
                v-if="material.fileUrl" 
                type="primary" 
                link 
                @click="openMaterial(material.fileUrl)"
              >
                查看/下载
              </el-button>
            </div>
          </div>
          <p class="material-desc" v-if="material.description">{{ material.description }}</p>
        </el-card>
        <el-empty v-if="materials.length === 0" description="暂无课程资料" />
      </el-tab-pane>
      
      <el-tab-pane label="课程作业" name="assignments">
        <el-card v-for="assignment in assignments" :key="assignment.id" class="assignment-card">
          <div class="assignment-header">
            <h3>{{ assignment.title }}</h3>
            <el-tag :type="getDeadlineTagType(assignment.deadline)">
              {{ getDeadlineText(assignment.deadline) }}
            </el-tag>
          </div>
          <p class="assignment-desc">{{ assignment.description }}</p>
          <div class="assignment-meta">
            <span><el-icon><Trophy /></el-icon> 满分：{{ assignment.maxScore }} 分</span>
            <span v-if="assignment.deadline">
              <el-icon><Clock /></el-icon> 截止：{{ formatDate(assignment.deadline) }}
            </span>
          </div>
          <el-button type="primary" @click="goToAssignment(assignment.id)">查看详情</el-button>
        </el-card>
        <el-empty v-if="assignments.length === 0" description="暂无课程作业" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourseById, getCourseMaterials } from '@/api/course'
import { getCourseAssignments } from '@/api/assignment'
import { 
  ArrowLeft, User, Collection, Document, Video, Link, 
  Grid, Trophy, Clock 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const courseId = computed(() => route.params.id)

const activeTab = ref('materials')
const course = ref(null)
const materials = ref([])
const assignments = ref([])

const loadData = async () => {
  try {
    const [courseRes, materialRes] = await Promise.all([
      getCourseById(courseId.value),
      getCourseMaterials(courseId.value)
    ])
    if (courseRes.success) course.value = courseRes.data
    if (materialRes.success) materials.value = materialRes.data || []
  } catch (e) {
    console.error(e)
  }
}

const getMaterialIcon = (type) => {
  const map = {
    DOCUMENT: Document,
    VIDEO: Video,
    LINK: Link,
    OTHER: Grid
  }
  return map[type] || Grid
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

const getIconClass = (type) => {
  const map = {
    DOCUMENT: 'icon-doc',
    VIDEO: 'icon-video',
    LINK: 'icon-link',
    OTHER: 'icon-other'
  }
  return map[type] || 'icon-other'
}

const openMaterial = (url) => {
  window.open(url, '_blank')
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

const goToAssignment = (id) => {
  router.push(`/student/assignments/${id}`)
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

.material-card, .assignment-card {
  margin-bottom: 16px;
}

.material-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.material-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.icon-doc { background: #409eff; }
.icon-video { background: #67c23a; }
.icon-link { background: #e6a23c; }
.icon-other { background: #909399; }

.material-info {
  flex: 1;
}

.material-info h3 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #303133;
}

.material-type {
  font-size: 12px;
  color: #909399;
}

.material-desc {
  margin: 12px 0 0;
  color: #606266;
  font-size: 13px;
  padding-left: 64px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.assignment-header h3 {
  margin: 0;
  font-size: 15px;
  color: #303133;
}

.assignment-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 12px;
}

.assignment-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 12px;
}

.assignment-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
