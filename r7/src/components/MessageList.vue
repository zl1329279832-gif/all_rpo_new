<template>
  <div
    ref="containerRef"
    class="message-list"
    @scroll="handleScroll"
    :class="{ 'is-loading': isLoading }"
  >
    <div class="load-more" v-if="hasMore" @click="loadMore">
      <el-button type="text" :loading="isLoadingMore">
        {{ isLoadingMore ? '加载中...' : '加载更多消息' }}
      </el-button>
    </div>
    
    <div class="load-more-no-more" v-else-if="messages.length > 50">
      <span>没有更多消息了</span>
    </div>
    
    <div
      v-for="(group, dateKey) in groupedMessages"
      :key="dateKey"
      class="message-group"
    >
      <div class="time-divider">
        <span class="time-label">{{ formatDateGroup(dateKey) }}</span>
      </div>
      
      <MessageBubble
        v-for="message in group"
        :key="message.id"
        :message="message"
        :is-self="isSelfMessage(message)"
        :show-sender="shouldShowSender(message, group)"
        :is-group-message="isGroup"
      />
    </div>
    
    <div ref="scrollAnchor" class="scroll-anchor"></div>
    
    <div class="loading-overlay" v-if="isLoading">
      <el-icon class="loading-icon" :size="32">
        <Loading />
      </el-icon>
      <span class="loading-text">加载中...</span>
    </div>
    
    <div class="new-message-tip" v-if="showNewMessageTip" @click="scrollToBottom">
      <el-icon><ArrowDown /></el-icon>
      <span>{{ newMessageCount }} 条新消息</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, type Ref } from 'vue'
import { Loading, ArrowDown } from '@element-plus/icons-vue'
import type { Message, ChatSession } from '@/types'
import { formatTime, formatDateGroup as formatDateGroupUtil } from '@/utils'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import MessageBubble from './MessageBubble.vue'

interface Props {
  messages: Message[]
  currentSession: ChatSession | null
  isLoading?: boolean
  hasMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasMore: true
})

const emit = defineEmits<{
  loadMore: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollAnchor = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const showNewMessageTip = ref(false)
const newMessageCount = ref(0)
const lastScrollHeight = ref(0)
const isAtBottom = ref(true)

const userStore = useUserStore()
const chatStore = useChatStore()

const isGroup = computed(() => props.currentSession?.type === 'group')

const groupedMessages = computed(() => {
  const groups: Record<string, Message[]> = {}
  
  props.messages.forEach(msg => {
    const dateKey = new Date(msg.timestamp).toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(msg)
  })
  
  return groups
})

const formatDateGroup = (dateKey: string): string => {
  const timestamp = new Date(dateKey).getTime()
  return formatDateGroupUtil(timestamp)
}

const isSelfMessage = (message: Message): boolean => {
  return message.senderId === userStore.user?.id
}

const shouldShowSender = (message: Message, group: Message[]): boolean => {
  if (!isGroup.value || isSelfMessage(message)) return false
  
  const index = group.findIndex(m => m.id === message.id)
  if (index === 0) return true
  
  const prevMessage = group[index - 1]
  return prevMessage.senderId !== message.senderId
}

const handleScroll = () => {
  if (!containerRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  isAtBottom.value = distanceFromBottom < 50
  
  if (distanceFromBottom > 100) {
    showNewMessageTip.value = true
  } else {
    showNewMessageTip.value = false
    newMessageCount.value = 0
  }
  
  if (scrollTop <= 0 && props.hasMore) {
    loadMore()
  }
}

const loadMore = async () => {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  
  const currentScrollHeight = containerRef.value?.scrollHeight || 0
  
  setTimeout(() => {
    emit('loadMore')
    isLoadingMore.value = false
    
    nextTick(() => {
      if (containerRef.value) {
        const newScrollHeight = containerRef.value.scrollHeight
        containerRef.value.scrollTop = newScrollHeight - currentScrollHeight
      }
    })
  }, 500)
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth'
    })
    showNewMessageTip.value = false
    newMessageCount.value = 0
  }
}

const scrollToMessage = (messageId: string) => {
  const messageEl = document.querySelector(`[data-message-id="${messageId}"]`)
  if (messageEl) {
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      const addedMessages = newLength - oldLength
      
      nextTick(() => {
        if (isAtBottom.value) {
          scrollToBottom()
        } else {
          newMessageCount.value += addedMessages
          showNewMessageTip.value = true
        }
      })
    }
  }
)

watch(
  () => props.currentSession,
  () => {
    showNewMessageTip.value = false
    newMessageCount.value = 0
    
    nextTick(() => {
      scrollToBottom()
    })
  }
)

onMounted(() => {
  nextTick(() => {
    scrollToBottom()
  })
})

defineExpose({
  scrollToBottom,
  scrollToMessage
})
</script>

<style lang="scss" scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  position: relative;
  background-color: #f5f7fa;

  &.is-loading {
    opacity: 0.6;
  }

  .load-more {
    text-align: center;
    padding: 8px 0;
    margin-bottom: 8px;
  }

  .load-more-no-more {
    text-align: center;
    padding: 8px 0;
    margin-bottom: 8px;
    font-size: 12px;
    color: #909399;
  }

  .message-group {
    margin-bottom: 8px;
  }

  .time-divider {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 16px 0;
    padding: 0 16px;

    .time-label {
      font-size: 12px;
      color: #909399;
      background-color: #e4e7ed;
      padding: 4px 12px;
      border-radius: 4px;
    }
  }

  .scroll-anchor {
    height: 0;
    visibility: hidden;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 10;

    .loading-icon {
      color: #409eff;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      margin-top: 8px;
      font-size: 14px;
      color: #606266;
    }
  }

  .new-message-tip {
    position: sticky;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background-color: #fff;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    z-index: 100;
    font-size: 13px;
    color: #409eff;

    &:hover {
      background-color: #ecf5ff;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

.dark-mode {
  .message-list {
    background-color: #1a1a2e;

    .time-label {
      background-color: #3a3a5a;
      color: #8a8aaa;
    }

    .loading-overlay {
      background-color: rgba(26, 26, 46, 0.9);

      .loading-text {
        color: #8a8aaa;
      }
    }

    .new-message-tip {
      background-color: #2a2a4a;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

      &:hover {
        background-color: #3a3a5a;
      }
    }
  }
}
</style>
