<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { login } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)
const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async (formRef: any) => {
  if (!formRef) return

  await formRef.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        const result = await login(loginForm)
        userStore.setToken(result.data.token)
        userStore.setUserInfo(result.data.userInfo)

        const redirect = route.query.redirect as string
        ElMessage.success('登录成功')
        router.push(redirect || '/')
      } catch (error) {
        console.error('Login failed:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="48" color="var(--color-primary)"><DataLine /></el-icon>
        <h1 class="title">医院运营指标系统</h1>
        <p class="subtitle">Hospital Operation Dashboard</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin(loginFormRef)"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin(loginFormRef)"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-tips">
        <p>测试账号：</p>
        <p>管理员：admin / admin123</p>
        <p>科室主任：director / director123</p>
        <p>院领导：leader / leader123</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.login-card {
  width: 420px;
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.title {
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
  margin: var(--spacing-md) 0 var(--spacing-xs);
  font-weight: 600;
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-placeholder);
}

.login-form {
  margin-bottom: var(--spacing-lg);
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: var(--font-size-base);
  font-weight: 500;
}

.login-tips {
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.login-tips p {
  margin: 0;
}
</style>
