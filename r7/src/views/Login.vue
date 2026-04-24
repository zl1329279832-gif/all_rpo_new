<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48"><ChatDotRound /></el-icon>
        </div>
        <h1 class="title">前端聊天系统</h1>
        <p class="subtitle">欢迎使用，输入用户名开始聊天</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码（任意密码即可）"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            @click="handleLogin"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p class="tips">
          提示：任意用户名和密码都可以登录
        </p>
        <div class="demo-accounts">
          <span class="demo-label">演示账号：</span>
          <el-tag size="small" @click="fillDemoAccount('demo_user')">demo_user</el-tag>
          <el-tag size="small" @click="fillDemoAccount('test_user')">test_user</el-tag>
        </div>
      </div>
    </div>
    
    <div class="login-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ChatDotRound, User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const loginFormRef = ref<FormInstance>()
const isLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 1, message: '密码不能为空', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      
      setTimeout(() => {
        const success = userStore.login(loginForm.username, loginForm.password)
        
        if (success) {
          ElMessage.success('登录成功')
          router.push('/chat')
        } else {
          ElMessage.error('登录失败')
        }
        
        isLoading.value = false
      }, 800)
    }
  })
}

const fillDemoAccount = (username: string) => {
  loginForm.username = username
  loginForm.password = '123456'
}

onMounted(() => {
  themeStore.loadTheme()
})
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 420px;
  padding: 48px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;

  .logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  .login-button {
    width: 100%;
    font-weight: 600;
    letter-spacing: 2px;
  }
}

.login-footer {
  margin-top: 32px;
  text-align: center;

  .tips {
    font-size: 13px;
    color: #909399;
    margin: 0 0 12px 0;
  }

  .demo-accounts {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .demo-label {
      font-size: 13px;
      color: #606266;
    }

    .el-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-shapes {
  .shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    background: #fff;
    animation: float 20s infinite ease-in-out;
  }

  .shape-1 {
    width: 400px;
    height: 400px;
    top: -100px;
    left: -100px;
    animation-delay: 0s;
  }

  .shape-2 {
    width: 300px;
    height: 300px;
    bottom: -50px;
    right: -50px;
    animation-delay: -5s;
  }

  .shape-3 {
    width: 200px;
    height: 200px;
    top: 50%;
    right: 20%;
    animation-delay: -10s;
  }

  .shape-4 {
    width: 150px;
    height: 150px;
    bottom: 20%;
    left: 15%;
    animation-delay: -15s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(50px, 50px) rotate(90deg);
  }
  50% {
    transform: translate(0, 100px) rotate(180deg);
  }
  75% {
    transform: translate(-50px, 50px) rotate(270deg);
  }
}

.dark-mode {
  .login-page {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .login-container {
    background-color: rgba(42, 42, 74, 0.95);
  }

  .login-header {
    .title {
      color: $text-color-dark;
    }

    .subtitle {
      color: #6a6a8a;
    }
  }

  .login-footer {
    .tips {
      color: #6a6a8a;
    }

    .demo-label {
      color: #8a8aaa;
    }
  }

  .background-shapes {
    .shape {
      background: #667eea;
      opacity: 0.15;
    }
  }
}
</style>
