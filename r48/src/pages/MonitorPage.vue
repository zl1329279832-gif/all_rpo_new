<script setup lang="ts">
import SceneContainer from '@/components/three/SceneContainer.vue'
import DeviceDetailPanel from '@/components/three/DeviceDetailPanel.vue'
import WaterLevelPlayer from '@/components/three/WaterLevelPlayer.vue'
import TopToolbar from '@/components/ui/TopToolbar.vue'
import AlarmFilter from '@/components/ui/AlarmFilter.vue'
import AreaSwitch from '@/components/ui/AreaSwitch.vue'
import StatusBar from '@/components/ui/StatusBar.vue'
import { useDeviceStore } from '@/stores'

const deviceStore = useDeviceStore()
</script>

<template>
  <div class="monitor-page">
    <TopToolbar />
    <div class="monitor-body">
      <div class="scene-area">
        <div class="overlay-top">
          <AlarmFilter />
          <AreaSwitch />
        </div>
        <SceneContainer />
        <div class="overlay-bottom">
          <WaterLevelPlayer />
          <StatusBar />
        </div>
      </div>
      <DeviceDetailPanel
        :device="deviceStore.selectedDevice"
        :visible="deviceStore.showDetailPanel"
        @close="deviceStore.selectDevice(null)"
      />
    </div>
  </div>
</template>

<style scoped>
.monitor-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  overflow: hidden;
}
.monitor-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}
.scene-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.overlay-top {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 40;
  display: flex;
  gap: 10px;
}
.overlay-bottom {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
