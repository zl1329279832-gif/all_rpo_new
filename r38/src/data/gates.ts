import type { CampusGate } from '@/types'

export const gates: CampusGate[] = [
  {
    id: 'gate1',
    name: '正门',
    position: { x: 0, y: 0, z: -75 },
    type: 'main',
    status: 'open',
    personFlow: 1250
  },
  {
    id: 'gate2',
    name: '西门',
    position: { x: -100, y: 0, z: 0 },
    type: 'secondary',
    status: 'open',
    personFlow: 480
  },
  {
    id: 'gate3',
    name: '东门',
    position: { x: 100, y: 0, z: 0 },
    type: 'secondary',
    status: 'open',
    personFlow: 560
  },
  {
    id: 'gate4',
    name: '北门',
    position: { x: 0, y: 0, z: 75 },
    type: 'secondary',
    status: 'closed',
    personFlow: 120
  }
]
