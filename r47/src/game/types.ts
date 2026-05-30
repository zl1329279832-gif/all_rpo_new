export interface City {
  id: string
  name: string
  description: string
  x: number
  y: number
  specialties: string[]
}

export interface Good {
  id: string
  name: string
  basePrice: number
  weight: number
  shelfLife: number
  profitRate: number
  riskLevel: number
}

export interface CityPrice {
  cityId: string
  goodId: string
  currentBuyPrice: number
  currentSellPrice: number
  demand: number
}

export interface CargoItem {
  goodId: string
  quantity: number
  buyPrice: number
  remainingLife: number
}

export interface CaravanState {
  gold: number
  maxCapacity: number
  currentWeight: number
  guardLevel: number
  reputation: number
  day: number
  currentCityId: string
  cargo: CargoItem[]
  isMoving: boolean
  movingTo: string | null
  moveProgress: number
  moveRoute: Route | null
}

export interface Route {
  from: string
  to: string
  distance: number
  tollCost: number
  dangerLevel: number
}

export type EventType = 'weather' | 'bandit' | 'merchant' | 'discovery' | 'plague'

export interface EventChoiceEffect {
  gold?: number
  reputation?: number
  guardLevel?: number
  loseCargoPercent?: number
  restoreShelfLife?: number
  addDays?: number
}

export interface EventChoice {
  text: string
  effects: EventChoiceEffect
  successChance?: number
  successEffects?: EventChoiceEffect
  failEffects?: EventChoiceEffect
}

export interface GameEvent {
  id: string
  name: string
  description: string
  type: EventType
  probability: number
  choices: EventChoice[]
}

export interface QuestStep {
  description: string
  targetCity: string
  targetGood: string
  targetQuantity: number
  reward: number
  completed: boolean
}

export interface Quest {
  id: string
  name: string
  steps: QuestStep[]
}

export interface GameState {
  caravan: CaravanState
  prices: CityPrice[]
  quests: Quest[]
  activeEvent: GameEvent | null
  activeEventResult: string | null
  gameOver: boolean
  victory: boolean
  gameStarted: boolean
  mapView: {
    x: number
    y: number
    zoom: number
  }
}
