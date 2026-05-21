<template>
  <div class="app">
    <GameCanvas />
  </div>
</template>

<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
