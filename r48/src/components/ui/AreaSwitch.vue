<script setup lang="ts">
import type { AreaType } from '@/types'
import { AREA_LABELS } from '@/types'
import { useDeviceStore } from '@/stores'
import { MapPin } from 'lucide-vue-next'

const store = useDeviceStore()
const areas: AreaType[] = ['intake', 'pumpHouse', 'outlet']
</script>

<template>
  <div class="area-switch">
    <div class="switch-label">
      <MapPin :size="14" />
      <span>区域</span>
    </div>
    <div class="switch-tabs">
      <button
        v-for="area in areas"
        :key="area"
        class="tab-btn"
        :class="{ active: store.currentArea === area }"
        @click="store.setArea(area)"
      >
        {{ AREA_LABELS[area] }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.area-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px;
  background: rgba(10, 22, 40, 0.85);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}
.switch-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8cb8d8;
  font-size: 12px;
  white-space: nowrap;
}
.switch-tabs {
  display: flex;
  gap: 4px;
  background: rgba(10, 22, 40, 0.6);
  border-radius: 6px;
  padding: 2px;
}
.tab-btn {
  padding: 4px 14px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8cb8d8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}
.tab-btn:hover {
  color: #e6f7ff;
}
.tab-btn.active {
  background: rgba(30, 144, 255, 0.25);
  color: #00e5ff;
  box-shadow: 0 0 6px rgba(30, 144, 255, 0.3);
}
</style>
