<template>
  <el-header class="app-header">
    <div class="header-left">
      <el-button
        class="toggle-btn"
        :icon="collapsed ? Expand : Fold"
        circle
        @click="handleToggleCollapse"
      />
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :to="item.path ? { path: item.path } : undefined"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-tooltip content="主题切换" placement="bottom">
        <el-button
          class="action-btn"
          :icon="themeMode === 'dark' ? Sunny : Moon"
          circle
          @click="handleToggleTheme"
        />
      </el-tooltip>

      <el-tooltip content="通知" placement="bottom">
        <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
          <el-button
            class="action-btn"
            :icon="Bell"
            circle
            @click="showNotificationPanel = !showNotificationPanel"
          />
        </el-badge>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleUserCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar">
            {{ userName.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ userName }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <transition name="slide-fade">
      <el-card v-if="showNotificationPanel" class="notification-panel" shadow="always">
        <template #header>
          <div class="notification-header">
            <span>通知中心</span>
            <el-button type="primary" link @click="markAllAsRead">全部已读</el-button>
          </div>
        </template>
        <el-scrollbar max-height="300px">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <el-avatar :size="36" :icon="getNotificationIcon(notification.type)" />
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-desc">{{ notification.content }}</div>
              <div class="notification-time">{{ notification.time }}</div>
            </div>
          </div>
          <div v-if="notifications.length === 0" class="empty-notification">
            <el-empty description="暂无通知" :image-size="60" />
          </div>
        </el-scrollbar>
      </el-card>
    </transition>
  </el-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  Sunny,
  Moon,
  Bell,
  User,
  Setting,
  SwitchButton,
  CaretBottom,
  Warning,
  InfoFilled,
  SuccessFilled
} from '@element-plus/icons-vue'
import { useTheme } from '../../composables/useTheme'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
}>()

const route = useRoute()
const { themeMode, toggleTheme } = useTheme()

const userName = ref('管理员')
const userAvatar = ref('')
const showNotificationPanel = ref(false)

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  title: string
  content: string
  time: string
  read: boolean
}

const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'info',
    title: '新订单提醒',
    content: '您有一个新的订单需要处理',
    time: '5分钟前',
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: '房间库存预警',
    content: '豪华大床房库存不足5间',
    time: '30分钟前',
    read: false
  },
  {
    id: '3',
    type: 'success',
    title: '会员升级',
    content: '会员张三升级为金卡会员',
    time: '2小时前',
    read: true
  }
])

const notificationCount = computed(() => notifications.value.filter(n => !n.read).length)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    title: item.meta?.title as string,
    path: item.path
  }))
})

const handleToggleCollapse = () => {
  emit('toggle-collapse')
}

const handleToggleTheme = () => {
  toggleTheme()
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('打开个人中心')
      break
    case 'settings':
      ElMessage.info('打开系统设置')
      break
    case 'logout':
      ElMessage.success('退出登录成功')
      break
  }
}

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    info: InfoFilled,
    warning: Warning,
    success: SuccessFilled
  }
  return iconMap[type] || InfoFilled
}

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('已全部标记为已读')
}
</script>

<style lang="scss" scoped>
.app-header {
  height: 60px;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  transition: all 0.3s ease;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .toggle-btn {
      width: 40px;
      height: 40px;
    }

    .breadcrumb {
      font-size: 14px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .action-btn {
      width: 40px;
      height: 40px;
    }

    .notification-badge {
      :deep(.el-badge__content) {
        top: 8px;
        right: 8px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-fill-color);
      }

      .user-name {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }
  }

  .notification-panel {
    position: absolute;
    top: 70px;
    right: 20px;
    width: 360px;
    z-index: 1000;

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-fill-color);
      }

      &.unread {
        background-color: var(--el-fill-color-light);
      }

      .notification-content {
        flex: 1;
        min-width: 0;

        .notification-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .notification-desc {
          font-size: 13px;
          color: var(--el-text-color-regular);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notification-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .empty-notification {
      padding: 20px 0;
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;

    .header-left {
      .breadcrumb {
        display: none;
      }
    }

    .header-right {
      .user-info .user-name {
        display: none;
      }
    }

    .notification-panel {
      width: calc(100% - 24px);
      right: 12px;
    }
  }
}
</style>
