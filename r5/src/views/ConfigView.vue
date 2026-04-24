<template>
  <div class="config-view">
    <div class="page-header">
      <h1>策略配置</h1>
      <p>选择你的策略角色，开始回测之旅！</p>
    </div>
    
    <div class="cards-container">
      <StrategyCard
        v-for="strategy in strategies"
        :key="strategy.id"
        :strategy="strategy"
        :is-selected="selectedStrategy === strategy.id"
        @select="handleSelect"
      />
    </div>
    
    <div class="action-bar" v-if="currentStrategy">
      <el-card class="selected-info">
        <template #header>
          <div class="card-header">
            <span>当前选择：{{ currentStrategy.name }}</span>
          </div>
        </template>
        <div class="info-content">
          <p><strong>策略类型：</strong>{{ currentStrategy.description }}</p>
          <p><strong>风险等级：</strong>
            <el-tag :type="riskTagType" size="small">
              {{ riskLabel }}
            </el-tag>
          </p>
        </div>
      </el-card>
      
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="goToBacktest">
          <el-icon><Right /></el-icon>
          开始回测
        </el-button>
        <el-button size="large" @click="goToMarket">
          <el-icon><DataLine /></el-icon>
          查看行情
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStrategyStore } from '@/stores/strategy';
import StrategyCard from '@/components/StrategyCard.vue';
import type { StrategyCard as StrategyCardType } from '@/types';

const router = useRouter();
const strategyStore = useStrategyStore();

const strategies = strategyStore.strategies;
const selectedStrategy = strategyStore.selectedStrategy;
const currentStrategy = strategyStore.currentStrategy;

const riskLabel = computed(() => {
  if (!currentStrategy.value) return '中';
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  };
  return map[currentStrategy.value.riskLevel] || '中';
});

const riskTagType = computed(() => {
  if (!currentStrategy.value) return 'warning';
  const map: Record<string, any> = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  };
  return map[currentStrategy.value.riskLevel] || 'warning';
});

function handleSelect(strategy: StrategyCardType) {
  strategyStore.selectStrategy(strategy.id);
}

function goToBacktest() {
  router.push('/backtest');
}

function goToMarket() {
  router.push('/market');
}
</script>

<style scoped>
.config-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 16px;
  color: #909399;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.action-bar {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.selected-info {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.info-content p {
  margin: 8px 0;
  color: #606266;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
