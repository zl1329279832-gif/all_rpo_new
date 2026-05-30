import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError, randomRange, randomFloat, generateAlertData } from './utils'

export default [
  {
    url: '/api/alert/list',
    method: 'get',
    response: ({ query }: { query: { level?: string; status?: string; page?: number; pageSize?: number } }) => {
      if (randomError()) {
        return errorResponse(500, '获取预警列表失败')
      }

      const { level = '', status = '', page = 1, pageSize = 10 } = query

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

      return successResponse({
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        highCount: data.filter((d) => d.level === 'high').length,
        mediumCount: data.filter((d) => d.level === 'medium').length,
        lowCount: data.filter((d) => d.level === 'low').length,
        pendingCount: data.filter((d) => d.status === 'pending').length,
      })
    },
  },
  {
    url: '/api/alert/detail',
    method: 'get',
    response: ({ query }: { query: { id?: string } }) => {
      if (randomError()) {
        return errorResponse(500, '获取预警详情失败')
      }

      const { id } = query

      return successResponse({
        id,
        level: 'high',
        type: '床位紧张',
        department: 'ICU',
        description: 'ICU床位使用率持续高于预警阈值',
        value: 98,
        threshold: 95,
        time: '2024-01-15 10:30:00',
        status: 'pending',
        handler: null,
        handleTime: null,
        handleNote: null,
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
      })
    },
  },
  {
    url: '/api/alert/handle',
    method: 'post',
    response: ({ body }: { body: { id: string; status: string; note: string } }) => {
      if (randomError()) {
        return errorResponse(500, '处理预警失败')
      }

      const { id, status, note } = body

      if (!id || !status) {
        return errorResponse(400, '参数不完整')
      }

      return successResponse({
        id,
        status,
        handler: '系统管理员',
        handleTime: new Date().toISOString(),
        handleNote: note,
      })
    },
  },
  {
    url: '/api/alert/statistics',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '获取预警统计失败')
      }

      return successResponse({
        today: randomRange(3, 15),
        thisWeek: randomRange(15, 50),
        thisMonth: randomRange(50, 150),
        high: randomRange(1, 5),
        medium: randomRange(3, 10),
        low: randomRange(5, 20),
        pending: randomRange(5, 15),
        resolved: randomRange(30, 80),
      })
    },
  },
] as MockMethod[]
