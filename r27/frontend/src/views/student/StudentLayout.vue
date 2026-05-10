<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon :size="28" color="#fff"><Reading /></el-icon>
        <span>在线课程系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/student/courses">
          <el-icon><Collection /></el-icon>
          <span>课程中心</span>
        </el-menu-item>
        <el-menu-item index="/student/assignments">
          <el-icon><Document /></el-icon>
          <span>作业管理</span>
        </el-menu-item>
        <el-menu-item index="/student/grades">
          <el-icon><Trophy /></el-icon>
          <span>成绩查询</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>学生端</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :icon="User" />
              <span class="username">{{ userStore.user?.nickname }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  Reading, Collection, Document, Trophy, 
  User, ArrowDown, SwitchButton 
} from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => {
  if (route.path.includes('/courses')) return '/student/courses'
  if (route.path.includes('/assignments')) return '/student/assignments'
  if (route.path.includes('/grades')) return '/student/grades'
  return '/student/courses'
})

const currentPage = computed(() => {
  if (route.path.includes('/courses')) return '课程中心'
  if (route.path.includes('/assignments')) return '作业管理'
  if (route.path.includes('/grades')) return '成绩查询'
  return '首页'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logoutAction()
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.aside {
  background-color: #304156;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
}

.layout-container > el-container {
  margin-left: 220px;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}

.breadcrumb {
  color: #606266;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #606266;
}

.main {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 24px;
}
</style>
