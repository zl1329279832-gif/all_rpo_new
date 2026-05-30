import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, randomFloat, getDepartmentName } from './utils'

export default [
  {
    url: '/api/doctor/list',
    method: 'get',
    response: ({ query }: { query: { department?: string; page?: number; pageSize?: number } }) => {
      if (randomError()) {
        return errorResponse(500, '获取医生数据失败')
      }

      const { department = 'all', page = 1, pageSize = 10 } = query

      const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
      const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
      const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']

      const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'ophthalmology']

      const list = []
      const start = (page - 1) * pageSize
      for (let i = 0; i < pageSize; i++) {
        const deptId = departments[randomRange(0, departments.length - 1)]
        if (department !== 'all' && deptId !== department) continue
        list.push({
          id: `doc${start + i + 1}`,
          name: firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)],
          department: getDepartmentName(deptId),
          departmentId: deptId,
          title: titles[randomRange(0, 3)],
          outpatientCount: randomRange(100, 500),
          surgeryCount: randomRange(0, 100),
          dischargeCount: randomRange(50, 200),
          income: randomRange(500000, 2000000),
          avgCost: randomRange(200, 800),
          satisfaction: randomFloat(85, 99),
        })
      }

      return successResponse({
        list,
        total: 50,
        page: Number(page),
        pageSize: Number(pageSize),
      })
    },
  },
  {
    url: '/api/doctor/rank',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取医生排名失败')
      }

      const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
      const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']

      const data = []
      for (let i = 0; i < 10; i++) {
        data.push({
          id: `doc${i + 1}`,
          name: firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)],
          outpatientCount: randomRange(300, 600),
          income: randomRange(1000000, 3000000),
          satisfaction: randomFloat(90, 99),
          rank: i + 1,
        })
      }

      return successResponse(data)
    },
  },
  {
    url: '/api/doctor/detail',
    method: 'get',
    response: ({ query }: { query: { id?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取医生详情失败')
      }

      const { id } = query

      return successResponse({
        id,
        name: '张医生',
        department: '内科',
        title: '主任医师',
        age: randomRange(35, 55),
        yearsOfExperience: randomRange(10, 30),
        education: '博士',
        specialty: '心血管疾病',
        outpatientCount: randomRange(300, 500),
        surgeryCount: randomRange(50, 150),
        dischargeCount: randomRange(100, 250),
        income: randomRange(1500000, 3000000),
        avgCost: randomRange(300, 600),
        satisfaction: randomFloat(92, 98),
        patientCount: randomRange(2000, 5000),
        avgLengthOfStay: randomFloat(5, 10),
        readmissionRate: randomFloat(2, 8),
      })
    },
  },
] as MockMethod[]
