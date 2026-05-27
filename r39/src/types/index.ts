export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageParams {
  page: number
  pageSize: number
}

export type UserRole = 'super_admin' | 'operation_admin' | 'maintenance' | 'finance'

export interface User {
  id: string
  username: string
  role: UserRole
  token: string
  avatar?: string
  email?: string
  phone?: string
}

export interface LoginParams {
  username: string
  password: string
  remember?: boolean
}

export type DeviceStatus = 'idle' | 'charging' | 'offline' | 'fault' | 'alarm'

export interface Station {
  id: string
  name: string
  address: string
  deviceCount: number
  onlineCount: number
  onlineRate: number
  status: 'active' | 'inactive'
  area: string
  lng?: number
  lat?: number
  createTime: string
  updateTime: string
}

export interface Device {
  id: string
  stationId: string
  stationName: string
  name: string
  code: string
  status: DeviceStatus
  power: number
  type: 'dc' | 'ac'
  currentPower?: number
  totalElectricity: number
  todayElectricity: number
  createTime: string
  lastOnlineTime?: string
}

export type OrderStatus = 'charging' | 'completed' | 'cancelled' | 'exception'

export interface Order {
  id: string
  orderNo: string
  stationId: string
  stationName: string
  deviceId: string
  deviceName: string
  userId: string
  userName: string
  startSoc: number
  endSoc?: number
  startTime: string
  endTime?: string
  duration?: number
  electricity: number
  amount: number
  status: OrderStatus
  payStatus: 'pending' | 'paid' | 'refunded'
  createTime: string
}

export type AlarmLevel = 'critical' | 'major' | 'minor' | 'warning'
export type AlarmStatus = 'pending' | 'processing' | 'resolved' | 'ignored'

export interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  stationId: string
  stationName: string
  level: AlarmLevel
  message: string
  status: AlarmStatus
  alarmTime: string
  handler?: string
  handleTime?: string
  handleRemark?: string
}

export interface PriceStrategy {
  id: string
  name: string
  type: 'time' | 'ladder'
  startTime: string
  endTime: string
  price: number
  serviceFee: number
  status: 'active' | 'inactive'
  createTime: string
}

export interface DashboardStats {
  stationCount: number
  stationOnlineRate: number
  deviceCount: number
  deviceOnlineRate: number
  todayOrders: number
  todayElectricity: number
  todayIncome: number
  pendingAlarms: number
}

export interface MenuItem {
  id: string
  title: string
  path: string
  icon: string
  roles: UserRole[]
  children?: MenuItem[]
}

export interface ChartData {
  name: string
  value: number
}

export interface TrendData {
  date: string
  value: number
}

export interface StationParams extends PageParams {
  keyword?: string
  area?: string
  status?: string
}

export interface DeviceParams extends PageParams {
  stationId?: string
  status?: DeviceStatus
  keyword?: string
}

export interface AlarmParams extends PageParams {
  level?: AlarmLevel
  status?: AlarmStatus
  keyword?: string
}

export interface OrderParams extends PageParams {
  keyword?: string
  status?: OrderStatus
  startDate?: string
  endDate?: string
}

export interface ReportParams extends PageParams {
  period?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}
