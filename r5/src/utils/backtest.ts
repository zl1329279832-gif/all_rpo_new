import type { MarketData, PortfolioState, TradeRecord, StrategyType } from '@/types';
import { initialCapital, feeRate } from '@/mock';

function calculateMA(data: MarketData[], period: number, index: number): number {
  if (index < period - 1) return 0;
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[index - i].close;
  }
  return sum / period;
}

function calculateRSI(data: MarketData[], period: number, index: number): number {
  if (index < period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[index - i + 1].close - data[index - i].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(data: MarketData[], period: number, index: number): { upper: number; middle: number; lower: number } {
  const middle = calculateMA(data, period, index);
  if (index < period - 1) return { upper: 0, middle: 0, lower: 0 };
  
  let sumSq = 0;
  for (let i = 0; i < period; i++) {
    sumSq += Math.pow(data[index - i].close - middle, 2);
  }
  const stdDev = Math.sqrt(sumSq / period);
  
  return {
    upper: middle + stdDev * 2,
    middle,
    lower: middle - stdDev * 2
  };
}

function calculateHighestHigh(data: MarketData[], period: number, index: number): number {
  if (index < period - 1) return 0;
  let high = 0;
  for (let i = 0; i < period; i++) {
    high = Math.max(high, data[index - i].high);
  }
  return high;
}

function calculateLowestLow(data: MarketData[], period: number, index: number): number {
  if (index < period - 1) return Infinity;
  let low = Infinity;
  for (let i = 0; i < period; i++) {
    low = Math.min(low, data[index - i].low);
  }
  return low;
}

export function generateSignal(
  strategyType: StrategyType,
  data: MarketData[],
  index: number,
  position: number
): 'buy' | 'sell' | 'hold' {
  if (index < 20) return 'hold';
  
  const currentPrice = data[index].close;
  
  switch (strategyType) {
    case 'trend': {
      const ma20 = calculateMA(data, 20, index);
      const ma10 = calculateMA(data, 10, index);
      if (position === 0 && currentPrice > ma20 && ma10 > ma20) {
        return 'buy';
      }
      if (position > 0 && currentPrice < ma20) {
        return 'sell';
      }
      return 'hold';
    }
    
    case 'meanReversion': {
      const rsi = calculateRSI(data, 14, index);
      const bb = calculateBollingerBands(data, 20, index);
      if (position === 0 && (rsi < 30 || currentPrice < bb.lower)) {
        return 'buy';
      }
      if (position > 0 && (rsi > 70 || currentPrice > bb.upper)) {
        return 'sell';
      }
      return 'hold';
    }
    
    case 'breakout': {
      const highestHigh = calculateHighestHigh(data, 20, index - 1);
      const lowestLow = calculateLowestLow(data, 20, index - 1);
      if (position === 0 && currentPrice > highestHigh && highestHigh > 0) {
        return 'buy';
      }
      if (position > 0 && currentPrice < lowestLow && lowestLow < Infinity) {
        return 'sell';
      }
      return 'hold';
    }
    
    case 'defensive': {
      const ma30 = calculateMA(data, 30, index);
      const ma10 = calculateMA(data, 10, index);
      if (position === 0 && currentPrice > ma30 && ma10 > ma30) {
        return 'buy';
      }
      if (position > 0 && currentPrice < ma30 * 0.95) {
        return 'sell';
      }
      return 'hold';
    }
    
    default:
      return 'hold';
  }
}

export function executeTrade(
  type: 'buy' | 'sell',
  price: number,
  cash: number,
  position: number,
  date: string,
  strategyType: StrategyType
): { newCash: number; newPosition: number; trade: TradeRecord | null } {
  if (type === 'buy' && cash > 0) {
    let amount = 0;
    if (strategyType === 'defensive') {
      amount = Math.floor((cash * 0.3) / price / 100) * 100;
    } else {
      amount = Math.floor((cash * 0.5) / price / 100) * 100;
    }
    if (amount < 100) amount = Math.floor(cash / price / 100) * 100;
    if (amount < 100) return { newCash: cash, newPosition: position, trade: null };
    
    const fee = amount * price * feeRate;
    const total = amount * price + fee;
    
    return {
      newCash: cash - total,
      newPosition: position + amount,
      trade: {
        id: Date.now().toString(),
        date,
        type: 'buy',
        price,
        amount,
        fee,
        total
      }
    };
  } else if (type === 'sell' && position > 0) {
    const amount = position;
    const fee = amount * price * feeRate;
    const total = amount * price - fee;
    
    return {
      newCash: cash + total,
      newPosition: 0,
      trade: {
        id: Date.now().toString(),
        date,
        type: 'sell',
        price,
        amount,
        fee,
        total
      }
    };
  }
  
  return { newCash: cash, newPosition: position, trade: null };
}

export function calculatePortfolioState(
  cash: number,
  position: number,
  currentPrice: number,
  history: PortfolioState[],
  winTrades: number,
  totalTrades: number,
  lastTrade: TradeRecord | null
): PortfolioState {
  const stockValue = position * currentPrice;
  const totalValue = cash + stockValue;
  const totalReturn = ((totalValue - initialCapital) / initialCapital) * 100;
  
  let dailyReturn = 0;
  if (history.length > 0) {
    const prevValue = history[history.length - 1].totalValue;
    dailyReturn = ((totalValue - prevValue) / prevValue) * 100;
  }
  
  let maxDrawdown = 0;
  let peakValue = initialCapital;
  for (const state of history) {
    if (state.totalValue > peakValue) {
      peakValue = state.totalValue;
    }
    const drawdown = ((peakValue - state.totalValue) / peakValue) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  const currentDrawdown = ((peakValue - totalValue) / peakValue) * 100;
  maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
  
  let winRate = 0;
  if (totalTrades > 0) {
    winRate = (winTrades / totalTrades) * 100;
  }
  
  return {
    cash,
    position,
    totalValue,
    dailyReturn,
    totalReturn,
    maxDrawdown,
    winRate,
    totalTrades,
    winTrades
  };
}
