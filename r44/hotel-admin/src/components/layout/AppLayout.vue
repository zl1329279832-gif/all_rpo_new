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

  .main-container {
    transition: all 0.3s ease;
  }

  .app-main {
    padding: 20px;
    background-color: var(--el-bg-color-page);
    min-height: calc(100vh - 60px);
    transition: all 0.3s ease;
  }
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
