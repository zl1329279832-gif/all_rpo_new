<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon><Menu /></el-icon>
        <span>组件配置平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/components">
          <el-icon><Grid /></el-icon>
          <span>组件列表</span>
        </el-menu-item>
        <el-menu-item index="/debug">
          <el-icon><Connection /></el-icon>
          <span>接口调试</span>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <span>请求历史</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-user">
          <el-icon><User /></el-icon>
          <span>管理员</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Menu,
  DataAnalysis,
  Grid,
  Connection,
  Clock,
  Document,
  User
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);
const pageTitle = computed(() => (route.meta?.title as string) || '');

const handleMenuSelect = (index: string) => {
  console.log('菜单点击:', index);
  router.push(index);
};
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
  cursor: pointer;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 0;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #409EFF;
  color: #fff;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
