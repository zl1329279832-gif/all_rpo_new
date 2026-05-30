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

export function getDepartmentName(id: string): string {
  const dept = DEPARTMENTS.find((d) => d.id === id)
  return dept ? dept.name : '未知科室'
}

export { Mock }
