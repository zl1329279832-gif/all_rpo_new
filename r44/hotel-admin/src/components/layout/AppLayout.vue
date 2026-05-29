<template>
  <el-container class="app-layout">
    <Sidebar :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
    <el-container class="main-container">
      <Header :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { useTheme } from '../../composables/useTheme'

const sidebarCollapsed = ref(false)
const { initTheme } = useTheme()

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleResize = () => {
  if (window.innerWidth <= 768) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  initTheme()
  handleResize()
  window.addEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .app-main {
    flex: 1;
    padding: 20px;
    background-color: var(--el-bg-color-page);
    overflow-y: auto;
    overflow-x: hidden;
  }
}

:deep(.el-container) {
  height: 100%;
}

:deep(.el-header) {
  height: 60px;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

:deep(.el-main) {
  padding: 0;
  margin: 0;
  overflow: hidden;
}

:deep(.el-aside) {
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .app-main {
    padding: 12px;
  }
}
</style>
