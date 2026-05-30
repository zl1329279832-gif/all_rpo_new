import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, generateDepartmentData, randomRange, randomFloat } from './utils'

export default [
  {
    url: '/api/department/list',
    method: 'get',
    response: ({ query }: { query: { dateRange?: string; department?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取科室数据失败')
      }

      let data = generateDepartmentData()

      if (query.department && query.department !== 'all') {
        data = data.filter((d) => d.id === query.department)
      }

      return successResponse({
        list: data,
        total: data.length,
        page: 1,
        pageSize: 20,
      })
    },
  },
  {
    url: '/api/department/rank',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取科室排名失败')
      }

      const data = generateDepartmentData()
      return successResponse(data.sort((a, b) => b.income - a.income))
    },
  },
  {
    url: '/api/department/detail',
    method: 'get',
    response: ({ query }: { query: { id?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取科室详情失败')
      }

      const { id } = query

      if (!id) {
        return errorResponse(400, '缺少科室ID')
      }

      return successResponse({
        id,
        name: '内科',
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
      })
    },
  },
  {
    url: '/api/department/trend',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取科室趋势失败')
      }

      const months = ['1月', '2月', '3月', '4月', '5月', '6月']
      const data = months.map((month) => ({
        month,
        outpatient: randomRange(2000, 4000),
        inpatient: randomRange(500, 1000),
        income: randomRange(3000000, 6000000),
      }))

      return successResponse(data)
    },
  },
] as MockMethod[]
