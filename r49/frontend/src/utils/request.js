import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 3000
      })

      if (res.code === 401) {
        ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore()
          userStore.logout().then(() => {
            location.reload()
          })
        })
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      return res
    }
  },
  (error) => {
    console.error('Response error:', error)

    if (error.response) {
      const { status } = error.response

      if (status === 401) {
        ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore()
          userStore.logout().then(() => {
            location.reload()
          })
        })
      } else if (status === 403) {
        ElMessage({
          message: '没有权限访问',
          type: 'error',
          duration: 3000
        })
      } else if (status === 404) {
        ElMessage({
          message: '请求的资源不存在',
          type: 'error',
          duration: 3000
        })
      } else if (status === 500) {
        ElMessage({
          message: '服务器内部错误',
          type: 'error',
          duration: 3000
        })
      } else {
        ElMessage({
          message: error.response.data?.message || error.message || '网络错误',
          type: 'error',
          duration: 3000
        })
      }
    } else {
      ElMessage({
        message: '网络连接失败，请检查网络',
        type: 'error',
        duration: 3000
      })
    }

    return Promise.reject(error)
  }
)

export default service
