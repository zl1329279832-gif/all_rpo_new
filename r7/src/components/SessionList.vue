<template>
  <div class="session-list">
    <div class="list-tabs">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="消息" name="messages">
          <div class="sessions-container">
            <div class="empty-state" v-if="sessions.length === 0">
              <el-icon :size="48"><ChatDotRound /></el-icon>
              <p>暂无聊天</p>
            </div>
            
            <ContactCard
              v-for="session in sessions"
              :key="session.id"
              :id="session.id"
              :name="session.name"
              :avatar="session.avatar"
              :unread-count="session.unreadCount"
              :last-message="session.lastMessage"
              :last-time="session.lastMessage?.timestamp"
              :is-group="session.type === 'group'"
              :is-active="currentSessionId === session.id"
              @click="handleSessionClick(session.id)"
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="联系人" name="contacts">
          <div class="contacts-container">
            <div class="contact-groups">
              <div class="group-header" @click="groupExpanded.online = !groupExpanded.online">
                <el-icon :class="{ 'is-expanded': groupExpanded.online }">
                  <ArrowRight />
                </el-icon>
                <span>在线联系人 ({{ onlineContacts.length }})</span>
              </div>
              <div class="group-contacts" v-show="groupExpanded.online">
                <ContactCard
                  v-for="contact in onlineContacts"
                  :key="contact.id"
                  :id="contact.id"
                  :name="contact.nickname || contact.username"
                  :avatar="contact.avatar"
                  :status="contact.status"
                  :signature="contact.signature"
                  show-actions
                  @click="handleContactClick(contact)"
                  @action="handleContactAction"
                />
              </div>
            </div>
            
            <div class="contact-groups">
              <div class="group-header" @click="groupExpanded.offline = !groupExpanded.offline">
                <el-icon :class="{ 'is-expanded': groupExpanded.offline }">
                  <ArrowRight />
                </el-icon>
                <span>离线联系人 ({{ offlineContacts.length }})</span>
              </div>
              <div class="group-contacts" v-show="groupExpanded.offline">
                <ContactCard
                  v-for="contact in offlineContacts"
                  :key="contact.id"
                  :id="contact.id"
                  :name="contact.nickname || contact.username"
                  :avatar="contact.avatar"
                  :status="contact.status"
                  :signature="contact.signature"
                  show-actions
                  @click="handleContactClick(contact)"
                  @action="handleContactAction"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChatDotRound, ArrowRight } from '@element-plus/icons-vue'
import type { ChatSession, Contact } from '@/types'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import ContactCard from './ContactCard.vue'

interface Props {
  sessions: ChatSession[]
  currentSessionId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectSession: [sessionId: string]
  selectContact: [contact: Contact]
}>()

const chatStore = useChatStore()
const userStore = useUserStore()

const activeTab = ref('messages')
const groupExpanded = ref({
  online: true,
  offline: true
})

const onlineContacts = computed(() => {
  return userStore.contacts.filter(c => c.status === 'online')
})

const offlineContacts = computed(() => {
  return userStore.contacts.filter(c => c.status !== 'online')
})

const handleSessionClick = (sessionId: string) => {
  emit('selectSession', sessionId)
}

const handleContactClick = (contact: Contact) => {
  let existingSession = chatStore.sessions.find(s => 
    s.type === 'single' && s.id.includes(contact.id)
  )
  
  if (!existingSession) {
    emit('selectContact', contact)
  } else {
    emit('selectSession', existingSession.id)
  }
  
  activeTab.value = 'messages'
}

const handleContactAction = (action: string, contactId: string) => {
  const contact = userStore.contacts.find(c => c.id === contactId)
  if (contact && action === 'chat') {
    handleContactClick(contact)
  }
}
</script>

<style lang="scss" scoped>
.session-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.sessions-container,
.contacts-container {
  height: 100%;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  gap: 12px;

  p {
    margin: 0;
    font-size: 14px;
  }
}

.contact-groups {
  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: #f5f7fa;
    cursor: pointer;
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;

    .el-icon {
      transition: transform 0.2s;

      &.is-expanded {
        transform: rotate(90deg);
      }
    }
  }

  .group-contacts {
    background-color: #fff;
  }
}

.dark-mode {
  .contact-groups {
    .group-header {
      background-color: #3a3a5a;
      color: #8a8aaa;
    }

    .group-contacts {
      background-color: #2a2a4a;
    }
  }

  .empty-state {
    color: #6a6a8a;
  }
}
</style>
