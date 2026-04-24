import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatTime = (timestamp: number, format: string = 'HH:mm'): string => {
  const now = dayjs()
  const time = dayjs(timestamp)
  
  if (now.isSame(time, 'day')) {
    return time.format('HH:mm')
  } else if (now.subtract(1, 'day').isSame(time, 'day')) {
    return `昨天 ${time.format('HH:mm')}`
  } else if (now.isSame(time, 'year')) {
    return time.format('MM-DD HH:mm')
  } else {
    return time.format('YYYY-MM-DD HH:mm')
  }
}

export const formatDateGroup = (timestamp: number): string => {
  const now = dayjs()
  const time = dayjs(timestamp)
  
  if (now.isSame(time, 'day')) {
    return '今天'
  } else if (now.subtract(1, 'day').isSame(time, 'day')) {
    return '昨天'
  } else if (now.subtract(2, 'day').isSame(time, 'day')) {
    return '前天'
  } else {
    return time.format('YYYY年MM月DD日')
  }
}

export const getRelativeTime = (timestamp: number): string => {
  return dayjs(timestamp).fromNow()
}

export const canRecall = (timestamp: number, senderId: string, currentUserId: string): boolean => {
  const now = Date.now()
  const timeDiff = now - timestamp
  return timeDiff <= 120000 && senderId === currentUserId
}

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }
}

export const generateId = (): string => {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const parseEmoji = (content: string): string => {
  return content
}

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const highlightKeyword = (text: string, keyword: string): string => {
  if (!keyword.trim()) return text
  
  const regex = new RegExp(`(${escapeHtml(keyword)})`, 'gi')
  return escapeHtml(text).replace(regex, '<mark>$1</mark>')
}

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key)
  },
  clear: (): void => {
    localStorage.clear()
  }
}
