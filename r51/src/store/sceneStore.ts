import { defineStore } from 'pinia';
import type { SceneState, Vehicle, TrafficStats } from '@/types';
import { ref, computed, watch } from 'vue';
import { vehiclePaths, roadSegments } from '@/data/trafficData';

export const useSceneStore = defineStore('scene', () => {
  const state = ref<SceneState>({
    cameraMode: 'free',
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

  let vehicleIdCounter = 0;

  function generateVehicle(pathId: string): Vehicle {
    const segment = roadSegments.find(s => s.id === pathId);
    const laneCount = segment?.lanes || 2;
    const roadWidth = segment?.width || 10;
    const types: Array<'car' | 'suv' | 'truck'> = ['car', 'car', 'car', 'suv', 'suv', 'truck'];
    const colors = [
      0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12,
      0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e,
      0xecf0f1, 0x2c3e50, 0xd35400, 0x16a085
    ];

    return {
      id: `v-${++vehicleIdCounter}`,
      type: types[Math.floor(Math.random() * types.length)],
      pathId,
      progress: Math.random(),
      speed: 20 + Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      lane: Math.floor(Math.random() * laneCount),
      lanes: laneCount,
      roadWidth
    };
  }

  function syncVehiclesToDensity(density: number) {
    const targetCount = Math.floor(density * 60);

    while (vehicles.value.length < targetCount) {
      const pathId = vehiclePaths[Math.floor(Math.random() * vehiclePaths.length)];
      vehicles.value.push(generateVehicle(pathId));
    }

    while (vehicles.value.length > targetCount) {
      vehicles.value.pop();
    }

    stats.value.totalVehicles = vehicles.value.length;
    stats.value.averageSpeed = vehicles.value.length > 0
      ? vehicles.value.reduce((sum, v) => sum + v.speed, 0) / vehicles.value.length
      : 0;
    stats.value.congestionLevel = density > 0.7 ? 0.8 : density > 0.4 ? 0.4 : 0.1;
  }

  watch(() => state.value.trafficDensity, (newDensity) => {
    syncVehiclesToDensity(newDensity);
  }, { immediate: true });

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
