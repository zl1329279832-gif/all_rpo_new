import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConnectionState } from '@/types'

export const useConnectionStore = defineStore('connection', () => {
  const state = ref<ConnectionState>({
    isConnected: true,
    lastPingTime: Date.now(),
    reconnectAttempts: 0
  })

  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  const isConnected = computed(() => state.value.isConnected)
  const reconnectAttempts = computed(() => state.value.reconnectAttempts)

  const connect = () => {
    state.value.isConnected = true
    state.value.lastPingTime = Date.now()
    state.value.reconnectAttempts = 0
  }

  const disconnect = () => {
    state.value.isConnected = false
  }

  const reconnect = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (state.value.reconnectAttempts >= maxReconnectAttempts) {
        resolve(false)
        return
      }

      state.value.reconnectAttempts++
      
      setTimeout(() => {
        const success = Math.random() > 0.3
        if (success) {
          connect()
          resolve(true)
        } else {
          resolve(false)
        }
      }, reconnectInterval)
    })
  }

  const toggleConnection = () => {
    if (state.value.isConnected) {
      disconnect()
    } else {
      connect()
    }
  }

  const updatePingTime = () => {
    state.value.lastPingTime = Date.now()
  }

  return {
    state,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
    toggleConnection,
    updatePingTime
  }
})
