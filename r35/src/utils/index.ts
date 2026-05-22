import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function formatPercent(num: number, decimals: number = 1): string {
  return `${(num * 100).toFixed(decimals)}%`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'normal':
    case 'success':
    case 'available':
    case 'idle':
      return '#52C41A';
    case 'warning':
    case 'reserved':
    case 'working':
      return '#FAAD14';
    case 'alarm':
    case 'danger':
    case 'critical':
    case 'error':
    case 'occupied':
      return '#FF4D4F';
    case 'offline':
    case 'maintenance':
      return '#6B7280';
    default:
      return '#1890FF';
  }
}

export function getAlarmLevelColor(level: string): string {
  switch (level) {
    case 'critical':
      return '#FF4D4F';
    case 'warning':
      return '#FAAD14';
    case 'info':
      return '#1890FF';
    default:
      return '#6B7280';
  }
}

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 0.95) return '#FF4D4F';
  if (utilization >= 0.85) return '#FAAD14';
  if (utilization >= 0.7) return '#13C2C2';
  return '#52C41A';
}
