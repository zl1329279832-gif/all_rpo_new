<script setup lang="ts">
import { ref } from 'vue'
import SceneViewer from '../components/SceneViewer.vue'
import ControlBar from '../components/ControlBar.vue'
import DataPanel from '../components/DataPanel.vue'
import type { ViewMode } from '../types'

const sceneViewerRef = ref<InstanceType<typeof SceneViewer> | null>(null)
const currentView = ref<ViewMode>('normal')
const isPanelOpen = ref(true)
const isAnimating = ref(false)

const handleViewChange = async (view: ViewMode) => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  
  if (view === 'normal') {
    if (currentView.value === 'exploded') {
      await sceneViewerRef.value?.resetExplodedView()
    } else if (currentView.value === 'internal') {
      await sceneViewerRef.value?.resetInternalView()
    }
  }
  
  currentView.value = view
  sceneViewerRef.value?.setViewMode(view)
  
  isAnimating.value = false
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

const handleToggleExplodedView = async () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  if (currentView.value === 'exploded') {
    await sceneViewerRef.value?.resetExplodedView()
    currentView.value = 'normal'
  } else {
    await sceneViewerRef.value?.playExplodedView()
    currentView.value = 'exploded'
  }
  isAnimating.value = false
}

const handleToggleInternalView = async () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  if (currentView.value === 'internal') {
    await sceneViewerRef.value?.resetInternalView()
    currentView.value = 'normal'
  } else {
    await sceneViewerRef.value?.playInternalView()
    currentView.value = 'internal'
  }
  isAnimating.value = false
}

const handleDeploySolarPanels = async () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  await sceneViewerRef.value?.deploySolarPanels()
  isAnimating.value = false
}

const handleResetCamera = () => {
  sceneViewerRef.value?.resetCamera()
}
</script>

<template>
  <div class="w-full h-screen bg-gray-900 relative overflow-hidden">
    <SceneViewer
      ref="sceneViewerRef"
      :view-mode="currentView"
      @animation-start="handleAnimationStart"
      @animation-complete="handleAnimationComplete"
    />
    
    <ControlBar
      :current-view="currentView"
      :is-animating="isAnimating"
      :is-panel-open="isPanelOpen"
      @view-change="handleViewChange"
      @toggle-exploded-view="handleToggleExplodedView"
      @toggle-internal-view="handleToggleInternalView"
      @deploy-solar-panels="handleDeploySolarPanels"
      @reset-camera="handleResetCamera"
      @toggle-panel="togglePanel"
    />
    
    <DataPanel :is-open="isPanelOpen" />
    
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
      <span>🖱️ 左键旋转 | 右键平移 | 滚轮缩放 | 点击部件查看详情</span>
    </div>
  </div>
</template>
