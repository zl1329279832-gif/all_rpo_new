<template>
  <div class="inventory-panel" v-if="visible">
    <div class="inventory-header">
      <span>背包</span>
      <span class="close-btn" @click="close">✕</span>
    </div>
    <div class="inventory-grid">
      <div
        v-for="item in inventory"
        :key="item.id"
        class="inventory-item"
        @click="useItem(item.id)"
      >
        <div class="item-icon">{{ item.icon }}</div>
        <div class="item-name">{{ item.name }}</div>
        <div class="item-quantity">x{{ item.quantity }}</div>
      </div>
      <div v-if="inventory.length === 0" class="empty">
        背包是空的
      </div>
    </div>
    <div class="inventory-hint">
      点击物品使用 | 按 I 关闭
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '@/types/game'

defineProps<{
  visible: boolean
  inventory: InventoryItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'useItem', id: string): void
}>()

const close = () => emit('close')
const useItem = (id: string) => emit('useItem', id)
</script>

<style scoped>
.inventory-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid #66bb6a;
  border-radius: 12px;
  padding: 16px;
  min-width: 300px;
  max-width: 500px;
  color: white;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #37474f;
}

.close-btn {
  cursor: pointer;
  color: #ef5350;
  font-size: 16px;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.inventory-item {
  background: #37474f;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.inventory-item:hover {
  border-color: #81c784;
  transform: scale(1.05);
}

.item-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.item-name {
  font-size: 11px;
  color: #b0bec5;
}

.item-quantity {
  font-size: 12px;
  color: #4fc3f7;
  font-weight: bold;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #78909c;
}

.inventory-hint {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #37474f;
  text-align: center;
  font-size: 12px;
  color: #78909c;
}
</style>
