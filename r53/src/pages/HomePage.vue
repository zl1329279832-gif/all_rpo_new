<script setup lang="ts">
import { ref } from 'vue'
import SceneViewer from '../components/SceneViewer.vue'
import ControlBar from '../components/ControlBar.vue'
import DataPanel from '../components/DataPanel.vue'
import type { ViewMode } from '../types'

const currentView = ref<ViewMode>('normal')
const isPanelOpen = ref(true)
const isAnimating = ref(false)

const handleViewChange = (view: ViewMode) => {
  currentView.value = view
}

const handleAnimationStart = () => {
  isAnimating.value = true
}

const handleAnimationComplete = () => {
  isAnimating.value = false
}

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}
</script>

<template>
  <div class="w-full h-screen bg-gray-900 relative overflow-hidden">
    <SceneViewer
      :view-mode="currentView"
      @animation-start="handleAnimationStart"
      @animation-complete="handleAnimationComplete"
    />
    
    <ControlBar
      :current-view="currentView"
      :is-animating="isAnimating"
      :is-panel-open="isPanelOpen"
      @view-change="handleViewChange"
      @toggle-panel="togglePanel"
    />
    
    <DataPanel :is-open="isPanelOpen" />
    
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
      <span>🖱️ 左键旋转 | 右键平移 | 滚轮缩放 | 点击部件查看详情</span>
    </div>
  </div>
</template>
