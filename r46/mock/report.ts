import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, randomFloat, getDepartmentName, formatDate } from './utils'

export default [
  {
    url: '/api/report/list',
    method: 'get',
    response: ({ query }: { query: { department?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number } }) => {
      if (randomError()) {
        return errorResponse(500, '获取报表数据失败')
      }

      const { department = 'all', page = 1, pageSize = 20 } = query

      const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'ophthalmology', 'ent', 'dermatology', 'neurology', 'cardiology', 'respiratory', 'gastroenterology', 'orthopedics', 'icu', 'emergency']

      const list = []
      const start = (page - 1) * pageSize
      const today = new Date()

      for (let i = 0; i < pageSize; i++) {
        const deptId = departments[randomRange(0, departments.length - 1)]
        if (department !== 'all' && deptId !== department) continue

        const date = new Date(today)
        date.setDate(date.getDate() - randomRange(0, 30))

        list.push({
          id: `report${start + i + 1}`,
          department: getDepartmentName(deptId),
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

      return successResponse({
        list,
        total: 365,
        page: Number(page),
        pageSize: Number(pageSize),
      })
    },
  },
  {
    url: '/api/report/export',
    method: 'post',
    response: ({ body }: { body: { ids?: string[]; format?: string; department?: string; startDate?: string; endDate?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '导出报表失败')
      }

      const { ids = [], format = 'xlsx' } = body

      return successResponse({
        downloadUrl: `/api/report/download/${Date.now()}.${format}`,
        filename: `医院运营报表_${formatDate(new Date())}.${format}`,
        totalCount: ids.length || 100,
        format,
      })
    },
  },
  {
    url: '/api/report/summary',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取汇总数据失败')
      }

      return successResponse({
        totalOutpatient: randomRange(50000, 150000),
        totalInpatient: randomRange(8000, 20000),
        totalIncome: randomRange(50000000, 150000000),
        avgDrugRatio: randomFloat(32, 38),
        avgBedOccupancyRate: randomFloat(80, 92),
        avgWaitingTime: randomRange(20, 40),
      })
    },
  },
] as MockMethod[]
