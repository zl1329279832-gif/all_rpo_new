export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage error:', e)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
