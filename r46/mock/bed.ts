import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, formatDate, getDepartmentName } from './utils'

export default [
  {
    url: '/api/bed/list',
    method: 'get',
    response: ({ query }: { query: { department?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取床位数据失败')
      }

      const { department = 'all' } = query
      const departments = ['internal', 'surgery', 'gynecology', 'pediatrics', 'icu']
      const statuses: Array<'empty' | 'occupied' | 'reserved' | 'cleaning'> = ['empty', 'occupied', 'reserved', 'cleaning']
      const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴']
      const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳']

      const list = []
      const wards = ['1号楼', '2号楼', '3号楼', '4号楼']

      for (let ward of wards) {
        for (let i = 1; i <= 20; i++) {
          const deptId = departments[randomRange(0, departments.length - 1)]
          if (department !== 'all' && deptId !== department) continue

          const status = statuses[randomRange(0, 3)]
          const today = new Date()
          const admissionDate = new Date(today)
          admissionDate.setDate(admissionDate.getDate() - randomRange(0, 10))

          const expectedDischargeDate = new Date(admissionDate)
          expectedDischargeDate.setDate(expectedDischargeDate.getDate() + randomRange(3, 14))

          list.push({
            id: `bed${ward.replace('号楼', '')}-${i}`,
            ward,
            bedNo: `${ward}-${String(i).padStart(3, '0')}`,
            status,
            patientName: status === 'occupied' ? firstNames[randomRange(0, 9)] + lastNames[randomRange(0, 9)] : undefined,
            department: getDepartmentName(deptId),
            departmentId: deptId,
            admissionDate: status === 'occupied' ? formatDate(admissionDate) : undefined,
            expectedDischargeDate: status === 'occupied' ? formatDate(expectedDischargeDate) : undefined,
          })
        }
      }

      const totalBeds = list.length
      const occupiedBeds = list.filter((b) => b.status === 'occupied').length
      const emptyBeds = list.filter((b) => b.status === 'empty').length
      const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2)) : 0

      return successResponse({
        list,
        total: totalBeds,
        occupied: occupiedBeds,
        empty: emptyBeds,
        reserved: list.filter((b) => b.status === 'reserved').length,
        cleaning: list.filter((b) => b.status === 'cleaning').length,
        occupancyRate,
      })
    },
  },
  {
    url: '/api/bed/trend',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取床位趋势失败')
      }

      const months = ['1月', '2月', '3月', '4月', '5月', '6月']
      const data = months.map((month) => ({
        month,
        occupancyRate: randomRange(70, 95),
        turnoverRate: randomRange(10, 25),
        avgLengthOfStay: randomRange(5, 12),
      }))

      return successResponse(data)
    },
  },
  {
    url: '/api/bed/department',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取科室床位数据失败')
      }

      const departments = ['内科', '外科', '妇产科', '儿科', 'ICU', '骨科']
      const data = departments.map((dept) => {
        const total = randomRange(30, 100)
        const occupied = randomRange(Math.floor(total * 0.6), total)
        return {
          department: dept,
          totalBeds: total,
          occupiedBeds: occupied,
          emptyBeds: total - occupied,
          occupancyRate: Number(((occupied / total) * 100).toFixed(2)),
        }
      })

      return successResponse(data)
    },
  },
] as MockMethod[]
