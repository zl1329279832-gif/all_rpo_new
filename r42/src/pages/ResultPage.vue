<template>
  <ResultScreen />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { StorageService } from '../services/StorageService';
import ResultScreen from '../components/ResultScreen.vue';

const route = useRoute();
const gameStore = useGameStore();

function loadResult(): void {
  const levelId = route.params.levelId as string;
  const saved = StorageService.load(levelId);
  if (saved) {
    gameStore.state = saved;
  }
}

onMounted(() => {
  loadResult();
});

watch(
  () => route.params.levelId,
  () => {
    loadResult();
  }
);
</script>
