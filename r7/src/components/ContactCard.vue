<template>
  <div
    class="contact-card"
    :class="{
      'is-active': isActive,
      'has-unread': unreadCount > 0
    }"
    @click="handleClick"
  >
    <div class="contact-avatar">
      <el-avatar :size="48" :src="avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
      
      <div
        class="status-indicator"
        :class="{
          'is-online': status === 'online',
          'is-offline': status === 'offline',
          'is-away': status === 'away'
        }"
        v-if="!isGroup"
      ></div>
      
      <el-badge
        :value="unreadCount"
        :max="99"
        :hidden="unreadCount === 0"
        class="unread-badge"
      >
      </el-badge>
    </div>
    
    <div class="contact-info">
      <div class="contact-header">
        <span class="contact-name">{{ name }}</span>
        <span class="contact-time" v-if="lastTime">
          {{ formatTime(lastTime) }}
        </span>
      </div>
      
      <div class="contact-preview" v-if="lastMessage">
        <span class="preview-sender" v-if="isGroup && lastMessage.senderId !== currentUserId">
          {{ getSenderName(lastMessage.senderId) }}:
        </span>
        <span class="preview-content">
          <el-icon v-if="lastMessage.type === 'image'"><Picture /></el-icon>
          {{ lastMessage.isRecalled ? '[消息已撤回]' : truncateText(lastMessage.content, 20) }}
        </span>
      </div>
      
      <div class="contact-status" v-if="!isGroup && !lastMessage">
        <span class="status-text" :class="status">
          {{ statusText }}
        </span>
        <span class="status-signature" v-if="signature">
          · {{ signature }}
        </span>
      </div>
    </div>
    
    <div class="contact-actions" v-if="showActions">
      <el-button type="primary" size="small" @click.stop="handleAction('chat')">
        发消息
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Picture } from '@element-plus/icons-vue'
import type { Message, User as UserType } from '@/types'
import { formatTime } from '@/utils'
import { useUserStore } from '@/stores/user'

interface Props {
  id: string
  name: string
  avatar: string
  status?: 'online' | 'offline' | 'away'
  signature?: string
  isGroup?: boolean
  unreadCount?: number
  lastMessage?: Message
  lastTime?: number
  isActive?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'offline',
  isGroup: false,
  unreadCount: 0,
  isActive: false,
  showActions: false
})

const emit = defineEmits<{
  click: [id: string]
  action: [action: string, id: string]
}>()

const userStore = useUserStore()

const currentUserId = computed(() => userStore.user?.id)

const statusText = computed(() => {
  switch (props.status) {
    case 'online':
      return '在线'
    case 'away':
      return '离开'
    default:
      return '离线'
  }
})

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const getSenderName = (senderId: string): string => {
  const user = userStore.getUserById(senderId)
  return user?.nickname || user?.username || '未知用户'
}

const handleClick = () => {
  emit('click', props.id)
}

const handleAction = (action: string) => {
  emit('action', action, props.id)
}
</script>

<style lang="scss" scoped>
.contact-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f5f7fa;
  }

  &.is-active {
    background-color: #ecf5ff;
    border-left: 3px solid #409eff;
  }

  .contact-avatar {
    position: relative;
    flex-shrink: 0;
  }

  .status-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    background-color: #c0c4cc;

    &.is-online {
      background-color: #67c23a;
    }

    &.is-away {
      background-color: #e6a23c;
    }

    &.is-offline {
      background-color: #c0c4cc;
    }
  }

  .unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
  }

  .contact-info {
    flex: 1;
    margin-left: 12px;
    min-width: 0;
  }

  .contact-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .contact-name {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contact-time {
    font-size: 12px;
    color: #c0c4cc;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .contact-preview {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #909399;
    overflow: hidden;
  }

  .preview-sender {
    color: #606266;
    margin-right: 4px;
  }

  .preview-content {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contact-status {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #909399;
    overflow: hidden;
  }

  .status-text {
    flex-shrink: 0;

    &.online {
      color: #67c23a;
    }

    &.away {
      color: #e6a23c;
    }
  }

  .status-signature {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contact-actions {
    flex-shrink: 0;
    margin-left: 12px;
  }
}

.dark-mode {
  .contact-card {
    border-bottom-color: #3a3a5a;

    &:hover {
      background-color: #2a2a4a;
    }

    &.is-active {
      background-color: #3a3a5a;
    }

    .contact-name {
      color: $text-color-dark;
    }

    .contact-time,
    .contact-preview,
    .contact-status {
      color: #6a6a8a;
    }

    .preview-sender {
      color: #8a8aaa;
    }

    .status-indicator {
      border-color: #1a1a2e;
    }
  }
}
</style>
