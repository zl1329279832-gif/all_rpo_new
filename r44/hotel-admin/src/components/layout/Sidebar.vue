<template>
  <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
    <div class="sidebar-container">
      <div class="logo-container">
        <img src="/icons.svg" alt="Logo" class="logo-icon" />
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">酒店管理系统</span>
        </transition>
      </div>

      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          :collapse-transition="false"
          background-color="var(--el-menu-bg-color)"
          text-color="var(--el-menu-text-color)"
          active-text-color="var(--el-color-primary)"
          router
        >
          <template v-for="item in menuItems" :key="item.path">
            <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
              <template #title>
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
              </template>
              <el-menu-item
                v-for="child in item.children"
                :key="child.path"
                :index="child.path"
              >
                <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                <span>{{ child.title }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <div class="sidebar-footer">
        <el-tooltip :content="themeMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'" placement="right">
          <el-button
            class="theme-toggle-btn"
            :icon="themeMode === 'dark' ? Sunny : Moon"
            circle
            @click="handleToggleTheme"
          />
        </el-tooltip>
        <el-tooltip :content="collapsed ? '展开菜单' : '收起菜单'" placement="right">
          <el-button
            class="collapse-btn"
            :icon="collapsed ? Expand : Fold"
            circle
            @click="handleToggleCollapse"
          />
        </el-tooltip>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  Management,
  List,
  User,
  Calendar,
  Money,
  Bell,
  Document,
  Sunny,
  Moon,
  Fold,
  Expand,
  DataLine
} from '@element-plus/icons-vue'
import { useTheme } from '../../composables/useTheme'

interface MenuItem {
  path: string
  title: string
  icon: any
  children?: MenuItem[]
}

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
}>()

const route = useRoute()
const { themeMode, toggleTheme } = useTheme()

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    title: '数据概览',
    icon: DataAnalysis
  },
  {
    path: '/room-types',
    title: '客房管理',
    icon: Management,
    children: [
      { path: '/room-types', title: '客房类型', icon: Document },
      { path: '/daily-status', title: '每日房态', icon: Calendar }
    ]
  },
  {
    path: '/orders',
    title: '订单管理',
    icon: List
  },
  {
    path: '/price-strategy',
    title: '收益管理',
    icon: Money,
    children: [
      { path: '/price-strategy', title: '价格策略', icon: Document },
      { path: '/channel-performance', title: '渠道表现', icon: DataLine }
    ]
  },
  {
    path: '/member-profiling',
    title: '会员管理',
    icon: User
  },
  {
    path: '/complaints',
    title: '投诉处理',
    icon: Bell
  },
  {
    path: '/reports',
    title: '报表中心',
    icon: Document
  }
]

const activeMenu = computed(() => route.path)

const handleToggleTheme = () => {
  toggleTheme()
}

const handleToggleCollapse = () => {
  emit('toggle-collapse')
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100vh;
  flex-shrink: 0;
  background-color: var(--el-menu-bg-color);
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid var(--el-border-color);

  .sidebar-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-bottom: 1px solid var(--el-border-color);
    padding: 0 16px;

    .logo-icon {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }
  }

  .menu-scrollbar {
    flex: 1;
    overflow: hidden;
  }

  .sidebar-footer {
    padding: 8px 12px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 8px;
    align-items: center;
    border-top: 1px solid var(--el-border-color);

    .theme-toggle-btn,
    .collapse-btn {
      width: 36px;
      height: 36px;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
