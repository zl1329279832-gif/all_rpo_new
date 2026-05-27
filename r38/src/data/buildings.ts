import type { Building } from '@/types'
import { COLORS } from '@/three/constants'

export const buildings: Building[] = [
  {
    id: 'b1',
    name: '第一教学楼',
    type: 'teaching',
    position: { x: -60, y: 0, z: -40 },
    size: { width: 25, height: 30, depth: 20 },
    floors: 6,
    color: COLORS.teaching
  },
  {
    id: 'b2',
    name: '第二教学楼',
    type: 'teaching',
    position: { x: -30, y: 0, z: -40 },
    size: { width: 25, height: 25, depth: 20 },
    floors: 5,
    color: COLORS.teaching
  },
  {
    id: 'b3',
    name: '第三教学楼',
    type: 'teaching',
    position: { x: 0, y: 0, z: -40 },
    size: { width: 25, height: 35, depth: 20 },
    floors: 7,
    color: COLORS.teaching
  },
  {
    id: 'b4',
    name: '行政办公楼',
    type: 'office',
    position: { x: 60, y: 0, z: -40 },
    size: { width: 30, height: 40, depth: 20 },
    floors: 8,
    color: COLORS.office
  },
  {
    id: 'd1',
    name: '第一宿舍楼',
    type: 'dormitory',
    position: { x: -60, y: 0, z: 40 },
    size: { width: 30, height: 25, depth: 15 },
    floors: 6,
    color: COLORS.dormitory
  },
  {
    id: 'd2',
    name: '第二宿舍楼',
    type: 'dormitory',
    position: { x: -25, y: 0, z: 40 },
    size: { width: 30, height: 25, depth: 15 },
    floors: 6,
    color: COLORS.dormitory
  },
  {
    id: 'd3',
    name: '第三宿舍楼',
    type: 'dormitory',
    position: { x: 10, y: 0, z: 40 },
    size: { width: 30, height: 25, depth: 15 },
    floors: 6,
    color: COLORS.dormitory
  },
  {
    id: 'd4',
    name: '第四宿舍楼',
    type: 'dormitory',
    position: { x: 45, y: 0, z: 40 },
    size: { width: 30, height: 25, depth: 15 },
    floors: 6,
    color: COLORS.dormitory
  },
  {
    id: 'l1',
    name: '图书馆',
    type: 'library',
    position: { x: 0, y: 0, z: 0 },
    size: { width: 40, height: 20, depth: 30 },
    floors: 4,
    color: COLORS.library
  },
  {
    id: 'c1',
    name: '食堂',
    type: 'canteen',
    position: { x: 60, y: 0, z: 10 },
    size: { width: 25, height: 12, depth: 20 },
    floors: 2,
    color: COLORS.canteen
  },
  {
    id: 'g1',
    name: '体育馆',
    type: 'gym',
    position: { x: -60, y: 0, z: 10 },
    size: { width: 35, height: 18, depth: 25 },
    floors: 1,
    color: COLORS.gym
  }
]
