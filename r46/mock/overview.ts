import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, generateTrendData, randomRange, randomFloat } from './utils'

export default [
  {
    url: '/api/overview/metrics',
    method: 'get',
    response: ({ query }: { query: { department?: string; dateRange?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取核心指标失败')
      }

      const { department = 'all', dateRange = 'week' } = query

      let baseMultiplier = 1

      if (department === 'dermatology' || department === 'gynecology') {
        baseMultiplier = 0.6
      }

      return successResponse({
        outpatientVolume: Math.floor(randomRange(2000, 5000) * baseMultiplier),
        inpatientCount: Math.floor(randomRange(800, 1500) * baseMultiplier),
        bedOccupancyRate: randomFloat(75, 92),
        departmentIncome: Math.floor(randomRange(5000000, 10000000) * baseMultiplier),
        drugRatio: randomFloat(30, 40),
        avgWaitingTime: randomRange(15, 45),
        examAppointments: Math.floor(randomRange(500, 1200) * baseMultiplier),
        alertCount: randomRange(3, 15),
        outpatientVolumeYoY: randomFloat(-10, 20),
        inpatientCountYoY: randomFloat(-5, 15),
        bedOccupancyRateYoY: randomFloat(-3, 8),
        departmentIncomeYoY: randomFloat(-8, 18),
        drugRatioYoY: randomFloat(-5, 5),
        avgWaitingTimeYoY: randomFloat(-10, 10),
        examAppointmentsYoY: randomFloat(-5, 15),
        alertCountYoY: randomFloat(-20, 10),
      })
    },
  },
  {
    url: '/api/overview/trend',
    method: 'get',
    response: ({ query }: { query: { type?: string; days?: number } }) => {
      if (randomError()) {
        return errorResponse(500, '获取趋势数据失败')
      }

      const { type = 'outpatient', days = 7 } = query

      const baseValues: Record<string, number> = {
        outpatient: 3000,
        inpatient: 1000,
        income: 5000000,
      }

      return successResponse(generateTrendData(Number(days), baseValues[type] || 1000, baseValues[type] ? baseValues[type] * 0.2 : 200))
    },
  },
  {
    url: '/api/overview/alerts',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取预警信息失败')
      }

      const alerts = [
        {
          id: '1',
          level: 'high',
          type: '床位紧张',
          department: 'ICU',
          description: 'ICU床位使用率达到98%，超过预警阈值95%',
          value: 98,
          threshold: 95,
          time: '2024-01-15 10:30',
          status: 'pending',
        },
        {
          id: '2',
          level: 'medium',
          type: '药占比超标',
          department: '内科',
          description: '内科药占比达到45%，超过预警阈值40%',
          value: 45,
          threshold: 40,
          time: '2024-01-15 09:15',
          status: 'processing',
        },
        {
          id: '3',
          level: 'low',
          type: '门诊量下降',
          department: '皮肤科',
          description: '皮肤科门诊量较上周下降15%',
          value: 15,
          threshold: 10,
          time: '2024-01-15 08:00',
          status: 'pending',
        },
      ]

      return successResponse(alerts)
    },
  },
] as MockMethod[]
