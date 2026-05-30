import Mock from 'mockjs'
import { randomRange, randomFloat, formatDate } from './mockUtils'
import { DEPARTMENTS } from './mockUtils'
import type {
  CoreMetrics,
  DepartmentData,
  DoctorData,
  BedData,
  AlertData,
  TrendData,
  CostData,
} from '@/types'

const STORAGE_KEY = 'hospital-data'

interface UserAccount {
  username: string
  password: string
  role: 'admin' | 'director' | 'leader'
  name: string
  department?: string
}

const ACCOUNTS: UserAccount[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: '系统管理员',
  },
  {
    username: 'director',
    password: 'director123',
    role: 'director',
    name: '张主任',
    department: 'internal',
  },
  {
    username: 'leader',
    password: 'leader123',
    role: 'leader',
    name: '王院长',
  },
]

const PERMISSIONS: Record<string, string[]> = {
  admin: [
    'overview:view',
    'department:view',
    'doctor:view',
    'bed:view',
    'cost:view',
    'appointment:view',
    'alert:view',
    'report:view',
    'report:export',
    'alert:handle',
    'alert:ignore',
    'department:export',
    'doctor:export',
    'cost:export',
    'appointment:export',
    'report:create',
    'view:department_detail',
  ],
  director: [
    'overview:view',
    'department:view',
    'doctor:view',
    'bed:view',
    'report:view',
    'report:export',
    'department:export',
    'doctor:export',
    'view:department_detail',
  ],
  leader: [
    'overview:view',
    'department:view',
    'doctor:view',
    'alert:view',
    'report:view',
  ],
}

export interface UserInfo {
  id: string
  username: string
  name: string
  role: 'admin' | 'director' | 'leader'
  department?: string
  permissions: string[]
}

function generateCoreMetrics(department: string = 'all'): CoreMetrics {
  let baseMultiplier = 1

  if (department === 'dermatology' || department === 'gynecology') {
    baseMultiplier = 0.6
  }

  return {
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
  }
}

function generateTrendData(days: number, baseValue: number, volatility: number): TrendData[] {
  const data: TrendData[] = []
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

function generateAlertData(count: number): AlertData[] {
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

function generateDepartmentData(): DepartmentData[] {
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

function generateDoctorData(count: number = 50): DoctorData[] {
  const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']
  const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'ophthalmology']

  const list: DoctorData[] = []
  for (let i = 0; i < count; i++) {
    const deptId = departments[randomRange(0, departments.length - 1)]
    const dept = DEPARTMENTS.find((d) => d.id === deptId)
    list.push({
      id: `doc${i + 1}`,
      name: firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)],
      department: dept?.name || '未知科室',
      title: titles[randomRange(0, 3)],
      outpatientCount: randomRange(100, 500),
      surgeryCount: randomRange(0, 100),
      dischargeCount: randomRange(50, 200),
      income: randomRange(500000, 2000000),
      avgCost: randomRange(200, 800),
      satisfaction: randomFloat(85, 99),
    })
  }
  return list
}

function generateBedData(department: string = 'all') {
  const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'icu']
  const statuses: Array<'empty' | 'occupied' | 'reserved' | 'cleaning'> = ['empty', 'occupied', 'reserved', 'cleaning']
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']

  const list: BedData[] = []
  const wards = ['1号楼', '2号楼', '3号楼', '4号楼']

  for (const ward of wards) {
    for (let i = 1; i <= 20; i++) {
      const deptId = departments[randomRange(0, departments.length - 1)]
      if (department !== 'all' && deptId !== department) continue

      const status = statuses[randomRange(0, 3)]
      const today = new Date()
      const admissionDate = new Date(today)
      admissionDate.setDate(admissionDate.getDate() - randomRange(0, 10))

      const expectedDischargeDate = new Date(admissionDate)
      expectedDischargeDate.setDate(expectedDischargeDate.getDate() + randomRange(3, 14))

      const dept = DEPARTMENTS.find((d) => d.id === deptId)

      list.push({
        id: `bed${ward.replace('号楼', '')}-${i}`,
        ward,
        bedNo: `${ward}-${String(i).padStart(3, '0')}`,
        status,
        patientName: status === 'occupied' ? firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)] : undefined,
        department: dept?.name || '未知科室',
        admissionDate: status === 'occupied' ? formatDate(admissionDate) : undefined,
        expectedDischargeDate: status === 'occupied' ? formatDate(expectedDischargeDate) : undefined,
      })
    }
  }

  const totalBeds = list.length
  const occupiedBeds = list.filter((b) => b.status === 'occupied').length
  const emptyBeds = list.filter((b) => b.status === 'empty').length
  const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2)) : 0

  return {
    list,
    total: totalBeds,
    occupied: occupiedBeds,
    empty: emptyBeds,
    reserved: list.filter((b) => b.status === 'reserved').length,
    cleaning: list.filter((b) => b.status === 'cleaning').length,
    occupancyRate,
  }
}

function generateCostData(): CostData[] {
  const categories = [
    { category: '药品收入', ratio: 35 },
    { category: '检查收入', ratio: 25 },
    { category: '治疗收入', ratio: 18 },
    { category: '手术收入', ratio: 12 },
    { category: '耗材收入', ratio: 7 },
    { category: '其他收入', ratio: 3 },
  ]

  const data = categories.map((item) => ({
    category: item.category,
    amount: randomRange(500000, 5000000),
    ratio: randomFloat(item.ratio - 3, item.ratio + 3),
    yoy: randomFloat(-10, 15),
  }))

  return data
}

function generatePaymentData() {
  return [
    { type: '医保支付', amount: randomRange(3000000, 6000000), ratio: randomFloat(55, 70) },
    { type: '自费支付', amount: randomRange(1000000, 3000000), ratio: randomFloat(20, 35) },
    { type: '商业保险', amount: randomRange(500000, 1500000), ratio: randomFloat(5, 15) },
    { type: '其他支付', amount: randomRange(100000, 500000), ratio: randomFloat(1, 5) },
  ]
}

function generateAppointmentData() {
  const data = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: formatDate(date),
      outpatient: randomRange(100, 500),
      examination: randomRange(50, 200),
      conversionRate: randomFloat(75, 95),
    })
  }
  return data
}

function generateExamData() {
  const types = ['CT检查', 'MRI检查', 'B超检查', 'X光检查', '心电图', '血常规', '生化检查']
  return types.map((type) => ({
    type,
    total: randomRange(100, 800),
    completed: randomRange(80, 750),
    pending: randomRange(10, 100),
    avgWaitDays: randomFloat(0.5, 5),
  }))
}

function generateReportData(page: number, pageSize: number, department: string = 'all') {
  const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'ophthalmology', 'ent', 'dermatology', 'neurology', 'cardiology', 'respiratory', 'gastroenterology', 'orthopedics', 'icu', 'emergency']

  const list = []
  const start = (page - 1) * pageSize
  const today = new Date()

  for (let i = 0; i < pageSize; i++) {
    const deptId = departments[randomRange(0, departments.length - 1)]
    if (department !== 'all' && deptId !== department) continue

    const date = new Date(today)
    date.setDate(date.getDate() - randomRange(0, 30))

    const dept = DEPARTMENTS.find((d) => d.id === deptId)

    list.push({
      id: `report${start + i + 1}`,
      department: dept?.name || '未知科室',
      departmentId: deptId,
      date: formatDate(date),
      outpatientVolume: randomRange(200, 2000),
      inpatientCount: randomRange(20, 300),
      income: randomRange(100000, 5000000),
      drugRatio: randomFloat(25, 45),
      bedOccupancyRate: randomFloat(60, 98),
      avgWaitingTime: randomRange(10, 60),
    })
  }

  return {
    list,
    total: 365,
    page: Number(page),
    pageSize: Number(pageSize),
  }
}

function initializeData() {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return

  const initialData = {
    coreMetrics: generateCoreMetrics(),
    departments: generateDepartmentData(),
    doctors: generateDoctorData(50),
    beds: generateBedData(),
    alerts: generateAlertData(50),
    appointments: generateAppointmentData(),
    examData: generateExamData(),
    costs: generateCostData(),
    payments: generatePaymentData(),
    reports: generateReportData(1, 20),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
}

function getData() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    initializeData()
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  }
  return JSON.parse(stored)
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function login(username: string, password: string): { userInfo: UserInfo } {
  const account = ACCOUNTS.find((a) => a.username === username && a.password === password)
  if (!account) {
    throw new Error('用户名或密码错误')
  }

  const userInfo: UserInfo = {
    id: account.username,
    username: account.username,
    name: account.name,
    role: account.role,
    department: account.department,
    permissions: PERMISSIONS[account.role] || [],
  }

  localStorage.setItem('hospital-user-info', JSON.stringify(userInfo))
  return { userInfo }
}

export function logout() {
  localStorage.removeItem('hospital-user-info')
}

export function getCurrentUser(): UserInfo | null {
  const stored = localStorage.getItem('hospital-user-info')
  if (!stored) return null
  return JSON.parse(stored)
}

export function hasPermission(permission: string): boolean {
  const user = getCurrentUser()
  if (!user) return false
  return user.permissions.includes(permission)
}

export function getCoreMetrics(params: { department?: string; dateRange?: string }) {
  const data = generateCoreMetrics(params.department)
  return { code: 200, message: 'success', data }
}

export function getTrendData(params: { type?: string; days?: number }) {
  const { type = 'outpatient', days = 7 } = params
  const baseValues: Record<string, number> = {
    outpatient: 3000,
    inpatient: 1000,
    income: 5000000,
  }
  const data = generateTrendData(Number(days), baseValues[type] || 1000, baseValues[type] ? baseValues[type] * 0.2 : 200)
  return { code: 200, message: 'success', data }
}

export function getOverviewAlerts() {
  const alerts = [
    {
      id: '1',
      level: 'high' as const,
      type: '床位紧张',
      department: 'ICU',
      description: 'ICU床位使用率达到98%，超过预警阈值95%',
      value: 98,
      threshold: 95,
      time: '2024-01-15 10:30',
      status: 'pending' as const,
    },
    {
      id: '2',
      level: 'medium' as const,
      type: '药占比超标',
      department: '内科',
      description: '内科药占比达到45%，超过预警阈值40%',
      value: 45,
      threshold: 40,
      time: '2024-01-15 09:15',
      status: 'processing' as const,
    },
    {
      id: '3',
      level: 'low' as const,
      type: '门诊量下降',
      department: '皮肤科',
      description: '皮肤科门诊量较上周下降15%',
      value: 15,
      threshold: 10,
      time: '2024-01-15 08:00',
      status: 'pending' as const,
    },
  ]
  return { code: 200, message: 'success', data: alerts }
}

export function getDepartmentList(params: { dateRange?: string; department?: string; page?: number; pageSize?: number }) {
  let data = generateDepartmentData()

  if (params.department && params.department !== 'all') {
    data = data.filter((d) => d.id === params.department)
  }

  return {
    code: 200,
    message: 'success',
    data: {
      list: data,
      total: data.length,
      page: 1,
      pageSize: 20,
    },
  }
}

export function getDepartmentRank() {
  const data = generateDepartmentData()
  return { code: 200, message: 'success', data: data.sort((a, b) => b.income - a.income) }
}

export function getDepartmentDetail(params: { id?: string }) {
  const { id } = params
  const dept = DEPARTMENTS.find((d) => d.id === id)
  return {
    code: 200,
    message: 'success',
    data: {
      id,
      name: dept?.name || '内科',
      outpatientVolume: randomRange(2000, 3000),
      inpatientCount: randomRange(200, 300),
      income: randomRange(3000000, 5000000),
      bedOccupancyRate: randomFloat(80, 90),
      drugRatio: randomFloat(35, 42),
      avgWaitingTime: randomRange(20, 40),
      satisfaction: randomFloat(90, 96),
      doctorCount: randomRange(20, 50),
      nurseCount: randomRange(30, 60),
      bedCount: randomRange(100, 200),
    },
  }
}

export function getDoctorList(params: { department?: string; page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 10 } = params
  let data = generateDoctorData(50)

  if (params.department && params.department !== 'all') {
    const dept = DEPARTMENTS.find((d) => d.id === params.department)
    if (dept) {
      data = data.filter((d) => d.department === dept.name)
    }
  }

  const total = data.length
  const start = (page - 1) * pageSize
  const list = data.slice(start, start + pageSize)

  return {
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  }
}

export function getDoctorRank() {
  const data = generateDoctorData(10)
  return { code: 200, message: 'success', data }
}

export function getDoctorDetail(params: { id?: string }) {
  const { id } = params
  const doctor = generateDoctorData(1)[0]
  return {
    code: 200,
    message: 'success',
    data: {
      id,
      ...doctor,
      age: randomRange(35, 55),
      yearsOfExperience: randomRange(10, 30),
      education: '博士',
      specialty: '心血管疾病',
      patientCount: randomRange(2000, 5000),
      avgLengthOfStay: randomFloat(5, 10),
      readmissionRate: randomFloat(2, 8),
    },
  }
}

export function getBedList(params: { department?: string }) {
  const data = generateBedData(params.department)
  return { code: 200, message: 'success', data }
}

export function getBedByDepartment() {
  const departments = ['内科', '外科', '妇产科', '儿科', 'ICU', '骨科']
  const data = departments.map((dept) => {
    const total = randomRange(30, 100)
    const occupied = randomRange(Math.floor(total * 0.6), total)
    return {
      department: dept,
      count: total,
      totalBeds: total,
      occupiedBeds: occupied,
      emptyBeds: total - occupied,
      occupancyRate: Number(((occupied / total) * 100).toFixed(2)),
    }
  })
  return { code: 200, message: 'success', data }
}

export function getCostStructure() {
  const data = generateCostData()
  return { code: 200, message: 'success', data }
}

export function getDrugRatioTrend() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const data = months.map((month) => ({
    month,
    ratio: randomFloat(30, 42),
    target: 40,
    date: month,
    total: randomRange(1000000, 5000000),
  }))
  return { code: 200, message: 'success', data }
}

export function getPaymentType() {
  const data = generatePaymentData().map((item) => ({
    name: item.type,
    amount: item.amount,
    value: item.amount,
    ratio: item.ratio,
  }))
  return { code: 200, message: 'success', data }
}

export function getCostByDepartment() {
  const departments = ['内科', '外科', '妇产科', '儿科', '骨科', 'ICU', '心血管内科']
  const data = departments.map((dept) => ({
    department: dept,
    total: randomRange(1000000, 8000000),
    drug: randomRange(300000, 3000000),
    exam: randomRange(200000, 2000000),
    treatment: randomRange(150000, 1500000),
    surgery: randomRange(100000, 2000000),
    drugRatio: randomFloat(30, 45),
  }))
  return { code: 200, message: 'success', data }
}

export function getAppointmentTrend() {
  const data = generateAppointmentData()
  return { code: 200, message: 'success', data }
}

export function getWaitingTime() {
  const departments = ['内科', '外科', '妇产科', '儿科', '眼科', '耳鼻喉科', '皮肤科', '口腔科']
  const data = departments.map((dept) => ({
    department: dept,
    avgWaitingTime: randomRange(10, 60),
    maxWaitingTime: randomRange(30, 120),
    patientCount: randomRange(50, 200),
  }))
  return { code: 200, message: 'success', data }
}

export function getAppointmentByDepartment() {
  const departments = ['内科', '外科', '妇产科', '儿科', '骨科', '眼科', '耳鼻喉科', '皮肤科']
  const data = departments.map((dept) => ({
    department: dept,
    totalAppointments: randomRange(500, 3000),
    completedAppointments: randomRange(400, 2800),
    cancelledAppointments: randomRange(20, 200),
    noShowAppointments: randomRange(10, 100),
    attendanceRate: randomFloat(85, 98),
  }))
  return { code: 200, message: 'success', data }
}

export function getExaminationAppointment() {
  const data = generateExamData().map((item) => ({
    ...item,
    type: item.type,
    count: item.total,
  }))
  return { code: 200, message: 'success', data }
}

export function getAppointmentList(params: { department?: string; dateRange?: string; page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 10 } = params
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
  const statusLabels: Record<string, string> = {
    pending: '待就诊',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未到诊',
  }

  const list = []
  const start = (page - 1) * pageSize
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']
  const depts = ['内科', '外科', '妇产科', '儿科', '骨科', '眼科']

  for (let i = 0; i < pageSize; i++) {
    const status = statuses[randomRange(0, 4)]
    list.push({
      id: `apt${start + i + 1}`,
      patientName: firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)],
      department: depts[randomRange(0, 5)],
      doctor: firstNames[randomRange(0, 9)] + '医生',
      appointmentTime: formatDate(new Date(Date.now() - randomRange(0, 86400000 * 7))),
      type: randomRange(0, 1) === 0 ? '门诊' : '检查',
      status,
      statusLabel: statusLabels[status],
      createTime: formatDate(new Date(Date.now() - randomRange(86400000, 86400000 * 14))),
    })
  }

  return {
    code: 200,
    message: 'success',
    data: {
      list,
      total: 500,
      page: Number(page),
      pageSize: Number(pageSize),
      pending: randomRange(30, 80),
      today: randomRange(50, 150),
      completed: randomRange(200, 400),
      cancelled: randomRange(20, 60),
    },
  }
}

export function getAlertList(params: { level?: string; status?: string; page?: number; pageSize?: number }) {
  const { level = '', status = '', page = 1, pageSize = 10 } = params
  let data = generateAlertData(50)

  if (level) {
    data = data.filter((item) => item.level === level)
  }

  if (status) {
    data = data.filter((item) => item.status === status)
  }

  const total = data.length
  const start = (page - 1) * pageSize
  const list = data.slice(start, start + pageSize)

  return {
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      highCount: data.filter((d) => d.level === 'high').length,
      mediumCount: data.filter((d) => d.level === 'medium').length,
      lowCount: data.filter((d) => d.level === 'low').length,
      pendingCount: data.filter((d) => d.status === 'pending').length,
    },
  }
}

export function getAlertDetail(params: { id?: string }) {
  const { id } = params
  return {
    code: 200,
    message: 'success',
    data: {
      id,
      level: 'high' as const,
      type: '床位紧张',
      department: 'ICU',
      description: 'ICU床位使用率持续高于预警阈值',
      value: 98,
      threshold: 95,
      time: '2024-01-15 10:30:00',
      status: 'pending' as const,
      handler: null,
      handleTime: null,
      handleNote: null,
      handleRecords: [
        {
          time: '2024-01-15 10:30:00',
          action: '系统自动预警',
          operator: '系统',
          note: '床位使用率达到98%，触发预警',
        },
      ],
      historyData: Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${15 - i}`,
        value: randomFloat(90, 100),
      })),
      suggestions: [
        '建议启动应急预案，增加临时床位',
        '协调其他科室转院或转出非重症患者',
        '增加医护人员配备',
        '通知医务科协调处理',
      ],
    },
  }
}

export function handleAlert(params: { id: string; status: string; note: string }) {
  return {
    code: 200,
    message: 'success',
    data: {
      id: params.id,
      status: params.status,
      handler: '当前用户',
      handleTime: new Date().toISOString(),
      handleNote: params.note,
    },
  }
}

export function ignoreAlert(params: { id: string; note: string }) {
  return {
    code: 200,
    message: 'success',
    data: {
      id: params.id,
      status: 'ignored',
      handler: '当前用户',
      handleTime: new Date().toISOString(),
      note: params.note,
    },
  }
}

export function getAlertStatistics() {
  return {
    code: 200,
    message: 'success',
    data: {
      today: randomRange(3, 15),
      thisWeek: randomRange(15, 50),
      thisMonth: randomRange(50, 150),
      high: randomRange(1, 5),
      medium: randomRange(3, 10),
      low: randomRange(5, 20),
      pending: randomRange(5, 15),
      resolved: randomRange(30, 80),
    },
  }
}

export function getAlertTypeDistribution() {
  const types = [
    { type: '床位使用率过高', count: randomRange(5, 20) },
    { type: '药占比超标', count: randomRange(5, 15) },
    { type: '门诊量下降', count: randomRange(3, 10) },
    { type: '收入下降', count: randomRange(2, 8) },
    { type: '候诊时间过长', count: randomRange(5, 15) },
    { type: '患者满意度低', count: randomRange(2, 8) },
  ]
  return {
    code: 200,
    message: 'success',
    data: types.map((t) => ({ name: t.type, value: t.count })),
  }
}

export function getAlertTrend(params: { days?: number } = {}) {
  const { days = 7 } = params
  const data = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: formatDate(date).split(' ')[0],
      high: randomRange(0, 3),
      medium: randomRange(1, 5),
      low: randomRange(2, 8),
    })
  }
  return { code: 200, message: 'success', data }
}

export function getReportList(params: { department?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 20, department = 'all' } = params
  const data = generateReportData(page, pageSize, department)
  return { code: 200, message: 'success', data }
}

export function getReportSummary() {
  return {
    code: 200,
    message: 'success',
    data: {
      totalOutpatient: randomRange(50000, 150000),
      totalInpatient: randomRange(8000, 20000),
      totalIncome: randomRange(50000000, 150000000),
      avgDrugRatio: randomFloat(32, 38),
      avgBedOccupancyRate: randomFloat(80, 92),
      avgWaitingTime: randomRange(20, 40),
    },
  }
}

export function exportReport(params: { ids?: string[]; format?: string; department?: string; startDate?: string; endDate?: string }) {
  const { ids = [], format = 'xlsx' } = params
  return {
    code: 200,
    message: 'success',
    data: {
      downloadUrl: `/download/report-${Date.now()}.${format}`,
      filename: `医院运营报表_${formatDate(new Date())}.${format}`,
      totalCount: ids.length || 100,
      format,
    },
  }
}

export function getReportHistory(params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 10 } = params
  const reportTypes = ['运营日报', '科室月报', '医生绩效', '财务报表', '床位报表']
  const list = []
  const start = (page - 1) * pageSize

  for (let i = 0; i < pageSize; i++) {
    const createTime = new Date(Date.now() - randomRange(0, 86400000 * 30))
    list.push({
      id: `history${start + i + 1}`,
      name: `${reportTypes[randomRange(0, 4)]}_${formatDate(createTime).split(' ')[0]}`,
      type: reportTypes[randomRange(0, 4)],
      createTime: formatDate(createTime),
      creator: ['管理员', '张主任', '王院长'][randomRange(0, 2)],
      isFavorite: randomRange(0, 1) === 1,
      fileSize: `${randomRange(100, 2000)}KB`,
      downloadCount: randomRange(1, 50),
    })
  }

  return {
    code: 200,
    message: 'success',
    data: {
      list,
      total: 100,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  }
}

export function toggleFavorite(params: { id: string; isFavorite: boolean }) {
  return {
    code: 200,
    message: 'success',
    data: {
      id: params.id,
      isFavorite: !params.isFavorite,
    },
  }
}

export function getAppointmentOverview() {
  const today = new Date()
  return {
    code: 200,
    message: 'success',
    data: {
      today: randomRange(100, 300),
      pending: randomRange(30, 80),
      completed: randomRange(50, 150),
      cancelled: randomRange(5, 20),
      avgWaitingTime: randomRange(10, 40),
    },
  }
}

export function getAlertListNew(params: { level?: string; status?: string; page?: number; pageSize?: number }) {
  return getAlertList(params)
}

export function batchHandleAlert(params: { ids: string[]; status: string; note: string }) {
  return {
    code: 200,
    message: 'success',
    data: {
      success: true,
      count: params.ids.length,
    },
  }
}

export function batchIgnoreAlert(params: { ids: string[]; note: string }) {
  return {
    code: 200,
    message: 'success',
    data: {
      success: true,
      count: params.ids.length,
    },
  }
}

export function generateReport(params: { type: string; period: string; departments: string[] }) {
  return {
    code: 200,
    message: 'success',
    data: {
      id: `report-${Date.now()}`,
      name: `${params.type}_${new Date().toLocaleDateString()}`,
      status: 'generating',
      progress: 0,
    },
  }
}

export function randomError(): boolean {
  return Math.random() < 0.1
}

initializeData()
