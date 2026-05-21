<template>
  <div class="game-over-overlay" v-if="visible">
    <div class="game-over-panel">
      <h2>💀 游戏结束</h2>
      <div class="stats">
        <div class="stat-item">
          <span>到达层数</span>
          <span class="value">{{ level }}</span>
        </div>
        <div class="stat-item">
          <span>最终等级</span>
          <span class="value">{{ playerLevel }}</span>
        </div>
        <div class="stat-item">
          <span>获得金币</span>
          <span class="value">{{ gold }}</span>
        </div>
      </div>
      <div class="buttons">
        <button class="menu-btn primary" @click="restart">重新开始</button>
        <button class="menu-btn" @click="quit">返回主菜单</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  level: number
  playerLevel: number
  gold: number
}>()

const emit = defineEmits<{
  (e: 'restart'): void
  (e: 'quit'): void
}>()

const restart = () => emit('restart')
const quit = () => emit('quit')
</script>

<style scoped>
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-panel {
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid #ef5350;
  border-radius: 12px;
  padding: 30px 40px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

h2 {
  color: #ef5350;
  font-size: 28px;
  margin: 0 0 20px 0;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  min-width: 200px;
  padding: 8px 16px;
  background: #37474f;
  border-radius: 6px;
}

.stat-item span:first-child {
  color: #b0bec5;
}

.stat-item .value {
  color: #4fc3f7;
  font-weight: bold;
}

.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.menu-btn {
  padding: 12px 30px;
  font-size: 14px;
  border: 2px solid #4fc3f7;
  background: transparent;
  color: #4fc3f7;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #4fc3f7;
  color: #1a1a2e;
}

.menu-btn.primary {
  border-color: #66bb6a;
  color: #66bb6a;
}

.menu-btn.primary:hover {
  background: #66bb6a;
  color: #1a1a2e;
}
</style>
