import { login as _login, logout as _logout } from '@/services/dataService'

interface LoginParams {
  username: string
  password: string
}

export function login(params: LoginParams) {
  const result = _login(params.username, params.password)
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: {
      token: 'mock-token-' + Date.now(),
      userInfo: result.userInfo,
    },
  })
}

export function logout() {
  _logout()
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: null,
  })
}

export function getUserInfo() {
  const userInfo = JSON.parse(localStorage.getItem('hospital-user-info') || 'null')
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: userInfo,
  })
}
