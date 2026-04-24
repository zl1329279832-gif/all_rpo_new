import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('chat_theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark-mode')
      document.body.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('chat_theme', isDark.value ? 'dark' : 'light')
  }

  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    loadTheme,
    toggleTheme,
    applyTheme
  }
})
