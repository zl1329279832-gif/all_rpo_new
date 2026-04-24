<template>
  <div class="chat-info-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        {{ isGroup ? '群聊信息' : '联系人信息' }}
      </h3>
      <el-button type="text" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    
    <div class="panel-content" v-if="currentSession">
      <div class="info-section">
        <div class="avatar-section">
          <el-avatar :size="80" :src="currentSession.avatar">
            <el-icon :size="40"><User /></el-icon>
          </el-avatar>
          <h4 class="session-name">{{ currentSession.name }}</h4>
          <p class="session-id">ID: {{ currentSession.id }}</p>
        </div>
      </div>
      
      <el-divider v-if="isGroup && currentSession.members">群成员 ({{ currentSession.members.length }})</el-divider>
      
      <div class="members-section" v-if="isGroup && currentSession.members">
        <div
          v-for="member in currentSession.members"
          :key="member.id"
          class="member-item"
        >
          <div class="member-avatar">
            <el-avatar :size="36" :src="member.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div
              class="status-indicator"
              :class="{
                'is-online': member.status === 'online',
                'is-offline': member.status === 'offline',
                'is-away': member.status === 'away'
              }"
            ></div>
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.nickname || member.username }}</span>
            <span class="member-status">{{ getStatusText(member.status) }}</span>
          </div>
          <el-tag
            v-if="member.id === currentSession.ownerId"
            type="warning"
            size="small"
          >
            群主
          </el-tag>
        </div>
      </div>
      
      <el-divider v-else-if="!isGroup">详细信息</el-divider>
      
      <div class="detail-section" v-if="!isGroup && contactInfo">
        <div class="detail-item">
          <span class="detail-label">昵称</span>
          <span class="detail-value">{{ contactInfo.nickname || contactInfo.username }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">用户名</span>
          <span class="detail-value">{{ contactInfo.username }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">个性签名</span>
          <span class="detail-value">{{ contactInfo.signature || '暂无' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">在线状态</span>
          <span class="detail-value" :class="contactInfo.status">
            {{ getStatusText(contactInfo.status) }}
          </span>
        </div>
        <div class="detail-item" v-if="contactInfo.lastOnlineTime">
          <span class="detail-label">最后在线</span>
          <span class="detail-value">{{ formatTime(contactInfo.lastOnlineTime) }}</span>
        </div>
      </div>
      
      <el-divider>设置</el-divider>
      
      <div class="settings-section">
        <div class="setting-item">
          <span class="setting-label">消息免打扰</span>
          <el-switch v-model="settings.mute" />
        </div>
        <div class="setting-item">
          <span class="setting-label">置顶聊天</span>
          <el-switch v-model="settings.pin" />
        </div>
        <div class="setting-item" v-if="!isGroup">
          <span class="setting-label">特别关心</span>
          <el-switch v-model="settings.star" />
        </div>
      </div>
      
      <el-divider>操作</el-divider>
      
      <div class="actions-section">
        <el-button type="danger" plain block @click="handleClearHistory">
          清空聊天记录
        </el-button>
        <el-button type="warning" plain block @click="handleDeleteChat">
          删除聊天
        </el-button>
        <el-button type="danger" plain block v-if="isGroup" @click="handleQuitGroup">
          退出群聊
        </el-button>
      </div>
    </div>
    
    <div class="panel-empty" v-else>
      <el-icon :size="48" style="color: #c0c4cc"><UserFilled /></el-icon>
      <p>请选择一个聊天</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import type { ChatSession, User as UserType } from '@/types'
import { formatTime } from '@/utils'
import { useUserStore } from '@/stores/user'

interface Props {
  currentSession: ChatSession | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  clearHistory: []
  deleteChat: []
  quitGroup: []
}>()

const userStore = useUserStore()

const settings = ref({
  mute: false,
  pin: false,
  star: false
})

const isGroup = computed(() => props.currentSession?.type === 'group')

const contactInfo = computed<UserType | undefined>(() => {
  if (isGroup.value || !props.currentSession) return undefined
  return userStore.getUserById(props.currentSession.id)
})

const getStatusText = (status: string): string => {
  switch (status) {
    case 'online':
      return '在线'
    case 'away':
      return '离开'
    default:
      return '离线'
  }
}

const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有聊天记录吗？此操作不可恢复。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('clearHistory')
    ElMessage.success('聊天记录已清空')
  } catch {
    // 用户取消
  }
}

const handleDeleteChat = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此聊天吗？聊天记录将被清空。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('deleteChat')
    ElMessage.success('聊天已删除')
  } catch {
    // 用户取消
  }
}

const handleQuitGroup = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出此群聊吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('quitGroup')
    ElMessage.success('已退出群聊')
  } catch {
    // 用户取消
  }
}

watch(
  () => props.currentSession,
  (newSession) => {
    if (newSession) {
      settings.value = {
        mute: false,
        pin: false,
        star: false
      }
    }
  }
)
</script>

<style lang="scss" scoped>
.chat-info-panel {
  width: 300px;
  height: 100%;
  background-color: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;
  }

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;
  }

  .info-section {
    padding: 20px 0;
    text-align: center;

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .session-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .session-id {
      margin: 0;
      font-size: 12px;
      color: #909399;
    }
  }

  .members-section {
    padding-bottom: 12px;
  }

  .member-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    gap: 12px;

    .member-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .status-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #fff;
      background-color: #c0c4cc;

      &.is-online {
        background-color: #67c23a;
      }

      &.is-away {
        background-color: #e6a23c;
      }
    }

    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .member-name {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .member-status {
      font-size: 12px;
      color: #909399;
    }
  }

  .detail-section {
    padding-bottom: 12px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 14px;
      color: #909399;
      flex-shrink: 0;
    }

    .detail-value {
      font-size: 14px;
      color: #303133;
      text-align: right;
      max-width: 60%;
      word-break: break-all;

      &.online {
        color: #67c23a;
      }

      &.away {
        color: #e6a23c;
      }

      &.offline {
        color: #909399;
      }
    }
  }

  .settings-section {
    padding-bottom: 12px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;

    .setting-label {
      font-size: 14px;
      color: #303133;
    }
  }

  .actions-section {
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .panel-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    color: #909399;

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

.dark-mode {
  .chat-info-panel {
    background-color: #2a2a4a;
    border-left-color: #3a3a5a;

    .panel-header {
      border-bottom-color: #3a3a5a;
    }

    .panel-title,
    .session-name,
    .member-name,
    .detail-value,
    .setting-label {
      color: $text-color-dark;
    }

    .session-id,
    .member-status,
    .detail-label,
    .panel-empty {
      color: #6a6a8a;
    }

    .member-item,
    .detail-item {
      border-bottom-color: #3a3a5a;
    }

    .status-indicator {
      border-color: #2a2a4a;
    }
  }
}
</style>
