<template>
  <el-card class="filter-bar" shadow="never">
    <el-form :model="filterForm" inline @submit.prevent>
      <template v-for="field in fields" :key="field.prop">
        <el-form-item :label="field.label" v-if="field.type === 'input'">
          <el-input
            v-model="filterForm[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '200px' }"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="field.label" v-else-if="field.type === 'select'">
          <el-select
            v-model="filterForm[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '200px' }"
            @change="handleSearch"
          >
            <el-option
              v-for="option in field.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="field.label" v-else-if="field.type === 'date'">
          <el-date-picker
            v-model="filterForm[field.prop]"
            type="date"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '200px' }"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="field.label" v-else-if="field.type === 'daterange'">
          <el-date-picker
            v-model="filterForm[field.prop]"
            type="daterange"
            :start-placeholder="field.startPlaceholder || '开始日期'"
            :end-placeholder="field.endPlaceholder || '结束日期'"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '280px' }"
            @change="handleSearch"
          />
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        <el-button
          v-if="showExpand"
          :icon="expanded ? ArrowUp : ArrowDown"
          @click="toggleExpand"
        >
          {{ expanded ? '收起' : '更多' }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Search, RefreshRight, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

interface FilterOption {
  label: string
  value: string | number | boolean
}

interface FilterField {
  prop: string
  label: string
  type: 'input' | 'select' | 'date' | 'daterange'
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  width?: string
  clearable?: boolean
  options?: FilterOption[]
  defaultValue?: any
}

const props = defineProps<{
  fields: FilterField[]
  showExpand?: boolean
}>()

const emit = defineEmits<{
  search: [filters: Record<string, any>]
  reset: []
}>()

const expanded = ref(false)
const filterForm = reactive<Record<string, any>>({})

const initFilterForm = () => {
  props.fields.forEach(field => {
    filterForm[field.prop] = field.defaultValue ?? ''
  })
}

watch(() => props.fields, () => {
  initFilterForm()
}, { immediate: true, deep: true })

const handleSearch = () => {
  emit('search', { ...filterForm })
}

const handleReset = () => {
  props.fields.forEach(field => {
    filterForm[field.prop] = field.defaultValue ?? ''
  })
  emit('reset')
}

const toggleExpand = () => {
  expanded.value = !expanded.value
}
</script>

<style lang="scss" scoped>
.filter-bar {
  margin-bottom: 16px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  :deep(.el-card__body) {
    padding: 16px 16px 0 16px;
  }

  :deep(.el-form--inline .el-form-item) {
    margin-right: 16px;
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
}

@media (max-width: 768px) {
  .filter-bar {
    :deep(.el-form--inline) {
      .el-form-item {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        margin-right: 0;
        width: 100%;

        .el-form-item__label {
          width: auto;
          justify-content: flex-start;
          margin-bottom: 4px;
        }

        .el-form-item__content {
          width: 100%;

          .el-input,
          .el-select,
          .el-date-editor {
            width: 100% !important;
          }
        }
      }
    }
  }
}
</style>
