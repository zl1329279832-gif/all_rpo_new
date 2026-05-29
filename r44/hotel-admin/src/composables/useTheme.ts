import { ref, watch } from 'vue'
import { getItem, setItem } from '../utils/storage'

export type ThemeMode = 'light' | 'dark'

const themeMode = ref<ThemeMode>('light')

export function useTheme() {
  const initTheme = () => {
    const savedTheme = getItem<ThemeMode>('theme-mode')
    if (savedTheme) {
      themeMode.value = savedTheme
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themeMode.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme(themeMode.value)
  }

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
    setItem('theme-mode', themeMode.value)
    applyTheme(themeMode.value)
  }

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode
    setItem('theme-mode', mode)
    applyTheme(mode)
  }

  watch(themeMode, (newMode) => {
    applyTheme(newMode)
  })

  return {
    themeMode,
    initTheme,
    toggleTheme,
    setTheme
  }
}
