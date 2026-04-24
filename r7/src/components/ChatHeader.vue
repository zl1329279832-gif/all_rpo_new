<template>
  <div class="chat-header">
    <div class="header-left">
      <div class="session-info" v-if="currentSession">
        <h3 class="session-name">{{ currentSession.name }}</h3>
        <div class="session-status" v-if="!isGroup">
          <span
            class="status-dot"
            :class="statusClass"
          ></span>
          <span class="status-text">{{ statusText }}</span>
          <span class="member-count" v-if="isGroup && currentSession.members">
            ({{ currentSession.members.length }}人)
          </span>
        </div>
        <div class="typing-indicator" v-if="isTyping">
          <span class="typing-text">对方正在输入...</span>
          <span class="typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>
    
    <div class="header-right">
      <el-tooltip content="搜索聊天记录" placement="bottom">
        <el-button type="text" @click="showSearch = !showSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="通知设置" placement="bottom">
        <el-button type="text">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="更多" placement="bottom">
        <el-button type="text" @click="toggleInfoPanel">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    
    <div class="search-panel" v-if="showSearch">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索聊天记录..."
        clearable
        @input="handleSearch"
        @clear="handleClearSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="search-results" v-if="searchResults.length > 0">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="handleSearchResultClick(result)"
        >
          <div class="result-info">
            <span class="result-sender">{{ getSenderName(result.senderId) }}</span>
            <span class="result-time">{{ formatTime(result.timestamp) }}</span>
          </div>
          <div class="result-content" v-html="highlightContent(result.content)"></div>
        </div>
      </div>
      <div class="search-no-result" v-else-if="searchKeyword && !isSearching">
        没有找到相关消息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Bell, MoreFilled } from '@element-plus/icons-vue'
import type { ChatSession, Message } from '@/types'
import { formatTime, highlightKeyword } from '@/utils'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'

interface Props {
  currentSession: ChatSession | null
  isTyping?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTyping: false
})

const emit = defineEmits<{
  toggleInfo: []
  search: [keyword: string]
  jumpToMessage: [messageId: string]
}>()

const userStore = useUserStore()
const chatStore = useChatStore()

const showSearch = ref(false)
const searchKeyword = ref('')
const searchResults = ref<Message[]>([])
const isSearching = ref(false)

const isGroup = computed(() => props.currentSession?.type === 'group')

const statusClass = computed(() => {
  if (!props.currentSession) return ''
  const members = props.currentSession.members
  if (members && members.length > 0) {
    const onlineCount = members.filter(m => m.status === 'online').length
    return onlineCount > 0 ? 'is-online' : 'is-offline'
  }
  return ''
})

const statusText = computed(() => {
  if (!props.currentSession) return ''
  if (isGroup.value) {
    const members = props.currentSession.members
    if (members) {
      const onlineCount = members.filter(m => m.status === 'online').length
      return `${onlineCount}人在线`
    }
    return '群聊'
  }
  const contact = userStore.contacts.find(c => c.id === props.currentSession?.id)
  if (contact) {
    switch (contact.status) {
      case 'online':
        return '在线'
      case 'away':
        return '离开'
      default:
        return '离线'
    }
  }
  return '在线'
})

const toggleInfoPanel = () => {
  emit('toggleInfo')
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  setTimeout(() => {
    const currentMessages = chatStore.currentMessages
    searchResults.value = currentMessages.filter(
      msg => msg.content.toLowerCase().includes(searchKeyword.value.toLowerCase()) && !msg.isRecalled
    )
    isSearching.value = false
  }, 300)
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

const handleSearchResultClick = (result: Message) => {
  emit('jumpToMessage', result.id)
  showSearch.value = false
}

const getSenderName = (senderId: string): string => {
  const user = userStore.getUserById(senderId)
  return user?.nickname || user?.username || '未知用户'
}

const highlightContent = (content: string): string => {
  return highlightKeyword(content, searchKeyword.value)
}

watch(
  () => props.currentSession,
  () => {
    showSearch.value = false
    searchKeyword.value = ''
    searchResults.value = []
  }
)
</script>

<style lang="scss" scoped>
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  position: relative;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.session-info {
  .session-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
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

  .member-count {
    color: #909399;
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
  }

  .typing-text {
    color: #409eff;
    font-size: 12px;
  }

  .typing-dots {
    display: inline-flex;
    gap: 2px;

    span {
      width: 4px;
      height: 4px;
      background-color: #409eff;
      border-radius: 50%;
      animation: typing 1.4s infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

.header-right {
  display: flex;
  gap: 4px;
}

.search-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;

  .search-results {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 12px;
  }

  .search-result-item {
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 4px;

    &:hover {
      background-color: #f5f7fa;
    }

    .result-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .result-sender {
      font-size: 13px;
      font-weight: 500;
      color: #409eff;
    }

    .result-time {
      font-size: 12px;
      color: #909399;
    }

    .result-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.5;

      mark {
        background-color: #fef08a;
        color: #854d0e;
        padding: 0 2px;
        border-radius: 2px;
      }
    }
  }

  .search-no-result {
    text-align: center;
    padding: 20px;
    color: #909399;
    font-size: 13px;
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.dark-mode {
  .chat-header {
    background-color: #2a2a4a;
    border-bottom-color: #3a3a5a;

    .session-name {
      color: $text-color-dark;
    }

    .session-status,
    .member-count {
      color: #6a6a8a;
    }

    .search-panel {
      background-color: #2a2a4a;
      border-bottom-color: #3a3a5a;

      .search-result-item:hover {
        background-color: #3a3a5a;
      }

      .result-content {
        color: #8a8aaa;
      }

      .search-no-result {
        color: #6a6a8a;
      }
    }
  }
}
</style>
