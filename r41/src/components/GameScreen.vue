<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GameRenderer } from '@/systems/renderer'
import GameHUD from './GameHUD.vue'
import OrderPanel from './OrderPanel.vue'
import EventNotification from './EventNotification.vue'
import GameOverModal from './GameOverModal.vue'

const props = defineProps<{
  level: number
  loadSave?: boolean
}>()

const emit = defineEmits<{
  (e: 'back-to-menu'): void
}>()

const gameStore = useGameStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderer: GameRenderer | null = null
let animationId: number | null = null
let lastTime = 0

const isPaused = computed(() => gameStore.isPaused)
const isGameOver = computed(() => gameStore.isGameOver)
const isVictory = computed(() => gameStore.isVictory)

onMounted(() => {
  if (canvasRef.value) {
    renderer = new GameRenderer(canvasRef.value)
    gameStore.initializeGame(props.level, props.loadSave)
    startGameLoop()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

const startGameLoop = () => {
  lastTime = performance.now()
  
  const gameLoop = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
    lastTime = currentTime
    
    gameStore.updateGame(deltaTime)
    
    if (renderer) {
      renderer.render(
        gameStore.trucks,
        gameStore.ships,
        gameStore.cranes,
        gameStore.berths,
        gameStore.yardSlots
      )
    }
    
    animationId = requestAnimationFrame(gameLoop)
  }
  
  animationId = requestAnimationFrame(gameLoop)
}

const handleCanvasClick = (event: MouseEvent) => {
  if (!renderer || !canvasRef.value || gameStore.isPaused) return
  
  const pos = renderer.getCanvasPosition(event.clientX, event.clientY)
  console.log('Clicked position:', pos)
}

const handlePause = () => {
  if (gameStore.isPaused) {
    gameStore.resumeGame()
  } else {
    gameStore.pauseGame()
  }
}

const handleSave = () => {
  gameStore.saveGame()
}

const handleBackToMenu = () => {
  gameStore.endGame()
  emit('back-to-menu')
}
</script>

<template>
  <div class="game-screen">
    <GameHUD 
      @pause="handlePause"
      @save="handleSave"
      @back-to-menu="handleBackToMenu"
    />
    
    <div class="game-main">
      <div class="canvas-container">
        <canvas 
          ref="canvasRef"
          @click="handleCanvasClick"
          class="game-canvas"
        ></canvas>
        
        <div v-if="isPaused && !isGameOver" class="pause-overlay">
          <div class="pause-content">
            <h2>⏸️ 游戏暂停</h2>
            <button class="btn btn-primary" @click="handlePause">
              继续游戏
            </button>
          </div>
        </div>
      </div>
      
      <OrderPanel />
    </div>
    
    <EventNotification />
    
    <GameOverModal 
      v-if="isGameOver"
      :victory="isVictory"
      @back-to-menu="handleBackToMenu"
      @restart="() => gameStore.initializeGame(props.level)"
    />
  </div>
</template>

<style scoped>
.game-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a;
}

.game-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.game-canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.pause-content {
  text-align: center;
}

.pause-content h2 {
  color: #f1f5f9;
  font-size: 32px;
  margin-bottom: 20px;
}
</style>
