import Mock from 'mockjs'
import type { ApiResponse, User, UserRole } from '../types'

const users: Record<string, { password: string; user: Omit<User, 'token'> }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      role: 'super_admin',
      avatar: '',
      email: 'admin@charging.com',
      phone: '13800000001'
    }
  },
  operation: {
    password: 'operation123',
    user: {
      id: '2',
      username: 'operation',
      role: 'operation_admin',
      avatar: '',
      email: 'operation@charging.com',
      phone: '13800000002'
    }
  },
  maintenance: {
    password: 'maintenance123',
    user: {
      id: '3',
      username: 'maintenance',
      role: 'maintenance',
      avatar: '',
      email: 'maintenance@charging.com',
      phone: '13800000003'
    }
  },
  finance: {
    password: 'finance123',
    user: {
      id: '4',
      username: 'finance',
      role: 'finance',
      avatar: '',
      email: 'finance@charging.com',
      phone: '13800000004'
    }
  }
}

export function setupUserMock() {
  Mock.mock('/api/user/login', 'post', (options: any) => {
    const { username, password } = JSON.parse(options.body)
    const userInfo = users[username]

    if (!userInfo) {
      return {
        code: 401,
        message: '用户不存在',
        data: null
      } as ApiResponse
    }

    if (userInfo.password !== password) {
      return {
        code: 401,
        message: '密码错误',
        data: null
      } as ApiResponse
    }

    const token = Mock.Random.guid()
    return {
      code: 200,
      message: '登录成功',
      data: {
        ...userInfo.user,
        token
      }
    } as ApiResponse<User>
  })

  Mock.mock('/api/user/info', 'get', () => {
    const token = Mock.Random.guid()
    return {
      code: 200,
      message: 'success',
      data: users.admin.user
    } as ApiResponse<Omit<User, 'token'>>
  })

  Mock.mock('/api/user/logout', 'post', () => {
    return {
      code: 200,
      message: '退出成功',
      data: null
    } as ApiResponse
  })
}

export const roleNames: Record<UserRole, string> = {
  super_admin: '超级管理员',
  operation_admin: '运营管理员',
  maintenance: '运维人员',
  finance: '财务人员'
}
