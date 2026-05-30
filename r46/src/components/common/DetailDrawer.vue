<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  width?: string
  size?: 'small' | 'default' | 'large'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const visible = ref(props.modelValue)
const loading = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
  }
)

const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

const setLoading = (val: boolean) => {
  loading.value = val
}

defineExpose({
  setLoading,
})
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size === 'small' ? '400px' : size === 'large' ? '800px' : width || '600px'"
    direction="rtl"
    :modal-append-to-body="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="drawer-content">
      <slot></slot>
    </div>
    <template #footer>
      <slot name="footer">
        <div class="drawer-footer">
          <el-button @click="handleClose">关闭</el-button>
          <slot name="actions"></slot>
        </div>
      </slot>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-content {
  height: 100%;
  overflow-y: auto;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>
