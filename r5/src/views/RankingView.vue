<template>
  <div class="ranking-view">
    <div class="page-header">
      <h1>策略排行榜</h1>
      <p>看看哪个策略表现最好！</p>
    </div>
    
    <div class="top-three">
      <div v-for="(item, index) in topThree" :key="item.id" class="top-item" :class="'rank-' + (index + 1)">
        <div class="rank-badge">
          <span class="rank-number">{{ index + 1 }}</span>
          <span class="rank-icon">{{ item.avatar }}</span>
        </div>
        <div class="top-card">
          <div class="strategy-name">{{ item.strategyName }}</div>
          <div class="strategy-type">
            <el-tag :color="getStrategyColor(item.strategyType)" effect="dark" size="small">
              {{ getStrategyName(item.strategyType) }}
            </el-tag>
          </div>
          <div class="main-stat">
            <span class="stat-value">{{ item.totalReturn.toFixed(2) }}%</span>
            <span class="stat-label">总收益率</span>
          </div>
        </div>
      </div>
    </div>
    
    <el-card class="ranking-card">
      <template #header>
        <div class="card-header">
          <span>完整排行榜</span>
        </div>
      </template>
      <el-table :data="rankList" style="width: 100%">
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <span v-if="$index < 3" class="top-rank">{{ $index + 1 }}</span>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="策略" width="180">
          <template #default="{ row }">
            <div class="strategy-info">
              <span class="strategy-avatar">{{ row.avatar }}</span>
              <span class="strategy-name">{{ row.strategyName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-tag :color="getStrategyColor(row.strategyType)" effect="dark" size="small">
              {{ getStrategyName(row.strategyType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总收益率" width="140">
          <template #default="{ row }">
            <span class="return-value" :style="{ color: row.totalReturn >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.totalReturn >= 0 ? '+' : '' }}{{ row.totalReturn.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最大回撤" width="120">
          <template #default="{ row }">
            <span>{{ row.maxDrawdown.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="胜率" width="120">
          <template #default="{ row }">
            <span>{{ row.winRate.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="交易次数" width="120">
          <template #default="{ row }">
            <span>{{ row.trades }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card class="tips-card">
      <template #header>
        <div class="card-header">
          <span class="tips-title">💡 策略选择建议</span>
        </div>
      </template>
      <div class="tips-content">
        <el-row :gutter="24">
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">📈</div>
              <div class="tip-title">趋势追踪</div>
              <div class="tip-desc">适合趋势明显的市场，追涨杀跌，及时止盈止损</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">⚖️</div>
              <div class="tip-title">均值回归</div>
              <div class="tip-desc">适合震荡市场，低买高卖，赚取波动收益</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">🎯</div>
              <div class="tip-title">突破猎手</div>
              <div class="tip-desc">适合捕捉突破行情，高风险高收益</div>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="24" style="margin-top: 20px;">
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">🛡️</div>
              <div class="tip-title">防守型</div>
              <div class="tip-desc">稳健保守，控制仓位，优先本金安全</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">📊</div>
              <div class="tip-title">综合评估</div>
              <div class="tip-desc">不要只看收益率，还要关注回撤和胜率</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="tip-item">
              <div class="tip-icon">🔄</div>
              <div class="tip-title">持续优化</div>
              <div class="tip-desc">回测不是终点，实盘才是真正的考验</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { rankList } from '@/mock';
import type { StrategyType } from '@/types';

const topThree = computed(() => rankList.slice(0, 3));

function getStrategyName(type: StrategyType): string {
  const map: Record<StrategyType, string> = {
    trend: '趋势追踪',
    meanReversion: '均值回归',
    breakout: '突破猎手',
    defensive: '防守型'
  };
  return map[type] || '未知';
}

function getStrategyColor(type: StrategyType): string {
  const map: Record<StrategyType, string> = {
    trend: '#409EFF',
    meanReversion: '#67C23A',
    breakout: '#E6A23C',
    defensive: '#909399'
  };
  return map[type] || '#909399';
}
</script>

<style scoped>
.ranking-view {
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

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 30px;
  margin-bottom: 40px;
  padding: 20px 0;
}

.top-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-item.rank-1 {
  order: 2;
}

.top-item.rank-2 {
  order: 1;
}

.top-item.rank-3 {
  order: 3;
}

.rank-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.rank-number {
  font-size: 48px;
  font-weight: bold;
  color: #c0c4cc;
  margin-bottom: 5px;
}

.top-item.rank-1 .rank-number {
  font-size: 64px;
  color: #ffd700;
}

.top-item.rank-2 .rank-number {
  color: #c0c4cc;
}

.top-item.rank-3 .rank-number {
  color: #cd7f32;
}

.rank-icon {
  font-size: 32px;
}

.top-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  border-top: 4px solid;
}

.top-item.rank-1 .top-card {
  border-color: #ffd700;
  transform: scale(1.1);
}

.top-item.rank-2 .top-card {
  border-color: #c0c4cc;
}

.top-item.rank-3 .top-card {
  border-color: #cd7f32;
}

.top-card .strategy-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.top-card .strategy-type {
  margin-bottom: 16px;
}

.main-stat {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.main-stat .stat-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 4px;
}

.main-stat .stat-label {
  font-size: 14px;
  color: #909399;
}

.ranking-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.top-rank {
  font-weight: bold;
  font-size: 18px;
}

.strategy-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strategy-avatar {
  font-size: 24px;
}

.strategy-name {
  color: #303133;
  font-weight: 500;
}

.return-value {
  font-weight: bold;
}

.tips-card {
  margin-bottom: 24px;
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
}

.tips-content {
  padding: 10px 0;
}

.tip-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tip-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tip-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
