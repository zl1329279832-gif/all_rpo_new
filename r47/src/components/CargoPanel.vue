<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { getGoodById } from '@/game/economy/goods'

const gameStore = useGameStore()
const { caravan } = storeToRefs(gameStore)

function getTotalValue() {
  return caravan.value.cargo.reduce((total, item) => {
    return total + item.buyPrice * item.quantity
  }, 0)
}
</script>

<template>
  <div class="cargo-panel bg-sand-dark/95 text-sand-light w-72 h-full flex flex-col shadow-2xl border-r-2 border-amber-gold">
    <div class="p-4 border-b border-amber-gold/30">
      <h2 class="text-xl font-bold text-amber-gold font-cinzel">🎒 货物库存</h2>
      <div class="text-sm mt-1">
        总价值: <span class="text-amber-gold font-bold">{{ getTotalValue() }}</span> 金币
      </div>
    </div>

    <div class="flex-1 overflow-auto p-4">
      <div v-if="caravan.cargo.length === 0" class="text-center opacity-50 py-8">
        <span class="text-4xl block mb-2">📦</span>
        暂无货物
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in caravan.cargo"
          :key="item.goodId"
          class="p-3 bg-sand-light/5 rounded-lg border border-amber-gold/20"
        >
          <div class="flex justify-between items-center">
            <span class="font-bold">{{ getGoodById(item.goodId)?.name }}</span>
            <span class="text-amber-gold">x{{ item.quantity }}</span>
          </div>
          <div class="flex justify-between text-sm mt-1 opacity-70">
            <span>购入价: {{ item.buyPrice }}</span>
            <span
              :class="[
                item.remainingLife < 999
                  ? item.remainingLife < 5
                    ? 'text-red-400'
                    : 'text-yellow-400'
                  : 'text-green-400',
              ]"
            >
              保质期: {{ item.remainingLife === 999 ? '永久' : item.remainingLife + '天' }}
            </span>
          </div>
          <div class="text-xs opacity-50 mt-1">
            总成本: {{ item.buyPrice * item.quantity }} 金币
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
