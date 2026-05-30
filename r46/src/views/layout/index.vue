<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore, useUserStore, useThemeStore } from '@/stores'
import { usePermission } from '@/hooks'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { hasPermission } = usePermission()

const sidebarStyle = computed(() => ({
  width: menuStore.isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
}))

const mainStyle = computed(() => ({
  marginLeft: menuStore.isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
}))

const filteredMenuList = computed(() => {
  return menuStore.menuList.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })
})

const handleMenuClick = (path: string) => {
  router.push(path)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <div class="app-container">
    <aside class="sidebar" :style="sidebarStyle">
      <div class="logo">
        <el-icon size="32"><DataLine /></el-icon>
        <span v-show="!menuStore.isCollapsed" class="logo-text">医院运营系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="menuStore.isCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="var(--color-text-primary)"
        active-text-color="var(--color-primary)"
        class="menu-container"
        @select="handleMenuClick"
      >
        <el-menu-item
          v-for="item in filteredMenuList"
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>{{ item.name }}</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <header class="header">
      <div class="header-left">
        <el-button class="toggle-btn" text @click="menuStore.toggleCollapse">
          <el-icon :size="20">
            <component :is="menuStore.isCollapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-tooltip :content="themeStore.theme === 'light' ? '切换深色主题' : '切换浅色主题'">
          <el-button class="theme-btn" text @click="toggleTheme">
            <el-icon :size="20">
              <component :is="themeStore.theme === 'light' ? 'Moon' : 'Sunny'" />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown @command="handleLogout">
          <div class="user-info">
            <el-avatar :size="32" style="background-color: var(--color-primary)">
              {{ userStore.userInfo?.name?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="user-name">{{ userStore.userInfo?.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-content" :style="mainStyle">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--color-bg-primary);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-normal);
  z-index: 1000;
  overflow: hidden;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.logo-text {
  white-space: nowrap;
}

.menu-container {
  border-right: none;
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: var(--header-height);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  z-index: 999;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.toggle-btn {
  margin-right: var(--spacing-sm);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.theme-btn {
  margin-right: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.main-content {
  padding-top: var(--header-height);
  min-height: 100vh;
  transition: margin-left var(--transition-normal);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
