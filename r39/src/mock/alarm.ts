import Mock from 'mockjs'
import type { ApiResponse, PageResult, Alarm, AlarmLevel, AlarmStatus } from '../types'

const levels: AlarmLevel[] = ['critical', 'major', 'minor', 'warning']
const alarmStatuses: AlarmStatus[] = ['pending', 'processing', 'resolved', 'ignored']
const alarmMessages = [
  '设备温度过高，超过安全阈值',
  '充电枪连接异常，请检查连接',
  '输出电压不稳定，波动超过±10%',
  '通信模块离线，无法远程监控',
  '急停按钮被触发，请排查原因',
  '门锁状态异常，柜门未关紧',
  '保险丝熔断，需要更换',
  '散热风扇故障，温度持续上升',
  '电表读数异常，请校准设备',
  '接地电阻过大，存在安全隐患'
]

const handlers = ['运维员A', '运维员B', '运维员C', '运维员D']

const generateAlarms = (count: number, devices: any[]): Alarm[] => {
  return Array.from({ length: count }, (_, i) => {
    const device = devices[i % devices.length]
    const level = levels[Mock.Random.integer(0, 3)]
    const status = alarmStatuses[Mock.Random.integer(0, 3)]
    return {
      id: Mock.Random.guid(),
      deviceId: device.id,
      deviceName: device.name,
      stationId: device.stationId,
      stationName: device.stationName,
      level,
      message: alarmMessages[Mock.Random.integer(0, alarmMessages.length - 1)],
      status,
      alarmTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      handler: status !== 'pending' ? handlers[Mock.Random.integer(0, handlers.length - 1)] : undefined,
      handleTime: status !== 'pending' ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined,
      handleRemark: status === 'resolved' ? '问题已排查并修复，设备恢复正常运行' :
        status === 'processing' ? '正在排查问题原因，预计2小时内完成' :
        status === 'ignored' ? '误报，设备实际运行正常' : undefined
    }
  })
}

export function setupAlarmMock(devices: any[]) {
  const alarms = generateAlarms(100, devices)

  Mock.mock(/\/api\/alarm\/list.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const level = url.searchParams.get('level') || ''
    const status = url.searchParams.get('status') || ''
    const keyword = url.searchParams.get('keyword') || ''

    let filtered = [...alarms]

    if (level) {
      filtered = filtered.filter(a => a.level === level)
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }
    if (keyword) {
      filtered = filtered.filter(a =>
        a.deviceName.includes(keyword) ||
        a.stationName.includes(keyword) ||
        a.message.includes(keyword)
      )
    }

    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return {
      code: 200,
      message: 'success',
      data: {
        list,
        total: filtered.length,
        page,
        pageSize
      }
    } as ApiResponse<PageResult<Alarm>>
  })

  Mock.mock('/api/alarm/handle', 'post', (options: any) => {
    const { ids, status, remark } = JSON.parse(options.body)
    ids.forEach((id: string) => {
      const index = alarms.findIndex(a => a.id === id)
      if (index > -1) {
        alarms[index].status = status
        alarms[index].handler = '当前用户'
        alarms[index].handleTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
        alarms[index].handleRemark = remark
      }
    })

    return {
      code: 200,
      message: '处置成功',
      data: null
    } as ApiResponse
  })

  Mock.mock('/api/alarm/stats', 'get', () => {
    const stats = {
      total: alarms.length,
      pending: alarms.filter(a => a.status === 'pending').length,
      processing: alarms.filter(a => a.status === 'processing').length,
      resolved: alarms.filter(a => a.status === 'resolved').length,
      critical: alarms.filter(a => a.level === 'critical').length,
      major: alarms.filter(a => a.level === 'major').length
    }

    return {
      code: 200,
      message: 'success',
      data: stats
    } as ApiResponse
  })

  return { alarms }
}
