<template>
  <transition name="slide">
    <div v-if="visible" class="detail-panel panel">
      <div class="panel-header">
        <span>{{ title }}</span>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="panel-body">
        <template v-if="objectData">
          <div class="detail-item" v-for="(value, key) in displayFields" :key="key">
            <span class="label">{{ getFieldLabel(key) }}</span>
            <span class="value">{{ formatValue(key, value) }}</span>
          </div>
        </template>
        <div v-else class="empty">
          点击场景中的对象查看详情
        </div>
      </div>
      <div v-if="objectData && objectData.type === 'truck'" class="panel-footer">
        <button class="btn btn-primary" @click="handlePlayRoute">
          🚚 播放行驶路线
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BaseObject, Container, Truck, QuayCrane, Berth, YardBlock } from '@/types'

const props = defineProps<{
  visible: boolean
  objectData: BaseObject | Container | Truck | QuayCrane | Berth | YardBlock | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'playRoute', truckId: string): void
}>()

const title = computed(() => {
  if (!props.objectData) return '对象详情'
  const typeNames: Record<string, string> = {
    container: '集装箱详情',
    truck: '集卡详情',
    quayCrane: '岸桥详情',
    berth: '泊位详情',
    yard: '堆场详情'
  }
  return typeNames[props.objectData.type] || '对象详情'
})

const displayFields = computed(() => {
  if (!props.objectData) return {}
  const obj = props.objectData
  const fields: Record<string, any> = {}

  switch (obj.type) {
    case 'container':
      const c = obj as Container
      fields['箱号'] = c.containerNumber
      fields['尺寸'] = c.size
      fields['重量'] = `${c.weight} 吨`
      fields['货主'] = c.owner
      fields['进场时间'] = c.inTime
      fields['状态'] = c.status
      fields['危险品'] = c.isDangerous ? `是 (等级${c.dangerousLevel})` : '否'
      fields['堆存位置'] = `${c.stackPosition.block}-${c.stackPosition.bay}排-${c.stackPosition.row}列-${c.stackPosition.tier}层`
      break
    case 'truck':
      const t = obj as Truck
      fields['编号'] = t.name
      fields['车牌号'] = t.plateNumber
      fields['状态'] = t.status
      fields['当前速度'] = `${t.speed.toFixed(1)} km/h`
      fields['当前任务'] = t.currentTask || '空闲'
      break
    case 'quayCrane':
      const q = obj as QuayCrane
      fields['编号'] = q.craneId
      fields['状态'] = q.status
      fields['作业效率'] = `${q.workEfficiency} 箱/小时`
      fields['所属泊位'] = q.currentBerth
      break
    case 'berth':
      const b = obj as Berth
      fields['名称'] = b.name
      fields['长度'] = `${b.length} 米`
      fields['宽度'] = `${b.width} 米`
      fields['当前船舶'] = b.vesselName || '无'
      fields['船舶状态'] = b.vesselStatus
      break
    case 'yard':
      const y = obj as YardBlock
      fields['区块'] = y.blockCode
      fields['总箱位'] = y.totalSlots
      fields['已占用'] = y.occupiedSlots
      fields['利用率'] = `${((y.occupiedSlots / y.totalSlots) * 100).toFixed(1)}%`
      fields['危险品区'] = y.isDangerousZone ? '是' : '否'
      break
  }

  return fields
})

const getFieldLabel = (key: string): string => key

const formatValue = (key: string, value: any): string => {
  if (value instanceof Date) {
    return value.toLocaleString('zh-CN')
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return String(value)
}

const handleClose = () => {
  emit('close')
}

const handlePlayRoute = () => {
  if (props.objectData && props.objectData.type === 'truck') {
    emit('playRoute', props.objectData.id)
  }
}
</script>

<style scoped>
.detail-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.close-btn {
  background: none;
  border: none;
  color: #8c8c8c;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #ff4d4f;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(24, 144, 255, 0.1);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  color: #8c8c8c;
  font-size: 13px;
}

.detail-item .value {
  color: #e6f7ff;
  font-size: 13px;
  text-align: right;
  max-width: 180px;
  word-break: break-all;
}

.empty {
  text-align: center;
  color: #8c8c8c;
  padding: 40px 20px;
  font-size: 14px;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(24, 144, 255, 0.2);
}

.btn-primary {
  width: 100%;
  padding: 10px;
  background: #1890ff;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #40a9ff;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
