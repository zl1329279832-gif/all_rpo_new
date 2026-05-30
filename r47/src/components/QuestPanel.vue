<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { quests } = storeToRefs(gameStore)

const collapsed = ref(false)

function getActiveStep(quest: typeof quests.value[0]) {
  return quest.steps.find((s) => !s.completed)
}

function getProgress(quest: typeof quests.value[0]) {
  const completed = quest.steps.filter((s) => s.completed).length
  return Math.round((completed / quest.steps.length) * 100)
}

const hasActiveQuest = computed(() => {
  return quests.value.some((q) => q.steps.some((s) => !s.completed))
})
</script>

<template>
  <div
    :class="[
      'quest-panel bg-sand-dark/95 text-sand-light shadow-2xl rounded-b-lg border-2 border-amber-gold border-t-0 transition-all duration-300',
      collapsed ? 'w-48' : 'w-64',
    ]"
  >
    <div
      class="p-3 border-b border-amber-gold/30 flex items-center justify-between cursor-pointer select-none"
      @click="collapsed = !collapsed"
    >
      <h2 class="text-lg font-bold text-amber-gold font-cinzel flex items-center gap-2">
        <span>📜</span>
        <span v-if="!collapsed">任务委托</span>
        <span v-else>任务</span>
        <span
          v-if="hasActiveQuest"
          class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
        ></span>
      </h2>
      <span class="text-amber-gold/70 text-sm">{{ collapsed ? '▸' : '▾' }}</span>
    </div>

    <div v-if="!collapsed" class="max-h-64 overflow-auto p-3 space-y-4">
      <div
        v-for="quest in quests"
        :key="quest.id"
        class="p-3 bg-sand-light/5 rounded-lg border border-amber-gold/20"
      >
        <div class="font-bold text-amber-gold">{{ quest.name }}</div>
        
        <div class="w-full bg-sand-light/10 rounded-full h-2 mt-2">
          <div
            class="bg-amber-gold h-2 rounded-full transition-all"
            :style="{ width: getProgress(quest) + '%' }"
          ></div>
        </div>
        <div class="text-xs text-right opacity-70 mt-1">{{ getProgress(quest) }}%</div>

        <div v-if="getActiveStep(quest)" class="mt-3 p-2 bg-amber-gold/10 rounded text-sm">
          <div class="font-bold text-amber-gold">当前目标</div>
          <div class="mt-1">{{ getActiveStep(quest)?.description }}</div>
          <div class="text-yellow-400 mt-1">奖励: {{ getActiveStep(quest)?.reward }} 金</div>
        </div>

        <div v-else class="mt-3 text-center text-green-400 font-bold">
          ✅ 任务完成！
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
