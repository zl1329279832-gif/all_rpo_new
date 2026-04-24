import dayjs from 'dayjs'

export const formatTime = (time: string | number): string => {
  const now = dayjs()
  const target = dayjs(time)
  
  if (now.isSame(target, 'day')) {
    return target.format('HH:mm')
  }
  
  if (now.subtract(1, 'day').isSame(target, 'day')) {
    return '昨天 ' + target.format('HH:mm')
  }
  
  if (now.isSame(target, 'year')) {
    return target.format('MM-DD HH:mm')
  }
  
  return target.format('YYYY-MM-DD HH:mm')
}

export const formatDate = (time: string | number): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
