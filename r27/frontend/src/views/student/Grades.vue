<template>
  <div class="page-container">
    <h3 class="page-title">成绩查询</h3>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">已完成作业</div>
            <div class="stat-value">{{ stats.completed }}</div>
          </div>
          <div class="stat-icon icon-success">
            <el-icon :size="32"><CircleCheck /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">平均分</div>
            <div class="stat-value">{{ stats.average.toFixed(1) }}</div>
          </div>
          <div class="stat-icon icon-primary">
            <el-icon :size="32"><Trophy /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">最高分</div>
            <div class="stat-value">{{ stats.highest }}</div>
          </div>
          <div class="stat-icon icon-warning">
            <el-icon :size="32"><Star /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>成绩详情</template>
      <el-table :data="grades" v-loading="loading">
        <el-table-column label="课程名称" prop="courseName" />
        <el-table-column label="作业名称">
          <template #default="scope">
            {{ scope.row.assignment?.title }}
          </template>
        </el-table-column>
        <el-table-column label="得分" width="150">
          <template #default="scope">
            <span class="score">
              {{ scope.row.submission?.score }}
              <span class="max-score"> / {{ scope.row.assignment?.maxScore }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="评语" prop="submission.feedback">
          <template #default="scope">
            {{ scope.row.submission?.feedback || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="批改时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.submission?.gradedAt) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && grades.length === 0" description="暂无成绩记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getGrades } from '@/api/assignment'
import { CircleCheck, Trophy, Star } from '@element-plus/icons-vue'

const loading = ref(false)
const grades = ref([])

const stats = computed(() => {
  const data = grades.value
  const completed = data.length
  const scores = data.map(g => g.submission?.score || 0)
  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const highest = scores.length ? Math.max(...scores) : 0
  return { completed, average, highest }
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getGrades()
    if (res.success) grades.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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

.page-title {
  margin: 0 0 24px;
  font-size: 18px;
  color: #303133;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  .el-card__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.icon-success { background: linear-gradient(135deg, #67c23a, #85ce61); }
.icon-primary { background: linear-gradient(135deg, #409eff, #66b1ff); }
.icon-warning { background: linear-gradient(135deg, #e6a23c, #ebb563); }

.table-card {
  margin-top: 24px;
}

.score {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}

.max-score {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
</style>
