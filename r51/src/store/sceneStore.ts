import { defineStore } from 'pinia';
import type { SceneState, Vehicle, TrafficStats } from '@/types';
import { ref, computed } from 'vue';

export const useSceneStore = defineStore('scene', () => {
  const state = ref<SceneState>({
    cameraMode: 'top',
    trafficDensity: 0.5,
    timeOfDay: 'day',
    roadStatus: 'normal',
    showLabels: true,
    selectedVehicleId: null
  });

  const vehicles = ref<Vehicle[]>([]);
  const activeVehicleCount = computed(() => vehicles.value.length);

  const stats = ref<TrafficStats>({
    totalVehicles: 0,
    averageSpeed: 0,
    congestionLevel: 0,
    activeRoutes: 8
  });

  function setCameraMode(mode: SceneState['cameraMode']) {
    state.value.cameraMode = mode;
  }

  function setTrafficDensity(density: number) {
    state.value.trafficDensity = Math.max(0, Math.min(1, density));
  }

  function setTimeOfDay(time: SceneState['timeOfDay']) {
    state.value.timeOfDay = time;
  }

  function setRoadStatus(status: SceneState['roadStatus']) {
    state.value.roadStatus = status;
  }

  function toggleLabels() {
    state.value.showLabels = !state.value.showLabels;
  }

  function selectVehicle(vehicleId: string | null) {
    state.value.selectedVehicleId = vehicleId;
  }

  function addVehicle(vehicle: Vehicle) {
    vehicles.value.push(vehicle);
  }

  function removeVehicle(vehicleId: string) {
    const index = vehicles.value.findIndex(v => v.id === vehicleId);
    if (index > -1) {
      vehicles.value.splice(index, 1);
    }
  }

  function updateVehicleProgress(vehicleId: string, progress: number) {
    const vehicle = vehicles.value.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.progress = progress;
    }
  }

  function updateStats(newStats: Partial<TrafficStats>) {
    stats.value = { ...stats.value, ...newStats };
  }

  return {
    state,
    vehicles,
    stats,
    activeVehicleCount,
    setCameraMode,
    setTrafficDensity,
    setTimeOfDay,
    setRoadStatus,
    toggleLabels,
    selectVehicle,
    addVehicle,
    removeVehicle,
    updateVehicleProgress,
    updateStats
  };
});
