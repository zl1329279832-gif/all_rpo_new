<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'empty' | 'loading' | 'error'
  description?: string
  icon?: string
}>()

const iconMap: Record<string, string> = {
  empty: 'Document',
  loading: 'Loading',
  error: 'Warning',
}

const currentIcon = computed(() => props.icon || iconMap[props.type || 'empty'])

const defaultDescription = computed(() => {
  switch (props.type) {
    case 'loading':
      return '数据加载中...'
    case 'error':
      return '数据加载失败，请稍后重试'
    default:
      return '暂无数据'
  }
})
</script>

<template>
  <div class="empty-state">
    <el-icon class="empty-icon" :class="{ 'is-loading': type === 'loading' }">
      <component :is="currentIcon" />
    </el-icon>
    <p class="empty-text">{{ description || defaultDescription }}</p>
    <slot name="action"></slot>
  </div>
</template>

<style scoped>
.empty-state {
  padding: var(--spacing-xl) var(--spacing-lg);
  text-align: center;
  color: var(--color-text-placeholder);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-base);
}
</style>
