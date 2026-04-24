<template>
  <div class="backtest-view">
    <div class="page-header">
      <h1>回测执行</h1>
      <p>当前策略：{{ currentStrategy?.name || '未选择' }}</p>
    </div>
    
    <el-card class="control-panel">
      <div class="control-row">
        <div class="control-group">
          <el-button
            type="primary"
            size="large"
            @click="handleStart"
            :disabled="isBacktestComplete"
          >
            <el-icon><VideoPlay /></el-icon>
            {{ backtest.isRunning ? (backtest.isPaused ? '继续' : '暂停') : '开始' }}
          </el-button>
          <el-button
            size="large"
            @click="handleStop"
            :disabled="!backtest.isRunning && backtest.currentIndex === 0"
          >
            <el-icon><VideoPause /></el-icon>
            重置
          </el-button>
          <el-button
            size="large"
            @click="handleFastForward"
            :disabled="isBacktestComplete"
          >
            <el-icon><Right /></el-icon>
            快进结束
          </el-button>
        </div>
        
        <div class="speed-control">
          <span class="speed-label">回测速度：</span>
          <el-slider
            v-model="speedValue"
            :min="10"
            :max="500"
            :step="10"
            :marks="{ 10: '快', 250: '中', 500: '慢' }"
            @change="handleSpeedChange"
            style="width: 200px;"
          />
        </div>
        
        <div class="progress-info">
          <span class="progress-text">
            进度：{{ backtest.currentIndex }} / {{ marketData.length }}
          </span>
          <el-progress
            :percentage="progressPercentage"
            :stroke-width="10"
            style="width: 200px;"
          />
        </div>
      </div>
    </el-card>
    
    <div class="stats-row">
      <StatCard
        label="总资产"
        :value="portfolio.totalValue.toFixed(2)"
        unit="元"
        icon="💰"
        color="#409EFF"
      />
      <StatCard
        label="总收益率"
        :value="portfolio.totalReturn.toFixed(2)"
        unit="%"
        icon="📈"
        :color="portfolio.totalReturn >= 0 ? '#67C23A' : '#F56C6C'"
      />
      <StatCard
        label="最大回撤"
        :value="portfolio.maxDrawdown.toFixed(2)"
        unit="%"
        icon="📉"
        color="#E6A23C"
      />
      <StatCard
        label="胜率"
        :value="portfolio.winRate.toFixed(2)"
        unit="%"
        icon="🎯"
        color="#909399"
      />
      <StatCard
        label="持仓"
        :value="portfolio.position"
        icon="📦"
        color="#667EEA"
      />
      <StatCard
        label="交易次数"
        :value="portfolio.totalTrades"
        icon="💱"
        color="#764BA2"
      />
    </div>
    
    <el-row :gutter="24">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>收益曲线</span>
            </div>
          </template>
          <v-chart :option="returnChartOption" autoresize style="height: 400px;" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="portfolio-card">
          <template #header>
            <div class="card-header">
              <span>当前持仓</span>
            </div>
          </template>
          <div class="portfolio-info">
            <div class="info-item">
              <span class="info-label">可用资金</span>
              <span class="info-value">¥{{ portfolio.cash.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">持仓数量</span>
              <span class="info-value">{{ portfolio.position }} 股</span>
            </div>
            <div class="info-item">
              <span class="info-label">持仓市值</span>
              <span class="info-value">¥{{ (portfolio.position * currentPrice).toFixed(2) }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <span class="info-label">总资产</span>
              <span class="info-value highlight">¥{{ portfolio.totalValue.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">今日收益</span>
              <span class="info-value" :style="{ color: portfolio.dailyReturn >= 0 ? '#67c23a' : '#f56c6c' }">
                {{ portfolio.dailyReturn >= 0 ? '+' : '' }}{{ portfolio.dailyReturn.toFixed(2) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="trades-card">
      <template #header>
        <div class="card-header">
          <span>交易明细</span>
          <el-tag type="info">共 {{ trades.length }} 笔</el-tag>
        </div>
      </template>
      <el-table :data="trades" stripe style="width: 100%" max-height="350">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="方向" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'buy' ? 'success' : 'danger'" effect="dark">
              {{ row.type === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            {{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="手续费" width="100">
          <template #default="{ row }">
            ¥{{ row.fee.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="金额">
          <template #default="{ row }">
            ¥{{ row.total.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import type { EChartsOption } from 'echarts';
import { useStrategyStore } from '@/stores/strategy';
import StatCard from '@/components/StatCard.vue';
import { initialCapital } from '@/mock';

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
]);

const router = useRouter();
const strategyStore = useStrategyStore();

const currentStrategy = strategyStore.currentStrategy;
const marketData = strategyStore.marketData;
const portfolio = strategyStore.portfolio;
const backtest = strategyStore.backtest;
const trades = computed(() => [...backtest.trades].reverse());
const isBacktestComplete = strategyStore.isBacktestComplete;

const speedValue = ref(100);

const progressPercentage = computed(() => {
  if (marketData.length === 0) return 0;
  return Math.round((backtest.currentIndex / marketData.length) * 100);
});

const currentPrice = computed(() => {
  if (backtest.currentIndex === 0) return marketData[0]?.close || 0;
  return marketData[backtest.currentIndex - 1]?.close || 0;
});

const returnChartOption = computed<EChartsOption>(() => {
  const dates = marketData.slice(0, backtest.currentIndex).map(item => item.date);
  const returns = backtest.history.map(item => item.totalReturn);
  const benchmarkReturns = backtest.history.map((item, index) => {
    if (index === 0) return 0;
    const priceChange = (marketData[index].close - marketData[0].close) / marketData[0].close * 100;
    return priceChange;
  });
  
  return {
    title: {
      text: '策略收益 vs 基准收益',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['策略收益', '基准收益'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '策略收益',
        type: 'line',
        smooth: true,
        data: returns,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '基准收益',
        type: 'line',
        smooth: true,
        data: benchmarkReturns,
        itemStyle: {
          color: '#909399'
        },
        lineStyle: {
          type: 'dashed'
        }
      }
    ]
  };
});

function handleStart() {
  if (backtest.isRunning) {
    strategyStore.pauseBacktest();
  } else {
    strategyStore.startBacktest();
  }
}

function handleStop() {
  strategyStore.stopBacktest();
  strategyStore.resetBacktest();
}

function handleFastForward() {
  strategyStore.fastForward();
}

function handleSpeedChange(val: number) {
  strategyStore.setSpeed(val);
}

onUnmounted(() => {
  strategyStore.stopBacktest();
});
</script>

<style scoped>
.backtest-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 16px;
  color: #909399;
}

.control-panel {
  margin-bottom: 20px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.control-group {
  display: flex;
  gap: 12px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speed-label {
  color: #606266;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-text {
  color: #606266;
  font-size: 14px;
  text-align: right;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card,
.portfolio-card,
.trades-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.portfolio-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-of-type {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.info-value.highlight {
  color: #409eff;
  font-size: 20px;
}

.info-divider {
  height: 1px;
  background: #ebeef5;
  margin: 12px 0;
}
</style>
