<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Activity, BarChart3, Droplets, AlertTriangle, BookOpen, BarChart2 } from 'lucide-vue-next'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const activeRoute = computed(() => route.name)
</script>

<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <Droplets :size="22" class="toolbar-icon" />
      <span class="toolbar-title">智慧水务泵站监控系统</span>
    </div>
    <div class="toolbar-right">
      <button 
        class="toolbar-btn" 
        :class="{ active: activeRoute === 'monitor' }" 
        @click="router.push('/')"
      >
        <Activity :size="16" />
        <span>三维监控</span>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: activeRoute === 'dashboard' }" 
        @click="router.push('/dashboard')"
      >
        <BarChart3 :size="16" />
        <span>数据面板</span>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: activeRoute === 'alarmHandle' }" 
        @click="router.push('/alarm-handle')"
      >
        <AlertTriangle :size="16" />
        <span>告警处置</span>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: activeRoute === 'deviceLedger' }" 
        @click="router.push('/device-ledger')"
      >
        <BookOpen :size="16" />
        <span>设备台账</span>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: activeRoute === 'operationStats' }" 
        @click="router.push('/operation-stats')"
      >
        <BarChart2 :size="16" />
        <span>运维统计</span>
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
