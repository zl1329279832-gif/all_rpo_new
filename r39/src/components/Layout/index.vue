<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useUserStore } from '../../stores/user'
import { usePermissionStore } from '../../stores/permission'
import {
  Fold,
  Expand,
  Sunny,
  Moon,
  UserFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { roleNames } from '../../mock/user'

const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const router = useRouter()
const route = useRoute()

const sidebarWidth = computed(() =>
  appStore.sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
)

const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.handleLogout()
  router.push('/login')
}

const iconComponents: Record<string, any> = {
  Odometer: () => import('@element-plus/icons-vue').then(m => m.Odometer),
  Location: () => import('@element-plus/icons-vue').then(m => m.Location),
  Monitor: () => import('@element-plus/icons-vue').then(m => m.Monitor),
  Warning: () => import('@element-plus/icons-vue').then(m => m.Warning),
  Document: () => import('@element-plus/icons-vue').then(m => m.Document),
  Coin: () => import('@element-plus/icons-vue').then(m => m.Coin),
  DataLine: () => import('@element-plus/icons-vue').then(m => m.DataLine)
}
</script>

<template>
  <div class="layout-container">
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">充电站管理</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        class="sidebar-menu"
        background-color="transparent"
        text-color="var(--text-regular)"
        active-text-color="var(--primary-color)"
      >
        <el-menu-item
          v-for="menu in permissionStore.menus"
          :key="menu.id"
          :index="menu.path"
          @click="router.push(menu.path)"
        >
          <component :is="(iconComponents as any)[menu.icon]" />
          <template #title>{{ menu.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="appStore.sidebarCollapsed ? Expand : Fold"
            circle
            @click="appStore.toggleSidebar()"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button
            :icon="appStore.isDarkMode ? Sunny : Moon"
            circle
            @click="appStore.toggleDarkMode()"
          />
          <el-dropdown @command="handleLogout">
            <span class="user-info">
              <el-icon class="user-avatar"><UserFilled /></el-icon>
              <span class="user-name">{{ userStore.user?.username }}</span>
              <el-tag size="small" type="info">{{ roleNames[userStore.userRole] }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" :icon="SwitchButton">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  background: var(--bg-color);
}

.sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border-light);
  transition: width var(--transition-duration);
  display: flex;
  flex-direction: column;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid var(--border-light);

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--primary-color);
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;

  :deep(.el-menu-item) {
    height: 50px;
    margin: 4px 8px;
    border-radius: 6px;

    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: rgba(64, 158, 255, 0.15);
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: var(--header-height);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-color);
  }
}

.user-avatar {
  font-size: 20px;
  color: var(--text-regular);
}

.user-name {
  color: var(--text-primary);
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: var(--bg-color);
}
</style>
