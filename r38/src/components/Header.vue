<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#1890ff"/>
          <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="title">
        <h1>校园安防三维态势展示系统</h1>
        <span class="subtitle">Campus Security 3D Situation Display</span>
      </div>
    </div>

    <div class="header-center">
      <div class="stat-item">
        <span class="stat-value online">{{ statistics.onlineRate.toFixed(1) }}%</span>
        <span class="stat-label">设备在线率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value alarm">{{ statistics.todayAlarms }}</span>
        <span class="stat-label">今日告警</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value warning">{{ statistics.unhandledAlarms }}</span>
        <span class="stat-label">待处理</span>
      </div>
    </div>

    <div class="header-right">
      <button class="btn" @click="$emit('toggle-labels')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        {{ labelsVisible ? '隐藏标签' : '显示标签' }}
      </button>
      <button class="btn primary" @click="$emit('reset-view')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        重置视角
      </button>
      <div class="time">
        <span class="time-text">{{ currentTime }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Statistics } from '@/types'

defineProps<{
  statistics: Statistics
  labelsVisible: boolean
}>()

defineEmits<{
  (e: 'reset-view'): void
  (e: 'toggle-labels'): void
}>()

const currentTime = ref('')
let timer: number | null = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(16, 26, 45, 0.98) 0%, rgba(16, 26, 45, 0.9) 100%);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title h1 {
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 1px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'DIN', 'Microsoft YaHei', sans-serif;
}

.stat-value.online { color: var(--success-color); }
.stat-value.alarm { color: var(--error-color); }
.stat-value.warning { color: var(--warning-color); }

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover {
  background: rgba(24, 144, 255, 0.2);
  border-color: rgba(24, 144, 255, 0.6);
}

.btn.primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.btn.primary:hover {
  background: #40a9ff;
}

.time {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.time-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: 'DIN', monospace;
}
</style>
