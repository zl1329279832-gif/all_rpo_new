import type { StrategyCard, MarketData, RankItem, StrategyType } from '@/types';

export const strategyCards: StrategyCard[] = [
  {
    id: 'trend',
    name: '趋势追踪者',
    description: '追随市场趋势，顺势而为，在上升趋势中持有，下跌趋势中离场',
    icon: '📈',
    color: '#409EFF',
    riskLevel: 'medium',
    rules: [
      '价格突破20日均线买入',
      '价格跌破20日均线卖出',
      '止损点设置为亏损5%',
      '止盈点设置为盈利15%'
    ]
  },
  {
    id: 'meanReversion',
    name: '均值回归者',
    description: '相信价格会回归均值，在超卖时买入，超买时卖出',
    icon: '⚖️',
    color: '#67C23A',
    riskLevel: 'low',
    rules: [
      'RSI < 30 时买入（超卖）',
      'RSI > 70 时卖出（超买）',
      '基于布林带上下轨交易',
      '单笔交易不超过总资金20%'
    ]
  },
  {
    id: 'breakout',
    name: '突破猎手',
    description: '捕捉价格突破关键阻力位的机会，追求高爆发收益',
    icon: '🎯',
    color: '#E6A23C',
    riskLevel: 'high',
    rules: [
      '价格突破前N日高点买入',
      '价格跌破前N日低点卖出',
      '成交量放大确认突破',
      '快速止损保护本金'
    ]
  },
  {
    id: 'defensive',
    name: '防守型资金管理者',
    description: '稳健保守，注重资金安全，追求稳定复利增长',
    icon: '🛡️',
    color: '#909399',
    riskLevel: 'low',
    rules: [
      '单笔交易亏损不超过总资金2%',
      '最大持仓不超过总资金50%',
      '分散投资降低风险',
      '优先考虑本金安全'
    ]
  }
];

export function generateMarketData(days: number = 365): MarketData[] {
  const data: MarketData[] = [];
  let price = 100;
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const volatility = 0.02;
    const trend = Math.sin(i / 30) * 0.001;
    const change = (Math.random() - 0.5) * volatility + trend;
    
    const open = price;
    price = price * (1 + change);
    const high = Math.max(open, price) * (1 + Math.random() * volatility);
    const low = Math.min(open, price) * (1 - Math.random() * volatility);
    const close = price;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: close,
      volume,
      high,
      low,
      open,
      close
    });
  }
  
  return data;
}

export const marketData = generateMarketData(365);

export const rankList: RankItem[] = [
  {
    id: '1',
    strategyName: '王者趋势策略',
    strategyType: 'trend',
    totalReturn: 89.5,
    maxDrawdown: 12.3,
    winRate: 62.5,
    trades: 48,
    avatar: '👑'
  },
  {
    id: '2',
    strategyName: '均值回归大师',
    strategyType: 'meanReversion',
    totalReturn: 67.2,
    maxDrawdown: 8.5,
    winRate: 71.3,
    trades: 56,
    avatar: '🥈'
  },
  {
    id: '3',
    strategyName: '突破猎人',
    strategyType: 'breakout',
    totalReturn: 55.8,
    maxDrawdown: 18.2,
    winRate: 54.8,
    trades: 62,
    avatar: '🥉'
  },
  {
    id: '4',
    strategyName: '稳健守护者',
    strategyType: 'defensive',
    totalReturn: 42.1,
    maxDrawdown: 5.6,
    winRate: 68.9,
    trades: 38,
    avatar: '🎖️'
  },
  {
    id: '5',
    strategyName: '趋势追踪新手',
    strategyType: 'trend',
    totalReturn: 38.5,
    maxDrawdown: 14.7,
    winRate: 58.2,
    trades: 42,
    avatar: '⭐'
  }
];

export const initialCapital = 100000;
export const feeRate = 0.001;
