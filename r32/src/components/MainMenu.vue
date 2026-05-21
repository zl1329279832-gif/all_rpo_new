<template>
  <div class="main-menu" v-if="visible">
    <div class="menu-content">
      <h1 class="game-title">⚔️ Roguelike</h1>
      <p class="subtitle">地牢探险</p>
      <div class="menu-buttons">
        <button class="menu-btn primary" @click="newGame">新的冒险</button>
        <button class="menu-btn" :disabled="!hasSave" @click="loadGame">继续游戏</button>
      </div>
      <div class="controls-hint">
        <h3>操作说明</h3>
        <div class="controls-grid">
          <div class="control-item"><span class="key">WASD</span><span>移动</span></div>
          <div class="control-item"><span class="key">Space/J</span><span>攻击</span></div>
          <div class="control-item"><span class="key">1-4</span><span>使用技能</span></div>
          <div class="control-item"><span class="key">I</span><span>背包</span></div>
          <div class="control-item"><span class="key">ESC</span><span>暂停</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  hasSave: boolean
}>()

const emit = defineEmits<{
  (e: 'newGame'): void
  (e: 'loadGame'): void
}>()

const newGame = () => emit('newGame')
const loadGame = () => emit('loadGame')
</script>

<style scoped>
.main-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.menu-content {
  text-align: center;
  color: white;
}

.game-title {
  font-size: 56px;
  margin: 0;
  background: linear-gradient(45deg, #4fc3f7, #7e57c2, #66bb6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 24px;
  color: #b0bec5;
  margin: 8px 0 40px 0;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.menu-btn {
  padding: 14px 60px;
  font-size: 18px;
  border: 2px solid #4fc3f7;
  background: transparent;
  color: #4fc3f7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn:hover:not(:disabled) {
  background: #4fc3f7;
  color: #1a1a2e;
  transform: scale(1.05);
}

.menu-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-btn.primary {
  border-color: #66bb6a;
  color: #66bb6a;
}

.menu-btn.primary:hover:not(:disabled) {
  background: #66bb6a;
  color: #1a1a2e;
}

.controls-hint {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-hint h3 {
  margin: 0 0 16px 0;
  color: #b0bec5;
  font-size: 16px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
}

.key {
  background: #37474f;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
  color: #4fc3f7;
  min-width: 60px;
  text-align: center;
}
</style>
