<script setup lang="ts">
import type { EngineStats } from '@/core/types'

interface Props {
  stats: EngineStats
}

defineProps<Props>()

const getFpsColor = (fps: number) => {
  if (fps >= 55) return '#22c55e'
  if (fps >= 30) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="stats-panel">
    <div class="stats-header">
      <span class="stats-title">性能监控</span>
    </div>
    
    <div class="stats-content">
      <div class="stat-item">
        <span class="stat-label">FPS</span>
        <span class="stat-value" :style="{ color: getFpsColor(stats.fps) }">
          {{ stats.fps }}
        </span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">实例数量</span>
        <span class="stat-value">{{ stats.instanceCount.toLocaleString() }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">渲染耗时</span>
        <span class="stat-value">{{ stats.renderTime.toFixed(2) }}ms</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">总帧数</span>
        <span class="stat-value">{{ stats.frameCount.toLocaleString() }}</span>
      </div>
    </div>
    
    <div class="stats-footer">
      <span class="optimization-note">InstancedMesh · Render on Demand</span>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  min-width: 180px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.stats-header {
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.5);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.stats-title {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.stats-content {
  padding: 12px 14px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
}

.stats-footer {
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.3);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.optimization-note {
  font-size: 10px;
  color: #64748b;
}
</style>
