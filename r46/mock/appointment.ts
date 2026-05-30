import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, randomFloat, formatDate } from './utils'

export default [
  {
    url: '/api/appointment/trend',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取预约趋势失败')
      }

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

      return successResponse(data)
    },
  },
  {
    url: '/api/appointment/waiting-time',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取候诊时间失败')
      }

      const departments = ['内科', '外科', '妇产科', '儿科', '眼科', '耳鼻喉科', '皮肤科', '口腔科']
      const data = departments.map((dept) => ({
        department: dept,
        avgWaitingTime: randomRange(10, 60),
        maxWaitingTime: randomRange(30, 120),
        patientCount: randomRange(50, 200),
      }))

      return successResponse(data)
    },
  },
  {
    url: '/api/appointment/department',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取科室预约数据失败')
      }

      const departments = ['内科', '外科', '妇产科', '儿科', '骨科', '眼科', '耳鼻喉科', '皮肤科']
      const data = departments.map((dept) => ({
        department: dept,
        totalAppointments: randomRange(500, 3000),
        completedAppointments: randomRange(400, 2800),
        cancelledAppointments: randomRange(20, 200),
        noShowAppointments: randomRange(10, 100),
        attendanceRate: randomFloat(85, 98),
      }))

      return successResponse(data)
    },
  },
  {
    url: '/api/appointment/examination',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取检查预约数据失败')
      }

      const types = ['CT检查', 'MRI检查', 'B超检查', 'X光检查', '心电图', '血常规', '生化检查']
      const data = types.map((type) => ({
        type,
        total: randomRange(100, 800),
        completed: randomRange(80, 750),
        pending: randomRange(10, 100),
        avgWaitDays: randomFloat(0.5, 5),
      }))

      return successResponse(data)
    },
  },
] as MockMethod[]
