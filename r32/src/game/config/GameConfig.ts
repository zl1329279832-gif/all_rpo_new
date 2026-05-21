export const GAME_CONFIG = {
  canvasWidth: 960,
  canvasHeight: 640,
  tileSize: 32,
  mapWidth: 60,
  mapHeight: 40,
  maxRooms: 10,
  minRoomSize: 5,
  maxRoomSize: 10,
}

export const PLAYER_INITIAL_STATS = {
  maxHp: 100,
  hp: 100,
  attack: 15,
  defense: 5,
  speed: 3,
  attackSpeed: 1,
  critRate: 0.1,
  critDamage: 1.5,
}

export const EXP_TABLE = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 4900, 5900, 7000, 8200,
  9500, 10900, 12400, 14000, 15700, 17500, 19400, 21400, 23500, 25700, 28000, 30400,
  32900, 35500, 38200, 41000,
]

export const COLORS = {
  wall: '#2d2d2d',
  wallBorder: '#1a1a1a',
  floor: '#4a4a4a',
  floorAlt: '#3d3d3d',
  door: '#8b7355',
  stairs: '#ffd700',
  player: '#4fc3f7',
  playerBorder: '#0288d1',
  enemy: '#ef5350',
  enemyBorder: '#c62828',
  item: '#66bb6a',
  projectile: '#ffeb3b',
  particle: '#ffffff',
  hpBar: '#e53935',
  hpBarBg: '#424242',
  expBar: '#7e57c2',
  expBarBg: '#311b92',
  text: '#ffffff',
  textDim: '#b0bec5',
}

export const SKILLS = [
  {
    id: 'slash',
    name: '普通攻击',
    icon: '⚔️',
    cooldown: 0.5,
    damage: 1.0,
    manaCost: 0,
    description: '普通的近战攻击',
  },
  {
    id: 'fireball',
    name: '火球术',
    icon: '🔥',
    cooldown: 3,
    damage: 2.0,
    manaCost: 20,
    description: '发射一颗火球造成范围伤害',
  },
  {
    id: 'heal',
    name: '治疗术',
    icon: '💚',
    cooldown: 8,
    damage: 0,
    manaCost: 30,
    description: '恢复30%最大生命值',
  },
  {
    id: 'dash',
    name: '冲刺',
    icon: '⚡',
    cooldown: 5,
    damage: 0,
    manaCost: 15,
    description: '快速向移动方向冲刺',
  },
]

export const ITEMS: Record<string, {
  name: string
  description: string
  icon: string
  effect?: Partial<import('@/types/game').Stats>
  duration?: number
}> = {
  health_potion: {
    name: '生命药水',
    description: '恢复50点生命值',
    icon: '❤️',
    effect: { hp: 50 },
  },
  attack_boost: {
    name: '力量药剂',
    description: '攻击力+5，持续30秒',
    icon: '💪',
    effect: { attack: 5 },
    duration: 30000,
  },
  defense_boost: {
    name: '护盾药剂',
    description: '防御力+3，持续30秒',
    icon: '🛡️',
    effect: { defense: 3 },
    duration: 30000,
  },
  speed_boost: {
    name: '疾风药剂',
    description: '移动速度+1，持续30秒',
    icon: '👟',
    effect: { speed: 1 },
    duration: 30000,
  },
  coin: {
    name: '金币',
    description: '闪闪发光的金币',
    icon: '💰',
  },
  key: {
    name: '钥匙',
    description: '可以打开宝箱或特殊门',
    icon: '🔑',
  },
}

export const ENEMIES: Record<string, {
  name: string
  stats: Partial<import('@/types/game').Stats>
  expReward: number
  color: string
  aiType: 'melee' | 'ranged' | 'fast'
}> = {
    slime: {
      name: '史莱姆',
      stats: { maxHp: 30, hp: 30, attack: 5, defense: 1, speed: 1 },
      expReward: 20,
      color: '#66bb6a',
      aiType: 'melee',
    },
    skeleton: {
      name: '骷髅',
      stats: { maxHp: 50, hp: 50, attack: 8, defense: 3, speed: 1.5 },
      expReward: 35,
      color: '#b0bec5',
      aiType: 'melee',
    },
    bat: {
      name: '蝙蝠',
      stats: { maxHp: 20, hp: 20, attack: 6, defense: 0, speed: 2.5 },
      expReward: 25,
      color: '#7e57c2',
      aiType: 'fast',
    },
    goblin: {
      name: '哥布林',
      stats: { maxHp: 40, hp: 40, attack: 10, defense: 2, speed: 2 },
      expReward: 40,
      color: '#8bc34a',
      aiType: 'ranged',
    },
    boss: {
      name: '地牢领主',
      stats: { maxHp: 200, hp: 200, attack: 20, defense: 8, speed: 1 },
      expReward: 200,
      color: '#d32f2f',
      aiType: 'melee',
    },
  }
