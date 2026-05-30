<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFilterStore } from '@/stores'
import { useDate } from '@/hooks'
import { DEPARTMENTS } from '@/types'

const emit = defineEmits<{
  (e: 'change'): void
}>()

const filterStore = useFilterStore()
const { startDate, endDate, dateRange, quickRanges, initFromFilter, setQuickRange, setCustomRange, dateRangeArray } = useDate()

const showCustomDate = ref(false)

initFromFilter(filterStore.filterParams)

const selectedDepartment = computed({
  get: () => filterStore.filterParams.department,
  set: (val: string) => {
    filterStore.setDepartment(val)
    emit('change')
  },
})

const handleQuickRangeChange = (val: string) => {
  setQuickRange(val)
  filterStore.setDateRange(val)
  emit('change')
}

const handleCustomDateChange = (val: [string, string]) => {
  if (val && val.length === 2) {
    setCustomRange(val)
    filterStore.setCustomDate(val[0], val[1])
    emit('change')
  }
}

const handleReset = () => {
  filterStore.resetFilter()
  initFromFilter(filterStore.filterParams)
  emit('change')
}

watch(
  () => filterStore.filterParams,
  () => {
    initFromFilter(filterStore.filterParams)
  }
)
</script>

<template>
  <div class="filter-bar">
    <div class="filter-item">
      <span class="filter-label">日期范围：</span>
      <el-radio-group v-model="dateRange" @change="handleQuickRangeChange">
        <el-radio-button v-for="range in quickRanges" :key="range.value" :value="range.value">
          {{ range.label }}
        </el-radio-button>
      </el-radio-group>
      <el-button type="text" @click="showCustomDate = !showCustomDate">
        {{ showCustomDate ? '收起' : '自定义' }}
      </el-button>
    </div>

    <div v-show="showCustomDate" class="filter-item">
      <el-date-picker
        v-model="dateRangeArray"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="handleCustomDateChange"
      />
    </div>

    <div class="filter-item">
      <span class="filter-label">科室：</span>
      <el-select v-model="selectedDepartment" placeholder="请选择科室" style="width: 200px" @change="emit('change')">
        <el-option v-for="dept in DEPARTMENTS" :key="dept.id" :label="dept.name" :value="dept.id" />
      </el-select>
    </div>

    <div class="filter-actions">
      <el-button @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-actions {
  margin-left: auto;
}
</style>
