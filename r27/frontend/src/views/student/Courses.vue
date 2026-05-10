<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="全部课程" name="all">
        <el-row :gutter="20">
          <el-col :span="8" v-for="course in allCourses" :key="course.id">
            <el-card class="course-card" shadow="hover">
              <div class="card-header">
                <div class="cover" v-if="course.coverImage">
                  <img :src="course.coverImage" alt="" />
                </div>
                <div class="cover no-image" v-else>
                  <el-icon :size="48"><Reading /></el-icon>
                </div>
              </div>
              <div class="card-body">
                <h3 class="title">{{ course.title }}</h3>
                <p class="desc">{{ course.description || '暂无描述' }}</p>
                <div class="meta">
                  <span><el-icon><User /></el-icon> {{ course.teacherName }}</span>
                  <span><el-icon><Collection /></el-icon> {{ course.category }}</span>
                </div>
                <div class="actions">
                  <el-button type="primary" link @click="viewCourse(course.id)">查看详情</el-button>
                  <el-button 
                    v-if="!isEnrolled(course.id)" 
                    type="success" 
                    @click="enroll(course.id)"
                  >
                    选修课程
                  </el-button>
                  <el-tag v-else type="success" effect="light">已选修</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-if="allCourses.length === 0" description="暂无课程" />
      </el-tab-pane>
      
      <el-tab-pane label="我的课程" name="my">
        <el-row :gutter="20">
          <el-col :span="8" v-for="course in myCourses" :key="course.id">
            <el-card class="course-card" shadow="hover">
              <div class="card-header">
                <div class="cover" v-if="course.coverImage">
                  <img :src="course.coverImage" alt="" />
                </div>
                <div class="cover no-image" v-else>
                  <el-icon :size="48"><Reading /></el-icon>
                </div>
              </div>
              <div class="card-body">
                <h3 class="title">{{ course.title }}</h3>
                <p class="desc">{{ course.description || '暂无描述' }}</p>
                <div class="meta">
                  <span><el-icon><User /></el-icon> {{ course.teacherName }}</span>
                  <span><el-icon><Collection /></el-icon> {{ course.category }}</span>
                </div>
                <div class="actions">
                  <el-button type="primary" @click="viewCourse(course.id)">进入学习</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-if="myCourses.length === 0" description="还没有选修课程" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllCourses, getEnrolledCourses, enrollCourse } from '@/api/course'
import { ElMessage } from 'element-plus'
import { Reading, User, Collection } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('all')
const allCourses = ref([])
const myCourses = ref([])

const loadData = async () => {
  try {
    const [allRes, myRes] = await Promise.all([
      getAllCourses(),
      getEnrolledCourses()
    ])
    if (allRes.success) allCourses.value = allRes.data || []
    if (myRes.success) myCourses.value = myRes.data || []
  } catch (e) {
    console.error(e)
  }
}

const isEnrolled = (courseId) => {
  return myCourses.value.some(c => c.id === courseId)
}

const enroll = async (courseId) => {
  try {
    const res = await enrollCourse(courseId)
    if (res.success) {
      ElMessage.success('选课成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const viewCourse = (courseId) => {
  router.push(`/student/courses/${courseId}`)
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

.tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.course-card {
  margin-bottom: 20px;
  cursor: pointer;
}

.course-card:hover {
  transform: translateY(-4px);
  transition: transform 0.3s;
}

.card-header {
  margin: -20px -20px 16px;
}

.cover {
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover.no-image {
  color: rgba(255, 255, 255, 0.8);
}

.title {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
