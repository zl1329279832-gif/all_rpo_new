<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { getGoodById } from '@/game/economy/goods'

const gameStore = useGameStore()
const { caravan, currentCityPrices, isInCity, currentCity } = storeToRefs(gameStore)

const selectedGoodId = ref<string | null>(null)
const tradeQuantity = ref(1)

const selectedGood = computed(() => {
  if (!selectedGoodId.value) return null
  const good = getGoodById(selectedGoodId.value)
  const price = currentCityPrices.value.find((p) => p.goodId === selectedGoodId.value)
  const cargo = caravan.value.cargo.find((c) => c.goodId === selectedGoodId.value)
  return { good, price, cargo }
})

const maxBuyQuantity = computed(() => {
  if (!selectedGood.value?.good || !selectedGood.value?.price) return 0
  const maxByGold = Math.floor(caravan.value.gold / selectedGood.value.price.currentBuyPrice)
  const maxByWeight = Math.floor(
    (caravan.value.maxCapacity - caravan.value.currentWeight) / selectedGood.value.good.weight
  )
  return Math.max(0, Math.min(maxByGold, maxByWeight))
})

const maxSellQuantity = computed(() => {
  return selectedGood.value?.cargo?.quantity || 0
})

function selectGood(goodId: string) {
  selectedGoodId.value = goodId
  tradeQuantity.value = 1
}

function buy() {
  if (!selectedGoodId.value || tradeQuantity.value <= 0) return
  gameStore.buyGood(selectedGoodId.value, tradeQuantity.value)
}

function sell() {
  if (!selectedGoodId.value || tradeQuantity.value <= 0) return
  gameStore.sellGood(selectedGoodId.value, tradeQuantity.value)
}

function formatPriceChange(demand: number) {
  const diff = demand - 1
  if (diff > 0.2) return 'text-green-400'
  if (diff < -0.2) return 'text-red-400'
  return 'text-gray-400'
}
</script>

<template>
  <div class="trade-panel bg-sand-dark/95 text-sand-light w-80 h-full flex flex-col shadow-2xl border-l-2 border-amber-gold">
    <div class="p-4 border-b border-amber-gold/30">
      <h2 class="text-xl font-bold text-amber-gold font-cinzel">🏪 {{ currentCity?.name }} 集市</h2>
      <p class="text-sm opacity-70 mt-1">特产: {{ currentCity?.specialties.join(', ') }}</p>
    </div>

    <div class="flex-1 overflow-auto p-4">
      <div class="space-y-2">
        <div
          v-for="price in currentCityPrices"
          :key="price.goodId"
          @click="selectGood(price.goodId)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-all border-2',
            selectedGoodId === price.goodId
              ? 'bg-amber-gold/20 border-amber-gold'
              : 'bg-sand-light/5 border-transparent hover:bg-sand-light/10',
          ]"
        >
          <div class="flex justify-between items-center">
            <span class="font-bold">{{ getGoodById(price.goodId)?.name }}</span>
            <span :class="formatPriceChange(price.demand)">
              {{ price.demand > 1.2 ? '📈 高需' : price.demand < 0.8 ? '📉 低需' : '➖ 正常' }}
            </span>
          </div>
          <div class="flex justify-between text-sm mt-1">
            <span class="text-green-400">买: {{ price.currentBuyPrice }}</span>
            <span class="text-yellow-400">卖: {{ price.currentSellPrice }}</span>
          </div>
          <div class="text-xs opacity-60 mt-1">
            重量: {{ getGoodById(price.goodId)?.weight }} | 
            库存: {{ caravan.cargo.find((c) => c.goodId === price.goodId)?.quantity || 0 }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedGood && isInCity" class="p-4 border-t border-amber-gold/30">
      <div class="text-sm mb-3">
        <span class="font-bold">{{ selectedGood.good?.name }}</span>
        <span class="opacity-60 ml-2">单价: {{ selectedGood.price?.currentBuyPrice }}</span>
      </div>
      <div class="flex items-center gap-2 mb-3">
        <button
          @click="tradeQuantity = Math.max(1, tradeQuantity - 1)"
          class="w-8 h-8 bg-amber-gold/30 rounded hover:bg-amber-gold/50"
        >-</button>
        <input
          v-model.number="tradeQuantity"
          type="number"
          min="1"
          class="flex-1 bg-sand-light/10 border border-amber-gold/30 rounded px-3 py-1 text-center"
        />
        <button
          @click="tradeQuantity = tradeQuantity + 1"
          class="w-8 h-8 bg-amber-gold/30 rounded hover:bg-amber-gold/50"
        >+</button>
      </div>
      <div class="flex gap-2">
        <button
          @click="buy"
          :disabled="tradeQuantity > maxBuyQuantity"
          class="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          买入 ({{ maxBuyQuantity }})
        </button>
        <button
          @click="sell"
          :disabled="tradeQuantity > maxSellQuantity"
          class="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          卖出 ({{ maxSellQuantity }})
        </button>
      </div>
    </div>

    <div class="p-4 border-t border-amber-gold/30">
      <div class="text-sm opacity-70 mb-2">升级商队</div>
      <div class="flex gap-2">
        <button
          @click="gameStore.upgradeGuard"
          class="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors"
        >
          护卫 ({{ caravan.guardLevel * 200 }}金)
        </button>
        <button
          @click="gameStore.upgradeCapacity"
          class="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold transition-colors"
        >
          仓储 ({{ caravan.maxCapacity * 5 }}金)
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
