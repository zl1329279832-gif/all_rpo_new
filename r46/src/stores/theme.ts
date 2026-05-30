import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ThemeMode } from '@/types'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeMode>('light')

    const setTheme = (mode: ThemeMode) => {
      theme.value = mode
      applyTheme(mode)
    }

    const toggleTheme = () => {
      setTheme(theme.value === 'light' ? 'dark' : 'light')
    }

    const applyTheme = (mode: ThemeMode) => {
      if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }

    const initTheme = () => {
      applyTheme(theme.value)
    }

    return {
      theme,
      setTheme,
      toggleTheme,
      initTheme,
    }
  },
  {
    persist: {
      key: 'hospital-theme',
      storage: localStorage,
    },
  }
)
