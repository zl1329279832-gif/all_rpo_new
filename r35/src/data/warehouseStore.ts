import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ShelfData,
  ForkliftData,
  SensorData,
  LoadingDockData,
  AlarmData,
  ChannelData,
  TrackPoint,
  WarehouseStats,
  CameraView,
  AlarmLevel,
  PickedObject,
} from '@/types';
import { MockDataGenerator } from './MockData';
import { DATA_REFRESH_INTERVAL, SCENE_CONFIG } from '@/config';

export const useWarehouseStore = defineStore('warehouse', () => {
  const mockData = MockDataGenerator.getInstance();

  const currentFloor = ref(0);
  const currentCameraView = ref<CameraView>('perspective');
  const alarmFilter = ref<AlarmLevel | 'all'>('all');
  const searchQuery = ref('');
  const isPlaying = ref(false);
  const playbackTime = ref(0);
  const playbackSpeed = ref(1);
  const selectedForkliftId = ref<string | null>(null);
  const pickedObject = ref<PickedObject | null>(null);

  const shelves = ref<ShelfData[]>(mockData.getShelves());
  const forklifts = ref<ForkliftData[]>(mockData.getForklifts());
  const sensors = ref<SensorData[]>(mockData.getSensors());
  const loadingDocks = ref<LoadingDockData[]>(mockData.getLoadingDocks());
  const channels = ref<ChannelData[]>(mockData.getChannels());
  const alarms = ref<AlarmData[]>([]);
  const forkliftTracks = ref<Map<string, TrackPoint[]>>(new Map());
  const historicalUtilization = ref(mockData.generateHistoricalUtilization(7));
  const alarmTrend = ref(mockData.generateAlarmTrend(24));

  let refreshTimer: number | null = null;

  const stats = computed<WarehouseStats>(() => {
    const allShelves = shelves.value;
    const allForklifts = forklifts.value;
    const allSensors = sensors.value;
    const activeAlarms = alarms.value.filter(a => a.status !== 'resolved');

    const totalCapacity = allShelves.reduce((sum, s) => sum + s.capacity, 0);
    const usedCapacity = allShelves.reduce((sum, s) => sum + s.usedSlots, 0);

    return {
      totalCapacity,
      usedCapacity,
      utilizationRate: totalCapacity > 0 ? usedCapacity / totalCapacity : 0,
      totalShelves: allShelves.length,
      activeShelves: allShelves.filter(s => s.status === 'normal').length,
      totalForklifts: allForklifts.length,
      activeForklifts: allForklifts.filter(f => f.status === 'working').length,
      offlineForklifts: allForklifts.filter(f => f.status === 'offline' || f.status === 'error').length,
      totalSensors: allSensors.length,
      offlineSensors: allSensors.filter(s => s.status === 'offline').length,
      activeAlarms: activeAlarms.length,
      criticalAlarms: activeAlarms.filter(a => a.level === 'critical').length,
      warningAlarms: activeAlarms.filter(a => a.level === 'warning').length,
    };
  });

  const filteredShelves = computed(() => {
    let result = currentFloor.value !== undefined
      ? shelves.value.filter(s => s.floor === currentFloor.value)
      : shelves.value;

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      result = result.filter(s => s.code.toLowerCase().includes(query));
    }

    return result;
  });

  const filteredSensors = computed(() => {
    if (currentFloor.value === undefined) return sensors.value;
    return sensors.value.filter(s =>
      Math.floor(s.position.y / SCENE_CONFIG.floorHeight) === currentFloor.value
    );
  });

  const filteredAlarms = computed(() => {
    if (alarmFilter.value === 'all') return alarms.value;
    return alarms.value.filter(a => a.level === alarmFilter.value);
  });

  function setFloor(floor: number): void {
    currentFloor.value = floor;
  }

  function setCameraView(view: CameraView): void {
    currentCameraView.value = view;
  }

  function setAlarmFilter(filter: AlarmLevel | 'all'): void {
    alarmFilter.value = filter;
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  function setPickedObject(obj: PickedObject | null): void {
    pickedObject.value = obj;
  }

  function setSelectedForklift(id: string | null): void {
    selectedForkliftId.value = id;
    if (id) {
      const track = mockData.generateForkliftTrack(id);
      forkliftTracks.value.set(id, track);
    }
  }

  function handleAlarm(alarmId: string): void {
    const alarm = alarms.value.find(a => a.id === alarmId);
    if (alarm) {
      alarm.status = alarm.status === 'unhandled' ? 'processing' : 'resolved';
      if (alarm.status === 'processing') {
        alarm.handledBy = '当前用户';
        alarm.handledAt = Date.now();
      }
    }
  }

  function refreshData(): void {
    shelves.value = mockData.updateShelves();
    sensors.value = mockData.updateSensors();
    channels.value = mockData.updateChannels();

    const { forklifts: updatedForklifts, tracks } = mockData.updateForklifts();
    forklifts.value = updatedForklifts;

    tracks.forEach((point, forkliftId) => {
      if (!forkliftTracks.value.has(forkliftId)) {
        forkliftTracks.value.set(forkliftId, []);
      }
      const track = forkliftTracks.value.get(forkliftId)!;
      track.push(point);
      if (track.length > 1000) {
        track.shift();
      }
    });

    alarms.value = mockData.generateAlarms(
      shelves.value,
      sensors.value,
      forklifts.value,
      channels.value
    );

    if (Math.random() > 0.9) {
      historicalUtilization.value = mockData.generateHistoricalUtilization(7);
      alarmTrend.value = mockData.generateAlarmTrend(24);
    }
  }

  function startDataRefresh(): void {
    if (refreshTimer) return;
    refreshData();
    refreshTimer = window.setInterval(refreshData, DATA_REFRESH_INTERVAL);
  }

  function stopDataRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function startPlayback(): void {
    isPlaying.value = true;
  }

  function pausePlayback(): void {
    isPlaying.value = false;
  }

  function setPlaybackTime(time: number): void {
    playbackTime.value = time;
  }

  function setPlaybackSpeed(speed: number): void {
    playbackSpeed.value = speed;
  }

  function resetPlayback(): void {
    isPlaying.value = false;
    playbackTime.value = 0;
  }

  return {
    currentFloor,
    currentCameraView,
    alarmFilter,
    searchQuery,
    isPlaying,
    playbackTime,
    playbackSpeed,
    selectedForkliftId,
    pickedObject,
    shelves,
    forklifts,
    sensors,
    loadingDocks,
    channels,
    alarms,
    forkliftTracks,
    historicalUtilization,
    alarmTrend,
    stats,
    filteredShelves,
    filteredSensors,
    filteredAlarms,
    setFloor,
    setCameraView,
    setAlarmFilter,
    setSearchQuery,
    setPickedObject,
    setSelectedForklift,
    handleAlarm,
    refreshData,
    startDataRefresh,
    stopDataRefresh,
    startPlayback,
    pausePlayback,
    setPlaybackTime,
    setPlaybackSpeed,
    resetPlayback,
  };
});
