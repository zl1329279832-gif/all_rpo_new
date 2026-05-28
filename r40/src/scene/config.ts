export const SceneConfig = {
  containerCount: 1200,
  truckCount: 12,
  craneCount: 4,
  berthCount: 3,
  yardBlockCount: 8,
  enableAnimation: true,
  enableLabels: true,
  labelsDistance: 150,
  animationSpeed: 1.0,

  layout: {
    roadWidth: 14,
    laneWidth: 6,
    yardGapX: 14,
    yardGapZ: 14,
    yardStartX: -120,
    yardStartZ: -30,
    yardBlockWidth: 50,
    yardBlockDepth: 30,
    berthZ: -150,
    berthFrontRoadZ: -95
  },

  yard: {
    blockWidth: 50,
    blockDepth: 30,
    blockGap: 14,
    rowGap: 3,
    bayGap: 5
  },

  container: {
    width20ft: 5,
    width40ft: 10,
    depth: 2.4,
    height: 2.6
  },

  truck: {
    minFollowingDistance: 12,
    safeDistance: 16,
    maxSpeed: 0.004,
    acceleration: 0.0001,
    deceleration: 0.0003
  },

  colors: {
    normal: 0x4CAF50,
    warning: 0xFF9800,
    danger: 0xF44336,
    overtime: 0x9C27B0,
    dangerous: 0xFF5722,
    berth: 0x1565C0,
    yard: 0x37474F,
    yardDangerous: 0x7B1FA2,
    road: 0x424242,
    roadLine: 0xFFEB3B,
    roadCongested: 0xE53935,
    quayCrane: 0x607D8B,
    truck: 0x0288D1,
    ground: 0x1A237E,
    water: 0x0D47A1
  }
} as const
