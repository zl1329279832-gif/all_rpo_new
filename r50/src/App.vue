<template>
  <div class="app-container">
    <SceneCanvas />
    <ControlPanel />
    <ComponentInfoPanel />
    <HelpOverlay v-if="sceneStore.showHelp" @close="sceneStore.toggleHelp()" />
    <LoadingOverlay v-if="sceneStore.isLoading" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SceneCanvas from './components/SceneCanvas.vue'
import ControlPanel from './components/ControlPanel.vue'
import ComponentInfoPanel from './components/ComponentInfoPanel.vue'
import HelpOverlay from './components/HelpOverlay.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import { useSceneStore } from './stores/sceneStore'

const sceneStore = useSceneStore()

onMounted(() => {
  setTimeout(() => {
    sceneStore.setLoading(false)
  }, 1500)
})
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
