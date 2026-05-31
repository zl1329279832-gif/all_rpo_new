<script setup lang="ts">
import { computed } from 'vue';
import { MapPin, Car, Move } from 'lucide-vue-next';
import { useSceneStore } from '@/store/sceneStore';

const store = useSceneStore();

const cameraModes = [
  { id: 'top', label: '俯视视角', icon: MapPin, shortcut: '1' },
  { id: 'driving', label: '驾驶视角', icon: Car, shortcut: '2' },
  { id: 'free', label: '自由视角', icon: Move, shortcut: '3' }
] as const;

const activeMode = computed(() => store.state.cameraMode);

function switchMode(mode: 'top' | 'driving' | 'free') {
  store.setCameraMode(mode);
  if (mode === 'driving') {
    // Will be handled by parent to select random vehicle
  }
}

const emit = defineEmits<{
  (e: 'mode-change', mode: 'top' | 'driving' | 'free'): void;
}>();

function handleModeChange(mode: 'top' | 'driving' | 'free') {
  switchMode(mode);
  emit('mode-change', mode);
}
</script>

<template>
  <div class="absolute top-6 right-6 flex gap-3 z-20">
    <button
      v-for="mode in cameraModes"
      :key="mode.id"
      @click="handleModeChange(mode.id)"
      :class="[
        'group relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300',
        'backdrop-blur-md border',
        activeMode === mode.id
          ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/30'
          : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
      ]"
    >
      <component
        :is="mode.icon"
        :class="[
          'w-6 h-6 transition-colors duration-300',
          activeMode === mode.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
        ]"
      />
      <span
        :class="[
          'text-xs mt-1 font-medium transition-colors duration-300',
          activeMode === mode.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
        ]"
      >
        {{ mode.label }}
      </span>
      <span class="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 rounded-full text-[10px] flex items-center justify-center text-slate-400 border border-slate-700">
        {{ mode.shortcut }}
      </span>
    </button>
  </div>
</template>
