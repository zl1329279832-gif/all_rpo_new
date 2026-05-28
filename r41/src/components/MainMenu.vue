<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LEVELS } from '@/config/levels'
import { useGameStore } from '@/stores/gameStore'

const emit = defineEmits<{
  (e: 'start-game', level: number): void
}>()

const gameStore = useGameStore()
const selectedLevel = ref(1)
const hasSave = ref(false)

onMounted(() => {
  const save = gameStore.loadGame()
  hasSave.value = !!save
  if (save) {
    selectedLevel.value = save.currentLevel
  }
})

const startGame = (levelId: number) => {
  emit('start-game', levelId)
}

const continueGame = () => {
  const save = gameStore.loadGame()
  if (save) {
    emit('start-game', save.currentLevel)
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'hard': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return difficulty
  }
}
</script>

<template>
  <div class="menu-container">
    <div class="menu-content">
      <div class="title-section">
        <h1 class="game-title">⚓ 港口大亨</h1>
        <p class="game-subtitle">集装箱调度经营游戏</p>
      </div>

      <div class="level-selection">
        <h2 class="section-title">选择关卡</h2>
        <div class="level-cards">
          <div 
            v-for="level in LEVELS" 
            :key="level.id"
            class="level-card"
            :class="{ selected: selectedLevel === level.id }"
            @click="selectedLevel = level.id"
          >
            <div class="level-header">
              <span class="level-number">{{ level.id }}</span>
              <span :class="getDifficultyColor(level.difficulty)">
                {{ getDifficultyText(level.difficulty) }}
              </span>
            </div>
            <h3 class="level-name">{{ level.name }}</h3>
            <div class="level-stats">
              <div class="stat">
                <span class="stat-label">目标订单</span>
                <span class="stat-value">{{ level.targetOrders }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">目标收入</span>
                <span class="stat-value">¥{{ level.targetRevenue }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">时间</span>
                <span class="stat-value">{{ Math.floor(level.duration / 60) }}分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button 
          v-if="hasSave" 
          class="btn btn-secondary"
          @click="continueGame"
        >
          📂 继续游戏
        </button>
        <button 
          class="btn btn-primary start-btn"
          @click="startGame(selectedLevel)"
        >
          🚢 开始游戏
        </button>
      </div>

      <div class="game-tips">
        <h3>💡 游戏提示</h3>
        <ul>
          <li>点击地图上的目标位置调度集卡</li>
          <li>优先处理高价值和紧急订单</li>
          <li>注意冷链和危险品的特殊存放要求</li>
          <li>避免港口拥堵造成的效率损失</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d1b2a 100%);
  overflow: auto;
  padding: 20px;
}

.menu-content {
  max-width: 900px;
  width: 100%;
}

.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.game-title {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.game-subtitle {
  font-size: 18px;
  color: #94a3b8;
}

.section-title {
  font-size: 24px;
  color: #f1f5f9;
  margin-bottom: 20px;
  text-align: center;
}

.level-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.level-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  padding: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-card:hover {
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.5);
}

.level-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.level-number {
  font-size: 28px;
  font-weight: bold;
  color: #3b82f6;
}

.level-name {
  font-size: 18px;
  color: #f1f5f9;
  margin-bottom: 15px;
}

.level-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #94a3b8;
  font-size: 12px;
}

.stat-value {
  color: #f1f5f9;
  font-weight: 600;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.start-btn {
  font-size: 18px;
  padding: 15px 40px;
}

.btn-secondary {
  background: #475569;
  color: white;
}

.btn-secondary:hover {
  background: #64748b;
}

.game-tips {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-tips h3 {
  color: #f1f5f9;
  margin-bottom: 15px;
  font-size: 16px;
}

.game-tips ul {
  list-style: none;
  padding: 0;
}

.game-tips li {
  color: #94a3b8;
  padding: 5px 0;
  padding-left: 20px;
  position: relative;
}

.game-tips li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #3b82f6;
}
</style>
