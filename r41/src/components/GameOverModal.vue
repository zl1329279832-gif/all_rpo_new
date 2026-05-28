<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  victory: boolean
}>()

const emit = defineEmits<{
  (e: 'back-to-menu'): void
  (e: 'restart'): void
}>()

const gameStore = useGameStore()

const stats = computed(() => gameStore.stats)
const currentLevel = computed(() => gameStore.currentLevel)

const calculateScore = (): number => {
  let score = stats.value.totalRevenue - stats.value.totalExpenses
  
  const timeBonus = gameStore.timeRemaining * 10
  score += timeBonus
  
  const perfectBonus = stats.value.failedOrders === 0 ? 1000 : 0
  score += perfectBonus
  
  return Math.max(0, Math.floor(score))
}

const getGrade = (): { grade: string; color: string } => {
  const score = calculateScore()
  if (score >= 20000) return { grade: 'S', color: '#fbbf24' }
  if (score >= 15000) return { grade: 'A', color: '#4ade80' }
  if (score >= 10000) return { grade: 'B', color: '#60a5fa' }
  if (score >= 5000) return { grade: 'C', color: '#a78bfa' }
  return { grade: 'D', color: '#f87171' }
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content" :class="{ victory, defeat: !victory }">
      <div class="modal-header">
        <div class="result-icon">{{ victory ? '🏆' : '💔' }}</div>
        <h2>{{ victory ? '关卡完成！' : '时间到！' }}</h2>
        <p v-if="victory" class="result-text">恭喜你成功完成了港口调度任务！</p>
        <p v-else class="result-text">很遗憾，未能在规定时间内完成目标</p>
      </div>

      <div class="grade-section" v-if="victory">
        <div class="grade" :style="{ color: getGrade().color }">{{ getGrade().grade }}</div>
        <div class="grade-label">评级</div>
      </div>

      <div class="stats-section">
        <div class="stat-row">
          <span class="stat-label">最终得分</span>
          <span class="stat-value highlight">{{ formatNumber(calculateScore()) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">完成订单</span>
          <span class="stat-value">{{ stats.completedOrders }} / {{ currentLevel?.targetOrders }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">失败订单</span>
          <span class="stat-value text-red-400">{{ stats.failedOrders }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">总收入</span>
          <span class="stat-value text-green-400">+¥{{ formatNumber(stats.totalRevenue) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">总支出</span>
          <span class="stat-value text-red-400">-¥{{ formatNumber(stats.totalExpenses) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">拥堵事件</span>
          <span class="stat-value">{{ stats.congestionEvents }}</span>
        </div>
        <div class="stat-row" v-if="stats.completedOrders > 0">
          <span class="stat-label">平均配送时间</span>
          <span class="stat-value">{{ stats.averageDeliveryTime.toFixed(1) }}秒</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" @click="emit('back-to-menu')">
          🏠 返回菜单
        </button>
        <button class="btn btn-primary" @click="emit('restart')">
          🔄 再来一次
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  border: 2px solid;
}

.modal-content.victory {
  border-color: #4ade80;
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.3);
}

.modal-content.defeat {
  border-color: #f87171;
  box-shadow: 0 0 40px rgba(248, 113, 113, 0.3);
}

.modal-header {
  margin-bottom: 30px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 28px;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.result-text {
  color: #94a3b8;
  font-size: 14px;
}

.grade-section {
  margin-bottom: 30px;
}

.grade {
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 30px currentColor;
}

.grade-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.stats-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #94a3b8;
  font-size: 14px;
}

.stat-value {
  color: #f1f5f9;
  font-weight: 600;
  font-size: 14px;
}

.stat-value.highlight {
  font-size: 18px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-green-400 { color: #4ade80; }
.text-red-400 { color: #f87171; }

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions .btn {
  flex: 1;
  padding: 14px;
  font-size: 15px;
}

.btn-secondary {
  background: #475569;
  color: white;
}

.btn-secondary:hover {
  background: #64748b;
}
</style>
