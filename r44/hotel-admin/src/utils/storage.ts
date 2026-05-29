const STORAGE_PREFIX = 'hotel_admin_'

const mockJsonModules: Record<string, any> = import.meta.glob('../mock/**/*.json', {
  eager: true,
  import: 'default'
})

function getKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

export function loadJsonFiles<T = any>(): Record<string, T> {
  const result: Record<string, T> = {}
  
  for (const path in mockJsonModules) {
    const fileName = path.replace('../mock/', '').replace('.json', '')
    result[fileName] = mockJsonModules[path] as T
  }
  
  return result
}

export function loadJsonFile<T = any>(fileName: string): T | null {
  const filePath = `../mock/${fileName}.json`
  return (mockJsonModules[filePath] as T) || null
}

export function getItem<T = any>(key: string): T | null {
  try {
    const fullKey = getKey(key)
    const value = localStorage.getItem(fullKey)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error)
    return null
  }
}

export function setItem<T = any>(key: string, value: T): void {
  try {
    const fullKey = getKey(key)
    localStorage.setItem(fullKey, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting item "${key}" to localStorage:`, error)
  }
}

export function removeItem(key: string): void {
  try {
    const fullKey = getKey(key)
    localStorage.removeItem(fullKey)
  } catch (error) {
    console.error(`Error removing item "${key}" from localStorage:`, error)
  }
}

export function clearAll(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key)
      }
    }
    keys.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

export function getAllKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ''))
      }
    }
    return keys
  } catch (error) {
    console.error('Error getting all keys:', error)
    return []
  }
}

export function saveToJson<T = any>(fileName: string, data: T): void {
  setItem(`json_${fileName}`, data)
}

export function loadFromJson<T = any>(fileName: string): T | null {
  const stored = getItem<T>(`json_${fileName}`)
  if (stored) return stored
  
  return loadJsonFile<T>(fileName)
}

export function getStorageSize(): number {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2
    }
  }
  return Math.round(total / 1024)
}
