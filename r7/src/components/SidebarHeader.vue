<template>
  <div class="sidebar-header">
    <div class="user-info" @click="showUserMenu = !showUserMenu">
      <el-avatar :size="40" :src="currentUser?.avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
      <div class="user-detail">
        <span class="user-name">{{ currentUser?.nickname || currentUser?.username }}</span>
        <span class="user-status">
          <span
            class="status-dot"
            :class="statusClass"
          ></span>
          {{ statusText }}
        </span>
      </div>
      <el-icon class="arrow-icon"><ArrowDown /></el-icon>
    </div>
    
    <div class="header-actions">
      <el-tooltip content="添加好友" placement="bottom">
        <el-button type="text" @click="handleAddFriend">
          <el-icon><Plus /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="创建群聊" placement="bottom">
        <el-button type="text" @click="handleCreateGroup">
          <el-icon><UserFilled /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip :content="isDark ? '切换亮色模式' : '切换暗黑模式'" placement="bottom">
        <el-button type="text" @click="toggleTheme">
          <el-icon><Sunny v-if="!isDark" /><Moon v-else /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="网络状态" placement="bottom">
        <el-button type="text" @click="toggleConnection">
          <el-icon :class="{ 'is-disconnected': !isConnected }">
            <Connection />
          </el-icon>
        </el-button>
      </el-tooltip>
      
      <el-dropdown trigger="click" placement="bottom-end">
        <el-tooltip content="更多" placement="bottom">
          <el-button type="text">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
        </el-tooltip>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleSettings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-dropdown-item>
            <el-dropdown-item @click="handleLogout" divided>
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <el-popover
      v-model:visible="showUserMenu"
      placement="bottom-start"
      :width="200"
      trigger="manual"
    >
      <div class="user-menu">
        <div class="menu-item" @click="handleProfile">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </div>
        <div class="menu-item" @click="handleChangeStatus">
          <el-icon><CircleCheck /></el-icon>
          <span>在线状态</span>
        </div>
        <el-divider />
        <div class="menu-item" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </div>
      </div>
      <template #reference>
        <div class="hidden-reference"></div>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  ArrowDown,
  Plus,
  UserFilled,
  Sunny,
  Moon,
  Connection,
  MoreFilled,
  Setting,
  SwitchButton,
  CircleCheck
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useConnectionStore } from '@/stores/connection'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const connectionStore = useConnectionStore()

const showUserMenu = ref(false)

const currentUser = computed(() => userStore.userInfo)
const isDark = computed(() => themeStore.isDark)
const isConnected = computed(() => connectionStore.isConnected)

const statusClass = computed(() => {
  switch (currentUser.value?.status) {
    case 'online':
      return 'is-online'
    case 'away':
      return 'is-away'
    default:
      return 'is-offline'
  }
})

const statusText = computed(() => {
  switch (currentUser.value?.status) {
    case 'online':
      return '在线'
    case 'away':
      return '离开'
    default:
      return '离线'
  }
})

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const toggleConnection = () => {
  connectionStore.toggleConnection()
  ElMessage.info(
    connectionStore.isConnected ? '已连接' : '已断开连接'
  )
}

const handleAddFriend = () => {
  ElMessage.info('添加好友功能开发中')
}

const handleCreateGroup = () => {
  ElMessage.info('创建群聊功能开发中')
}

const handleSettings = () => {
  ElMessage.info('设置功能开发中')
}

const handleProfile = () => {
  ElMessage.info('个人资料功能开发中')
  showUserMenu.value = false
}

const handleChangeStatus = () => {
  const currentStatus = currentUser.value?.status || 'online'
  const nextStatus = currentStatus === 'online' ? 'away' : currentStatus === 'away' ? 'offline' : 'online'
  userStore.updateStatus(nextStatus)
  ElMessage.success(`状态已切换为: ${nextStatus === 'online' ? '在线' : nextStatus === 'away' ? '离开' : '离线'}`)
  showUserMenu.value = false
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
  ElMessage.success('已退出登录')
  showUserMenu.value = false
}
</script>

<style lang="scss" scoped>
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  .user-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .user-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #c0c4cc;

    &.is-online {
      background-color: #67c23a;
    }

    &.is-away {
      background-color: #e6a23c;
    }
  }

  .arrow-icon {
    font-size: 12px;
    color: #909399;
  }
}

.header-actions {
  display: flex;
  gap: 4px;

  .el-button {
    padding: 6px 8px;
  }

  .is-disconnected {
    color: #f56c6c;
  }
}

.user-menu {
  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
    font-size: 14px;
    color: #606266;

    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
    }

    .el-icon {
      font-size: 16px;
    }
  }
}

.dark-mode {
  .sidebar-header {
    background-color: #2a2a4a;
    border-bottom-color: #3a3a5a;

    .user-name {
      color: $text-color-dark;
    }

    .user-status {
      color: #6a6a8a;
    }

    .user-info:hover {
      background-color: #3a3a5a;
    }
  }
}
</style>
