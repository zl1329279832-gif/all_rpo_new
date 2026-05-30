import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DeviceData, AlarmInfo, StationMetrics, WaterLevelData, AreaType, AlarmLevel } from '@/types'
import { getDevices, getAlarms, getStationMetrics, getWaterLevelData, simulateDataUpdate } from '@/services/mockDataService'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<DeviceData[]>(getDevices())
  const selectedDevice = ref<DeviceData | null>(null)
  const currentArea = ref<AreaType>('pumpHouse')
  const alarmFilter = ref<AlarmLevel | null>(null)
  const showDetailPanel = ref(false)

  function selectDevice(device: DeviceData | null) {
    selectedDevice.value = device
    showDetailPanel.value = device !== null
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

  return { devices, selectedDevice, currentArea, alarmFilter, showDetailPanel, selectDevice, setArea, setAlarmFilter, updateData }
})

export const useAlarmStore = defineStore('alarm', () => {
  const alarms = ref<AlarmInfo[]>(getAlarms())

  function refreshAlarms() {
    alarms.value = getAlarms()
  }

  return { alarms, refreshAlarms }
})

export const useSceneStore = defineStore('scene', () => {
  const waterLevelData = ref<WaterLevelData>(getWaterLevelData())
  const stationMetrics = ref<StationMetrics>(getStationMetrics())
  const isPlaying = ref(false)
  const playProgress = ref(0)
  const playSpeed = ref(1)

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function setProgress(p: number) {
    playProgress.value = p
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

  return { waterLevelData, stationMetrics, isPlaying, playProgress, playSpeed, togglePlay, setProgress, setSpeed, refreshMetrics, refreshWaterLevel }
})
