<template>
  <div class="pause-overlay" v-if="visible">
    <div class="pause-menu">
      <h2>游戏暂停</h2>
      <div class="menu-buttons">
        <button class="menu-btn" @click="resume">继续游戏</button>
        <button class="menu-btn" @click="save">保存游戏</button>
        <button class="menu-btn danger" @click="quit">返回主菜单</button>
      </div>
      <div class="hint">按 ESC 继续游戏</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'resume'): void
  (e: 'save'): void
  (e: 'quit'): void
}>()

const resume = () => emit('resume')
const save = () => emit('save')
const quit = () => emit('quit')
</script>

<style scoped>
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.pause-menu {
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid #4fc3f7;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

h2 {
  color: white;
  font-size: 28px;
  margin: 0 0 20px 0;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-btn {
  padding: 12px 40px;
  font-size: 16px;
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

.menu-btn.danger {
  border-color: #ef5350;
  color: #ef5350;
}

.menu-btn.danger:hover {
  background: #ef5350;
  color: white;
}

.hint {
  margin-top: 20px;
  font-size: 12px;
  color: #78909c;
}
</style>
