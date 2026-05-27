import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(false)
  const isDarkMode = ref<boolean>(
    localStorage.getItem('dark-mode') === 'true' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  watch(isDarkMode, (val) => {
    localStorage.setItem('dark-mode', String(val))
    if (val) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, { immediate: true })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    sidebarCollapsed,
    isDarkMode,
    toggleSidebar,
    toggleDarkMode
  }
})
