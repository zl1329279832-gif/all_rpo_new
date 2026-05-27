import * as THREE from 'three'

export const COLORS = {
  teaching: 0x4a90d9,
  dormitory: 0x7cb342,
  office: 0xffa726,
  canteen: 0xff7043,
  library: 0x9575cd,
  gym: 0x26c6da,
  road: 0x3a3a4a,
  ground: 0x1a2a3a,
  grass: 0x2d5a27,
  online: 0x52c41a,
  offline: 0x8c8c8c,
  fault: 0xfaad14,
  alarm: 0xff4d4f,
  gate: 0x1890ff
}

export const DEVICE_COLORS: Record<string, number> = {
  online: COLORS.online,
  offline: COLORS.offline,
  fault: COLORS.fault,
  alarm: COLORS.alarm
}

export const CAMPUS_CONFIG = {
  width: 200,
  depth: 150,
  groundSize: 300,
  cameraPosition: new THREE.Vector3(150, 120, 150),
  cameraTarget: new THREE.Vector3(0, 0, 0)
}

export const LABEL_CONFIG = {
  fontSize: 14,
  padding: 6,
  backgroundColor: 'rgba(16, 26, 45, 0.9)',
  borderColor: 'rgba(24, 144, 255, 0.6)',
  textColor: '#ffffff'
}
