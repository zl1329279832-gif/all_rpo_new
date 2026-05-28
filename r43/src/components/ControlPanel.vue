<template>
  <div class="control-panel">
    <div class="panel-left">
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #2ecc71, #27ae60);">⚡</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalPower.toFixed(1) }} kW</div>
            <div class="stat-label">总发电功率</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9);">📅</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayGeneration }} MWh</div>
            <div class="stat-label">今日发电量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #9b59b6, #8e44ad);">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.monthGeneration }} MWh</div>
            <div class="stat-label">本月发电量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" :style="{ background: alarmCount > 0 ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #2ecc71, #27ae60)' }">
            {{ alarmCount > 0 ? '🚨' : '✅' }}
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ alarmCount }}</div>
            <div class="stat-label">告警数量</div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-right">
      <div class="control-buttons">
        <button class="control-btn" @click="$emit('reset-view')">
          <span class="btn-icon">🎯</span>
          重置视角
        </button>
        <button 
          class="control-btn primary"
          :class="{ active: isPatrolling }"
          @click="handlePatrolToggle"
        >
          <span class="btn-icon">{{ isPatrolling ? '⏹️' : '▶️' }}</span>
          {{ isPatrolling ? '停止巡检' : '开始巡检' }}
        </button>
        <label class="control-btn toggle">
          <span class="btn-icon">👁️</span>
          跟随镜头
          <input type="checkbox" v-model="followCamera" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { StatisticsData } from '@/types'

const props = defineProps<{
  statistics: StatisticsData
  alarmCount: number
  isPatrolling: boolean
  selectedRoute: string | null
}>()

const emit = defineEmits<{
  (e: 'reset-view'): void
  (e: 'start-patrol', followCamera: boolean): void
  (e: 'stop-patrol'): void
}>()

const followCamera = ref(true)

const handlePatrolToggle = () => {
  if (props.isPatrolling) {
    emit('stop-patrol')
  } else {
    emit('start-patrol', followCamera.value)
  }
}
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 0;
  left: 280px;
  right: 400px;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
}

.panel-left {
  flex: 1;
}

.stat-cards {
  display: flex;
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

.panel-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.control-btn.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.control-btn.primary:hover {
  background: #2563eb;
}

.control-btn.primary.active {
  background: #ef4444;
  border-color: #ef4444;
}

.control-btn.toggle {
  position: relative;
}

.control-btn.toggle input {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.btn-icon {
  font-size: 16px;
}
</style>
