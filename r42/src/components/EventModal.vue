<template>
  <Teleport to="body">
    <div
      v-if="gameStore.hasActiveEvent && gameStore.state?.activeEvent"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="w-[480px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div
          class="px-6 py-4 border-b"
          :class="headerBorderClass"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="iconBgClass"
            >
              <component :is="eventIcon" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white" style="font-family: Orbitron, sans-serif;">
                {{ eventTitle }}
              </h3>
              <p class="text-sm text-slate-400">
                {{ gameStore.state.activeEvent.description }}
              </p>
            </div>
          </div>
        </div>
        <div class="p-6 space-y-3">
          <button
            v-for="(choice, index) in gameStore.state.activeEvent.choices"
            :key="index"
            class="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-left transition-all group"
            @click="onChoice(choice.effect)"
          >
            <div class="flex items-center justify-between">
              <span class="text-slate-100 group-hover:text-white">{{ choice.label }}</span>
              <ChevronRight class="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </div>
            <div class="text-xs text-slate-500 mt-1">{{ getChoiceHint(choice.effect) }}</div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, Zap, Swords, ChevronRight } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { EventType } from '../types';

const gameStore = useGameStore();

const eventIcon = computed(() => {
  const type = gameStore.state?.activeEvent?.type;
  if (type === EventType.Asteroid) return AlertTriangle;
  if (type === EventType.EnergyCrisis) return Zap;
  if (type === EventType.HostileRaid) return Swords;
  return AlertTriangle;
});

const headerBorderClass = computed(() => {
  const type = gameStore.state?.activeEvent?.type;
  if (type === EventType.Asteroid) return 'border-amber-600';
  if (type === EventType.EnergyCrisis) return 'border-yellow-600';
  if (type === EventType.HostileRaid) return 'border-red-600';
  return 'border-slate-700';
});

const iconBgClass = computed(() => {
  const type = gameStore.state?.activeEvent?.type;
  if (type === EventType.Asteroid) return 'bg-amber-600';
  if (type === EventType.EnergyCrisis) return 'bg-yellow-600';
  if (type === EventType.HostileRaid) return 'bg-red-600';
  return 'bg-slate-600';
});

const eventTitle = computed(() => {
  const type = gameStore.state?.activeEvent?.type;
  if (type === EventType.Asteroid) return '陨石灾害';
  if (type === EventType.EnergyCrisis) return '能源危机';
  if (type === EventType.HostileRaid) return '敌对袭扰';
  return '未知事件';
});

function getChoiceHint(effect: string): string {
  const hints: Record<string, string> = {
    evacuate: '安全撤离所有飞船，但矿站可能受损',
    hold: '坚守阵地，但飞船将受到损伤',
    reroute: '消耗 50 能源快速解决',
    shutdown: '全舰队停机 10 秒',
    defend: '派出防卫舰迎战',
    abandon: '放弃该星区资源，全员撤回母舰'
  };
  return hints[effect] || '';
}

function onChoice(effect: string): void {
  gameStore.resolveEventChoice(effect);
}
</script>
