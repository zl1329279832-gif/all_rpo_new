<template>
  <div class="stat-card" :style="{ borderLeftColor: color }">
    <div class="stat-header">
      <span class="stat-icon">{{ icon }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
    <div class="stat-value">
      <span class="value-text" :style="{ color }">{{ value }}</span>
      <span class="value-unit" v-if="unit">{{ unit }}</span>
    </div>
    <div class="stat-change" v-if="change !== undefined">
      <el-icon v-if="change > 0"><Top /></el-icon>
      <el-icon v-else-if="change < 0"><Bottom /></el-icon>
      <span :class="{ 'is-positive': change > 0, 'is-negative': change < 0 }">
        {{ Math.abs(change).toFixed(2) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: string;
  change?: number;
}

withDefaults(defineProps<Props>(), {
  icon: '📊',
  color: '#409EFF'
});
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 20px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  margin-bottom: 8px;
}

.value-text {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.value-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.stat-change .is-positive {
  color: #67c23a;
}

.stat-change .is-negative {
  color: #f56c6c;
}
</style>
