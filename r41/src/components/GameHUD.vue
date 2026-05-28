<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'save'): void
  (e: 'back-to-menu'): void
}>()

const gameStore = useGameStore()

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const timeRemaining = computed(() => formatTime(gameStore.timeRemaining))
const currentLevel = computed(() => gameStore.currentLevel)
const progress = computed(() => {
  if (!currentLevel.value) return 0
  return Math.min(100, (gameStore.stats.completedOrders / currentLevel.value.targetOrders) * 100)
})

const timeColor = computed(() => {
  if (gameStore.timeRemaining < 60) return 'text-red-400'
  if (gameStore.timeRemaining < 120) return 'text-yellow-400'
  return 'text-green-400'
})
</script>

<template>
  <div class="hud">
    <div class="hud-left">
      <div class="level-info">
        <span class="level-badge">关卡 {{ currentLevel?.id }}</span>
        <span class="level-name">{{ currentLevel?.name }}</span>
      </div>
      <div class="progress-section">
        <div class="progress-label">
          <span>订单进度</span>
          <span>{{ gameStore.stats.completedOrders }} / {{ currentLevel?.targetOrders }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="hud-center">
      <div class="timer" :class="timeColor">
        <span class="timer-icon">⏱️</span>
        <span class="timer-value">{{ timeRemaining }}</span>
      </div>
    </div>

    <div class="hud-right">
      <div class="stat-item">
        <span class="stat-icon">💰</span>
        <span class="stat-value">¥{{ gameStore.money.toLocaleString() }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">{{ gameStore.score }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🚚</span>
        <span class="stat-value">{{ gameStore.trucks.filter(t => t.status === 'idle').length }}/{{ gameStore.trucks.length }}</span>
      </div>
      <div class="hud-actions">
        <button class="btn-icon" @click="emit('save')" title="保存游戏">💾</button>
        <button class="btn-icon" @click="emit('pause')" :title="gameStore.isPaused ? '继续' : '暂停'">
          {{ gameStore.isPaused ? '▶️' : '⏸️' }}
        </button>
        <button class="btn-icon btn-danger" @click="emit('back-to-menu')" title="返回菜单">🏠</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hud-left, .hud-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.level-badge {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.level-name {
  font-size: 14px;
  color: #94a3b8;
}

.progress-section {
  width: 180px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.hud-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.timer-icon {
  font-size: 24px;
}

.text-green-400 { color: #4ade80; }
.text-yellow-400 { color: #facc15; }
.text-red-400 { color: #f87171; }

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 8px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 14px;
}

.hud-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.4);
}
</style>
