<template>
  <div
    class="strategy-card"
    :class="{ 'is-selected': isSelected, 'is-hover': isHover }"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
    @click="handleClick"
  >
    <div class="card-header" :style="{ background: strategy.color }">
      <span class="card-icon">{{ strategy.icon }}</span>
      <span class="card-name">{{ strategy.name }}</span>
    </div>
    <div class="card-body">
      <p class="card-description">{{ strategy.description }}</p>
      <div class="risk-level">
        <span class="risk-label">风险等级：</span>
        <el-tag :type="riskTagType" size="small">
          {{ riskLabel }}
        </el-tag>
      </div>
      <div class="rules-list">
        <div class="rules-title">交易规则：</div>
        <ul>
          <li v-for="(rule, index) in strategy.rules" :key="index">
            <span class="rule-dot"></span>
            {{ rule }}
          </li>
        </ul>
      </div>
    </div>
    <div class="card-footer" v-if="isSelected">
      <el-tag type="success" effect="dark">
        <el-icon><Check /></el-icon>
        已选择
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StrategyCard } from '@/types';

interface Props {
  strategy: StrategyCard;
  isSelected: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', strategy: StrategyCard): void;
}>();

const isHover = ref(false);

const riskLabel = computed(() => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  };
  return map[props.strategy.riskLevel] || '中';
});

const riskTagType = computed(() => {
  const map: Record<string, any> = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  };
  return map[props.strategy.riskLevel] || 'warning';
});

function handleClick() {
  emit('select', props.strategy);
}
</script>

<style scoped>
.strategy-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.strategy-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.strategy-card.is-selected {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
}

.card-header {
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 32px;
}

.card-name {
  font-size: 18px;
  font-weight: bold;
}

.card-body {
  padding: 20px;
}

.card-description {
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.6;
}

.risk-level {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-label {
  color: #909399;
  font-size: 14px;
}

.rules-list {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.rules-title {
  color: #303133;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}

.rules-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  color: #606266;
  font-size: 13px;
  padding: 6px 0;
  padding-left: 18px;
  position: relative;
  line-height: 1.5;
}

.rule-dot {
  position: absolute;
  left: 0;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
}

.card-footer {
  padding: 12px 20px;
  background: #f0f9ff;
  text-align: center;
}
</style>
