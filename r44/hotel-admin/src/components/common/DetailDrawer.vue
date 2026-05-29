<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :direction="direction"
    :destroy-on-close="destroyOnClose"
    :with-header="withHeader"
    @close="handleClose"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div v-if="loading" class="loading-container">
      <el-loading :fullscreen="false" text="加载中..." />
    </div>

    <div v-else class="drawer-content">
      <template v-if="detail">
        <el-descriptions
          v-if="!$slots.default"
          :column="column"
          border
          size="default"
        >
          <el-descriptions-item
            v-for="field in fields"
            :key="field.prop"
            :label="field.label"
            :span="field.span || 1"
          >
            <template v-if="field.type === 'tag'">
              <el-tag
                :type="getTagType(detail[field.prop], field.tagOptions)"
                effect="light"
              >
                {{ getTagLabel(detail[field.prop], field.tagOptions) }}
              </el-tag>
            </template>

            <template v-else-if="field.type === 'status'">
              <el-tag
                :type="getStatusType(detail[field.prop])"
                effect="light"
              >
                {{ getStatusLabel(detail[field.prop]) }}
              </el-tag>
            </template>

            <template v-else-if="field.type === 'date'">
              {{ formatDate(detail[field.prop]) }}
            </template>

            <template v-else-if="field.type === 'money'">
              ¥{{ formatMoney(detail[field.prop]) }}
            </template>

            <template v-else-if="field.type === 'image'">
              <el-image
                :src="detail[field.prop]"
                :preview-src-list="[detail[field.prop]]"
                style="width: 100px; height: 100px"
                fit="cover"
              />
            </template>

            <template v-else-if="field.type === 'images'">
              <div class="image-list">
                <el-image
                  v-for="(img, index) in detail[field.prop]"
                  :key="index"
                  :src="img"
                  :preview-src-list="detail[field.prop]"
                  style="width: 80px; height: 80px; margin-right: 8px; margin-bottom: 8px"
                  fit="cover"
                />
              </div>
            </template>

            <template v-else>
              {{ detail[field.prop] || '-' }}
            </template>
          </el-descriptions-item>
        </el-descriptions>

        <slot v-else :detail="detail" />
      </template>

      <el-empty v-else description="暂无数据" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">关闭</el-button>
        <slot name="footer-extra" />
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface TagOption {
  label: string
  value: string | number
  type?: 'success' | 'warning' | 'info' | 'danger' | 'primary'
}

interface DetailField {
  prop: string
  label: string
  type?: 'tag' | 'status' | 'date' | 'money' | 'image' | 'images'
  span?: number
  tagOptions?: TagOption[]
}

const props = defineProps<{
  modelValue: boolean
  title?: string
  size?: string | number
  direction?: 'rtl' | 'ltr' | 'ttb' | 'btt'
  destroyOnClose?: boolean
  withHeader?: boolean
  loading?: boolean
  detail?: Record<string, any>
  fields?: DetailField[]
  column?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
  emit('close')
}

const getTagLabel = (value: any, options?: TagOption[]) => {
  if (!options) return value || '-'
  const option = options.find(o => o.value === value)
  return option ? option.label : value || '-'
}

const getTagType = (value: any, options?: TagOption[]) => {
  if (!options) return 'info'
  const option = options.find(o => o.value === value)
  return option?.type || 'info'
}

const statusTypeMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  normal: 'success',
  active: 'success',
  confirmed: 'primary',
  checkedIn: 'success',
  checkedOut: 'info',
  pending: 'warning',
  processing: 'warning',
  resolved: 'success',
  closed: 'info',
  cancelled: 'danger',
  unpaid: 'warning',
  partial: 'primary',
  paid: 'success',
  refunded: 'info',
  full: 'danger',
  maintenance: 'warning',
  noShow: 'danger'
}

const statusLabelMap: Record<string, string> = {
  normal: '正常',
  active: '启用',
  confirmed: '已确认',
  checkedIn: '已入住',
  checkedOut: '已退房',
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  cancelled: '已取消',
  unpaid: '未支付',
  partial: '部分支付',
  paid: '已支付',
  refunded: '已退款',
  full: '满房',
  maintenance: '维护中',
  noShow: '未入住'
}

const getStatusType = (status: string) => {
  return statusTypeMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  return statusLabelMap[status] || status || '-'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMoney = (value: number) => {
  if (value === null || value === undefined) return '0.00'
  return value.toFixed(2)
}
</script>

<style lang="scss" scoped>
.drawer-content {
  padding: 0;

  .loading-container {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-list {
    display: flex;
    flex-wrap: wrap;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-drawer__header) {
  margin-bottom: 16px;
}
</style>
