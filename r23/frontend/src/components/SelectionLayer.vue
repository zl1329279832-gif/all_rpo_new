<template>
  <div v-if="store.selectedElement && store.selectedElement.type === 'line'" class="selection-layer">
    <div 
      class="selection-box"
      :style="getBoundingBoxStyle()"
    >
      <div class="handle handle-tl"></div>
      <div class="handle handle-tr"></div>
      <div class="handle handle-bl"></div>
      <div class="handle handle-br"></div>
    </div>
  </div>
</template>

<script setup>
import { useWhiteboardStore } from '@/stores/whiteboard'

const store = useWhiteboardStore()

function getBoundingBoxStyle() {
  const element = store.selectedElement
  if (!element || !element.points || element.points.length === 0) {
    return { display: 'none' }
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  element.points.forEach(point => {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  })
  
  const padding = 10
  const lineWidth = element.lineWidth || 3
  
  return {
    left: (minX - padding - lineWidth) + 'px',
    top: (minY - padding - lineWidth) + 'px',
    width: (maxX - minX + padding * 2 + lineWidth * 2) + 'px',
    height: (maxY - minY + padding * 2 + lineWidth * 2) + 'px'
  }
}
</script>

<style scoped>
.selection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.selection-box {
  position: absolute;
  border: 1px dashed #4a90d9;
  background: rgba(74, 144, 217, 0.05);
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #4a90d9;
  border-radius: 50%;
}

.handle-tl {
  top: -4px;
  left: -4px;
}

.handle-tr {
  top: -4px;
  right: -4px;
}

.handle-bl {
  bottom: -4px;
  left: -4px;
}

.handle-br {
  bottom: -4px;
  right: -4px;
}
</style>
