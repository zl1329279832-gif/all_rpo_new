<template>
  <div class="chat-page" :class="{ 'dark-mode': isDark }">
    <div class="chat-layout">
      <div class="sidebar">
        <SidebarHeader />
        <SearchBox
          @select-contact="handleSelectContact"
          @select-message="handleSelectMessage"
        />
        <SessionList
          :sessions="chatStore.sessions"
          :current-session-id="chatStore.currentSessionId"
          @select-session="handleSelectSession"
          @select-contact="handleSelectContact"
        />
      </div>
      
      <div class="chat-main">
        <div class="chat-empty" v-if="!chatStore.currentSession">
          <el-icon :size="64" style="color: #c0c4cc"><ChatDotRound /></el-icon>
          <h3>选择一个聊天开始对话</h3>
          <p>从左侧列表选择联系人或群组</p>
        </div>
        
        <template v-else>
          <ChatHeader
            :current-session="chatStore.currentSession"
            :is-typing="isTyping"
            @toggle-info="showInfoPanel = !showInfoPanel"
            @jump-to-message="handleJumpToMessage"
          />
          
          <div class="chat-content">
            <MessageList
              ref="messageListRef"
              :messages="chatStore.currentMessages"
              :current-session="chatStore.currentSession"
              :is-loading="chatStore.isLoading"
              :has-more="false"
              @load-more="handleLoadMore"
            />
          </div>
          
          <div class="chat-input">
            <MessageInput
              @send="handleSendMessage"
            />
          </div>
        </template>
      </div>
      
      <div
        class="chat-info"
        v-show="showInfoPanel && chatStore.currentSession"
      >
        <ChatInfoPanel
          :current-session="chatStore.currentSession"
          @close="showInfoPanel = false"
          @clear-history="handleClearHistory"
          @delete-chat="handleDeleteChat"
          @quit-group="handleQuitGroup"
        />
      </div>
    </div>
    
    <el-notification
      v-for="notification in notifications"
      :key="notification.id"
      :title="notification.title"
      :message="notification.content"
      :position="'bottom-right'"
      :duration="4500"
      @close="removeNotification(notification.id)"
    />
    
    <div class="connection-status" v-if="!connectionStore.isConnected">
      <el-icon><Warning /></el-icon>
      <span>网络连接已断开</span>
      <el-button type="primary" size="small" @click="handleReconnect">
        重新连接
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { ChatDotRound, Warning } from '@element-plus/icons-vue'
import type { Contact, Notification as NotificationType, Message } from '@/types'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useThemeStore } from '@/stores/theme'
import { useConnectionStore } from '@/stores/connection'
import { v4 as uuidv4 } from 'uuid'

import SidebarHeader from '@/components/SidebarHeader.vue'
import SearchBox from '@/components/SearchBox.vue'
import SessionList from '@/components/SessionList.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import ChatInfoPanel from '@/components/ChatInfoPanel.vue'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const chatStore = useChatStore()
const themeStore = useThemeStore()
const connectionStore = useConnectionStore()

const messageListRef = ref<InstanceType<typeof MessageList>>()
const showInfoPanel = ref(false)
const isTyping = ref(false)
const notifications = ref<NotificationType[]>([])
let simulateInterval: number | null = null

const isDark = computed(() => themeStore.isDark)

const handleSelectSession = (sessionId: string) => {
  chatStore.selectSession(sessionId)
  showInfoPanel.value = false
}

const handleSelectContact = (contact: Contact) => {
  const existingSession = chatStore.sessions.find(s => 
    s.type === 'single' && s.id.includes(contact.id)
  )
  
  if (existingSession) {
    chatStore.selectSession(existingSession.id)
  } else {
    const newSessionId = `session_single_${Date.now()}`
    const newSession = {
      id: newSessionId,
      type: 'single' as const,
      name: contact.nickname || contact.username,
      avatar: contact.avatar,
      unreadCount: 0,
      createTime: Date.now()
    }
    
    chatStore.sessions.unshift(newSession)
    chatStore.selectSession(newSessionId)
  }
  
  showInfoPanel.value = false
}

const handleSelectMessage = (result: any) => {
  const session = chatStore.sessions.find(s => 
    chatStore.messages[s.id]?.some((m: Message) => m.id === result.id)
  )
  
  if (session) {
    chatStore.selectSession(session.id)
    
    setTimeout(() => {
      messageListRef.value?.scrollToMessage(result.id)
    }, 100)
  }
}

const handleJumpToMessage = (messageId: string) => {
  messageListRef.value?.scrollToMessage(messageId)
}

const handleSendMessage = (content: string, type: 'text' | 'image') => {
  if (!chatStore.currentSessionId) return
  
  try {
    chatStore.sendMessage(content, type)
    
    setTimeout(() => {
      simulateReceiveMessage()
    }, 1000 + Math.random() * 2000)
  } catch (error) {
    ElMessage.error('发送消息失败')
  }
}

const simulateReceiveMessage = () => {
  if (!chatStore.currentSessionId) return
  
  isTyping.value = true
  
  setTimeout(() => {
    isTyping.value = false
    
    const messages = [
      '你好！',
      '今天天气怎么样？',
      '最近在忙什么？',
      '有什么好玩的推荐吗？',
      '周末有空吗？',
      '这个功能真不错！',
      '收到，谢谢！',
      '好的，知道了',
      '让我想想...',
      '没问题！'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    const senderId = getRandomSenderId()
    
    chatStore.simulateReceiveMessage(
      chatStore.currentSessionId!,
      randomMessage,
      senderId
    )
    
    showNotification(randomMessage)
  }, 1500 + Math.random() * 1500)
}

const getRandomSenderId = (): string => {
  if (!chatStore.currentSession) return ''
  
  if (chatStore.currentSession.type === 'group' && chatStore.currentSession.members) {
    const members = chatStore.currentSession.members.filter(m => m.id !== userStore.user?.id)
    return members[Math.floor(Math.random() * members.length)]?.id || ''
  } else {
    return chatStore.currentSession.id.replace('session_single_', '')
  }
}

const showNotification = (content: string) => {
  const notification: NotificationType = {
    id: uuidv4(),
    type: 'message',
    title: chatStore.currentSession?.name || '新消息',
    content: content.length > 50 ? content.slice(0, 50) + '...' : content,
    timestamp: Date.now(),
    isRead: false
  }
  
  notifications.value.push(notification)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const handleLoadMore = () => {
  console.log('加载更多消息')
}

const handleClearHistory = () => {
  if (chatStore.currentSessionId) {
    chatStore.messages[chatStore.currentSessionId] = []
    ElMessage.success('聊天记录已清空')
  }
}

const handleDeleteChat = () => {
  if (chatStore.currentSessionId) {
    const index = chatStore.sessions.findIndex(s => s.id === chatStore.currentSessionId)
    if (index > -1) {
      chatStore.sessions.splice(index, 1)
      delete chatStore.messages[chatStore.currentSessionId]
      chatStore.currentSessionId = null
      showInfoPanel.value = false
    }
  }
}

const handleQuitGroup = () => {
  handleDeleteChat()
}

const handleReconnect = async () => {
  const success = await connectionStore.reconnect()
  if (success) {
    ElMessage.success('连接成功')
  } else {
    ElMessage.error('连接失败，请稍后重试')
  }
}

const startSimulation = () => {
  simulateInterval = window.setInterval(() => {
    if (Math.random() > 0.95 && chatStore.currentSessionId) {
      simulateReceiveMessage()
    }
  }, 10000)
}

const stopSimulation = () => {
  if (simulateInterval) {
    clearInterval(simulateInterval)
    simulateInterval = null
  }
}

onMounted(() => {
  themeStore.loadTheme()
  chatStore.loadFromStorage()
  
  if (chatStore.sessions.length > 0 && !chatStore.currentSessionId) {
    chatStore.selectSession(chatStore.sessions[0].id)
  }
  
  startSimulation()
})

onUnmounted(() => {
  stopSimulation()
})
</script>

<style lang="scss" scoped>
.chat-page {
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

.chat-layout {
  display: flex;
  height: 100%;
  background-color: #fff;
}

.sidebar {
  width: 300px;
  height: 100%;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  flex-shrink: 0;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  background-color: #f5f7fa;
  color: #909399;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-input {
  flex-shrink: 0;
}

.chat-info {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid #e4e7ed;
}

.connection-status {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  font-size: 14px;

  .el-icon {
    font-size: 18px;
  }
}

.dark-mode {
  .chat-page {
    background-color: #1a1a2e;
  }

  .chat-layout {
    background-color: #2a2a4a;
  }

  .sidebar {
    border-right-color: #3a3a5a;
    background-color: #2a2a4a;
  }

  .chat-empty {
    background-color: #1a1a2e;
    color: #6a6a8a;
  }

  .chat-info {
    border-left-color: #3a3a5a;
  }
}
</style>
