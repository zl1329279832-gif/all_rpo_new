<template>
  <div class="page-container">
    <h3 class="page-title">作业管理</h3>
    <el-table :data="assignments" v-loading="loading">
      <el-table-column label="课程名称" prop="courseName" />
      <el-table-column label="作业标题" prop="assignment.title" />
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.submission?.status)">
            {{ getStatusText(scope.row.submission?.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="截止时间" width="200">
        <template #default="scope">
          {{ formatDate(scope.row.assignment.deadline) }}
        </template>
      </el-table-column>
      <el-table-column label="分数" width="100">
        <template #default="scope">
          <span v-if="scope.row.submission?.score !== undefined">
            {{ scope.row.submission.score }} / {{ scope.row.assignment.maxScore }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="goToDetail(scope.row.assignment.id)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && assignments.length === 0" description="暂无作业" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStudentAssignments } from '@/api/assignment'

const router = useRouter()
const loading = ref(false)
const assignments = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await getStudentAssignments()
    if (res.success) assignments.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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

const formatDate = (date) => {
  if (!date) return '无截止日期'
  return new Date(date).toLocaleString('zh-CN')
}

const goToDetail = (id) => {
  router.push(`/student/assignments/${id}`)
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

.page-title {
  margin: 0 0 24px;
  font-size: 18px;
  color: #303133;
}
</style>
