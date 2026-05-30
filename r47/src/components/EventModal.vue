<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { activeEvent, activeEventResult } = storeToRefs(gameStore)

function selectChoice(index: number) {
  gameStore.resolveEventChoice(index)
}

function closeEvent() {
  gameStore.closeEvent()
}

function getEventIcon(type: string) {
  switch (type) {
    case 'weather': return '🌪️'
    case 'bandit': return '⚔️'
    case 'merchant': return '🤝'
    case 'discovery': return '🔍'
    case 'plague': return '☠️'
    default: return '❓'
  }
}

function getEventTypeLabel(type: string) {
  switch (type) {
    case 'weather': return '天气事件'
    case 'bandit': return '危险遭遇'
    case 'merchant': return '商人偶遇'
    case 'discovery': return '意外发现'
    case 'plague': return '瘟疫警报'
    default: return '随机事件'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activeEvent"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >
      <div class="event-modal bg-sand-dark text-sand-light w-96 rounded-xl shadow-2xl border-2 border-amber-gold overflow-hidden">
        <div class="p-6">
          <div class="text-center">
            <span class="text-5xl block mb-3">{{ getEventIcon(activeEvent.type) }}</span>
            <div class="text-sm text-amber-gold/70 mb-1">{{ getEventTypeLabel(activeEvent.type) }}</div>
            <h2 class="text-2xl font-bold text-amber-gold font-cinzel">{{ activeEvent.name }}</h2>
          </div>

          <p class="mt-4 text-center leading-relaxed">
            {{ activeEvent.description }}
          </p>

          <div v-if="!activeEventResult" class="mt-6 space-y-3">
            <button
              v-for="(choice, index) in activeEvent.choices"
              :key="index"
              @click="selectChoice(index)"
              class="w-full py-3 px-4 bg-amber-gold/20 hover:bg-amber-gold/40 border border-amber-gold/50 rounded-lg font-bold transition-all hover:scale-102 text-left"
            >
              {{ choice.text }}
            </button>
          </div>

          <div v-else class="mt-6">
            <div class="p-4 bg-amber-gold/10 rounded-lg text-center">
              <p class="leading-relaxed">{{ activeEventResult }}</p>
            </div>
            <button
              @click="closeEvent"
              class="w-full mt-4 py-3 bg-amber-gold hover:bg-amber-gold/80 text-sand-dark rounded-lg font-bold transition-colors"
            >
              继续旅程
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>
