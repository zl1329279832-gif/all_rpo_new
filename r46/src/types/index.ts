export interface CoreMetrics {
  outpatientVolume: number
  inpatientCount: number
  bedOccupancyRate: number
  departmentIncome: number
  drugRatio: number
  avgWaitingTime: number
  examAppointments: number
  alertCount: number
  outpatientVolumeYoY: number
  inpatientCountYoY: number
  bedOccupancyRateYoY: number
  departmentIncomeYoY: number
  drugRatioYoY: number
  avgWaitingTimeYoY: number
  examAppointmentsYoY: number
  alertCountYoY: number
}

export interface DepartmentData {
  id: string
  name: string
  outpatientVolume: number
  inpatientCount: number
  income: number
  bedOccupancyRate: number
  drugRatio: number
  avgWaitingTime: number
  satisfaction: number
  rank: number
}

export interface DoctorData {
  id: string
  name: string
  department: string
  title: string
  outpatientCount: number
  surgeryCount: number
  dischargeCount: number
  income: number
  avgCost: number
  satisfaction: number
}

export interface BedData {
  id: string
  ward: string
  bedNo: string
  status: 'empty' | 'occupied' | 'reserved' | 'cleaning'
  patientName?: string
  department: string
  admissionDate?: string
  expectedDischargeDate?: string
}

export interface CostData {
  category: string
  amount: number
  ratio: number
  yoy: number
}

export interface AppointmentTrend {
  date: string
  outpatient: number
  examination: number
  conversionRate: number
}

export interface AlertData {
  id: string
  level: 'high' | 'medium' | 'low'
  type: string
  department: string
  description: string
  value: number
  threshold: number
  time: string
  status: 'pending' | 'processing' | 'resolved'
  handler?: string
  handleTime?: string
  handleNote?: string
}

export interface ReportData {
  id: string
  department: string
  date: string
  outpatientVolume: number
  inpatientCount: number
  income: number
  drugRatio: number
  bedOccupancyRate: number
  avgWaitingTime: number
}

export interface UserInfo {
  id: string
  username: string
  name: string
  role: 'admin' | 'director' | 'leader'
  department?: string
  avatar?: string
  permissions: string[]
}

export interface MenuItem {
  path: string
  name: string
  icon: string
  children?: MenuItem[]
  permission?: string
}

export interface FilterParams {
  startDate: string
  endDate: string
  department: string
  dateRange: string
}

export interface TrendData {
  date: string
  value: number
  type?: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export type ThemeMode = 'light' | 'dark'

export const DEPARTMENTS = [
  { id: 'all', name: '全院' },
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

export const DATE_RANGES = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'week', label: '近一周' },
  { value: 'month', label: '近一月' },
  { value: 'quarter', label: '近三月' },
  { value: 'year', label: '近一年' },
]

export type MetricUnit = 'number' | 'percent' | 'money' | 'time'
