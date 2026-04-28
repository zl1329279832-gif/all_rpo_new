export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameover',
  LEVEL_COMPLETE = 'levelcomplete',
  VICTORY = 'victory',
  LEADERBOARD = 'leaderboard',
  SETTINGS = 'settings'
}

export enum BrickType {
  NORMAL = 'normal',
  MULTI_HP = 'multihp',
  UNBREAKABLE = 'unbreakable'
}

export enum PowerUpType {
  PADDLE_LONGER = 'paddle_longer',
  PADDLE_SHORTER = 'paddle_shorter',
  BALL_SPEED_UP = 'ball_speed_up',
  EXTRA_LIFE = 'extra_life',
  PIERCING = 'piercing',
  MULTI_BALL = 'multi_ball'
}

export interface Vector2D {
  x: number
  y: number
}

export interface GameObject {
  x: number
  y: number
  width: number
  height: number
}

export interface Ball extends GameObject {
  dx: number
  dy: number
  speed: number
  radius: number
  isPiercing: boolean
}

export interface Paddle extends GameObject {
  speed: number
  originalWidth: number
}

export interface Brick extends GameObject {
  type: BrickType
  hp: number
  maxHp: number
  points: number
  color: string
  active: boolean
}

export interface PowerUp extends GameObject {
  type: PowerUpType
  speed: number
  color: string
  active: boolean
}

export interface LevelConfig {
  rows: number
  cols: number
  brickWidth: number
  brickHeight: number
  brickPadding: number
  offsetTop: number
  offsetLeft: number
  ballSpeed: number
  unbreakableChance: number
  multiHpChance: number
  powerUpChance: number
}

export interface LeaderboardEntry {
  name: string
  score: number
  level: number
  date: string
}

export interface GameSettings {
  soundEnabled: boolean
  theme: string
  defaultName: string
  highScore: number
}
