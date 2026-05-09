import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { MessageType, ElementType } from '@/utils/messageTypes'
import { WebSocketClient } from '@/utils/websocket'

export const useWhiteboardStore = defineStore('whiteboard', () => {
  const roomId = ref('')
  const currentUser = ref(null)
  const users = ref([])
  const elements = ref(new Map())
  const selectedElementId = ref(null)
  const currentTool = ref('pen')
  const currentColor = ref('#000000')
  const currentLineWidth = ref(3)
  const isDrawing = ref(false)
  const currentPoints = ref([])
  const wsClient = ref(null)
  const isConnected = ref(false)
  const stickerColors = ['#FFEAA7', '#98D8C8', '#DDA0DD', '#F7DC6F', '#BB8FCE', '#85C1E9']

  const elementsArray = computed(() => {
    return Array.from(elements.value.values())
  })

  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null
    return elements.value.get(selectedElementId.value) || null
  })

  function initializeRoom(room) {
    roomId.value = room
    wsClient.value = new WebSocketClient(room)
    isConnected.value = wsClient.value.isConnected
    
    setupWebSocketHandlers()
    wsClient.value.connect()
  }

  function setupWebSocketHandlers() {
    wsClient.value.on(MessageType.JOIN_ROOM, (message) => {
      currentUser.value = message.payload
    })

    wsClient.value.on(MessageType.USER_LIST, (message) => {
      users.value = message.payload
    })

    wsClient.value.on(MessageType.DRAW_LINE, (message) => {
      handleRemoteDrawLine(message.payload)
    })

    wsClient.value.on(MessageType.ADD_STICKER, (message) => {
      handleRemoteAddSticker(message.payload)
    })

    wsClient.value.on(MessageType.MOVE_ELEMENT, (message) => {
      handleRemoteMoveElement(message.payload)
    })

    wsClient.value.on(MessageType.DELETE_ELEMENT, (message) => {
      handleRemoteDeleteElement(message.payload)
    })

    wsClient.value.on(MessageType.CLEAR_CANVAS, () => {
      elements.value.clear()
      selectedElementId.value = null
    })

    wsClient.value.on(MessageType.SYNC_STATE, (message) => {
      handleSyncState(message.payload)
    })
  }

  function handleSyncState(stateElements) {
    if (!stateElements || !Array.isArray(stateElements)) return
    
    stateElements.forEach(elementData => {
      if (elementData.elementId) {
        if (elementData.points) {
          const element = {
            id: elementData.elementId,
            type: ElementType.LINE,
            points: elementData.points,
            color: elementData.color,
            lineWidth: elementData.lineWidth,
            lineCap: elementData.lineCap || 'round',
            lineJoin: elementData.lineJoin || 'round'
          }
          elements.value.set(element.id, element)
        } else if (elementData.text !== undefined) {
          const element = {
            id: elementData.elementId,
            type: ElementType.STICKER,
            text: elementData.text,
            x: elementData.x,
            y: elementData.y,
            width: elementData.width || 150,
            height: elementData.height || 100,
            backgroundColor: elementData.backgroundColor || '#FFEAA7',
            textColor: elementData.textColor || '#000000',
            fontSize: elementData.fontSize || 14
          }
          elements.value.set(element.id, element)
        }
      }
    })
  }

  function handleRemoteDrawLine(payload) {
    const element = {
      id: payload.elementId,
      type: ElementType.LINE,
      points: payload.points,
      color: payload.color,
      lineWidth: payload.lineWidth,
      lineCap: payload.lineCap || 'round',
      lineJoin: payload.lineJoin || 'round'
    }
    elements.value.set(element.id, element)
  }

  function handleRemoteAddSticker(payload) {
    const element = {
      id: payload.elementId,
      type: ElementType.STICKER,
      text: payload.text,
      x: payload.x,
      y: payload.y,
      width: payload.width || 150,
      height: payload.height || 100,
      backgroundColor: payload.backgroundColor || '#FFEAA7',
      textColor: payload.textColor || '#000000',
      fontSize: payload.fontSize || 14
    }
    elements.value.set(element.id, element)
  }

  function handleRemoteMoveElement(payload) {
    const element = elements.value.get(payload.elementId)
    if (element) {
      element.x = payload.newX
      element.y = payload.newY
    }
  }

  function handleRemoteDeleteElement(payload) {
    elements.value.delete(payload.elementId)
    if (selectedElementId.value === payload.elementId) {
      selectedElementId.value = null
    }
  }

  function startDrawing(x, y) {
    if (currentTool.value !== 'pen' && currentTool.value !== 'eraser') return
    
    isDrawing.value = true
    currentPoints.value = [{ x, y }]
  }

  function continueDrawing(x, y) {
    if (!isDrawing.value) return
    
    currentPoints.value.push({ x, y })
  }

  function finishDrawing() {
    if (!isDrawing.value) return
    
    isDrawing.value = false
    
    if (currentPoints.value.length < 2) {
      currentPoints.value = []
      return
    }

    const elementId = uuidv4()
    const payload = {
      elementId,
      points: [...currentPoints.value],
      color: currentTool.value === 'eraser' ? '#FFFFFF' : currentColor.value,
      lineWidth: currentTool.value === 'eraser' ? currentLineWidth.value * 3 : currentLineWidth.value,
      lineCap: 'round',
      lineJoin: 'round'
    }

    const element = {
      id: elementId,
      type: ElementType.LINE,
      points: payload.points,
      color: payload.color,
      lineWidth: payload.lineWidth,
      lineCap: payload.lineCap,
      lineJoin: payload.lineJoin
    }

    elements.value.set(elementId, element)
    
    if (wsClient.value) {
      wsClient.value.send({
        type: MessageType.DRAW_LINE,
        roomId: roomId.value,
        payload
      })
    }

    currentPoints.value = []
  }

  function addSticker(x, y) {
    const elementId = uuidv4()
    const payload = {
      elementId,
      text: '便签',
      x,
      y,
      width: 150,
      height: 100,
      backgroundColor: stickerColors[Math.floor(Math.random() * stickerColors.length)],
      textColor: '#000000',
      fontSize: 14
    }

    const element = {
      id: elementId,
      type: ElementType.STICKER,
      text: payload.text,
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height,
      backgroundColor: payload.backgroundColor,
      textColor: payload.textColor,
      fontSize: payload.fontSize
    }

    elements.value.set(elementId, element)
    selectedElementId.value = elementId
    
    if (wsClient.value) {
      wsClient.value.send({
        type: MessageType.ADD_STICKER,
        roomId: roomId.value,
        payload
      })
    }
  }

  function updateSticker(elementId, text) {
    const element = elements.value.get(elementId)
    if (element) {
      element.text = text
      
      if (wsClient.value) {
        wsClient.value.send({
          type: MessageType.ADD_STICKER,
          roomId: roomId.value,
          payload: {
            elementId,
            text: element.text,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            backgroundColor: element.backgroundColor,
            textColor: element.textColor,
            fontSize: element.fontSize
          }
        })
      }
    }
  }

  function moveElement(elementId, deltaX, deltaY, newX, newY) {
    const element = elements.value.get(elementId)
    if (element) {
      element.x = newX
      element.y = newY
      
      if (wsClient.value) {
        wsClient.value.send({
          type: MessageType.MOVE_ELEMENT,
          roomId: roomId.value,
          payload: {
            elementId,
            deltaX,
            deltaY,
            newX,
            newY
          }
        })
      }
    }
  }

  function deleteElement(elementId) {
    elements.value.delete(elementId)
    if (selectedElementId.value === elementId) {
      selectedElementId.value = null
    }
    
    if (wsClient.value) {
      wsClient.value.send({
        type: MessageType.DELETE_ELEMENT,
        roomId: roomId.value,
        payload: { elementId }
      })
    }
  }

  function clearCanvas() {
    elements.value.clear()
    selectedElementId.value = null
    
    if (wsClient.value) {
      wsClient.value.send({
        type: MessageType.CLEAR_CANVAS,
        roomId: roomId.value,
        payload: {}
      })
    }
  }

  function selectElement(elementId) {
    selectedElementId.value = elementId
  }

  function deselectElement() {
    selectedElementId.value = null
  }

  function setTool(tool) {
    currentTool.value = tool
    if (tool !== 'select') {
      selectedElementId.value = null
    }
  }

  function setColor(color) {
    currentColor.value = color
  }

  function setLineWidth(width) {
    currentLineWidth.value = width
  }

  function disconnect() {
    if (wsClient.value) {
      wsClient.value.disconnect()
      wsClient.value = null
    }
  }

  return {
    roomId,
    currentUser,
    users,
    elements,
    elementsArray,
    selectedElementId,
    selectedElement,
    currentTool,
    currentColor,
    currentLineWidth,
    isDrawing,
    currentPoints,
    isConnected,
    stickerColors,
    initializeRoom,
    startDrawing,
    continueDrawing,
    finishDrawing,
    addSticker,
    updateSticker,
    moveElement,
    deleteElement,
    clearCanvas,
    selectElement,
    deselectElement,
    setTool,
    setColor,
    setLineWidth,
    disconnect
  }
})
