import Mock from 'mockjs'
import { randomRange, randomFloat, formatDate } from '@/utils'
import { DEPARTMENTS } from '@/types'

export function randomError(): boolean {
  return Math.random() < 0.1
}

export function successResponse<T>(data: T) {
  return {
    code: 200,
    message: 'success',
    data,
  }
}

export function errorResponse(code: number, message: string) {
  return {
    code,
    message,
    data: null,
  }
}

export function generateTrendData(days: number, baseValue: number, volatility: number) {
  const data: { date: string; value: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const value = baseValue + randomRange(-volatility, volatility)
    data.push({
      date: formatDate(date),
      value: Math.max(0, value),
    })
  }
  return data
}

export function getDepartmentName(id: string): string {
  const dept = DEPARTMENTS.find((d) => d.id === id)
  return dept ? dept.name : '未知科室'
}

export function generateDepartmentData() {
  const departments = DEPARTMENTS.filter((d) => d.id !== 'all').map((dept, index) => ({
    id: dept.id,
    name: dept.name,
    outpatientVolume: randomRange(500, 3000),
    inpatientCount: randomRange(50, 300),
    income: randomRange(500000, 5000000),
    bedOccupancyRate: randomFloat(60, 95),
    drugRatio: randomFloat(25, 45),
    avgWaitingTime: randomRange(10, 60),
    satisfaction: randomFloat(85, 98),
    rank: index + 1,
  }))
  return departments
}

export function generateAlertData(count: number) {
  const alertTypes = [
    '门诊量下降',
    '床位使用率过高',
    '药占比超标',
    '收入下降',
    '候诊时间过长',
    '患者满意度低',
  ]
  const levels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  const statuses: Array<'pending' | 'processing' | 'resolved'> = ['pending', 'processing', 'resolved']

  const data = []
  for (let i = 0; i < count; i++) {
    const level = levels[randomRange(0, 2)]
    const dept = DEPARTMENTS[randomRange(1, DEPARTMENTS.length - 1)]
    const type = alertTypes[randomRange(0, alertTypes.length - 1)]
    const date = new Date()
    date.setMinutes(date.getMinutes() - randomRange(0, 1440))

    data.push({
      id: Mock.mock('@guid'),
      level,
      type,
      department: dept.name,
      description: `${dept.name}${type}`,
      value: randomFloat(10, 50),
      threshold: 30,
      time: formatDate(date),
      status: statuses[randomRange(0, 2)],
    })
  }
  return data
}

export { Mock, randomRange, randomFloat }
