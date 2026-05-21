<template>
  <div class="level-complete-overlay" v-if="visible">
    <div class="level-complete-panel">
      <h2>🎉 关卡完成！</h2>
      <div class="stats">
        <div class="stat-item">
          <span>当前层数</span>
          <span class="value">{{ level }}</span>
        </div>
        <div class="stat-item">
          <span>角色等级</span>
          <span class="value">{{ playerLevel }}</span>
        </div>
        <div class="stat-item">
          <span>当前金币</span>
          <span class="value">{{ gold }}</span>
        </div>
      </div>
      <button class="continue-btn" @click="continueToNext">继续探索</button>
      <div class="hint">准备进入更深的地牢...</div>
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
  (e: 'continue'): void
}>()

const continueToNext = () => emit('continue')
</script>

<style scoped>
.level-complete-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.level-complete-panel {
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 30px 40px;
  text-align: center;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

h2 {
  color: #ffd700;
  font-size: 28px;
  margin: 0 0 20px 0;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
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

.continue-btn {
  padding: 12px 40px;
  font-size: 16px;
  border: 2px solid #ffd700;
  background: transparent;
  color: #ffd700;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}

.continue-btn:hover {
  background: #ffd700;
  color: #1a1a2e;
}

.hint {
  margin-top: 16px;
  font-size: 12px;
  color: #78909c;
}
</style>
