<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Activity, BarChart3, Droplets } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <Droplets :size="22" class="toolbar-icon" />
      <span class="toolbar-title">智慧水务泵站监控系统</span>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn active" @click="router.push('/')">
        <Activity :size="16" />
        <span>三维监控</span>
      </button>
      <button class="toolbar-btn" @click="router.push('/dashboard')">
        <BarChart3 :size="16" />
        <span>数据面板</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 20px;
  background: linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(15, 30, 55, 0.95));
  border-bottom: 1px solid rgba(30, 144, 255, 0.2);
  backdrop-filter: blur(10px);
  z-index: 100;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-icon {
  color: #00e5ff;
}
.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #e6f7ff;
  letter-spacing: 2px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid rgba(30, 144, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s;
}
.toolbar-btn:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #e6f7ff;
}
.toolbar-btn.active {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.6);
  color: #00e5ff;
  box-shadow: 0 0 8px rgba(30, 144, 255, 0.3);
}
</style>
