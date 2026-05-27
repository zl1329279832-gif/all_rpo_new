import type { Alarm } from '@/types'

export const alarms: Alarm[] = [
  {
    id: 'alarm1',
    deviceId: 'dev_12',
    deviceName: '烟雾探测器-012',
    type: '烟雾告警',
    level: 'high',
    status: 'unhandled',
    position: { x: 0, y: 28, z: -35 },
    buildingId: 'b3',
    floor: 7,
    time: '2024-01-15 14:32:15',
    description: '第三教学楼7层检测到烟雾浓度异常'
  },
  {
    id: 'alarm2',
    deviceId: 'dev_28',
    deviceName: '监控摄像头-028',
    type: '入侵检测',
    level: 'critical',
    status: 'handling',
    position: { x: 60, y: 32, z: -35 },
    buildingId: 'b4',
    floor: 8,
    time: '2024-01-15 14:28:42',
    description: '行政办公楼8层检测到异常人员闯入',
    handler: '安保-张三',
    handleTime: '2024-01-15 14:30:00'
  },
  {
    id: 'alarm3',
    deviceId: 'dev_33',
    deviceName: '消防栓-033',
    type: '水压异常',
    level: 'medium',
    status: 'unhandled',
    position: { x: -60, y: 12, z: 35 },
    buildingId: 'd1',
    floor: 3,
    time: '2024-01-15 14:15:30',
    description: '第一宿舍楼3层消防栓水压低于阈值'
  },
  {
    id: 'alarm4',
    deviceId: 'dev_8',
    deviceName: '球机摄像头-008',
    type: '视频丢失',
    level: 'low',
    status: 'resolved',
    position: { x: -20, y: 2, z: -30 },
    buildingId: 'b2',
    floor: 1,
    time: '2024-01-15 13:45:20',
    description: '第二教学楼1层摄像头视频信号恢复',
    handler: '运维-李四',
    handleTime: '2024-01-15 14:05:00'
  },
  {
    id: 'alarm5',
    deviceId: 'dev_45',
    deviceName: '灭火器-045',
    type: '设备过期',
    level: 'medium',
    status: 'unhandled',
    position: { x: 20, y: 2, z: 15 },
    buildingId: 'l1',
    floor: 1,
    time: '2024-01-15 12:30:00',
    description: '图书馆1层干粉灭火器已过检修期'
  }
]
