<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SceneManager } from '@/three'
import type { PickResult } from '@/three'

const emit = defineEmits<{
  (e: 'scene-ready', manager: SceneManager): void
  (e: 'pick', result: PickResult): void
}>()

const containerRef = ref<HTMLElement | null>(null)
let sceneManager: SceneManager | null = null

onMounted(() => {
  if (!containerRef.value) return

  sceneManager = new SceneManager(containerRef.value)
  emit('scene-ready', sceneManager)
})

onUnmounted(() => {
  sceneManager?.dispose()
  sceneManager = null
})

defineExpose({
  getSceneManager: () => sceneManager
})
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.three-container :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
