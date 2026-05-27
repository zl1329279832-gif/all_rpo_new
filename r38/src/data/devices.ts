import type { Device } from '@/types'

const deviceTypes: Array<'camera' | 'fireExtinguisher' | 'fireHydrant' | 'smokeDetector'> = [
  'camera',
  'fireExtinguisher',
  'fireHydrant',
  'smokeDetector'
]

const deviceNames: Record<string, string[]> = {
  camera: ['监控摄像头', '球机摄像头', '枪机摄像头', '半球摄像头'],
  fireExtinguisher: ['干粉灭火器', '二氧化碳灭火器', '泡沫灭火器'],
  fireHydrant: ['室内消防栓', '室外消防栓'],
  smokeDetector: ['烟雾探测器', '烟感报警器']
}

const buildingPositions: Record<string, { x: number; y: number; z: number }[]> = {
  b1: [
    { x: -70, y: 2, z: -50 },
    { x: -50, y: 2, z: -50 },
    { x: -70, y: 2, z: -30 },
    { x: -50, y: 2, z: -30 },
    { x: -60, y: 15, z: -45 },
    { x: -60, y: 25, z: -35 }
  ],
  b2: [
    { x: -40, y: 2, z: -50 },
    { x: -20, y: 2, z: -50 },
    { x: -40, y: 2, z: -30 },
    { x: -20, y: 2, z: -30 },
    { x: -30, y: 12, z: -45 }
  ],
  b3: [
    { x: -10, y: 2, z: -50 },
    { x: 10, y: 2, z: -50 },
    { x: -10, y: 2, z: -30 },
    { x: 10, y: 2, z: -30 },
    { x: 0, y: 18, z: -45 },
    { x: 0, y: 28, z: -35 }
  ],
  b4: [
    { x: 50, y: 2, z: -50 },
    { x: 70, y: 2, z: -50 },
    { x: 50, y: 2, z: -30 },
    { x: 70, y: 2, z: -30 },
    { x: 60, y: 20, z: -45 },
    { x: 60, y: 32, z: -35 }
  ],
  d1: [
    { x: -70, y: 2, z: 30 },
    { x: -50, y: 2, z: 30 },
    { x: -70, y: 2, z: 50 },
    { x: -50, y: 2, z: 50 },
    { x: -60, y: 12, z: 35 }
  ],
  d2: [
    { x: -35, y: 2, z: 30 },
    { x: -15, y: 2, z: 30 },
    { x: -35, y: 2, z: 50 },
    { x: -15, y: 2, z: 50 },
    { x: -25, y: 12, z: 35 }
  ],
  d3: [
    { x: 0, y: 2, z: 30 },
    { x: 20, y: 2, z: 30 },
    { x: 0, y: 2, z: 50 },
    { x: 20, y: 2, z: 50 },
    { x: 10, y: 12, z: 35 }
  ],
  d4: [
    { x: 35, y: 2, z: 30 },
    { x: 55, y: 2, z: 30 },
    { x: 35, y: 2, z: 50 },
    { x: 55, y: 2, z: 50 },
    { x: 45, y: 12, z: 35 }
  ],
  l1: [
    { x: -20, y: 2, z: -15 },
    { x: 20, y: 2, z: -15 },
    { x: -20, y: 2, z: 15 },
    { x: 20, y: 2, z: 15 },
    { x: 0, y: 10, z: -10 },
    { x: 0, y: 10, z: 10 }
  ],
  c1: [
    { x: 50, y: 2, z: 0 },
    { x: 70, y: 2, z: 0 },
    { x: 50, y: 2, z: 20 },
    { x: 70, y: 2, z: 20 }
  ],
  g1: [
    { x: -75, y: 2, z: 0 },
    { x: -45, y: 2, z: 0 },
    { x: -75, y: 2, z: 20 },
    { x: -45, y: 2, z: 20 }
  ]
}

export const devices: Device[] = []
let deviceId = 1

Object.entries(buildingPositions).forEach(([buildingId, positions]) => {
  positions.forEach((pos, index) => {
    const type = deviceTypes[index % deviceTypes.length]
    const names = deviceNames[type]
    const name = names[index % names.length]

    const statusRandom = Math.random()
    let status: 'online' | 'offline' | 'fault' | 'alarm'
    if (statusRandom < 0.75) status = 'online'
    else if (statusRandom < 0.85) status = 'offline'
    else if (statusRandom < 0.95) status = 'fault'
    else status = 'alarm'

    devices.push({
      id: `dev_${deviceId++}`,
      name: `${name}-${String(deviceId).padStart(3, '0')}`,
      type,
      status,
      position: pos,
      buildingId,
      floor: Math.floor(Math.random() * 6) + 1,
      installTime: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      lastCheckTime: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      description: `安装于${buildingId === 'l1' ? '图书馆' : buildingId.startsWith('b') ? '教学楼' : '宿舍'}${pos.y > 10 ? '高层' : '低层'}区域`
    })
  })
})
