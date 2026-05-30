<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, formatPercent, formatMoney, getTrendColor } from '@/utils'

const props = defineProps<{
  label: string
  value: number
  trend?: number
  unit?: 'number' | 'percent' | 'money' | 'time'
  color?: string
  isPositiveGood?: boolean
  showTrend?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const formattedValue = computed(() => {
  switch (props.unit) {
    case 'percent':
      return formatPercent(props.value)
    case 'money':
      return formatMoney(props.value)
    case 'time':
      return `${props.value}分钟`
    default:
      return formatNumber(props.value)
  }
})

const trendColor = computed(() => {
  if (props.trend === undefined) return '#999'
  return getTrendColor(props.trend, props.isPositiveGood)
})

const trendIcon = computed(() => {
  if (props.trend === undefined || props.trend === 0) return 'Right'
  return props.trend > 0 ? 'Top' : 'Bottom'
})

const gradientStyle = computed(() => {
  const baseColor = props.color || '#1E88E5'
  return {
    background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}cc 100%)`,
  }
})
</script>

<template>
  <div class="metric-card" :style="gradientStyle" @click="emit('click')">
    <div class="metric-label">{{ label }}</div>
    <div class="metric-value">{{ formattedValue }}</div>
    <div v-if="showTrend && trend !== undefined" class="metric-trend" :style="{ color: trendColor }">
      <el-icon>
        <component :is="trendIcon" />
      </el-icon>
      <span>{{ Math.abs(trend).toFixed(2) }}%</span>
      <span class="trend-text">环比</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  color: #fff;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.metric-label {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  margin-bottom: var(--spacing-sm);
}

.metric-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.metric-trend {
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-text {
  opacity: 0.8;
  margin-left: 4px;
}
</style>
