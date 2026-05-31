<script setup lang="ts">
import type { ViewMode } from '../types'

const props = defineProps<{
  currentView: ViewMode
  isAnimating: boolean
  isPanelOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'view-change', mode: ViewMode): void
  (e: 'toggle-exploded-view'): void
  (e: 'toggle-internal-view'): void
  (e: 'deploy-solar-panels'): void
  (e: 'reset-camera'): void
  (e: 'toggle-panel'): void
}>()

function toggleExplodedView() {
  emit('toggle-exploded-view')
}

function toggleInternalView() {
  emit('toggle-internal-view')
}

function deploySolarPanels() {
  if (!props.isAnimating) {
    emit('deploy-solar-panels')
  }
}

function resetView() {
  emit('reset-camera')
}

function setViewMode(mode: ViewMode) {
  emit('view-change', mode)
}
</script>

<template>
  <div class="control-bar">
    <div class="control-group">
      <span class="group-label">视图模式</span>
      <button 
        class="control-btn"
        :class="{ active: currentView === 'normal' }"
        @click="setViewMode('normal')"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        整体视图
      </button>
      <button 
        class="control-btn"
        :class="{ active: currentView === 'exploded' }"
        @click="toggleExplodedView"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        爆炸视图
      </button>
      <button 
        class="control-btn"
        :class="{ active: currentView === 'internal' }"
        @click="toggleInternalView"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
        内部结构
      </button>
    </div>

    <div class="control-group">
      <span class="group-label">动画控制</span>
      <button 
        class="control-btn primary"
        :class="{ deploying: isAnimating }"
        @click="deploySolarPanels"
        :disabled="isAnimating"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {{ isAnimating ? '展开中...' : '展开太阳翼' }}
      </button>
    </div>

    <div class="control-group">
      <span class="group-label">操作</span>
      <button class="control-btn" @click="resetView">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        复位视角
      </button>
      <button class="control-btn" @click="emit('toggle-panel')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        数据面板
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.control-bar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(10, 22, 40, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  z-index: 100;
  flex-wrap: wrap;
  justify-content: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-right: none;
    padding-right: 0;
  }
}

.group-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-right: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.5);
    color: #00d4ff;
  }

  &.active {
    background: rgba(0, 212, 255, 0.2);
    border-color: #00d4ff;
    color: #00d4ff;
  }

  &.primary {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 136, 255, 0.3));
    border-color: #00d4ff;

    &:hover {
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(0, 136, 255, 0.5));
    }

    &.deploying {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 1200px) {
  .control-bar {
    top: 10px;
    padding: 8px 12px;
    gap: 10px;
  }

  .control-group {
    padding-right: 10px;
  }

  .control-btn {
    padding: 6px 10px;
    font-size: 12px;

    .icon {
      width: 14px;
      height: 14px;
    }
  }
}
</style>
