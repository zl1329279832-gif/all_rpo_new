import { readUsers } from '../utils/storage'
import type { ApiResponse, User, LoginParams } from '../types'

function generateToken(): string {
  return 'token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

export async function login(params: LoginParams): Promise<ApiResponse<User>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = readUsers()
      const userInfo = users[params.username]

      if (!userInfo) {
        resolve({
          code: 401,
          message: '用户不存在',
          data: null as any
        })
        return
      }

      if (userInfo.password !== params.password) {
        resolve({
          code: 401,
          message: '密码错误',
          data: null as any
        })
        return
      }

      const token = generateToken()
      resolve({
        code: 200,
        message: '登录成功',
        data: {
          ...userInfo.user,
          token
        }
      })
    }, 300)
  })
}

export async function getUserInfo(): Promise<ApiResponse<Omit<User, 'token'>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = readUsers()
      resolve({
        code: 200,
        message: 'success',
        data: users.admin?.user || null
      })
    }, 200)
  })
}

export async function logout(): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '退出成功',
        data: null
      })
    }, 200)
  })
}
