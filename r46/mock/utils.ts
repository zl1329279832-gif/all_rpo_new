import Mock from 'mockjs'

export function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export const DEPARTMENTS = [
  { id: 'all', name: '全部科室' },
  { id: 'internal', name: '内科' },
  { id: 'surgery', name: '外科' },
  { id: 'gynecology', name: '妇产科' },
  { id: 'pediatrics', name: '儿科' },
  { id: 'ophthalmology', name: '眼科' },
  { id: 'ent', name: '耳鼻喉科' },
  { id: 'dermatology', name: '皮肤科' },
  { id: 'neurology', name: '神经内科' },
  { id: 'cardiology', name: '心血管内科' },
  { id: 'respiratory', name: '呼吸内科' },
  { id: 'gastroenterology', name: '消化内科' },
  { id: 'orthopedics', name: '骨科' },
  { id: 'icu', name: 'ICU' },
  { id: 'emergency', name: '急诊科' },
]

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

export { Mock }
