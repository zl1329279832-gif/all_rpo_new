<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { caravan, victory, gameOver } = storeToRefs(gameStore)

const title = computed(() => (victory.value ? '🎉 胜利！' : '💀 游戏结束'))
const message = computed(() => {
  if (victory.value) {
    return '恭喜你成为了丝路传奇商人！你的商队名垂青史。'
  }
  if (caravan.value.gold <= 0) {
    return '你的金币耗尽，商队破产了。商场如战场，下次再接再厉！'
  }
  if (caravan.value.reputation <= 0) {
    return '你的声望跌至谷底，没人再愿意与你交易。'
  }
  return '游戏结束。'
})

function restart() {
  gameStore.startNewGame()
}

function backToTitle() {
  gameStore.gameStarted = false
}
</script>

<template>
  <div class="game-over-screen fixed inset-0 bg-black/90 flex items-center justify-center z-50">
    <div class="text-center">
      <div class="text-8xl mb-6">{{ victory ? '🏆' : '💀' }}</div>
      <h1
        class="text-5xl font-bold font-cinzel mb-6"
        :class="victory ? 'text-amber-gold' : 'text-red-500'"
      >
        {{ title }}
      </h1>
      <p class="text-sand-light/80 text-xl mb-8 max-w-md mx-auto leading-relaxed">
        {{ message }}
      </p>
      <div class="text-2xl text-sand-light mb-8">
        <span class="text-amber-gold font-bold">{{ caravan.gold }}</span> 金币 · 
        第 <span class="text-amber-gold font-bold">{{ caravan.day }}</span> 天
      </div>
      <div class="space-x-4">
        <button
          @click="restart"
          class="py-3 px-8 bg-amber-gold hover:bg-amber-gold/80 text-sand-dark text-lg font-bold rounded-lg transition-all hover:scale-105 font-cinzel"
        >
          🔄 再来一局
        </button>
        <button
          @click="backToTitle"
          class="py-3 px-8 bg-sand-light/10 hover:bg-sand-light/20 text-sand-light text-lg font-bold rounded-lg border border-amber-gold/50 transition-all font-cinzel"
        >
          🏠 返回标题
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
