<template>
  <div class="whiteboard-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      class="whiteboard-canvas"
      :class="{ 'read-only': readOnly }"
      :style="{ cursor: readOnly ? 'default' : 'crosshair' }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @dblclick="handleDoubleClick"
    ></canvas>
    <canvas ref="overlayCanvas" class="whiteboard-canvas overlay"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  tool: {
    type: String,
    default: 'select'
  },
  color: {
    type: String,
    default: '#333333'
  },
  lineWidth: {
    type: Number,
    default: 3
  },
  initialElements: {
    type: Array,
    default: () => []
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['addElement', 'updateElement', 'deleteElement', 'draw'])

const containerRef = ref(null)
const canvasRef = ref(null)
const overlayCanvas = ref(null)
let ctx = null
let overlayCtx = null

const elements = ref([])
const isDrawing = ref(false)
const currentElement = ref(null)
const selectedElement = ref(null)
const startX = ref(0)
const startY = ref(0)

onMounted(() => {
  initCanvas()
  elements.value = props.initialElements.map(e => ({
    id: e.id,
    type: e.type,
    ...e.data
  }))
  redraw()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(() => props.initialElements, (newElements) => {
  elements.value = newElements.map(e => ({
    id: e.id,
    type: e.type,
    ...e.data
  }))
  redraw()
})

const initCanvas = () => {
  const canvas = canvasRef.value
  const overlay = overlayCanvas.value
  const container = containerRef.value
  
  const rect = container.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  overlay.width = rect.width
  overlay.height = rect.height
  
  ctx = canvas.getContext('2d')
  overlayCtx = overlay.getContext('2d')
  
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const handleResize = () => {
  initCanvas()
  redraw()
}

const getCanvasCoords = (e) => {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

const handleMouseDown = (e) => {
  if (props.readOnly) {
    return
  }

  const { x, y } = getCanvasCoords(e)
  startX.value = x
  startY.value = y
  isDrawing.value = true

  if (props.tool === 'select') {
    selectElementAt(x, y)
  } else if (props.tool === 'eraser') {
    const elem = findElementAt(x, y)
    if (elem) {
      deleteElement(elem.id)
    }
  } else if (props.tool === 'line' || props.tool === 'rect' || props.tool === 'circle') {
    currentElement.value = {
      id: uuidv4(),
      type: props.tool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color: props.color,
      lineWidth: props.lineWidth
    }
  } else if (props.tool === 'pen') {
    currentElement.value = {
      id: uuidv4(),
      type: 'pen',
      points: [{ x, y }],
      color: props.color,
      lineWidth: props.lineWidth
    }
  } else if (props.tool === 'sticky') {
    const elem = {
      id: uuidv4(),
      type: 'sticky',
      x: x,
      y: y,
      width: 180,
      height: 120,
      text: '',
      bgColor: '#FFF9C4',
      color: '#333333'
    }
    addElement(elem)
  } else if (props.tool === 'text') {
    const elem = {
      id: uuidv4(),
      type: 'text',
      x: x,
      y: y,
      text: '',
      color: props.color,
      fontSize: 16
    }
    addElement(elem)
  }
}

const handleMouseMove = (e) => {
  const { x, y } = getCanvasCoords(e)

  if (!isDrawing.value) {
    return
  }

  if (props.tool === 'select' && selectedElement.value) {
    const dx = x - startX.value
    const dy = y - startY.value
    moveElement(selectedElement.value, dx, dy)
    startX.value = x
    startY.value = y
    redraw()
    emit('draw', {
      type: 'CURSOR',
      elementId: selectedElement.value.id,
      payload: selectedElement.value
    })
  } else if (props.tool === 'pen' && currentElement.value) {
    currentElement.value.points.push({ x, y })
    redraw()
    drawCurrentElement()
    emit('draw', {
      type: 'DRAW',
      elementId: currentElement.value.id,
      payload: currentElement.value
    })
  } else if ((props.tool === 'line' || props.tool === 'rect' || props.tool === 'circle') && currentElement.value) {
    currentElement.value.endX = x
    currentElement.value.endY = y
    redraw()
    drawCurrentElement()
  }
}

const handleMouseUp = () => {
  if (!isDrawing.value) return
  isDrawing.value = false

  if (currentElement.value) {
    addElement(currentElement.value)
    currentElement.value = null
  } else if (selectedElement.value) {
    emit('updateElement', {
      type: 'UPDATE',
      elementId: selectedElement.value.id,
      payload: selectedElement.value
    })
  }

  clearOverlay()
}

const handleDoubleClick = (e) => {
  if (props.readOnly) {
    return
  }

  const { x, y } = getCanvasCoords(e)
  const elem = findElementAt(x, y)
  
  if (elem && (elem.type === 'sticky' || elem.type === 'text')) {
    const newText = prompt('输入文本:', elem.text || '')
    if (newText !== null) {
      elem.text = newText
      redraw()
      emit('updateElement', {
        type: 'UPDATE',
        elementId: elem.id,
        payload: elem
      })
    }
  }
}

const findElementAt = (x, y) => {
  for (let i = elements.value.length - 1; i >= 0; i--) {
    const elem = elements.value[i]
    if (isPointInElement(x, y, elem)) {
      return elem
    }
  }
  return null
}

const isPointInElement = (x, y, elem) => {
  const margin = 10
  
  switch (elem.type) {
    case 'sticky':
    case 'rect':
      return x >= elem.x - margin && x <= elem.x + elem.width + margin &&
             y >= elem.y - margin && y <= elem.y + elem.height + margin
    case 'circle':
      const cx = (elem.startX + elem.endX) / 2
      const cy = (elem.startY + elem.endY) / 2
      const rx = Math.abs(elem.endX - elem.startX) / 2
      const ry = Math.abs(elem.endY - elem.startY) / 2
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      return dx * dx + dy * dy <= 1
    case 'line':
      return pointToLineDistance(x, y, elem.startX, elem.startY, elem.endX, elem.endY) < margin
    case 'pen':
      for (const point of elem.points) {
        if (Math.abs(point.x - x) < margin && Math.abs(point.y - y) < margin) {
          return true
        }
      }
      return false
    case 'text':
      return x >= elem.x - margin && x <= elem.x + 200 + margin &&
             y >= elem.y - 20 - margin && y <= elem.y + margin
    default:
      return false
  }
}

const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy
  return Math.sqrt(dx * dx + dy * dy)
}

const selectElementAt = (x, y) => {
  const elem = findElementAt(x, y)
  selectedElement.value = elem
  redraw()
}

const moveElement = (elem, dx, dy) => {
  switch (elem.type) {
    case 'sticky':
    case 'rect':
    case 'text':
      elem.x += dx
      elem.y += dy
      break
    case 'line':
    case 'circle':
      elem.startX += dx
      elem.startY += dy
      elem.endX += dx
      elem.endY += dy
      break
    case 'pen':
      elem.points = elem.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
      }))
      break
  }
}

const addElement = (elem) => {
  elements.value.push({ ...elem })
  redraw()
  emit('addElement', {
    type: 'ADD',
    elementId: elem.id,
    payload: elem
  })
}

const deleteElement = (id) => {
  const index = elements.value.findIndex(e => e.id === id)
  if (index !== -1) {
    elements.value.splice(index, 1)
    if (selectedElement.value?.id === id) {
      selectedElement.value = null
    }
    redraw()
    emit('deleteElement', {
      type: 'DELETE',
      elementId: id
    })
  }
}

const deleteSelected = () => {
  if (selectedElement.value) {
    deleteElement(selectedElement.value.id)
  }
}

const redraw = () => {
  if (!ctx) return
  
  const canvas = canvasRef.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const elem of elements.value) {
    drawElement(elem)
  }

  if (selectedElement.value) {
    drawSelection(selectedElement.value)
  }
}

const drawCurrentElement = () => {
  if (!overlayCtx || !currentElement.value) return
  
  clearOverlay()
  drawElementOnCanvas(currentElement.value, overlayCtx)
}

const clearOverlay = () => {
  if (!overlayCtx) return
  const canvas = overlayCanvas.value
  overlayCtx.clearRect(0, 0, canvas.width, canvas.height)
}

const drawElement = (elem) => {
  drawElementOnCanvas(elem, ctx)
}

const drawElementOnCanvas = (elem, context) => {
  context.save()
  
  switch (elem.type) {
    case 'line':
      context.strokeStyle = elem.color
      context.lineWidth = elem.lineWidth
      context.beginPath()
      context.moveTo(elem.startX, elem.startY)
      context.lineTo(elem.endX, elem.endY)
      context.stroke()
      break
      
    case 'rect':
      context.strokeStyle = elem.color
      context.lineWidth = elem.lineWidth
      const rx = Math.min(elem.startX, elem.endX)
      const ry = Math.min(elem.startY, elem.endY)
      const rw = Math.abs(elem.endX - elem.startX)
      const rh = Math.abs(elem.endY - elem.startY)
      context.strokeRect(rx, ry, rw, rh)
      break
      
    case 'circle':
      context.strokeStyle = elem.color
      context.lineWidth = elem.lineWidth
      const cx = (elem.startX + elem.endX) / 2
      const cy = (elem.startY + elem.endY) / 2
      const crx = Math.abs(elem.endX - elem.startX) / 2
      const cry = Math.abs(elem.endY - elem.startY) / 2
      context.beginPath()
      context.ellipse(cx, cy, crx, cry, 0, 0, Math.PI * 2)
      context.stroke()
      break
      
    case 'pen':
      if (elem.points.length < 2) break
      context.strokeStyle = elem.color
      context.lineWidth = elem.lineWidth
      context.beginPath()
      context.moveTo(elem.points[0].x, elem.points[0].y)
      for (let i = 1; i < elem.points.length; i++) {
        context.lineTo(elem.points[i].x, elem.points[i].y)
      }
      context.stroke()
      break
      
    case 'sticky':
      context.fillStyle = elem.bgColor || '#FFF9C4'
      context.fillRect(elem.x, elem.y, elem.width, elem.height)
      context.strokeStyle = '#E0D86C'
      context.lineWidth = 1
      context.strokeRect(elem.x, elem.y, elem.width, elem.height)
      
      if (elem.text) {
        context.fillStyle = elem.color || '#333333'
        context.font = '14px sans-serif'
        wrapText(context, elem.text, elem.x + 10, elem.y + 25, elem.width - 20, 20)
      }
      break
      
    case 'text':
      context.fillStyle = elem.color || '#333333'
      context.font = `${elem.fontSize || 16}px sans-serif`
      context.fillText(elem.text || '双击编辑文字', elem.x, elem.y)
      break
  }
  
  context.restore()
}

const drawSelection = (elem) => {
  ctx.save()
  ctx.strokeStyle = '#4a90d9'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  
  const bounds = getElementBounds(elem)
  ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10)
  
  ctx.restore()
}

const getElementBounds = (elem) => {
  switch (elem.type) {
    case 'sticky':
    case 'rect':
      return { x: elem.x, y: elem.y, width: elem.width, height: elem.height }
    case 'line':
      return {
        x: Math.min(elem.startX, elem.endX),
        y: Math.min(elem.startY, elem.endY),
        width: Math.abs(elem.endX - elem.startX) || 10,
        height: Math.abs(elem.endY - elem.startY) || 10
      }
    case 'circle':
      return {
        x: Math.min(elem.startX, elem.endX),
        y: Math.min(elem.startY, elem.endY),
        width: Math.abs(elem.endX - elem.startX),
        height: Math.abs(elem.endY - elem.startY)
      }
    case 'pen':
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const p of elem.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    case 'text':
      return { x: elem.x, y: elem.y - 20, width: 200, height: 25 }
    default:
      return { x: 0, y: 0, width: 50, height: 50 }
  }
}

const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = context.measureText(testLine)
    const testWidth = metrics.width
    
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  context.fillText(line, x, y)
}

const remoteAddElement = (data) => {
  const exists = elements.value.some(e => e.id === data.elementId)
  if (exists) {
    remoteUpdateElement(data)
    return
  }
  
  elements.value.push({
    id: data.elementId,
    ...data.payload
  })
  redraw()
}

const remoteUpdateElement = (data) => {
  const index = elements.value.findIndex(e => e.id === data.elementId)
  if (index !== -1) {
    elements.value[index] = {
      id: data.elementId,
      ...data.payload
    }
    redraw()
  }
}

const remoteDeleteElement = (data) => {
  const index = elements.value.findIndex(e => e.id === data.elementId)
  if (index !== -1) {
    elements.value.splice(index, 1)
    if (selectedElement.value?.id === data.elementId) {
      selectedElement.value = null
    }
    redraw()
  }
}

const remoteDraw = (data) => {
  const index = elements.value.findIndex(e => e.id === data.elementId)
  if (index === -1) {
    elements.value.push({
      id: data.elementId,
      ...data.payload
    })
  } else {
    elements.value[index] = {
      id: data.elementId,
      ...data.payload
    }
  }
  redraw()
}

defineExpose({
  deleteSelected,
  remoteAddElement,
  remoteUpdateElement,
  remoteDeleteElement,
  remoteDraw,
  redraw
})
</script>

<style scoped>
.whiteboard-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
}

.whiteboard-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
}

.whiteboard-canvas.read-only {
  cursor: default;
}

.whiteboard-canvas.overlay {
  pointer-events: none;
}
</style>
