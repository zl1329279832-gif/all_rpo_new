import type { Statistics, RegionRisk, AlarmTrend, ResponseStat } from '@/types'

export const statistics: Statistics = {
  totalDevices: 68,
  onlineDevices: 52,
  offlineDevices: 8,
  faultDevices: 6,
  alarmDevices: 2,
  onlineRate: 76.5,
  todayAlarms: 12,
  unhandledAlarms: 3,
  avgResponseTime: 4.5,
  resolutionRate: 92.3
}

export const regionRisks: RegionRisk[] = [
  { name: '教学区', riskLevel: 'medium', deviceCount: 28, alarmCount: 3 },
  { name: '宿舍区', riskLevel: 'high', deviceCount: 20, alarmCount: 5 },
  { name: '行政区', riskLevel: 'low', deviceCount: 10, alarmCount: 1 },
  { name: '公共区', riskLevel: 'medium', deviceCount: 10, alarmCount: 2 }
]

export const alarmTrends: AlarmTrend[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  count: Math.floor(Math.random() * 8) + 2
}))

export const responseStats: ResponseStat[] = [
  { type: '入侵检测', count: 15, avgTime: 3.2 },
  { type: '烟雾告警', count: 8, avgTime: 2.8 },
  { type: '设备故障', count: 12, avgTime: 5.6 },
  { type: '视频异常', count: 6, avgTime: 4.1 },
  { type: '消防告警', count: 4, avgTime: 1.5 }
]
