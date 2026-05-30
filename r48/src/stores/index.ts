import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DeviceData,
  AlarmInfo,
  StationMetrics,
  WaterLevelData,
  AreaType,
  AlarmLevel,
  PlaybackData,
  PlaybackFrame,
  AlarmStatus,
  ScenarioType,
  DeviceSearchResult,
  OperationStats,
} from '@/types'
import {
  getDevices,
  getAlarms,
  getStationMetrics,
  getWaterLevelData,
  simulateDataUpdate,
  generatePlaybackData,
  getScenarioDevices,
  searchDevices,
  confirmAlarm,
  startDisposal,
  recoverAlarm,
  closeAlarm,
  getOperationStats,
} from '@/services/mockDataService'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<DeviceData[]>(getDevices())
  const selectedDevice = ref<DeviceData | null>(null)
  const highlightedDeviceId = ref<string | null>(null)
  const currentArea = ref<AreaType>('pumpHouse')
  const alarmFilter = ref<AlarmLevel | null>(null)
  const showDetailPanel = ref(false)
  const searchKeyword = ref('')
  const currentScenario = ref<ScenarioType>('normal')

  const searchResults = computed<DeviceSearchResult[]>(() => {
    if (!searchKeyword.value.trim()) return []
    return searchDevices(devices.value, searchKeyword.value)
  })

  const filteredDevices = computed(() => {
    if (alarmFilter.value) {
      return devices.value.filter(d => d.alarms.some(a => a.level === alarmFilter.value))
    }
    return devices.value
  })

  function selectDevice(device: DeviceData | null) {
    selectedDevice.value = device
    showDetailPanel.value = device !== null
  }

  function highlightDevice(deviceId: string | null) {
    highlightedDeviceId.value = deviceId
  }

  function setArea(area: AreaType) {
    currentArea.value = area
  }

  function setAlarmFilter(level: AlarmLevel | null) {
    alarmFilter.value = level
  }

  function updateData() {
    devices.value = simulateDataUpdate(devices.value)
    if (selectedDevice.value) {
      const updated = devices.value.find(d => d.id === selectedDevice.value!.id)
      if (updated) selectedDevice.value = updated
    }
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }

  function applyScenario(scenario: ScenarioType) {
    currentScenario.value = scenario
    devices.value = getScenarioDevices(scenario)
  }

  function locateDevice(deviceId: string) {
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      highlightDevice(deviceId)
      selectDevice(device)
    }
  }

  return {
    devices,
    selectedDevice,
    highlightedDeviceId,
    currentArea,
    alarmFilter,
    showDetailPanel,
    searchKeyword,
    currentScenario,
    searchResults,
    filteredDevices,
    selectDevice,
    highlightDevice,
    setArea,
    setAlarmFilter,
    updateData,
    setSearchKeyword,
    applyScenario,
    locateDevice,
  }
})

export const useAlarmStore = defineStore('alarm', () => {
  const alarms = ref<AlarmInfo[]>(getAlarms())
  const selectedAlarm = ref<AlarmInfo | null>(null)
  const statusFilter = ref<AlarmStatus | null>(null)
  const levelFilter = ref<AlarmLevel | null>(null)

  const filteredAlarms = computed(() => {
    return alarms.value.filter(a => {
      if (statusFilter.value && a.status !== statusFilter.value) return false
      if (levelFilter.value && a.level !== levelFilter.value) return false
      return true
    })
  })

  const stats = computed(() => ({
    total: alarms.value.length,
    pending: alarms.value.filter(a => a.status === 'pending').length,
    confirmed: alarms.value.filter(a => a.status === 'confirmed').length,
    processing: alarms.value.filter(a => a.status === 'processing').length,
    recovered: alarms.value.filter(a => a.status === 'recovered').length,
    closed: alarms.value.filter(a => a.status === 'closed').length,
    critical: alarms.value.filter(a => a.level === 'critical').length,
    major: alarms.value.filter(a => a.level === 'major').length,
    minor: alarms.value.filter(a => a.level === 'minor').length,
    info: alarms.value.filter(a => a.level === 'info').length,
  }))

  function refreshAlarms() {
    alarms.value = getAlarms()
  }

  function selectAlarm(alarm: AlarmInfo | null) {
    selectedAlarm.value = alarm
  }

  function setStatusFilter(status: AlarmStatus | null) {
    statusFilter.value = status
  }

  function setLevelFilter(level: AlarmLevel | null) {
    levelFilter.value = level
  }

  function confirmAlarmAction(alarmId: string, operator: string) {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm && alarm.status === 'pending') {
      confirmAlarm(alarm, operator)
    }
  }

  function addDisposalRecord(alarmId: string, operator: string, action: string, description: string) {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      startDisposal(alarm, operator, action, description)
    }
  }

  function recoverAlarmAction(alarmId: string, operator: string, recoveryValue?: number) {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      recoverAlarm(alarm, operator, recoveryValue)
    }
  }

  function closeAlarmAction(alarmId: string, operator: string) {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm && (alarm.status === 'recovered' || alarm.status === 'closed')) {
      closeAlarm(alarm, operator)
    }
  }

  return {
    alarms,
    selectedAlarm,
    statusFilter,
    levelFilter,
    filteredAlarms,
    stats,
    refreshAlarms,
    selectAlarm,
    setStatusFilter,
    setLevelFilter,
    confirmAlarmAction,
    addDisposalRecord,
    recoverAlarmAction,
    closeAlarmAction,
  }
})

export const useSceneStore = defineStore('scene', () => {
  const waterLevelData = ref<WaterLevelData>(getWaterLevelData())
  const stationMetrics = ref<StationMetrics>(getStationMetrics())
  const isPlaying = ref(false)
  const playProgress = ref(0)
  const playSpeed = ref(1)
  const playbackData = ref<PlaybackData | null>(null)
  const currentFrame = ref<PlaybackFrame | null>(null)
  const playbackMode = ref(false)
  const highlightDeviceId = ref<string | null>(null)

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function setProgress(p: number) {
    playProgress.value = p
    if (playbackData.value && playbackMode.value) {
      const idx = Math.floor((p / 100) * (playbackData.value.frames.length - 1))
      currentFrame.value = playbackData.value.frames[idx] || null
    }
  }

  function setSpeed(s: number) {
    playSpeed.value = s
  }

  function refreshMetrics() {
    stationMetrics.value = getStationMetrics()
  }

  function refreshWaterLevel() {
    waterLevelData.value = getWaterLevelData()
  }

  function loadPlaybackData() {
    playbackData.value = generatePlaybackData(24, 5)
  }

  function enterPlaybackMode() {
    if (!playbackData.value) {
      loadPlaybackData()
    }
    playbackMode.value = true
    isPlaying.value = false
    playProgress.value = 0
    currentFrame.value = playbackData.value?.frames[0] || null
  }

  function exitPlaybackMode() {
    playbackMode.value = false
    isPlaying.value = false
    currentFrame.value = null
    playProgress.value = 0
    refreshMetrics()
    refreshWaterLevel()
  }

  function setHighlightDevice(deviceId: string | null) {
    highlightDeviceId.value = deviceId
  }

  const operationStats = computed<OperationStats | null>(() => {
    const deviceStore = useDeviceStore()
    const alarmStore = useAlarmStore()
    return getOperationStats(deviceStore.devices, alarmStore.alarms, stationMetrics.value)
  })

  return {
    waterLevelData,
    stationMetrics,
    isPlaying,
    playProgress,
    playSpeed,
    playbackData,
    currentFrame,
    playbackMode,
    highlightDeviceId,
    operationStats,
    togglePlay,
    setProgress,
    setSpeed,
    refreshMetrics,
    refreshWaterLevel,
    loadPlaybackData,
    enterPlaybackMode,
    exitPlaybackMode,
    setHighlightDevice,
  }
})
