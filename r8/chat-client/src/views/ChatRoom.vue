<template>
  <div class="chat-room">
    <el-container class="chat-container">
      <el-aside width="280px" class="left-sidebar">
        <div class="user-header">
          <div class="user-info">
            <el-avatar :size="40" class="user-avatar">
              {{ userStore.userInfo?.nickname?.[0] || userStore.userInfo?.username?.[0] || 'U' }}
            </el-avatar>
            <div class="user-detail">
              <div class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</div>
              <div class="user-status">
                <span class="status-dot online"></span>
                <span>在线</span>
              </div>
            </div>
          </div>
          <el-button type="danger" link @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </div>

        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索联系人、群组"
            prefix-icon="Search"
            clearable
          />
        </div>

        <el-tabs v-model="activeTab" class="chat-tabs">
          <el-tab-pane label="消息" name="messages">
            <div class="session-list" v-loading="loading">
              <div
                v-for="session in filteredSessions"
                :key="session.id"
                class="session-item"
                :class="{ active: currentSession?.id === session.id }"
                @click="selectSession(session)"
              >
                <el-avatar :size="44" class="session-avatar">
                  {{ session.name?.[0] || '?' }}
                </el-avatar>
                <div class="session-content">
                  <div class="session-header">
                    <span class="session-name">{{ session.name }}</span>
                    <span class="session-time">{{ session.lastTime }}</span>
                  </div>
                  <div class="session-footer">
                    <span class="session-message">{{ session.lastMessage || '暂无消息' }}</span>
                    <el-badge :value="session.unreadCount" :hidden="session.unreadCount === 0" class="unread-badge">
                    </el-badge>
                  </div>
                </div>
              </div>
              
              <div v-if="filteredSessions.length === 0" class="empty-session">
                暂无消息
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="联系人" name="contacts">
            <div class="contact-section">
              <div class="section-header">
                <span>好友列表</span>
                <el-button type="primary" link size="small" @click="showAddFriend = true">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
              <div class="contact-list">
                <div
                  v-for="friend in filteredFriends"
                  :key="friend.id"
                  class="contact-item"
                  @click="startPrivateChat(friend)"
                >
                  <el-avatar :size="40" class="contact-avatar">
                    {{ friend.friendInfo?.nickname?.[0] || friend.friendInfo?.username?.[0] || '?' }}
                  </el-avatar>
                  <div class="contact-info">
                    <div class="contact-name">
                      {{ friend.remark || friend.friendInfo?.nickname || friend.friendInfo?.username }}
                    </div>
                    <div class="contact-status">
                      <span :class="['status-dot', friend.friendInfo?.online ? 'online' : 'offline']"></span>
                      <span>{{ friend.friendInfo?.online ? '在线' : '离线' }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="filteredFriends.length === 0" class="empty-contact">
                  暂无好友
                </div>
              </div>
            </div>

            <div class="contact-section">
              <div class="section-header">
                <span>我的群组</span>
                <el-button type="primary" link size="small" @click="showCreateGroup = true">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
              <div class="contact-list">
                <div
                  v-for="group in filteredGroups"
                  :key="group.id"
                  class="contact-item"
                  @click="startGroupChat(group)"
                >
                  <el-avatar :size="40" class="contact-avatar group-avatar">
                    {{ group.groupName?.[0] || '?' }}
                  </el-avatar>
                  <div class="contact-info">
                    <div class="contact-name">{{ group.groupName }}</div>
                    <div class="contact-status">{{ group.memberCount }} 人</div>
                  </div>
                </div>
                <div v-if="filteredGroups.length === 0" class="empty-contact">
                  暂无群组
                </div>
              </div>
            </div>

            <div class="contact-section">
              <div class="section-header">
                <span>好友申请</span>
                <el-badge :value="pendingRequests.length" :hidden="pendingRequests.length === 0">
                </el-badge>
              </div>
              <div class="contact-list">
                <div
                  v-for="request in pendingRequests"
                  :key="request.id"
                  class="request-item"
                >
                  <el-avatar :size="40" class="contact-avatar">
                    {{ request.friendInfo?.nickname?.[0] || request.friendInfo?.username?.[0] || '?' }}
                  </el-avatar>
                  <div class="contact-info">
                    <div class="contact-name">
                      {{ request.friendInfo?.nickname || request.friendInfo?.username }}
                    </div>
                    <div class="contact-status">请求添加好友</div>
                  </div>
                  <div class="request-actions">
                    <el-button type="primary" size="small" @click="acceptFriendRequest(request)">
                      接受
                    </el-button>
                    <el-button size="small" @click="rejectFriendRequest(request)">
                      拒绝
                    </el-button>
                  </div>
                </div>
                <div v-if="pendingRequests.length === 0" class="empty-contact">
                  暂无好友申请
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-aside>

      <el-main class="chat-main">
        <template v-if="currentSession">
          <div class="chat-header">
            <div class="chat-target">
              <el-avatar :size="36">
                {{ currentSession.name?.[0] || '?' }}
              </el-avatar>
              <div class="chat-target-info">
                <div class="chat-target-name">{{ currentSession.name }}</div>
              </div>
            </div>
            <el-button type="primary" link @click="showGroupMembers = true" v-if="currentSession.chatType === 2">
              <el-icon><UserFilled /></el-icon>
              群成员
            </el-button>
          </div>

          <div class="chat-messages" ref="messagesContainer">
            <div
              v-for="message in displayMessages"
              :key="message.id || message.sendTime"
              class="message-item"
              :class="{ 'message-self': isSelfMessage(message) }"
            >
              <el-avatar :size="36" class="message-avatar">
                {{ message.fromUser?.nickname?.[0] || message.fromUser?.username?.[0] || '?' }}
              </el-avatar>
              <div class="message-content">
                <div class="message-info" v-if="!isSelfMessage(message)">
                  <span class="message-sender">
                    {{ message.fromUser?.nickname || message.fromUser?.username }}
                  </span>
                  <span class="message-time">{{ formatTime(message.sendTime) }}</span>
                </div>
                <div class="message-bubble">
                  <div class="message-text">{{ message.content }}</div>
                </div>
              </div>
            </div>

            <div v-if="loadingMessages" class="loading-messages">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
          </div>

          <div class="chat-input-area">
            <div class="input-toolbar">
              <el-button type="primary" link>
                <el-icon><Picture /></el-icon>
              </el-button>
              <el-button type="primary" link>
                <el-icon><Document /></el-icon>
              </el-button>
            </div>
            <el-input
              v-model="messageContent"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              class="message-textarea"
              @keyup.enter.ctrl="sendMessage"
            />
            <div class="input-actions">
              <span class="input-hint">按 Ctrl+Enter 发送</span>
              <el-button type="primary" :disabled="!messageContent.trim()" @click="sendMessage">
                发送
              </el-button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="empty-chat">
            <el-icon :size="80" color="#909399"><ChatDotRound /></el-icon>
            <p>选择一个联系人开始聊天</p>
          </div>
        </template>
      </el-main>
    </el-container>

    <el-dialog v-model="showAddFriend" title="添加好友" width="400px">
      <el-input
        v-model="searchUserKeyword"
        placeholder="搜索用户名"
        prefix-icon="Search"
        class="search-user-input"
        @keyup.enter="searchUsers"
      />
      <el-button type="primary" class="search-btn" @click="searchUsers">搜索</el-button>

      <div class="search-results" v-if="searchResults.length > 0">
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="search-result-item"
        >
          <el-avatar :size="40">
            {{ user.nickname?.[0] || user.username?.[0] || '?' }}
          </el-avatar>
          <div class="result-info">
            <div class="result-name">{{ user.nickname || user.username }}</div>
            <div class="result-username">@{{ user.username }}</div>
          </div>
          <el-button type="primary" size="small" @click="addFriend(user)">
            添加
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showCreateGroup" title="创建群组" width="500px">
      <el-form label-width="80px">
        <el-form-item label="群名称">
          <el-input v-model="createGroupForm.groupName" placeholder="请输入群名称" />
        </el-form-item>
        <el-form-item label="群公告">
          <el-input
            v-model="createGroupForm.groupNotice"
            type="textarea"
            :rows="3"
            placeholder="请输入群公告（可选）"
          />
        </el-form-item>
        <el-form-item label="群成员">
          <el-select
            v-model="createGroupForm.memberIds"
            multiple
            filterable
            placeholder="选择群成员"
            style="width: 100%"
          >
            <el-option
              v-for="friend in chatStore.friends"
              :key="friend.friendId"
              :label="friend.remark || friend.friendInfo?.nickname || friend.friendInfo?.username"
              :value="friend.friendId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateGroup = false">取消</el-button>
        <el-button type="primary" :loading="creatingGroup" @click="createGroup">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showGroupMembers" title="群成员" width="400px">
      <div class="group-members-list">
        <div
          v-for="member in groupMembers"
          :key="member.id"
          class="group-member-item"
        >
          <el-avatar :size="36">
            {{ member.userInfo?.nickname?.[0] || member.userInfo?.username?.[0] || '?' }}
          </el-avatar>
          <div class="member-info">
            <span class="member-name">
              {{ member.nickname || member.userInfo?.nickname || member.userInfo?.username }}
            </span>
            <el-tag v-if="member.role === 1" size="small" type="danger">群主</el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  Search, Plus, SwitchButton, ChatDotRound, UserFilled,
  Picture, Document, Loading
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { webSocketService } from '@/services/websocket'
import { friendApi } from '@/api/friend'
import { groupApi } from '@/api/group'
import { messageApi } from '@/api/message'
import { userApi } from '@/api/user'
import { formatTime } from '@/utils/date'
import type { User, Friend, Group, GroupMember, Message, ChatSession } from '@/types'
import { ChatType, MessageType } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

const activeTab = ref('messages')
const searchKeyword = ref('')
const messageContent = ref('')
const loading = ref(false)
const loadingMessages = ref(false)

const showAddFriend = ref(false)
const showCreateGroup = ref(false)
const showGroupMembers = ref(false)
const searchUserKeyword = ref('')
const searchResults = ref<User[]>([])
const pendingRequests = ref<Friend[]>([])
const groupMembers = ref<GroupMember[]>([])
const creatingGroup = ref(false)

const messagesContainer = ref<HTMLElement>()

const createGroupForm = ref({
  groupName: '',
  groupNotice: '',
  memberIds: [] as number[]
})

const currentSession = computed(() => chatStore.currentSession)
const displayMessages = computed(() => chatStore.messages)

const filteredSessions = computed(() => {
  if (!searchKeyword.value) return chatStore.sessions
  return chatStore.sessions.filter(s => 
    s.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredFriends = computed(() => {
  if (!searchKeyword.value) return chatStore.friends
  return chatStore.friends.filter(f => {
    const name = f.remark || f.friendInfo?.nickname || f.friendInfo?.username
    return name?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  })
})

const filteredGroups = computed(() => {
  if (!searchKeyword.value) return chatStore.groups
  return chatStore.groups.filter(g => 
    g.groupName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const isSelfMessage = (message: Message): boolean => {
  return message.fromUserId === userStore.userInfo?.id
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const fetchPendingRequests = async () => {
  try {
    const res = await friendApi.getPending()
    pendingRequests.value = res.data || []
  } catch (error) {
    console.error('获取好友申请失败:', error)
  }
}

const handleLogout = async () => {
  webSocketService.disconnect()
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

const selectSession = async (session: ChatSession) => {
  chatStore.setCurrentSession(session)
  loadingMessages.value = true
  
  try {
    await chatStore.fetchHistoryMessages(session.targetId, session.chatType)
    scrollToBottom()
    
    if (session.unreadCount > 0) {
      await messageApi.markAsRead(session.targetId, session.chatType)
      chatStore.clearUnreadCount(session.targetId, session.chatType)
    }
  } catch (error) {
    console.error('获取历史消息失败:', error)
  } finally {
    loadingMessages.value = false
  }
}

const startPrivateChat = (friend: Friend) => {
  const session = chatStore.createSession(friend, ChatType.PRIVATE)
  const existingSession = chatStore.sessions.find(s => s.id === session.id)
  
  if (existingSession) {
    selectSession(existingSession)
  } else {
    chatStore.sessions.unshift(session)
    selectSession(session)
  }
  
  activeTab.value = 'messages'
}

const startGroupChat = (group: Group) => {
  const session = chatStore.createSession(group, ChatType.GROUP)
  const existingSession = chatStore.sessions.find(s => s.id === session.id)
  
  if (existingSession) {
    selectSession(existingSession)
  } else {
    chatStore.sessions.unshift(session)
    selectSession(session)
  }
  
  activeTab.value = 'messages'
}

const searchUsers = async () => {
  if (!searchUserKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    const res = await userApi.search(searchUserKeyword.value)
    searchResults.value = res.data || []
  } catch (error) {
    console.error('搜索用户失败:', error)
  }
}

const addFriend = async (user: User) => {
  try {
    await friendApi.add(user.id)
    ElMessage.success('好友申请已发送')
    showAddFriend.value = false
    searchResults.value = []
    searchUserKeyword.value = ''
  } catch (error) {
    console.error('添加好友失败:', error)
  }
}

const acceptFriendRequest = async (request: Friend) => {
  try {
    await friendApi.accept(request.userId)
    ElMessage.success('已接受好友申请')
    await chatStore.fetchFriends()
    await fetchPendingRequests()
    chatStore.initSessions()
  } catch (error) {
    console.error('接受好友申请失败:', error)
  }
}

const rejectFriendRequest = async (request: Friend) => {
  try {
    await friendApi.reject(request.userId)
    ElMessage.info('已拒绝好友申请')
    await fetchPendingRequests()
  } catch (error) {
    console.error('拒绝好友申请失败:', error)
  }
}

const createGroup = async () => {
  if (!createGroupForm.value.groupName.trim()) {
    ElMessage.warning('请输入群名称')
    return
  }
  
  creatingGroup.value = true
  try {
    const res = await groupApi.create(
      createGroupForm.value.groupName,
      createGroupForm.value.groupNotice || undefined,
      createGroupForm.value.memberIds.length > 0 ? createGroupForm.value.memberIds : undefined
    )
    ElMessage.success('群组创建成功')
    showCreateGroup.value = false
    createGroupForm.value = { groupName: '', groupNotice: '', memberIds: [] }
    await chatStore.fetchGroups()
    chatStore.initSessions()
  } catch (error) {
    console.error('创建群组失败:', error)
  } finally {
    creatingGroup.value = false
  }
}

const loadGroupMembers = async () => {
  if (!currentSession.value || currentSession.value.chatType !== ChatType.GROUP) return
  
  try {
    const res = await groupApi.getMembers(currentSession.value.targetId)
    groupMembers.value = res.data || []
  } catch (error) {
    console.error('获取群成员失败:', error)
  }
}

const sendMessage = async () => {
  if (!messageContent.value.trim() || !currentSession.value) return
  
  const content = messageContent.value.trim()
  messageContent.value = ''
  
  const chatType = currentSession.value.chatType
  const targetId = currentSession.value.targetId
  
  const sendData: any = {
    chatType,
    messageType: MessageType.TEXT,
    content
  }
  
  if (chatType === ChatType.PRIVATE) {
    sendData.toUserId = targetId
  } else {
    sendData.groupId = targetId
  }
  
  try {
    const res = await messageApi.send(sendData)
    
    const webSocketMsg = {
      type: 'chat',
      fromUserId: userStore.userInfo!.id,
      toUserId: chatType === ChatType.PRIVATE ? targetId : 0,
      groupId: chatType === ChatType.GROUP ? targetId : 0,
      chatType,
      messageType: MessageType.TEXT,
      content,
      data: null,
      timestamp: new Date().toISOString()
    }
    webSocketService.send(webSocketMsg)
    
    if (res.data) {
      chatStore.addMessage({
        ...res.data,
        fromUser: userStore.userInfo
      })
      scrollToBottom()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const handleWebSocketMessage = (msg: any) => {
  if (msg.type === 'chat') {
    if (currentSession.value) {
      const isCurrentSession = (
        (msg.chatType === ChatType.PRIVATE && 
         currentSession.value.targetId === msg.fromUserId &&
         currentSession.value.chatType === ChatType.PRIVATE) ||
        (msg.chatType === ChatType.GROUP &&
         currentSession.value.targetId === msg.groupId &&
         currentSession.value.chatType === ChatType.GROUP)
      )
      
      if (isCurrentSession) {
        const newMessage: Message = {
          id: 0,
          fromUserId: msg.fromUserId,
          toUserId: msg.toUserId,
          groupId: msg.groupId,
          chatType: msg.chatType,
          messageType: msg.messageType,
          content: msg.content,
          status: 0,
          sendTime: msg.timestamp,
          readTime: ''
        }
        chatStore.addMessage(newMessage)
        scrollToBottom()
      } else {
        let targetId = msg.chatType === ChatType.PRIVATE ? msg.fromUserId : msg.groupId
        chatStore.incrementUnreadCount(targetId, msg.chatType)
      }
    }
  }
}

watch(showGroupMembers, (val) => {
  if (val) {
    loadGroupMembers()
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      userStore.fetchUserInfo(),
      chatStore.fetchFriends(),
      chatStore.fetchGroups(),
      chatStore.fetchUnreadCounts(),
      fetchPendingRequests()
    ])
    
    chatStore.initSessions()
    
    webSocketService.on('chat', handleWebSocketMessage)
    await webSocketService.connect()
    
  } catch (error) {
    console.error('初始化数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.chat-room {
  height: 100%;
}

.chat-container {
  height: 100%;
}

.left-sidebar {
  background: #f5f5f5;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.user-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .user-info {
    display: flex;
    align-items: center;
  }

  .user-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .user-detail {
    margin-left: 12px;
  }

  .user-name {
    font-size: 15px;
    font-weight: 500;
    color: #303133;
  }

  .user-status {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;

    &.online {
      background: #67c23a;
    }

    &.offline {
      background: #c0c4cc;
    }
  }
}

.search-box {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.chat-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.session-list {
  flex: 1;
  overflow-y: auto;
  background: #fff;
}

.session-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #ecf5ff;
  }

  .session-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    flex-shrink: 0;
  }

  .session-content {
    flex: 1;
    margin-left: 12px;
    min-width: 0;
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .session-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-time {
    font-size: 12px;
    color: #c0c4cc;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .session-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }

  .session-message {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .unread-badge {
    flex-shrink: 0;
  }
}

.empty-session {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.contact-section {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #606266;
    background: #f5f5f5;
  }
}

.contact-list {
  max-height: 200px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f5f7fa;
  }

  .contact-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    flex-shrink: 0;
  }

  .group-avatar {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .contact-info {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .contact-name {
    font-size: 14px;
    color: #303133;
  }

  .contact-status {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #909399;
    margin-top: 2px;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 4px;

      &.online {
        background: #67c23a;
      }

      &.offline {
        background: #c0c4cc;
      }
    }
  }
}

.request-item {
  display: flex;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;

  .contact-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    flex-shrink: 0;
  }

  .contact-info {
    flex: 1;
    margin-left: 12px;
  }

  .contact-name {
    font-size: 14px;
    color: #303133;
  }

  .contact-status {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  .request-actions {
    display: flex;
    gap: 8px;
  }
}

.empty-contact {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 13px;
}

.chat-main {
  background: #fafafa;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.chat-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  .chat-target {
    display: flex;
    align-items: center;
  }

  .el-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .chat-target-info {
    margin-left: 12px;
  }

  .chat-target-name {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;

  .message-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    flex-shrink: 0;
  }

  .message-content {
    margin: 0 12px;
    max-width: 60%;
  }

  .message-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 4px;

    .message-sender {
      font-size: 12px;
      color: #909399;
      margin-right: 8px;
    }

    .message-time {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .message-bubble {
    display: inline-block;
    padding: 10px 16px;
    border-radius: 6px;
    background: #fff;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .message-text {
    font-size: 14px;
    color: #303133;
    line-height: 1.6;
  }

  &.message-self {
    flex-direction: row-reverse;

    .message-content {
      text-align: right;
    }

    .message-bubble {
      background: #409eff;
    }

    .message-text {
      color: #fff;
    }
  }
}

.loading-messages {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;

  .el-icon {
    margin-right: 8px;
  }
}

.chat-input-area {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px;

  .input-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .message-textarea {
    :deep(.el-textarea__inner) {
      resize: none;
      border: none;
      font-size: 14px;
    }

    :deep(.el-textarea__inner:focus) {
      box-shadow: none;
    }
  }

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;

    .input-hint {
      font-size: 12px;
      color: #c0c4cc;
    }
  }
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;

  p {
    margin-top: 16px;
    font-size: 16px;
  }
}

.search-user-input {
  margin-bottom: 12px;
}

.search-btn {
  margin-bottom: 16px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #f5f7fa;

  &:hover {
    background: #ecf5ff;
  }

  .el-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .result-info {
    flex: 1;
    margin-left: 12px;
  }

  .result-name {
    font-size: 14px;
    color: #303133;
  }

  .result-username {
    font-size: 12px;
    color: #909399;
  }
}

.group-members-list {
  max-height: 400px;
  overflow-y: auto;
}

.group-member-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #f5f7fa;

  .el-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .member-info {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-name {
    font-size: 14px;
    color: #303133;
  }
}
</style>
