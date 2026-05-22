import type { SceneConfig } from '@/types';

export const COLORS = {
  background: '#0A1628',
  primary: '#1890FF',
  primaryLight: '#40A9FF',
  primaryDark: '#096DD9',
  success: '#52C41A',
  warning: '#FAAD14',
  danger: '#FF4D4F',
  info: '#13C2C2',
  purple: '#722ED1',
  white: '#FFFFFF',
  gray100: '#F0F2F5',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  glass: 'rgba(10, 22, 40, 0.75)',
  glassLight: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(24, 144, 255, 0.3)',
  glow: 'rgba(24, 144, 255, 0.6)',
} as const;

export const SCENE_CONFIG: SceneConfig = {
  warehouseWidth: 120,
  warehouseDepth: 80,
  warehouseHeight: 24,
  floorCount: 3,
  floorHeight: 8,
  shelfWidth: 2.5,
  shelfDepth: 12,
  shelfHeight: 6,
  shelfGap: 1.5,
  rowGap: 4,
  levels: 4,
  slotsPerLevel: 12,
};

export const ALARM_CONFIG = {
  temperature: {
    warning: 28,
    alarm: 35,
    unit: '°C',
  },
  humidity: {
    warning: 75,
    alarm: 85,
    unit: '%',
  },
  capacity: {
    warning: 85,
    alarm: 95,
    unit: '%',
  },
  congestion: {
    warning: 70,
    alarm: 90,
    unit: '%',
  },
} as const;

export const DATA_REFRESH_INTERVAL = 3000;
export const ANIMATION_DURATION = 500;
export const LABEL_VISIBLE_DISTANCE = 50;
export const CAMERA_PRESETS = {
  perspective: {
    position: { x: 80, y: 60, z: 80 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  top: {
    position: { x: 0, y: 100, z: 0.1 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  front: {
    position: { x: 0, y: 30, z: 100 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  side: {
    position: { x: 100, y: 30, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
};

export const FLOOR_NAMES = ['一层', '二层', '三层'];
