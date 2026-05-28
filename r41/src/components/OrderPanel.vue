<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { getCargoTypeName, getCargoTypeColor, getStatusName } from '@/systems/orderSystem'

const gameStore = useGameStore()

const activeOrders = computed(() => 
  gameStore.orders.filter(o => o.status !== 'completed' && o.status !== 'failed')
    .sort((a, b) => a.deadline - b.deadline)
)

const completedOrders = computed(() =>
  gameStore.orders.filter(o => o.status === 'completed')
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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#94a3b8'
    case 'in_progress': return '#f59e0b'
    case 'completed': return '#10b981'
    case 'failed': return '#ef4444'
    default: return '#94a3b8'
  }
}

const getCargoBadgeStyle = (type: string) => {
  return {
    background: getCargoTypeColor(type as any) + '30',
    borderColor: getCargoTypeColor(type as any)
  }
}

const getContainerStatus = (order: any): string => {
  const container = gameStore.containers.find(c => c.id === order.containerId)
  if (container) {
    return getStatusName(container.status)
  }
  return '等待处理'
}
</script>

<template>
  <div class="order-panel">
    <div class="panel-header">
      <h3>📋 订单列表</h3>
      <span class="order-count">{{ activeOrders.length }} 个待处理</span>
    </div>
    
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-icon">✅</span>
        <span>{{ completedOrders.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">📦</span>
        <span>{{ gameStore.stats.containersUnloaded }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🚚</span>
        <span>{{ gameStore.idleTrucks.length }}/{{ gameStore.trucks.length }}</span>
      </div>
    </div>
    
    <div class="orders-list">
      <div v-if="activeOrders.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <span>等待货轮到达...</span>
      </div>
      
      <div 
        v-for="order in activeOrders" 
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
            <span class="value">{{ order.cargo.size }}尺</span>
          </div>
          <div class="info-row">
            <span class="label">状态</span>
            <span class="value" :style="{ color: getStatusColor(order.status) }">
              {{ getContainerStatus(order) }}
            </span>
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
        
        <div class="progress-indicator" v-if="order.status === 'in_progress'">
          <div class="progress-steps">
            <div class="step completed">
              <span class="step-icon">🚢</span>
              <span class="step-label">到港</span>
            </div>
            <div class="step-line completed"></div>
            <div class="step completed">
              <span class="step-icon">🏗️</span>
              <span class="step-label">卸货</span>
            </div>
            <div class="step-line completed"></div>
            <div class="step active">
              <span class="step-icon">🚚</span>
              <span class="step-label">运输</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <span class="step-icon">📦</span>
              <span class="step-label">入库</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="legend">
      <h4>堆场区域</h4>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color" style="background: #4b5563"></span>
          <span>普通区</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #0891b2"></span>
          <span>冷链区</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #dc2626"></span>
          <span>危险品区</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-panel {
  width: 320px;
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

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.stat-icon {
  font-size: 14px;
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
  margin-bottom: 12px;
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

.progress-indicator {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0.4;
}

.step.active {
  opacity: 1;
  animation: pulse 1.5s infinite;
}

.step.completed {
  opacity: 1;
}

.step-icon {
  font-size: 16px;
}

.step-label {
  font-size: 9px;
  color: #94a3b8;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 5px;
}

.step-line.completed {
  background: #10b981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.legend {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.legend h4 {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.legend-items {
  display: flex;
  justify-content: space-around;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
</style>
