<template>
  <div
    class="absolute left-4 top-4 bottom-20 w-72 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden transition-all duration-300"
    :class="{ '-translate-x-[120%]': !uiStore.fleetPanelOpen }"
  >
    <div class="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-100 tracking-wider" style="font-family: Orbitron, sans-serif;">舰队状态</h3>
      <ChevronLeft class="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" @click="uiStore.toggleFleetPanel" />
    </div>
    <div class="p-3 space-y-2 max-h-full overflow-y-auto">
      <div
        v-for="ship in gameStore.state?.ships"
        :key="ship.id"
        class="p-3 rounded-lg border cursor-pointer transition-all"
        :class="ship.id === gameStore.selectedShipId ? 'bg-blue-900/40 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'"
        @click="selectShip(ship.id)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="getShipColor(ship.type)"
          >
            <component :is="getShipIcon(ship.type)" class="w-4 h-4 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-100 truncate">{{ ship.name }}</div>
            <div class="text-xs text-slate-400 flex items-center gap-1">
              <span :class="getStateColor(ship.state)">{{ getStateLabel(ship.state) }}</span>
              <span v-if="ship.sectorId">· {{ getSectorName(ship.sectorId) }}</span>
            </div>
          </div>
        </div>
        <div class="mt-2 space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500">HP</span>
            <span class="text-slate-300">{{ ship.health }}/{{ ship.maxHealth }}</span>
          </div>
          <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all"
              :class="ship.health / ship.maxHealth > 0.5 ? 'bg-green-500' : ship.health / ship.maxHealth > 0.25 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: (ship.health / ship.maxHealth * 100) + '%' }"
            ></div>
          </div>
          <div v-if="ship.cargo.length > 0" class="text-xs text-slate-400">
            载货: {{ getCargoTotal(ship) }}/{{ ship.cargoCapacity }}
          </div>
        </div>
        <div v-if="ship.id === gameStore.selectedShipId && ship.type !== 'mothership'" class="mt-3 flex gap-2">
          <button
            v-if="canMine(ship)"
            class="flex-1 px-2 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors"
            @click.stop="gameStore.startMining(ship.id)"
          >
            <Pickaxe class="w-3 h-3 inline mr-1" /> 采矿
          </button>
          <button
            v-if="ship.sectorId === motherSectorId && getCargoTotal(ship) > 0"
            class="flex-1 px-2 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
            @click.stop="gameStore.transferCargoToMothership(ship.id)"
          >
            <Upload class="w-3 h-3 inline mr-1" /> 卸货
          </button>
        </div>
      </div>
    </div>
  </div>
  <button
    v-if="!uiStore.fleetPanelOpen"
    class="absolute left-4 top-4 px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors"
    @click="uiStore.toggleFleetPanel"
  >
    <ChevronRight class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Pickaxe, Upload, ChevronLeft, ChevronRight, Rocket, Truck, Shield, Anchor } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { getCargoTotal } from '../game/entities/Ship';
import type { ShipType, ShipState } from '../types';
import { SectorType } from '../types';

const gameStore = useGameStore();
const uiStore = useUIStore();

const motherSectorId = computed(() => gameStore.state?.sectors.find(s => s.type === SectorType.Mothership)?.id);

function getShipColor(type: ShipType): string {
  const colors: Record<string, string> = {
    mothership: 'bg-blue-600',
    mining_ship: 'bg-amber-600',
    transport_ship: 'bg-green-600',
    defense_ship: 'bg-red-600'
  };
  return colors[type] || 'bg-slate-600';
}

function getShipIcon(type: ShipType) {
  const icons: Record<string, any> = {
    mothership: Anchor,
    mining_ship: Pickaxe,
    transport_ship: Truck,
    defense_ship: Shield
  };
  return icons[type] || Rocket;
}

function getStateColor(state: ShipState): string {
  const colors: Record<string, string> = {
    idle: 'text-slate-400',
    moving: 'text-blue-400',
    mining: 'text-amber-400',
    transporting: 'text-green-400',
    fighting: 'text-red-400'
  };
  return colors[state] || 'text-slate-400';
}

function getStateLabel(state: ShipState): string {
  const labels: Record<string, string> = {
    idle: '待命',
    moving: '移动中',
    mining: '采矿中',
    transporting: '运输中',
    fighting: '战斗中'
  };
  return labels[state] || state;
}

function getSectorName(id: string): string {
  return gameStore.state?.sectors.find(s => s.id === id)?.name || '';
}

function selectShip(id: string): void {
  gameStore.selectedShipId = id;
  gameStore.selectedSectorId = null;
}

function canMine(ship: any): boolean {
  if (!gameStore.state) return false;
  if (ship.type !== 'mining_ship' || ship.state === 'mining') return false;
  const sector = gameStore.state.sectors.find(s => s.id === ship.sectorId);
  return sector?.type === SectorType.Mining && (sector.resourceAmount ?? 0) > 0;
}
</script>
