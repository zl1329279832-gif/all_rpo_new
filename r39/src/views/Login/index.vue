<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { usePermissionStore } from '../../stores/permission'
import { useAppStore } from '../../stores/app'
import { User, Lock, Sunny, Moon } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const appStore = useAppStore()

const loading = ref(false)
const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
  remember: true
})

const accountOptions = [
  { username: 'admin', password: 'admin123', label: '超级管理员' },
  { username: 'operation', password: 'operation123', label: '运营管理员' },
  { username: 'maintenance', password: 'maintenance123', label: '运维人员' },
  { username: 'finance', password: 'finance123', label: '财务人员' }
]

async function handleLogin() {
  loading.value = true
  try {
    const res = await userStore.handleLogin(loginForm)
    if (res.code === 200) {
      permissionStore.filterMenusByRole(userStore.userRole)
      router.push('/dashboard')
    }
  } finally {
    loading.value = false
  }
}

function selectAccount(account: typeof accountOptions[0]) {
  loginForm.username = account.username
  loginForm.password = account.password
}
</script>

<template>
  <div class="login-container">
    <div class="theme-toggle">
      <el-button
        :icon="appStore.isDarkMode ? Sunny : Moon"
        circle
        @click="appStore.toggleDarkMode()"
      />
    </div>

    <div class="login-card">
      <div class="login-header">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <h1 class="login-title">充电站运营管理系统</h1>
        <p class="login-subtitle">Charging Station Management System</p>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        class="login-form"
        @submit.prevent="handleLogin"
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
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="account-tips">
        <p class="tips-title">快捷登录账号：</p>
        <div class="account-list">
          <el-tag
            v-for="account in accountOptions"
            :key="account.username"
            class="account-tag"
            @click="selectAccount(account)"
          >
            {{ account.label }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: float 25s ease-in-out infinite reverse;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-30px, 30px); }
}

.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  transition: background-color var(--transition-duration);
}

:deep(.dark) .login-card {
  background: rgba(22, 27, 34, 0.95);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .logo-icon {
    width: 56px;
    height: 56px;
    color: #409eff;
    margin-bottom: 16px;
  }
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.account-tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.tips-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-tag {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
