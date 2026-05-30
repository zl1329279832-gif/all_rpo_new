<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { GameMapRenderer } from '@/game/render/GameMapRenderer'
import type { City } from '@/game/types'

const gameStore = useGameStore()
const { caravan, isInCity, connectedCities } = storeToRefs(gameStore)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderer: GameMapRenderer | null = null
let animationFrameId: number | null = null
let lastTime = 0

const selectedCity = ref<string | null>(null)
const showRouteConfirm = ref(false)

function initRenderer() {
  if (!canvasRef.value) return

  renderer = new GameMapRenderer(canvasRef.value)
  renderer.onCityClick = (cityId) => handleCityClick(cityId)

  lastTime = performance.now()
  
  function gameLoop(time: number) {
    const delta = time - lastTime
    lastTime = time

    if (gameStore.isInCity) {
      renderer?.highlightConnectedCities(connectedCities.value)
    } else if (!caravan.value.isMoving) {
      renderer?.resetHighlights()
    }

    if (caravan.value.isMoving) {
      gameStore.updateMovement(delta)
    }

    if (renderer) {
      renderer.updateCaravan(caravan.value)
      renderer.setHighlightedCity(selectedCity.value)
    }

    animationFrameId = requestAnimationFrame(gameLoop)
  }

  animationFrameId = requestAnimationFrame(gameLoop)
}

function handleCityClick(cityId: string) {
  if (!isInCity.value) return
  if (!connectedCities.value.includes(cityId)) return

  selectedCity.value = cityId
  showRouteConfirm.value = true
}

function confirmTravel() {
  if (selectedCity.value) {
    gameStore.startJourney(selectedCity.value)
    showRouteConfirm.value = false
    selectedCity.value = null
  }
}

function cancelTravel() {
  showRouteConfirm.value = false
  selectedCity.value = null
}

function handleResize() {
  renderer?.resize()
}

onMounted(() => {
  initRenderer()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', handleResize)
  renderer?.destroy()
})
</script>

<template>
  <div class="map-container relative w-full h-full">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>

    <Teleport to="body">
      <div
        v-if="showRouteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
        @click.self="cancelTravel"
      >
        <div class="bg-sand-dark text-sand-light p-6 rounded-xl border-2 border-amber-gold shadow-2xl w-80">
          <h3 class="text-xl font-bold text-amber-gold font-cinzel text-center mb-4">
            🐪 确认出发
          </h3>
          <p class="text-center mb-4">
            前往 <span class="text-amber-gold font-bold">{{ gameStore.allCities.find((c: City) => c.id === selectedCity)?.name }}</span>
          </p>
          <div class="text-sm text-center opacity-70 mb-4">
            <p>通行费: {{ gameStore.allRoutes.find((r) => 
                (r.from === caravan.currentCityId && r.to === selectedCity) ||
                (r.to === caravan.currentCityId && r.from === selectedCity)
              )?.tollCost }} 金币</p>
            <p>危险度: {{ Math.round((gameStore.allRoutes.find((r) =>
                (r.from === caravan.currentCityId && r.to === selectedCity) ||
                (r.to === caravan.currentCityId && r.from === selectedCity)
              )?.dangerLevel || 0) * 100) }}%</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="cancelTravel"
              class="flex-1 py-2 bg-sand-light/10 hover:bg-sand-light/20 rounded font-bold transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmTravel"
              class="flex-1 py-2 bg-amber-gold hover:bg-amber-gold/80 text-sand-dark rounded font-bold transition-colors"
            >
              出发
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      v-if="isInCity"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sand-dark/90 text-sand-light px-6 py-3 rounded-full border border-amber-gold/50 shadow-lg"
    >
      <span class="text-amber-gold">💡</span> 点击相邻城市开始旅程
    </div>
  </div>
</template>

<style scoped>
.map-container {
  background: linear-gradient(135deg, #E8D5A3 0%, #D4B896 50%, #C4A882 100%);
}

.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
