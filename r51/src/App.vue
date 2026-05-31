<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSceneStore } from '@/store/sceneStore';
import { useThreeScene } from '@/composables/useThreeScene';
import ViewSwitcher from '@/components/ViewSwitcher.vue';
import ControlPanel from '@/components/ControlPanel.vue';
import StatsPanel from '@/components/StatsPanel.vue';

const store = useSceneStore();
const containerRef = ref<HTMLElement | null>(null);
let sceneInstance: ReturnType<typeof useThreeScene> | null = null;

function handleModeChange(mode: 'top' | 'driving' | 'free') {
  if (mode === 'driving' && sceneInstance) {
    sceneInstance.trafficSystem.selectRandomVehicle();
  }
}

function handleDensityChange(density: number) {
  sceneInstance?.trafficSystem.updateTrafficDensity(density);
}

function handleDayNightChange(isDay: boolean) {
  sceneInstance?.setDayNight(isDay);
}

function handleLabelsChange(show: boolean) {
  sceneInstance?.updateLabels(show);
}

onMounted(() => {
  if (containerRef.value) {
    sceneInstance = useThreeScene(containerRef.value);
  }
});

onUnmounted(() => {
  sceneInstance?.dispose();
});
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden bg-slate-900">
    <div ref="containerRef" class="w-full h-full" />

    <div class="absolute top-6 left-6 z-20">
      <div class="backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 shadow-2xl">
        <h1 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          城市立交桥三维模型
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Urban Overpass 3D Visualization System
        </p>
      </div>
    </div>

    <ViewSwitcher @mode-change="handleModeChange" />

    <ControlPanel
      @density-change="handleDensityChange"
      @daynight-change="handleDayNightChange"
      @labels-change="handleLabelsChange"
    />

    <StatsPanel />

    <div class="absolute bottom-6 right-6 z-20">
      <div class="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3">
        <div class="flex items-center gap-4 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-emerald-500" />
          <span>地面层</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-amber-500" />
          <span>一层</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500" />
          <span>二层</span>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
