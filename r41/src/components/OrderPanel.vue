<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { getCargoTypeName, getCargoTypeColor } from '@/systems/orderSystem'

const gameStore = useGameStore()

const pendingOrders = computed(() => 
  gameStore.orders.filter(o => o.status === 'pending' || o.status === 'in_progress')
)

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getTimeRemaining = (deadline: number): number => {
  return Math.max(0, deadline - gameStore.gameTime)
}

const getUrgencyColor = (deadline: number): string => {
  const remaining = getTimeRemaining(deadline)
  if (remaining < 30) return 'urgent'
  if (remaining < 60) return 'warning'
  return 'normal'
}

const acceptOrder = (orderId: string) => {
  const order = gameStore.orders.find(o => o.id === orderId)
  if (order && order.status === 'pending') {
    order.status = 'in_progress'
  }
}

const completeOrder = (orderId: string) => {
  gameStore.completeOrder(orderId)
}

const getCargoBadgeStyle = (type: string) => {
  return {
    background: getCargoTypeColor(type as any) + '30',
    borderColor: getCargoTypeColor(type as any)
  }
}
</script>

<template>
  <div class="order-panel">
    <div class="panel-header">
      <h3>📋 订单列表</h3>
      <span class="order-count">{{ pendingOrders.length }} 个待处理</span>
    </div>
    
    <div class="orders-list">
      <div v-if="pendingOrders.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <span>暂无订单</span>
      </div>
      
      <div 
        v-for="order in pendingOrders" 
        :key="order.id"
        class="order-card"
        :class="[getUrgencyColor(order.deadline), { accepted: order.status === 'in_progress' }]"
      >
        <div class="order-header">
          <div class="cargo-type" :style="getCargoBadgeStyle(order.cargo.type)">
            {{ getCargoTypeName(order.cargo.type) }}
          </div>
          <div class="order-time" :class="getUrgencyColor(order.deadline)">
            ⏱️ {{ formatTime(getTimeRemaining(order.deadline)) }}
          </div>
        </div>
        
        <div class="order-info">
          <div class="info-row">
            <span class="label">目的地</span>
            <span class="value">{{ order.cargo.destination }}</span>
          </div>
          <div class="info-row">
            <span class="label">规格</span>
            <span class="value">{{ order.cargo.size }}尺 / {{ order.cargo.weight }}吨</span>
          </div>
        </div>
        
        <div class="order-reward">
          <div class="reward">
            <span class="label">奖励</span>
            <span class="value positive">+¥{{ order.reward }}</span>
          </div>
          <div class="penalty">
            <span class="label">超时</span>
            <span class="value negative">-¥{{ order.penalty }}</span>
          </div>
        </div>
        
        <div class="order-actions">
          <button 
            v-if="order.status === 'pending'"
            class="btn btn-primary btn-sm"
            @click="acceptOrder(order.id)"
          >
            接受订单
          </button>
          <button 
            v-else
            class="btn btn-success btn-sm"
            @click="completeOrder(order.id)"
          >
            ✓ 完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-panel {
  width: 300px;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 16px;
  color: #f1f5f9;
  margin: 0;
}

.order-count {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 10px;
  border-radius: 12px;
}

.orders-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748b;
  gap: 8px;
}

.empty-icon {
  font-size: 32px;
}

.order-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.order-card.urgent {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.order-card.warning {
  border-color: rgba(250, 204, 21, 0.5);
}

.order-card.accepted {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.cargo-type {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid;
}

.order-time {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.order-time.urgent { color: #f87171; }
.order-time.warning { color: #facc15; }
.order-time.normal { color: #4ade80; }

.order-info {
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 3px 0;
}

.info-row .label {
  color: #64748b;
}

.info-row .value {
  color: #e2e8f0;
  font-weight: 500;
}

.order-reward {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.reward, .penalty {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reward .label, .penalty .label {
  font-size: 10px;
  color: #64748b;
}

.reward .value {
  font-weight: 600;
  font-size: 14px;
}

.value.positive { color: #4ade80; }
.value.negative { color: #f87171; }

.order-actions {
  display: flex;
}

.btn-sm {
  width: 100%;
  padding: 8px;
  font-size: 13px;
}

.btn-success {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}
</style>
