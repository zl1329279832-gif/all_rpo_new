<template>
  <ResultScreen />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { StorageService } from '../services/StorageService';
import ResultScreen from '../components/ResultScreen.vue';

const route = useRoute();
const gameStore = useGameStore();

onMounted(() => {
  const levelId = route.params.levelId as string;
  if (!gameStore.state) {
    const saved = StorageService.load(levelId);
    if (saved) {
      gameStore.state = saved;
    }
  }
});
</script>
