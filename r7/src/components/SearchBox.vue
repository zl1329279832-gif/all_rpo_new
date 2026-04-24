<template>
  <div class="search-box">
    <el-input
      v-model="searchKeyword"
      placeholder="搜索联系人、消息..."
      clearable
      @input="handleSearch"
      @clear="handleClear"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    
    <div
      class="search-dropdown"
      v-if="showDropdown && searchKeyword.trim()"
    >
      <div class="search-section" v-if="contactsResults.length > 0">
        <div class="section-title">联系人</div>
        <div
          v-for="contact in contactsResults"
          :key="contact.id"
          class="search-item"
          @click="handleContactClick(contact)"
        >
          <el-avatar :size="32" :src="contact.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="search-item-info">
            <span class="search-item-name">{{ contact.name }}</span>
            <span class="search-item-type">联系人</span>
          </div>
        </div>
      </div>
      
      <div class="search-section" v-if="messagesResults.length > 0">
        <div class="section-title">消息记录</div>
        <div
          v-for="result in messagesResults"
          :key="result.id"
          class="search-item"
          @click="handleMessageClick(result)"
        >
          <el-avatar :size="32" :src="result.avatar">
            <el-icon><ChatDotRound /></el-icon>
          </el-avatar>
          <div class="search-item-info">
            <span class="search-item-name">{{ result.name }}</span>
            <span class="search-item-content" v-html="highlightContent(result.highlight || '')"></span>
          </div>
        </div>
      </div>
      
      <div class="search-no-result" v-if="contactsResults.length === 0 && messagesResults.length === 0">
        <el-icon><Search /></el-icon>
        <span>没有找到相关结果</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, User, ChatDotRound } from '@element-plus/icons-vue'
import type { Contact, SearchResult } from '@/types'
import { highlightKeyword } from '@/utils'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'

interface Props {
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: '搜索联系人、消息...'
})

const emit = defineEmits<{
  selectContact: [contact: Contact]
  selectMessage: [result: SearchResult]
  search: [keyword: string]
}>()

const userStore = useUserStore()
const chatStore = useChatStore()

const searchKeyword = ref('')
const showDropdown = ref(false)
const isFocused = ref(false)

const contactsResults = computed<SearchResult[]>(() => {
  if (!searchKeyword.value.trim()) return []
  
  const keyword = searchKeyword.value.toLowerCase()
  const results: SearchResult[] = []
  
  userStore.contacts.forEach(contact => {
    if (
      contact.nickname?.toLowerCase().includes(keyword) ||
      contact.username.toLowerCase().includes(keyword)
    ) {
      results.push({
        type: 'contact',
        id: contact.id,
        name: contact.nickname || contact.username,
        avatar: contact.avatar
      })
    }
  })
  
  return results.slice(0, 5)
})

const messagesResults = computed<SearchResult[]>(() => {
  if (!searchKeyword.value.trim()) return []
  
  const keyword = searchKeyword.value.toLowerCase()
  const results: SearchResult[] = []
  
  chatStore.sessions.forEach(session => {
    const messages = chatStore.messages[session.id] || []
    
    messages.forEach(msg => {
      if (msg.content.toLowerCase().includes(keyword) && !msg.isRecalled) {
        results.push({
          type: 'message',
          id: msg.id,
          name: session.name,
          avatar: session.avatar,
          highlight: msg.content,
          timestamp: msg.timestamp
        })
      }
    })
  })
  
  return results.slice(0, 10)
})

const handleSearch = () => {
  emit('search', searchKeyword.value)
}

const handleClear = () => {
  searchKeyword.value = ''
  showDropdown.value = false
}

const handleFocus = () => {
  isFocused.value = true
  if (searchKeyword.value.trim()) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
    showDropdown.value = false
  }, 200)
}

const handleContactClick = (contact: SearchResult) => {
  const fullContact = userStore.contacts.find(c => c.id === contact.id)
  if (fullContact) {
    emit('selectContact', fullContact)
  }
  searchKeyword.value = ''
  showDropdown.value = false
}

const handleMessageClick = (result: SearchResult) => {
  emit('selectMessage', result)
  searchKeyword.value = ''
  showDropdown.value = false
}

const highlightContent = (content: string): string => {
  return highlightKeyword(content, searchKeyword.value)
}

watch(
  searchKeyword,
  (newVal) => {
    if (newVal.trim() && isFocused.value) {
      showDropdown.value = true
    } else {
      showDropdown.value = false
    }
  }
)
</script>

<style lang="scss" scoped>
.search-box {
  position: relative;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin: 0 16px;
}

.search-section {
  padding: 8px 0;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }

  .section-title {
    font-size: 12px;
    color: #909399;
    padding: 0 12px;
    margin-bottom: 4px;
  }
}

.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  .search-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .search-item-name {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-item-type {
    font-size: 12px;
    color: #909399;
  }

  .search-item-content {
    font-size: 12px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    mark {
      background-color: #fef08a;
      color: #854d0e;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
}

.search-no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #909399;
  font-size: 13px;

  .el-icon {
    font-size: 24px;
  }
}

.dark-mode {
  .search-box {
    background-color: #2a2a4a;
    border-bottom-color: #3a3a5a;
  }

  .search-dropdown {
    background-color: #2a2a4a;
    border-color: #3a3a5a;

    .section-title {
      color: #6a6a8a;
    }

    .search-item:hover {
      background-color: #3a3a5a;
    }

    .search-item-name {
      color: $text-color-dark;
    }

    .search-item-type,
    .search-item-content {
      color: #6a6a8a;
    }
  }
}
</style>
