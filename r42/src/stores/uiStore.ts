import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const techPanelOpen = ref(false);
  const fleetPanelOpen = ref(true);
  const showSaveNotification = ref(false);

  function toggleTechPanel(): void {
    techPanelOpen.value = !techPanelOpen.value;
  }

  function toggleFleetPanel(): void {
    fleetPanelOpen.value = !fleetPanelOpen.value;
  }

  function showSaved(): void {
    showSaveNotification.value = true;
    setTimeout(() => {
      showSaveNotification.value = false;
    }, 2000);
  }

  return {
    techPanelOpen,
    fleetPanelOpen,
    showSaveNotification,
    toggleTechPanel,
    toggleFleetPanel,
    showSaved
  };
});
