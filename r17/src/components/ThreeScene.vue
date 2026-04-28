<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { BuildingData, EnergyLevel, PickResult, HoverTooltip } from '@/types';
import { SceneManager, BuildingManager, InteractionManager } from '@/three';
import { mockBuildings } from '@/mock';

const props = defineProps<{
  visibleEnergyLevels?: EnergyLevel[];
}>();

const emit = defineEmits<{
  (e: 'buildingClick', result: PickResult | null): void;
  (e: 'buildingHover', data: HoverTooltip): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let sceneManager: SceneManager | null = null;
let buildingManager: BuildingManager | null = null;
let interactionManager: InteractionManager | null = null;
let animationTime = 0;
let unsubscribeRender: (() => void) | null = null;
let unsubscribeHover: (() => void) | null = null;
let unsubscribeClick: (() => void) | null = null;

function initScene(): void {
  if (!containerRef.value) return;

  sceneManager = new SceneManager(containerRef.value);
  buildingManager = new BuildingManager(sceneManager.scene);

  buildingManager.createBuildings(mockBuildings);

  interactionManager = new InteractionManager(sceneManager, buildingManager);

  unsubscribeRender = sceneManager.onRender(() => {
    animationTime += 0.016;
    buildingManager?.updateAnimations(animationTime);
  });

  unsubscribeHover = interactionManager.onHover((data: HoverTooltip) => {
    emit('buildingHover', data);
  });

  unsubscribeClick = interactionManager.onClick((result: PickResult | null) => {
    emit('buildingClick', result);
  });
}

function cleanup(): void {
  if (unsubscribeRender) {
    unsubscribeRender();
    unsubscribeRender = null;
  }
  if (unsubscribeHover) {
    unsubscribeHover();
    unsubscribeHover = null;
  }
  if (unsubscribeClick) {
    unsubscribeClick();
    unsubscribeClick = null;
  }
  if (interactionManager) {
    interactionManager.dispose();
    interactionManager = null;
  }
  if (buildingManager) {
    buildingManager.dispose();
    buildingManager = null;
  }
  if (sceneManager) {
    sceneManager.dispose();
    sceneManager = null;
  }
}

watch(
  () => props.visibleEnergyLevels,
  (newLevels) => {
    if (!buildingManager) return;
    
    if (newLevels && newLevels.length > 0) {
      buildingManager.filterByEnergyLevel(newLevels);
    } else {
      buildingManager.showAll();
    }
  },
  { deep: true }
);

onMounted(() => {
  initScene();
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div ref="containerRef" class="three-scene-container"></div>
</template>

<style scoped>
.three-scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

:deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
