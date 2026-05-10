import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getCurrentUser } from '@/api/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const isTeacher = computed(() => user.value?.role === 'TEACHER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const loginAction = async (loginData) => {
    const res = await login(loginData)
    if (res.success) {
      const data = res.data
      setToken(data.token)
      setUser({
        id: data.userId,
        username: data.username,
        nickname: data.nickname,
        role: data.role,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar
      })
      ElMessage.success('登录成功')
      
      if (data.role === 'TEACHER' || data.role === 'ADMIN') {
        router.push('/teacher/courses')
      } else {
        router.push('/student/courses')
      }
    }
  }

  const logoutAction = async () => {
    try {
      await logout()
    } catch (e) {
      console.error(e)
    }
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    ElMessage.success('已退出登录')
    router.push('/login')
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return
    try {
      const res = await getCurrentUser()
      if (res.success) {
        setUser(res.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    isStudent,
    isTeacher,
    isAdmin,
    loginAction,
    logoutAction,
    fetchCurrentUser,
    setUser
  }
})
