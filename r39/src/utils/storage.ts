import initialStations from '../data/stations.json'
import initialDevices from '../data/devices.json'
import initialOrders from '../data/orders.json'
import initialAlarms from '../data/alarms.json'
import initialPrices from '../data/prices.json'
import initialUsers from '../data/users.json'

const STORAGE_KEYS = {
  STATIONS: 'charging_stations',
  DEVICES: 'charging_devices',
  ORDERS: 'charging_orders',
  ALARMS: 'charging_alarms',
  PRICES: 'charging_prices',
  USERS: 'charging_users',
  INITIALIZED: 'charging_initialized'
}

export function initializeData() {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED)
  
  if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(initialStations))
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(initialDevices))
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders))
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(initialAlarms))
    localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(initialPrices))
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers))
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true')
  }
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEYS.STATIONS)
  localStorage.removeItem(STORAGE_KEYS.DEVICES)
  localStorage.removeItem(STORAGE_KEYS.ORDERS)
  localStorage.removeItem(STORAGE_KEYS.ALARMS)
  localStorage.removeItem(STORAGE_KEYS.PRICES)
  localStorage.removeItem(STORAGE_KEYS.USERS)
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED)
  initializeData()
}

export function readData<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

export function writeData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function readUsers(): Record<string, any> {
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : {}
}

export function getStations() {
  return readData<any>(STORAGE_KEYS.STATIONS)
}

export function saveStations(stations: any[]) {
  writeData(STORAGE_KEYS.STATIONS, stations)
}

export function getDevices() {
  return readData<any>(STORAGE_KEYS.DEVICES)
}

export function saveDevices(devices: any[]) {
  writeData(STORAGE_KEYS.DEVICES, devices)
}

export function getOrders() {
  return readData<any>(STORAGE_KEYS.ORDERS)
}

export function saveOrders(orders: any[]) {
  writeData(STORAGE_KEYS.ORDERS, orders)
}

export function getAlarms() {
  return readData<any>(STORAGE_KEYS.ALARMS)
}

export function saveAlarms(alarms: any[]) {
  writeData(STORAGE_KEYS.ALARMS, alarms)
}

export function getPrices() {
  return readData<any>(STORAGE_KEYS.PRICES)
}

export function savePrices(prices: any[]) {
  writeData(STORAGE_KEYS.PRICES, prices)
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getCurrentTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export { STORAGE_KEYS }
