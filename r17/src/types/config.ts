import { EnergyLevel, RiskLevel } from './building';

export const ENERGY_LEVEL_LABELS: Record<EnergyLevel, string> = {
  [EnergyLevel.LOW]: '低能耗',
  [EnergyLevel.MEDIUM]: '中能耗',
  [EnergyLevel.HIGH]: '高能耗',
  [EnergyLevel.CRITICAL]: '警告'
};

export const ENERGY_LEVEL_COLORS: Record<EnergyLevel, string> = {
  [EnergyLevel.LOW]: '#10b981',
  [EnergyLevel.MEDIUM]: '#3b82f6',
  [EnergyLevel.HIGH]: '#f59e0b',
  [EnergyLevel.CRITICAL]: '#ef4444'
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '严重'
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '#10b981',
  [RiskLevel.MEDIUM]: '#3b82f6',
  [RiskLevel.HIGH]: '#f59e0b',
  [RiskLevel.CRITICAL]: '#ef4444'
};

export const ANIMATION_CONFIG = {
  cameraTransitionDuration: 1000,
  highlightPulseSpeed: 0.003,
  hoverScale: 1.05,
  selectionOutlineWidth: 0.1
} as const;

export const TIME_RANGES = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '全年', value: 'year' }
] as const;
