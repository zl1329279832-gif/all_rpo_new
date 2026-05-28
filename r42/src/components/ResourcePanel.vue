<template>
  <div class="absolute right-4 top-4 flex gap-3">
    <div
      v-for="res in displayResources"
      :key="res.type"
      class="px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg min-w-[120px]"
    >
      <div class="flex items-center gap-2 mb-1">
        <div
          class="w-3 h-3 rounded-full"
          :class="res.color"
        ></div>
        <span class="text-xs text-slate-400">{{ res.label }}</span>
      </div>
      <div class="text-lg font-semibold text-slate-100" style="font-family: Orbitron, sans-serif;">
        {{ res.current }}<span class="text-xs text-slate-500"> / {{ res.capacity }}</span>
      </div>
    </div>
    <div class="px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg min-w-[120px]">
      <div class="flex items-center gap-2 mb-1">
        <Zap class="w-3 h-3 text-yellow-400" />
        <span class="text-xs text-slate-400">能源</span>
      </div>
      <div class="text-lg font-semibold text-slate-100" style="font-family: Orbitron, sans-serif;">
        {{ energyCurrent }}<span class="text-xs text-slate-500"> / {{ energyMax }}</span>
      </div>
      <div class="text-xs" :class="energyRate >= 0 ? 'text-green-400' : 'text-red-400'">
        {{ energyRate >= 0 ? '+' : '' }}{{ energyRate.toFixed(1) }}/s
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Zap } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { ResourceType } from '../types';
import { getEffectiveCapacity } from '../game/economy/WarehouseCapacity';

const gameStore = useGameStore();

interface ResourceDisplay {
  type: ResourceType;
  label: string;
  color: string;
  current: number;
  capacity: number;
}

const displayResources = computed<ResourceDisplay[]>(() => {
  if (!gameStore.state) return [];
  const capacity = getEffectiveCapacity(gameStore.state.warehouseCapacity, gameStore.state.techs);
  const types = [
    { type: ResourceType.Iron, label: '铁矿', color: 'bg-slate-400' },
    { type: ResourceType.Crystal, label: '水晶', color: 'bg-blue-400' },
    { type: ResourceType.Deuterium, label: '氘', color: 'bg-green-400' },
    { type: ResourceType.DarkMatter, label: '暗物质', color: 'bg-purple-500' }
  ];
  return types.map(t => ({
    ...t,
    current: gameStore.state!.warehouse.find(w => w.type === t.type)?.amount ?? 0,
    capacity
  }));
});

const energyCurrent = computed(() => Math.floor(gameStore.state?.energy ?? 0));
const energyMax = computed(() => gameStore.state?.maxEnergy ?? 0);
const energyRate = computed(() => gameStore.state?.energyRate ?? 0);
</script>
