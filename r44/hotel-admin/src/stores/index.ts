import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export { useAppStore } from './app'
export { useDashboardStore } from './dashboard'
export { useOrderStore } from './order'
export { useRoomStore } from './room'
