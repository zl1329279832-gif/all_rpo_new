import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, randomFloat } from './utils'

export default [
  {
    url: '/api/cost/structure',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取费用结构失败')
      }

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

      return successResponse(data)
    },
  },
  {
    url: '/api/cost/drug-ratio',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取药占比数据失败')
      }

      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const data = months.map((month) => ({
        month,
        drugRatio: randomFloat(30, 42),
        target: 40,
      }))

      return successResponse(data)
    },
  },
  {
    url: '/api/cost/payment',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取支付方式数据失败')
      }

      const data = [
        { type: '医保支付', amount: randomRange(3000000, 6000000), ratio: randomFloat(55, 70) },
        { type: '自费支付', amount: randomRange(1000000, 3000000), ratio: randomFloat(20, 35) },
        { type: '商业保险', amount: randomRange(500000, 1500000), ratio: randomFloat(5, 15) },
        { type: '其他支付', amount: randomRange(100000, 500000), ratio: randomFloat(1, 5) },
      ]

      return successResponse(data)
    },
  },
  {
    url: '/api/cost/department',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取科室费用数据失败')
      }

      const departments = ['内科', '外科', '妇产科', '儿科', '骨科', 'ICU', '心血管内科']
      const data = departments.map((dept) => ({
        department: dept,
        totalIncome: randomRange(1000000, 8000000),
        drugIncome: randomRange(300000, 3000000),
        examIncome: randomRange(200000, 2000000),
        treatmentIncome: randomRange(150000, 1500000),
        surgeryIncome: randomRange(100000, 2000000),
        drugRatio: randomFloat(30, 45),
      }))

      return successResponse(data)
    },
  },
] as MockMethod[]
