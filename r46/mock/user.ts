import type { MockMethod } from 'vite-plugin-mock'
import { successResponse, errorResponse, randomError } from './utils'

export default [
  {
    url: '/api/user/login',
    method: 'post',
    response: ({ body }: { body: { username: string; password: string } }) => {
      if (randomError()) {
        return errorResponse(500, '服务器错误')
      }

      const { username, password } = body

      if (!username || !password) {
        return errorResponse(400, '用户名和密码不能为空')
      }

      let userInfo = null
      let permissions: string[] = []

      if (username === 'admin' && password === 'admin123') {
        userInfo = {
          id: '1',
          username: 'admin',
          name: '系统管理员',
          role: 'admin',
          avatar: '',
        }
        permissions = [
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
        ]
      } else if (username === 'director' && password === 'director123') {
        userInfo = {
          id: '2',
          username: 'director',
          name: '张主任',
          role: 'director',
          department: 'internal',
          avatar: '',
        }
        permissions = [
          'overview:view',
          'department:view',
          'doctor:view',
          'bed:view',
          'report:view',
          'report:export',
        ]
      } else if (username === 'leader' && password === 'leader123') {
        userInfo = {
          id: '3',
          username: 'leader',
          name: '王院长',
          role: 'leader',
          avatar: '',
        }
        permissions = [
          'overview:view',
          'department:view',
          'doctor:view',
          'alert:view',
          'report:view',
        ]
      } else {
        return errorResponse(401, '用户名或密码错误')
      }

      return successResponse({
        token: 'mock-token-' + Date.now(),
        userInfo: {
          ...userInfo,
          permissions,
        },
      })
    },
  },
  {
    url: '/api/user/info',
    method: 'get',
    response: () => {
      if (randomError()) {
        return errorResponse(500, '服务器错误')
      }

      return successResponse({
        id: '1',
        username: 'admin',
        name: '系统管理员',
        role: 'admin',
        avatar: '',
        permissions: [
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
        ],
      })
    },
  },
  {
    url: '/api/user/logout',
    method: 'post',
    response: () => {
      return successResponse(null)
    },
  },
] as MockMethod[]
