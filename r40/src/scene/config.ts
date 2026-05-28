export const SceneConfig = {
  containerCount: 1500,
  truckCount: 25,
  craneCount: 4,
  berthCount: 3,
  yardBlockCount: 12,
  enableAnimation: true,
  enableLabels: true,
  labelsDistance: 150,
  animationSpeed: 1.0,

  yard: {
    blockWidth: 60,
    blockDepth: 40,
    blockGap: 15,
    rowGap: 3,
    bayGap: 6
  },

  container: {
    width20ft: 6,
    width40ft: 12,
    depth: 2.5,
    height: 2.6
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
    roadCongested: 0xE53935,
    quayCrane: 0x607D8B,
    truck: 0x0288D1,
    ground: 0x1A237E,
    water: 0x0D47A1
  }
} as const
