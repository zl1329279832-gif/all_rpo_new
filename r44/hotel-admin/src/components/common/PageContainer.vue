<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-info">
        <h2 class="page-title">{{ title }}</h2>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="page-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;

    .page-info {
      flex: 1;
      min-width: 0;

      .page-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.5;
      }

      .page-description {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }
    }

    .page-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .page-content {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .page-container {
    .page-header {
      flex-direction: column;
      align-items: stretch;

      .page-actions {
        width: 100%;
        justify-content: flex-start;
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 8px;
      }
    }
  }
}
</style>
