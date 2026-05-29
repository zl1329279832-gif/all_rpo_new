<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="price-adjust-form"
  >
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12">
        <el-form-item label="房型" prop="roomTypeId">
          <el-select
            v-model="formData.roomTypeId"
            placeholder="请选择房型"
            style="width: 100%"
            @change="handleRoomTypeChange"
          >
            <el-option
              v-for="item in roomTypes"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="策略名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入策略名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="24">
        <el-form-item label="适用日期" prop="dateRange">
          <el-date-picker
            v-model="formData.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="适用星期">
          <el-checkbox-group v-model="formData.weekdays">
            <el-checkbox :value="1">周一</el-checkbox>
            <el-checkbox :value="2">周二</el-checkbox>
            <el-checkbox :value="3">周三</el-checkbox>
            <el-checkbox :value="4">周四</el-checkbox>
            <el-checkbox :value="5">周五</el-checkbox>
            <el-checkbox :value="6">周六</el-checkbox>
            <el-checkbox :value="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="价格类型">
          <el-radio-group v-model="priceType">
            <el-radio value="fixed">固定价格</el-radio>
            <el-radio value="dynamic">动态价格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12" v-if="priceType === 'fixed'">
        <el-form-item label="工作日价格" prop="basePrice">
          <el-input-number
            v-model="formData.basePrice"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 100%"
            placeholder="请输入工作日价格"
            :prefix-icon="Money"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12" v-if="priceType === 'fixed'">
        <el-form-item label="周末价格" prop="weekendPrice">
          <el-input-number
            v-model="formData.weekendPrice"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 100%"
            placeholder="请输入周末价格"
            :prefix-icon="Money"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12" v-if="priceType === 'fixed'">
        <el-form-item label="节假日价格" prop="holidayPrice">
          <el-input-number
            v-model="formData.holidayPrice"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 100%"
            placeholder="请输入节假日价格"
            :prefix-icon="Money"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12" v-if="priceType === 'dynamic'">
        <el-form-item label="折扣率(%)" prop="discountRate">
          <el-input-number
            v-model="formData.discountRate"
            :min="0"
            :max="100"
            :precision="1"
            :step="5"
            style="width: 100%"
            placeholder="请输入折扣率"
            :suffix-icon="Operation"
          />
          <div class="tip">调整后价格 = 基准价 × (折扣率 ÷ 100)</div>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="最少入住" prop="minStay">
          <el-input-number
            v-model="formData.minStay"
            :min="1"
            :max="30"
            style="width: 100%"
            placeholder="最少入住天数"
          />
          <span class="unit">晚</span>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="最多入住" prop="maxStay">
          <el-input-number
            v-model="formData.maxStay"
            :min="1"
            :max="90"
            style="width: 100%"
            placeholder="最多入住天数"
          />
          <span class="unit">晚</span>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="优先级" prop="priority">
          <el-input-number
            v-model="formData.priority"
            :min="1"
            :max="100"
            style="width: 100%"
            placeholder="数值越大优先级越高"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="启用状态">
          <el-switch v-model="formData.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-col>

      <el-col :xs="24">
        <el-form-item label="备注">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </el-row>

    <div v-if="showActions" class="form-actions">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSubmit">确认提交</el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Money, Operation } from '@element-plus/icons-vue'
import type { RoomType } from '../../types'

interface PriceAdjustFormData {
  id?: string
  roomTypeId: string
  name: string
  dateRange: [Date, Date] | null
  weekdays: number[]
  basePrice: number
  weekendPrice: number
  holidayPrice: number
  discountRate: number
  minStay: number
  maxStay: number
  priority: number
  isActive: boolean
  remarks: string
}

const props = defineProps<{
  roomTypes: RoomType[]
  initialData?: Partial<PriceAdjustFormData>
  showActions?: boolean
}>()

const emit = defineEmits<{
  submit: [data: PriceAdjustFormData]
  reset: []
}>()

const formRef = ref<FormInstance>()
const priceType = ref<'fixed' | 'dynamic'>('fixed')

const formData = reactive<PriceAdjustFormData>({
  roomTypeId: '',
  name: '',
  dateRange: null,
  weekdays: [1, 2, 3, 4, 5, 6, 0],
  basePrice: 0,
  weekendPrice: 0,
  holidayPrice: 0,
  discountRate: 100,
  minStay: 1,
  maxStay: 30,
  priority: 1,
  isActive: true,
  remarks: ''
})

const selectedRoomType = computed(() => {
  return props.roomTypes.find(r => r.id === formData.roomTypeId)
})

const rules: FormRules = {
  roomTypeId: [
    { required: true, message: '请选择房型', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入策略名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  dateRange: [
    { required: true, message: '请选择适用日期', trigger: 'change' }
  ],
  basePrice: [
    { required: true, message: '请输入工作日价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  weekendPrice: [
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  holidayPrice: [
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  discountRate: [
    { type: 'number', min: 0, max: 100, message: '折扣率应在0-100之间', trigger: 'blur' }
  ],
  minStay: [
    { type: 'number', min: 1, max: 30, message: '最少入住1-30晚', trigger: 'blur' }
  ],
  maxStay: [
    { type: 'number', min: 1, max: 90, message: '最多入住1-90晚', trigger: 'blur' }
  ],
  priority: [
    { type: 'number', min: 1, max: 100, message: '优先级应在1-100之间', trigger: 'blur' }
  ]
}

watch(() => props.initialData, (data) => {
  if (data) {
    Object.assign(formData, data)
    if (data.discountRate && data.discountRate !== 100) {
      priceType.value = 'dynamic'
    }
  }
}, { immediate: true, deep: true })

const handleRoomTypeChange = (roomTypeId: string) => {
  const roomType = props.roomTypes.find(r => r.id === roomTypeId)
  if (roomType) {
    formData.basePrice = roomType.basePrice
    formData.weekendPrice = roomType.weekendPrice
    formData.holidayPrice = roomType.holidayPrice
  }
}

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const submitData = { ...formData }
      if (priceType.value === 'dynamic') {
        submitData.basePrice = 0
        submitData.weekendPrice = 0
        submitData.holidayPrice = 0
      } else {
        submitData.discountRate = 100
      }
      emit('submit', submitData)
    }
  })
}

const handleReset = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    roomTypeId: '',
    name: '',
    dateRange: null,
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    basePrice: 0,
    weekendPrice: 0,
    holidayPrice: 0,
    discountRate: 100,
    minStay: 1,
    maxStay: 30,
    priority: 1,
    isActive: true,
    remarks: ''
  })
  priceType.value = 'fixed'
  emit('reset')
}

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  formData
})
</script>

<style lang="scss" scoped>
.price-adjust-form {
  .unit {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  .tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

@media (max-width: 768px) {
  .price-adjust-form {
    :deep(.el-form-item__label) {
      width: auto !important;
      text-align: left;
    }

    .form-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
