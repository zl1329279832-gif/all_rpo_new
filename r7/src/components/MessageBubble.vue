<template>
  <div
    class="message-bubble"
    :class="{
      'is-self': isSelf,
      'is-recalled': message.isRecalled,
      'is-image': message.type === 'image'
    }"
  >
    <div class="message-avatar" v-if="!isSelf">
      <el-avatar :size="40" :src="senderInfo?.avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
    </div>
    
    <div class="message-content">
      <div class="message-sender" v-if="showSender && !isSelf && !isGroupMessage">
        {{ senderInfo?.nickname || senderInfo?.username }}
      </div>
      
      <div class="message-wrapper" @contextmenu.prevent="showContextMenu($event)">
        <div
          class="message-text"
          v-if="message.type === 'text' && !message.isRecalled"
        >
          {{ message.content }}
        </div>
        
        <div
          class="message-image"
          v-else-if="message.type === 'image' && !message.isRecalled"
          @click="previewImage(message.content)"
        >
          <img :src="message.content" alt="图片" />
        </div>
        
        <div class="message-recalled" v-else-if="message.isRecalled">
          <el-icon><Warning /></el-icon>
          <span>{{ message.content }}</span>
        </div>
        
        <div class="message-status" v-if="isSelf && !message.isRecalled">
          <el-icon v-if="message.status === 'sending'">
            <Loading class="spinning" />
          </el-icon>
          <el-icon v-else-if="message.status === 'sent'">
            <Check />
          </el-icon>
          <el-icon v-else-if="message.status === 'read'" style="color: #409eff">
            <CircleCheck />
          </el-icon>
          <el-icon v-else-if="message.status === 'failed'" style="color: #f56c6c">
            <Close />
          </el-icon>
        </div>
      </div>
      
      <div class="message-time">
        {{ formatTime(message.timestamp) }}
        <span v-if="message.recallTime"> (已撤回)</span>
      </div>
    </div>
    
    <div class="message-avatar" v-if="isSelf">
      <el-avatar :size="40" :src="currentUser?.avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
    </div>
    
    <el-dropdown
      ref="contextMenuRef"
      trigger="manual"
      placement="bottom"
      @command="handleCommand"
    >
      <span class="hidden-trigger"></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            command="copy"
            v-if="message.type === 'text' && !message.isRecalled"
          >
            复制
          </el-dropdown-item>
          <el-dropdown-item
            command="recall"
            :disabled="!canRecallMessage"
            v-if="isSelf && !message.isRecalled"
          >
            {{ canRecallMessage ? '撤回' : '超过2分钟无法撤回' }}
          </el-dropdown-item>
          <el-dropdown-item command="delete" divided>
            删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="[currentPreviewImage]"
      :initial-index="0"
      @close="showImageViewer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type ElDropdown } from 'element-plus'
import {
  User,
  Warning,
  Loading,
  Check,
  CircleCheck,
  Close
} from '@element-plus/icons-vue'
import type { Message, User as UserType } from '@/types'
import { formatTime, canRecall } from '@/utils'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'

interface Props {
  message: Message
  isSelf?: boolean
  showSender?: boolean
  isGroupMessage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelf: false,
  showSender: false,
  isGroupMessage: false
})

const contextMenuRef = ref<InstanceType<typeof ElDropdown>>()
const showImageViewer = ref(false)
const currentPreviewImage = ref('')

const userStore = useUserStore()
const chatStore = useChatStore()

const currentUser = computed(() => userStore.userInfo)

const senderInfo = computed<UserType | undefined>(() => {
  return userStore.getUserById(props.message.senderId)
})

const canRecallMessage = computed(() => {
  return (
    props.message.senderId === currentUser.value?.id &&
    canRecall(props.message.timestamp, props.message.senderId, currentUser.value?.id || '')
  )
})

const showContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  if (contextMenuRef.value) {
    ;(contextMenuRef.value as any).handleClick()
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'copy':
      navigator.clipboard.writeText(props.message.content)
      ElMessage.success('已复制到剪贴板')
      break
    case 'recall':
      const success = chatStore.recallMessage(props.message.id)
      if (success) {
        ElMessage.success('消息已撤回')
      } else {
        ElMessage.error('消息撤回失败')
      }
      break
    case 'delete':
      ElMessage.warning('删除功能开发中')
      break
  }
}

const previewImage = (url: string) => {
  currentPreviewImage.value = url
  showImageViewer.value = true
}
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  margin-bottom: 16px;
  padding: 0 16px;

  &.is-self {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
      text-align: right;
    }

    .message-wrapper {
      background-color: $message-bubble-self-bg;
      color: #fff;
      border-radius: 12px 12px 4px 12px;
    }

    .message-time {
      text-align: right;
    }
  }

  .message-avatar {
    flex-shrink: 0;
    margin: 0 12px;
  }

  .message-content {
    max-width: 60%;
    display: flex;
    flex-direction: column;
  }

  .message-sender {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
    padding: 0 4px;
  }

  .message-wrapper {
    display: inline-flex;
    align-items: center;
    padding: 10px 14px;
    background-color: $message-bubble-other-bg;
    border-radius: 12px 12px 12px 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    max-width: 100%;
    word-break: break-word;
    position: relative;

    &:hover {
      .message-status {
        opacity: 1;
      }
    }
  }

  .message-text {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .message-image {
    max-width: 300px;
    max-height: 300px;
    overflow: hidden;
    border-radius: 4px;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .message-recalled {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: #909399;
    font-style: italic;
  }

  .message-status {
    position: absolute;
    right: -24px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .message-time {
    font-size: 12px;
    color: #c0c4cc;
    margin-top: 4px;
    padding: 0 4px;
  }

  &.is-recalled {
    .message-wrapper {
      background-color: transparent;
      box-shadow: none;
      padding: 0;
    }
  }

  .spinning {
    animation: spin 1s linear infinite;
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
  .message-bubble {
    .message-wrapper {
      background-color: #2a2a4a;
      color: $text-color-dark;
    }

    .message-sender,
    .message-time {
      color: #6a6a8a;
    }

    &.is-self {
      .message-wrapper {
        background-color: $message-bubble-self-bg;
        color: #fff;
      }
    }
  }
}
</style>
