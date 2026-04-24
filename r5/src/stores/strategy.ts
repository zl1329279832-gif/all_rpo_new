import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StrategyType, StrategyCard, PortfolioState, TradeRecord, BacktestState } from '@/types';
import { strategyCards, marketData, initialCapital } from '@/mock';
import { generateSignal, executeTrade, calculatePortfolioState } from '@/utils/backtest';

export const useStrategyStore = defineStore('strategy', () => {
  const selectedStrategy = ref<StrategyType>('trend');
  const marketDataRef = ref(marketData);
  
  const portfolio = ref<PortfolioState>({
    cash: initialCapital,
    position: 0,
    totalValue: initialCapital,
    dailyReturn: 0,
    totalReturn: 0,
    maxDrawdown: 0,
    winRate: 0,
    totalTrades: 0,
    winTrades: 0
  });
  
  const backtest = ref<BacktestState>({
    isRunning: false,
    isPaused: false,
    currentIndex: 0,
    speed: 100,
    history: [],
    trades: []
  });
  
  const buyPriceRef = ref<number | null>(null);
  
  const strategies = computed<StrategyCard[]>(() => strategyCards);
  
  const currentStrategy = computed<StrategyCard | undefined>(() => 
    strategyCards.find(s => s.id === selectedStrategy.value)
  );
  
  const isBacktestComplete = computed(() => 
    backtest.value.currentIndex >= marketDataRef.value.length
  );
  
  function selectStrategy(strategyId: StrategyType) {
    selectedStrategy.value = strategyId;
    resetBacktest();
  }
  
  function resetBacktest() {
    portfolio.value = {
      cash: initialCapital,
      position: 0,
      totalValue: initialCapital,
      dailyReturn: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      winRate: 0,
      totalTrades: 0,
      winTrades: 0
    };
    backtest.value = {
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      speed: 100,
      history: [],
      trades: []
    };
    buyPriceRef.value = null;
  }
  
  function setSpeed(speed: number) {
    backtest.value.speed = speed;
  }
  
  function stepForward(): boolean {
    if (backtest.value.currentIndex >= marketDataRef.value.length) {
      backtest.value.isRunning = false;
      return false;
    }
    
    const index = backtest.value.currentIndex;
    const data = marketDataRef.value[index];
    
    const signal = generateSignal(selectedStrategy.value, marketDataRef.value, index, portfolio.value.position);
    
    let newCash = portfolio.value.cash;
    let newPosition = portfolio.value.position;
    let newTrade: TradeRecord | null = null;
    let newWinTrades = portfolio.value.winTrades;
    let newTotalTrades = portfolio.value.totalTrades;
    
    if (signal !== 'hold') {
      const result = executeTrade(
        signal,
        data.close,
        newCash,
        newPosition,
        data.date,
        selectedStrategy.value
      );
      newCash = result.newCash;
      newPosition = result.newPosition;
      newTrade = result.trade;
      
      if (newTrade) {
        backtest.value.trades.push(newTrade);
        newTotalTrades++;
        
        if (newTrade.type === 'buy') {
          buyPriceRef.value = newTrade.price;
        } else if (newTrade.type === 'sell' && buyPriceRef.value !== null) {
          if (newTrade.price > buyPriceRef.value) {
            newWinTrades++;
          }
          buyPriceRef.value = null;
        }
      }
    }
    
    const newPortfolio = calculatePortfolioState(
      newCash,
      newPosition,
      data.close,
      backtest.value.history,
      newWinTrades,
      newTotalTrades,
      newTrade
    );
    
    portfolio.value = newPortfolio;
    backtest.value.history.push(newPortfolio);
    backtest.value.currentIndex++;
    
    return true;
  }
  
  let intervalId: number | null = null;
  
  function startBacktest() {
    if (backtest.value.isRunning) return;
    
    backtest.value.isRunning = true;
    backtest.value.isPaused = false;
    
    intervalId = window.setInterval(() => {
      if (!backtest.value.isPaused) {
        const hasMore = stepForward();
        if (!hasMore) {
          stopBacktest();
        }
      }
    }, backtest.value.speed);
  }
  
  function pauseBacktest() {
    backtest.value.isPaused = !backtest.value.isPaused;
  }
  
  function stopBacktest() {
    backtest.value.isRunning = false;
    backtest.value.isPaused = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
  
  function fastForward() {
    stopBacktest();
    while (stepForward()) {}
  }
  
  return {
    selectedStrategy,
    marketData: marketDataRef,
    portfolio,
    backtest,
    strategies,
    currentStrategy,
    isBacktestComplete,
    selectStrategy,
    resetBacktest,
    setSpeed,
    startBacktest,
    pauseBacktest,
    stopBacktest,
    fastForward,
    stepForward
  };
});
