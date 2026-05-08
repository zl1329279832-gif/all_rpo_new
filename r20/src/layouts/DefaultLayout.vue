<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import {
  HomeFilled,
  List,
  Plus,
  Folder,
  Histogram,
  Wallet,
  Setting,
  Sunny,
  Moon,
  Menu
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()

const isDark = computed(() => settingsStore.settings.darkMode)
const isCollapsed = ref(false)

const menuItems = [
  { path: '/', label: '仪表盘', icon: HomeFilled },
  { path: '/transactions', label: '账单列表', icon: List },
  { path: '/add-transaction', label: '记一笔', icon: Plus },
  { path: '/categories', label: '分类管理', icon: Folder },
  { path: '/budget', label: '预算管理', icon: Wallet },
  { path: '/statistics', label: '统计分析', icon: Histogram },
  { path: '/settings', label: '设置', icon: Setting }
]

function toggleDarkMode() {
  settingsStore.toggleDarkMode()
}

function handleSelect(path: string) {
  router.push(path)
}
</script>

<template>
  <el-container class="layout-container" :class="{ dark: isDark }">
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapsed">个人记账</span>
        <span v-else>💰</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapsed"
        class="sidebar-menu"
        background-color="transparent"
        :text-color="isDark ? '#e5e7eb' : '#374151'"
        active-text-color="#409EFF"
        @select="handleSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle-btn" @click="isCollapsed = !isCollapsed">
            <Menu />
          </el-icon>
          <span class="page-title">{{ route.meta.title }}</span>
        </div>
        <div class="header-right">
          <el-tooltip :content="isDark ? '切换亮色' : '切换暗色'" placement="bottom">
            <el-icon class="theme-toggle" @click="toggleDarkMode">
              <Moon v-if="!isDark" />
              <Sunny v-else />
            </el-icon>
          </el-tooltip>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-container.dark {
  background-color: #1f2937;
}

.sidebar {
  background-color: #f8fafc;
  transition: width 0.3s;
}

.layout-container.dark .sidebar {
  background-color: #111827;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #374151;
}

.layout-container.dark .logo {
  color: #e5e7eb;
}

.sidebar-menu {
  border-right: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.layout-container.dark .header {
  background-color: #111827;
  border-bottom-color: #374151;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
}

.layout-container.dark .toggle-btn {
  color: #9ca3af;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.layout-container.dark .page-title {
  color: #f3f4f6;
}

.theme-toggle {
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
}

.layout-container.dark .theme-toggle {
  color: #fbbf24;
}

.main-content {
  background-color: #f1f5f9;
  padding: 24px;
}

.layout-container.dark .main-content {
  background-color: #1f2937;
}
</style>
