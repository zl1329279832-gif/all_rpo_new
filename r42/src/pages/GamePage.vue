<template>
  <div class="w-screen h-screen overflow-hidden bg-slate-950">
    <StarMapCanvas />
    <ResourcePanel />
    <FleetPanel />
    <TechPanel />
    <ActionBar />
    <EventModal />
    <PauseOverlay />
    <div
      v-if="gameStore.isCompleted"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="text-center">
        <div class="text-6xl font-bold text-amber-400 mb-6 animate-pulse" style="font-family: Orbitron, sans-serif;">
          任务完成!
        </div>
        <button
          class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          @click="goToResult"
        >
          查看结算 <ChevronRight class="w-5 h-5 inline" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import StarMapCanvas from '../components/StarMapCanvas.vue';
import ResourcePanel from '../components/ResourcePanel.vue';
import FleetPanel from '../components/FleetPanel.vue';
import TechPanel from '../components/TechPanel.vue';
import ActionBar from '../components/ActionBar.vue';
import EventModal from '../components/EventModal.vue';
import PauseOverlay from '../components/PauseOverlay.vue';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

function loadLevel(): void {
  const levelId = route.params.levelId as string;
  const loadSave = route.query.continue === '1';
  gameStore.initLevel(levelId, loadSave);
}

onMounted(() => {
  loadLevel();
});

watch(
  () => route.params.levelId,
  () => {
    gameStore.cleanup();
    loadLevel();
  }
);

onUnmounted(() => {
  gameStore.cleanup();
});

function goToResult(): void {
  const levelId = route.params.levelId as string;
  router.push(`/result/${levelId}`);
}
</script>
