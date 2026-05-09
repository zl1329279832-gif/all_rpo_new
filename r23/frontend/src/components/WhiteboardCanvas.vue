<template>
  <canvas 
    ref="canvasRef" 
    class="whiteboard-canvas"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { ElementType } from '@/utils/messageTypes'

const canvasRef = ref(null)
const ctx = ref(null)
const store = useWhiteboardStore()

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  
  watch(
    () => store.elementsArray,
    () => {
      requestAnimationFrame(render)
    },
    { deep: true }
  )
  
  requestAnimationFrame(render)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight
  ctx.value = canvas.getContext('2d')
  requestAnimationFrame(render)
}

function render() {
  if (!ctx.value || !canvasRef.value) return
  
  const context = ctx.value
  const canvas = canvasRef.value
  
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  store.elementsArray.forEach(element => {
    if (element.type === ElementType.LINE) {
      drawLine(element)
    }
  })
  
  if (store.isDrawing && store.currentPoints.length > 1) {
    drawCurrentLine()
  }
}

function drawLine(element) {
  if (!ctx.value || element.points.length < 2) return
  
  const context = ctx.value
  
  context.beginPath()
  context.strokeStyle = element.color
  context.lineWidth = element.lineWidth
  context.lineCap = element.lineCap || 'round'
  context.lineJoin = element.lineJoin || 'round'
  
  context.moveTo(element.points[0].x, element.points[0].y)
  
  for (let i = 1; i < element.points.length; i++) {
    context.lineTo(element.points[i].x, element.points[i].y)
  }
  
  context.stroke()
}

function drawCurrentLine() {
  if (!ctx.value || store.currentPoints.length < 2) return
  
  const context = ctx.value
  const points = store.currentPoints
  
  context.beginPath()
  context.strokeStyle = store.currentTool === 'eraser' ? '#FFFFFF' : store.currentColor
  context.lineWidth = store.currentTool === 'eraser' 
    ? store.currentLineWidth * 3 
    : store.currentLineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'
  
  context.moveTo(points[0].x, points[0].y)
  
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y)
  }
  
  context.stroke()
}

function getMousePos(event) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function handleMouseDown(event) {
  if (store.currentTool === 'select') {
    store.deselectElement()
    return
  }
  
  if (store.currentTool === 'sticker') {
    const pos = getMousePos(event)
    store.addSticker(pos.x - 75, pos.y - 50)
    return
  }
  
  const pos = getMousePos(event)
  store.startDrawing(pos.x, pos.y)
  requestAnimationFrame(render)
}

function handleMouseMove(event) {
  if (!store.isDrawing) return
  
  const pos = getMousePos(event)
  store.continueDrawing(pos.x, pos.y)
  requestAnimationFrame(render)
}

function handleMouseUp() {
  if (store.isDrawing) {
    store.finishDrawing()
    requestAnimationFrame(render)
  }
}
</script>

<style scoped>
.whiteboard-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
