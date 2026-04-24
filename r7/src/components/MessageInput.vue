<template>
  <div class="message-input">
    <div class="input-toolbar">
      <el-tooltip content="表情" placement="top">
        <el-button type="text" @click="showEmojiPicker = !showEmojiPicker">
          <el-icon :size="20"><Smile /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="图片" placement="top">
        <el-button type="text" @click="triggerImageUpload">
          <el-icon :size="20"><Picture /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="文件" placement="top">
        <el-button type="text" @click="handleFileClick">
          <el-icon :size="20"><Folder /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="截图" placement="top">
        <el-button type="text" @click="handleScreenshot">
          <el-icon :size="20"><Camera /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    
    <div class="input-area">
      <el-input
        v-model="inputValue"
        type="textarea"
        :rows="3"
        placeholder="输入消息... (Enter发送，Shift+Enter换行)"
        resize="none"
        @keydown="handleKeyDown"
        @input="handleInput"
        :maxlength="2000"
        show-word-limit
      />
    </div>
    
    <div class="input-actions">
      <div class="action-left">
        <span class="input-hint">Enter 发送，Shift + Enter 换行</span>
      </div>
      <div class="action-right">
        <el-button @click="clearInput">清空</el-button>
        <el-button type="primary" @click="sendMessage" :disabled="!canSend">
          发送
        </el-button>
      </div>
    </div>
    
    <div
      class="emoji-picker"
      v-if="showEmojiPicker"
      @click.stop
    >
      <el-tabs v-model="activeEmojiTab">
        <el-tab-pane label="表情" name="emoji">
          <div class="emoji-grid">
            <span
              v-for="emoji in emojiList"
              :key="emoji"
              class="emoji-item"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </span>
          </div>
        </el-tab-pane>
        <el-tab-pane label="颜文字" name="kaomoji">
          <div class="emoji-grid">
            <span
              v-for="kaomoji in kaomojiList"
              :key="kaomoji"
              class="emoji-item"
              @click="insertEmoji(kaomoji)"
            >
              {{ kaomoji }}
            </span>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Smile, Picture, Folder, Camera } from '@element-plus/icons-vue'

const emit = defineEmits<{
  send: [content: string, type: 'text' | 'image']
}>()

const inputValue = ref('')
const showEmojiPicker = ref(false)
const activeEmojiTab = ref('emoji')
const imageInputRef = ref<HTMLInputElement | null>(null)

const canSend = computed(() => {
  return inputValue.value.trim().length > 0
})

const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
  '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾'
]

const kaomojiList = [
  '(^_^)', '(^o^)', '(^_~)', '(-_-)', '(T_T)', '(>_<)',
  '(^_^;)', '(-_-;)', '(^^;)','(^.^)', '(^_-)', '(-_-)',
  '(^.^)', '(^3^)', '(^▽^)', '(^o^)', '(^_^)', '(^_^)v',
  '(=^_^=)', '(>^_^<)', '(^<^)', '(^.^)', '(^^)v', '(^^)/',
  '(^o^)丿', '(^_^)/', '\\(^o^)/', '(^_^)b', '(^^)b', '(^_^)v',
  '(^_-)', '(-_-)', '(._.)', '(._.)', '(>_<)', '(>_<)',
  '(T_T)', '(T_T)', '(;_;)', '(;_;)', '(/_;)', '(/_;)',
  '(>_<)', '(>_<)', '(>_<)', '(>_<)', '(>_<)', '(>_<)',
  '(^_^)', '(^_^)', '(^_^)', '(^_^)', '(^_^)', '(^_^)'
]

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInput = () => {
  emit('input')
}

const sendMessage = () => {
  if (!canSend.value) {
    return
  }
  
  const content = inputValue.value.trim()
  emit('send', content, 'text')
  inputValue.value = ''
  showEmojiPicker.value = false
}

const clearInput = () => {
  inputValue.value = ''
  showEmojiPicker.value = false
}

const insertEmoji = (emoji: string) => {
  inputValue.value += emoji
  showEmojiPicker.value = false
}

const triggerImageUpload = () => {
  if (imageInputRef.value) {
    imageInputRef.value.click()
  }
}

const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    emit('send', result, 'image')
  }
  reader.readAsDataURL(file)
  
  input.value = ''
}

const handleFileClick = () => {
  ElMessage.info('文件上传功能开发中')
}

const handleScreenshot = () => {
  ElMessage.info('截图功能开发中')
}

document.addEventListener('click', () => {
  showEmojiPicker.value = false
})
</script>

<style lang="scss" scoped>
.message-input {
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;

  .el-button {
    padding: 4px 8px;
  }
}

.input-area {
  .el-textarea__inner {
    font-size: 14px;
    line-height: 1.6;
    resize: none;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    padding: 12px;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
}

.input-hint {
  font-size: 12px;
  color: #909399;
}

.action-right {
  display: flex;
  gap: 8px;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 16px;
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  width: 320px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;

  .el-tabs__header {
    margin-bottom: 12px;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
  }

  .emoji-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 20px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.dark-mode {
  .message-input {
    background-color: #2a2a4a;
    border-top-color: #3a3a5a;

    .el-textarea__inner {
      background-color: #1a1a2e;
      border-color: #3a3a5a;
      color: $text-color-dark;

      &::placeholder {
        color: #6a6a8a;
      }
    }

    .input-hint {
      color: #6a6a8a;
    }

    .emoji-picker {
      background-color: #2a2a4a;
      border: 1px solid #3a3a5a;

      .emoji-item:hover {
        background-color: #3a3a5a;
      }
    }
  }
}
</style>
