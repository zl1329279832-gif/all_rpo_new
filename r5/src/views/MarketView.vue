<template>
  <div class="market-view">
    <div class="page-header">
      <h1>历史行情数据</h1>
      <p>查看标的历史价格走势，为策略回测做准备</p>
    </div>
    
    <el-card class="chart-card">
      <v-chart :option="chartOption" autoresize style="height: 500px;" />
    </el-card>
    
    <el-card class="data-card">
      <template #header>
        <div class="card-header">
          <span>行情明细</span>
          <el-tag type="info">共 {{ marketData.length }} 条数据</el-tag>
        </div>
      </template>
      <el-table :data="marketData" stripe style="width: 100%" max-height="400">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="open" label="开盘" width="100">
          <template #default="{ row }">
            <span>{{ row.open.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="high" label="最高" width="100">
          <template #default="{ row }">
            <span style="color: #67c23a">{{ row.high.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="low" label="最低" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c">{{ row.low.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="close" label="收盘" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.close >= row.open ? '#67c23a' : '#f56c6c' }">
              {{ row.close.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="成交量" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CandlestickChart, LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import type { EChartsOption } from 'echarts';
import { useStrategyStore } from '@/stores/strategy';

use([
  CanvasRenderer,
  CandlestickChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
]);

const strategyStore = useStrategyStore();
const marketData = strategyStore.marketData;

const chartOption = computed<EChartsOption>(() => {
  const dates = marketData.map(item => item.date);
  const values = marketData.map(item => [item.open, item.close, item.low, item.high]);
  const volumes = marketData.map(item => item.volume);
  const closePrices = marketData.map(item => item.close);
  
  const calculateMA = (dayCount: number) => {
    const result = [];
    for (let i = 0; i < marketData.length; i++) {
      if (i < dayCount - 1) {
        result.push('-');
        continue;
      }
      let sum = 0;
      for (let j = 0; j < dayCount; j++) {
        sum += marketData[i - j].close;
      }
      result.push((sum / dayCount).toFixed(2));
    }
    return result;
  };
  
  return {
    title: {
      text: '标的价格走势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['K线', 'MA5', 'MA20', '成交量'],
      top: 30
    },
    grid: [
      {
        left: '10%',
        right: '8%',
        top: 80,
        height: '50%'
      },
      {
        left: '10%',
        right: '8%',
        top: '70%',
        height: '15%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false }
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 0,
        end: 100
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        bottom: 10,
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: '#ec0000',
          color0: '#00da3c',
          borderColor: '#8a0000',
          borderColor0: '#008f28'
        }
      },
      {
        name: 'MA5',
        type: 'line',
        data: calculateMA(5),
        smooth: true,
        lineStyle: {
          opacity: 0.5
        }
      },
      {
        name: 'MA20',
        type: 'line',
        data: calculateMA(20),
        smooth: true,
        lineStyle: {
          opacity: 0.5
        }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: (params: any) => {
            const dataIndex = params.dataIndex;
            return marketData[dataIndex].close >= marketData[dataIndex].open
              ? '#ec0000'
              : '#00da3c';
          }
        }
      }
    ]
  };
});
</script>

<style scoped>
.market-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 16px;
  color: #909399;
}

.chart-card {
  margin-bottom: 24px;
}

.data-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
