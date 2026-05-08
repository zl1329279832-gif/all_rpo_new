import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppSettings } from '@/types'
import { getStorage, setStorage } from '@/utils/storage'

const STORAGE_KEY = 'finance_settings'

const defaultSettings: AppSettings = {
  darkMode: false,
  currency: '¥',
  language: 'zh-CN'
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(getStorage<AppSettings>(STORAGE_KEY, defaultSettings))

  watch(
    () => settings.value,
    (val) => {
      setStorage(STORAGE_KEY, val)
      applyDarkMode(val.darkMode)
    },
    { deep: true }
  )

  function toggleDarkMode(): void {
    settings.value.darkMode = !settings.value.darkMode
  }

  function applyDarkMode(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function initDarkMode(): void {
    applyDarkMode(settings.value.darkMode)
  }

  function updateSettings(updates: Partial<AppSettings>): void {
    settings.value = { ...settings.value, ...updates }
  }

  return {
    settings,
    toggleDarkMode,
    updateSettings,
    initDarkMode
  }
})
