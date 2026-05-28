<template>
  <div class="maintenance-container">
    <div class="progress-header">
      <span class="label">维护进度</span>
      <span class="value">{{ (progress * 100).toFixed(1) }}%</span>
    </div>
    <div class="progress-bar-wrapper">
      <div 
        class="progress-bar" 
        :style="{ width: `${progress * 100}%` }"
      ></div>
    </div>
    <div class="progress-stats">
      <div class="stat-item">
        <span class="stat-icon">🔧</span>
        <span class="stat-label">待维修</span>
        <span class="stat-value">{{ pendingCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⚙️</span>
        <span class="stat-label">维修中</span>
        <span class="stat-value">{{ inProgressCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">✅</span>
        <span class="stat-label">已完成</span>
        <span class="stat-value">{{ completedCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  totalCount: number
}>()

const pendingCount = computed(() => Math.ceil(props.totalCount * (1 - props.progress) * 0.6))
const inProgressCount = computed(() => Math.ceil(props.totalCount * (1 - props.progress) * 0.4))
const completedCount = computed(() => props.totalCount - pendingCount.value - inProgressCount.value)
</script>

<style scoped>
.maintenance-container {
  padding: 8px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
}

.progress-bar-wrapper {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 6px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 18px;
}

.stat-label {
  font-size: 11px;
  color: #999;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
</style>
