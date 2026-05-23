import { defineStore } from 'pinia';
import { ref, computed, shallowRef, markRaw } from 'vue';
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
import { debounce, throttle } from '@/utils';

export const useWarehouseStore = defineStore('warehouse', () => {
  const mockData = markRaw(MockDataGenerator.getInstance());

  const currentFloor = ref(0);
  const currentCameraView = ref<CameraView>('perspective');
  const alarmFilter = ref<AlarmLevel | 'all'>('all');
  const searchQuery = ref('');
  const isPlaying = ref(false);
  const playbackTime = ref(0);
  const playbackSpeed = ref(1);
  const selectedForkliftId = ref<string | null>(null);
  const pickedObject = shallowRef<PickedObject | null>(null);

  const shelves = ref<ShelfData[]>(mockData.getShelves());
  const forklifts = ref<ForkliftData[]>(mockData.getForklifts());
  const sensors = ref<SensorData[]>(mockData.getSensors());
  const loadingDocks = ref<LoadingDockData[]>(mockData.getLoadingDocks());
  const channels = ref<ChannelData[]>(mockData.getChannels());
  const alarms = ref<AlarmData[]>([]);
  const forkliftTracks = shallowRef<Map<string, TrackPoint[]>>(new Map());
  const historicalUtilization = ref(mockData.generateHistoricalUtilization(7));
  const alarmTrend = ref(mockData.generateAlarmTrend(24));

  let refreshTimer: number | null = null;
  let lastChartUpdate = 0;
  const CHART_UPDATE_INTERVAL = 10000;

  const stats = computed<WarehouseStats>(() => {
    const allShelves = shelves.value;
    const allForklifts = forklifts.value;
    const allSensors = sensors.value;
    const activeAlarms = alarms.value;

    let totalCapacity = 0;
    let usedCapacity = 0;
    let activeShelves = 0;
    let activeForklifts = 0;
    let offlineForklifts = 0;
    let offlineSensors = 0;
    let activeAlarmsCount = 0;
    let criticalAlarms = 0;
    let warningAlarms = 0;

    const len1 = allShelves.length;
    for (let i = 0; i < len1; i++) {
      const s = allShelves[i];
      totalCapacity += s.capacity;
      usedCapacity += s.usedSlots;
      if (s.status === 'normal') activeShelves++;
    }

    const len2 = allForklifts.length;
    for (let i = 0; i < len2; i++) {
      const f = allForklifts[i];
      if (f.status === 'working') activeForklifts++;
      if (f.status === 'offline' || f.status === 'error') offlineForklifts++;
    }

    const len3 = allSensors.length;
    for (let i = 0; i < len3; i++) {
      const s = allSensors[i];
      if (s.status === 'offline') offlineSensors++;
    }

    const len4 = activeAlarms.length;
    for (let i = 0; i < len4; i++) {
      const a = activeAlarms[i];
      if (a.status !== 'resolved') {
        activeAlarmsCount++;
        if (a.level === 'critical') criticalAlarms++;
        if (a.level === 'warning') warningAlarms++;
      }
    }

    return {
      totalCapacity,
      usedCapacity,
      utilizationRate: totalCapacity > 0 ? usedCapacity / totalCapacity : 0,
      totalShelves: len1,
      activeShelves,
      totalForklifts: len2,
      activeForklifts,
      offlineForklifts,
      totalSensors: len3,
      offlineSensors,
      activeAlarms: activeAlarmsCount,
      criticalAlarms,
      warningAlarms,
    };
  });

  const filteredShelves = computed(() => {
    const floor = currentFloor.value;
    const query = searchQuery.value.toLowerCase().trim();

    let result = shelves.value;
    if (floor !== undefined) {
      result = result.filter(s => s.floor === floor);
    }

    if (query) {
      result = result.filter(s => s.code.toLowerCase().includes(query));
    }

    return result;
  });

  const filteredSensors = computed(() => {
    if (currentFloor.value === undefined) return sensors.value;
    const floor = currentFloor.value;
    const floorHeight = SCENE_CONFIG.floorHeight;
    return sensors.value.filter(s =>
      Math.floor(s.position.y / floorHeight) === floor
    );
  });

  const filteredAlarms = computed(() => {
    if (alarmFilter.value === 'all') return alarms.value;
    const filter = alarmFilter.value;
    return alarms.value.filter(a => a.level === filter);
  });

  const unhandledAlarmsCount = computed(() =>
    alarms.value.filter(a => a.status === 'unhandled').length
  );

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
    const now = performance.now();

    const updatedShelves = mockData.updateShelves();
    const updatedSensors = mockData.updateSensors();
    const updatedChannels = mockData.updateChannels();
    const { forklifts: updatedForklifts, tracks } = mockData.updateForklifts();
    const updatedAlarms = mockData.generateAlarms(
      updatedShelves,
      updatedSensors,
      updatedForklifts,
      updatedChannels
    );

    shelves.value = updatedShelves;
    sensors.value = updatedSensors;
    channels.value = updatedChannels;
    forklifts.value = updatedForklifts;
    alarms.value = updatedAlarms;

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

    if (now - lastChartUpdate > CHART_UPDATE_INTERVAL) {
      historicalUtilization.value = mockData.generateHistoricalUtilization(7);
      alarmTrend.value = mockData.generateAlarmTrend(24);
      lastChartUpdate = now;
    }
  }

  const throttledRefreshData = throttle(() => {
    refreshData();
  }, DATA_REFRESH_INTERVAL);

  function startDataRefresh(): void {
    if (refreshTimer) return;
    refreshData();
    refreshTimer = window.setInterval(throttledRefreshData, DATA_REFRESH_INTERVAL);
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
