export type StrategyType = 'trend' | 'meanReversion' | 'breakout' | 'defensive';

export interface StrategyCard {
  id: StrategyType;
  name: string;
  description: string;
  icon: string;
  color: string;
  riskLevel: 'low' | 'medium' | 'high';
  rules: string[];
}

export interface MarketData {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface TradeRecord {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  fee: number;
  total: number;
}

export interface PortfolioState {
  cash: number;
  position: number;
  totalValue: number;
  dailyReturn: number;
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winTrades: number;
}

export interface BacktestState {
  isRunning: boolean;
  isPaused: boolean;
  currentIndex: number;
  speed: number;
  history: PortfolioState[];
  trades: TradeRecord[];
}

export interface RankItem {
  id: string;
  strategyName: string;
  strategyType: StrategyType;
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  avatar: string;
}
