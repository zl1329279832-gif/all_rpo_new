<template>
  <div class="relative w-full h-full">
    <canvas
      ref="canvasRef"
      class="cursor-crosshair"
      @click="onCanvasClick"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useGameLoop } from '../composables/useGameLoop';
import { useCanvas } from '../composables/useCanvas';

const gameStore = useGameStore();

const { canvasRef, renderFrame, handleClick } = useCanvas(
  () => gameStore.state,
  () => gameStore.selectedSectorId,
  () => gameStore.selectedShipId
);

const onUpdate = (dt: number) => {
  if (gameStore.isPlaying) {
    gameStore.update(dt);
  }
};

const { start, stop } = useGameLoop(onUpdate, renderFrame);

function onCanvasClick(event: MouseEvent): void {
  const result = handleClick(event);
  if (result.type === 'sector') {
    if (gameStore.selectedShipId) {
      gameStore.orderShipTo(gameStore.selectedShipId, result.id!);
    }
    gameStore.selectedSectorId = result.id;
    gameStore.selectedShipId = null;
  } else if (result.type === 'ship') {
    gameStore.selectedShipId = result.id;
    gameStore.selectedSectorId = null;
  } else {
    gameStore.selectedSectorId = null;
    gameStore.selectedShipId = null;
  }
}

watch(() => gameStore.isPlaying, (playing) => {
  if (playing) start();
  else stop();
}, { immediate: true });
</script>
