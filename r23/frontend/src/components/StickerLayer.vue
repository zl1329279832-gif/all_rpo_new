<template>
  <div class="sticker-layer">
    <div
      v-for="element in stickers"
      :key="element.id"
      class="sticker"
      :class="{ selected: store.selectedElementId === element.id, dragging: draggingId === element.id }"
      :style="getStickerStyle(element)"
      @mousedown="handleMouseDown($event, element)"
      @dblclick="startEditing(element)"
    >
      <div
        v-if="editingId === element.id"
        class="sticker-editor"
      >
        <textarea
          ref="stickerTextarea"
          v-model="element.text"
          class="sticker-textarea"
          :style="{ backgroundColor: element.backgroundColor, color: element.textColor, fontSize: element.fontSize + 'px' }"
          @blur="stopEditing"
          @keydown.enter.exact="stopEditing"
        ></textarea>
      </div>
      <div 
        v-else
        class="sticker-content"
        :style="{ fontSize: element.fontSize + 'px', color: element.textColor }"
      >
        {{ element.text }}
      </div>
      <div class="sticker-handle" v-if="store.selectedElementId === element.id">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="6" r="1"/>
          <circle cx="9" cy="12" r="1"/>
          <circle cx="9" cy="18" r="1"/>
          <circle cx="15" cy="6" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <circle cx="15" cy="18" r="1"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { ElementType } from '@/utils/messageTypes'

const store = useWhiteboardStore()
const stickerTextarea = ref(null)
const editingId = ref(null)
const draggingId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const lastMousePos = ref({ x: 0, y: 0 })

const stickers = computed(() => {
  return store.elementsArray.filter(el => el.type === ElementType.STICKER)
})

function getStickerStyle(element) {
  return {
    left: element.x + 'px',
    top: element.y + 'px',
    width: element.width + 'px',
    height: element.height + 'px',
    backgroundColor: element.backgroundColor
  }
}

function handleMouseDown(event, element) {
  if (editingId.value === element.id) return
  
  event.stopPropagation()
  
  store.selectElement(element.id)
  
  draggingId.value = element.id
  lastMousePos.value = {
    x: event.clientX,
    y: event.clientY
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event) {
  if (!draggingId.value) return
  
  const deltaX = event.clientX - lastMousePos.value.x
  const deltaY = event.clientY - lastMousePos.value.y
  
  const element = store.elements.get(draggingId.value)
  if (element) {
    const newX = element.x + deltaX
    const newY = element.y + deltaY
    
    store.moveElement(element.id, deltaX, deltaY, newX, newY)
  }
  
  lastMousePos.value = {
    x: event.clientX,
    y: event.clientY
  }
}

function handleMouseUp() {
  draggingId.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function startEditing(element) {
  editingId.value = element.id
  nextTick(() => {
    if (stickerTextarea.value) {
      stickerTextarea.value.focus()
      stickerTextarea.value.select()
    }
  })
}

function stopEditing() {
  if (editingId.value) {
    store.updateSticker(editingId.value, store.elements.get(editingId.value).text)
    editingId.value = null
  }
}

onMounted(() => {
  const handleKeyDown = (event) => {
    if (editingId.value) return
    
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (store.selectedElementId) {
        store.deleteElement(store.selectedElementId)
      }
    }
    
    if (event.key === 'Escape') {
      store.deselectElement()
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.sticker-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sticker {
  position: absolute;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: move;
  pointer-events: auto;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.sticker:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.sticker.selected {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}

.sticker.dragging {
  opacity: 0.9;
  z-index: 1000;
  transform: scale(1.02);
}

.sticker-content {
  padding: 12px;
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

.sticker-editor {
  width: 100%;
  height: 100%;
  padding: 0;
}

.sticker-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 12px;
  font-family: inherit;
  text-align: center;
  box-sizing: border-box;
  background: transparent;
}

.sticker-handle {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 24px;
  height: 24px;
  background: #4a90d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: move;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
