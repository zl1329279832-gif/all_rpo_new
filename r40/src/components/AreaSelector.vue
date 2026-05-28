<template>
  <div class="area-selector">
    <span class="label">作业区域：</span>
    <div class="area-buttons">
      <button
        v-for="area in areas"
        :key="area.id"
        class="area-btn"
        :class="{ active: selectedArea === area.id }"
        @click="selectArea(area.id)"
      >
        {{ area.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Area {
  id: string
  name: string
}

const areas: Area[] = [
  { id: 'all', name: '全部' },
  { id: 'berth', name: '泊位区' },
  { id: 'yard', name: '堆场区' },
  { id: 'road', name: '道路' }
]

const selectedArea = ref('all')

const emit = defineEmits<{
  (e: 'change', areaId: string): void
}>()

const selectArea = (areaId: string) => {
  selectedArea.value = areaId
  emit('change', areaId)
}
</script>

<style scoped>
.area-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  color: #e6f7ff;
  font-size: 14px;
  white-space: nowrap;
}

.area-buttons {
  display: flex;
  gap: 8px;
}

.area-btn {
  padding: 6px 16px;
  background: rgba(16, 32, 56, 0.8);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  color: #8c8c8c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.area-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.area-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
</style>
