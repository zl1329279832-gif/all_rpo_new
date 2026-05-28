<template>
  <div
    class="absolute right-4 top-20 bottom-20 w-80 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden transition-all duration-300"
    :class="{ 'translate-x-[120%]': !uiStore.techPanelOpen }"
  >
    <div class="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-100 tracking-wider" style="font-family: Orbitron, sans-serif;">科技升级</h3>
      <X class="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" @click="uiStore.toggleTechPanel" />
    </div>
    <div class="p-4 space-y-4 max-h-full overflow-y-auto">
      <div
        v-for="tech in gameStore.state?.techs"
        :key="tech.type"
        class="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <component :is="getTechIcon(tech.type)" class="w-5 h-5 text-amber-400" />
            <span class="font-medium text-slate-100">{{ getTechName(tech.type) }}</span>
          </div>
          <span class="text-sm text-amber-400" style="font-family: Orbitron, sans-serif;">Lv.{{ tech.level }}/{{ tech.maxLevel }}</span>
        </div>
        <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            class="h-full bg-amber-500 transition-all"
            :style="{ width: (tech.level / tech.maxLevel * 100) + '%' }"
          ></div>
        </div>
        <p class="text-xs text-slate-400 mb-3">{{ tech.description }}</p>
        <div v-if="tech.level < tech.maxLevel" class="space-y-2">
          <div class="text-xs text-slate-500">升级消耗:</div>
          <div class="flex gap-2 flex-wrap">
            <div
              v-for="cost in tech.costs"
              :key="cost.type"
              class="px-2 py-1 bg-slate-700/50 rounded text-xs flex items-center gap-1"
              :class="hasEnoughResource(cost.type, cost.amount) ? 'text-slate-300' : 'text-red-400'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="getResourceColor(cost.type)"
              ></span>
              {{ cost.amount }}
            </div>
          </div>
          <button
            class="w-full mt-2 px-3 py-2 rounded text-sm font-medium transition-colors"
            :class="canUpgrade(tech) ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
            :disabled="!canUpgrade(tech)"
            @click="onUpgrade(tech.type)"
          >
            {{ tech.level === 0 ? '研发' : '升级' }}
          </button>
        </div>
        <div v-else class="text-center py-2 text-amber-400 text-sm">
          ✓ 已达最高等级
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Pickaxe, Truck, Shield, Zap } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { canUpgradeTech } from '../game/tech/TechTree';
import type { TechType, ResourceType, Tech, ResourceStack } from '../types';

const gameStore = useGameStore();
const uiStore = useUIStore();

function getTechIcon(type: TechType) {
  const icons: Record<string, any> = {
    mining_efficiency: Pickaxe,
    transport_capacity: Truck,
    defense_power: Shield,
    energy_efficiency: Zap
  };
  return icons[type] || Zap;
}

function getTechName(type: TechType): string {
  const names: Record<string, string> = {
    mining_efficiency: '采矿效率',
    transport_capacity: '仓储扩容',
    defense_power: '火力强化',
    energy_efficiency: '能源效率'
  };
  return names[type] || type;
}

function getResourceColor(type: ResourceType): string {
  const colors: Record<string, string> = {
    iron: 'bg-slate-400',
    crystal: 'bg-blue-400',
    deuterium: 'bg-green-400',
    dark_matter: 'bg-purple-500'
  };
  return colors[type] || 'bg-slate-400';
}

function hasEnoughResource(type: ResourceType, amount: number): boolean {
  if (!gameStore.state) return false;
  const stack = gameStore.state.warehouse.find(w => w.type === type);
  return (stack?.amount ?? 0) >= amount;
}

function canUpgrade(tech: Tech): boolean {
  if (!gameStore.state) return false;
  return canUpgradeTech(tech, gameStore.state.warehouse);
}

function onUpgrade(type: TechType): void {
  gameStore.upgradeTechAction(type);
}
</script>
