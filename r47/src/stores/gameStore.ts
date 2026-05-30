import { defineStore } from 'pinia'
import type { GameState, CaravanState, CityPrice, Quest, GameEvent } from '../game/types'
import { CITIES, getCityById, getConnectedCities, getRoute, getAllRoutes } from '../game/map'
import { GOODS, getGoodById } from '../game/economy/goods'
import { generateInitialPrices, updatePrices } from '../game/economy/pricing'
import { pickRandomEvent, resolveEventChoice } from '../game/events'
import { createInitialQuests, checkQuestProgress } from '../game/quests'
import { saveGame, loadGame } from '../game/save/saveService'

const createInitialCaravan = (): CaravanState => ({
  gold: 500,
  maxCapacity: 50,
  currentWeight: 0,
  guardLevel: 1,
  reputation: 50,
  day: 1,
  currentCityId: 'changan',
  cargo: [],
  isMoving: false,
  movingTo: null,
  moveProgress: 0,
  moveRoute: null,
})

const createInitialState = (): GameState => ({
  caravan: createInitialCaravan(),
  prices: generateInitialPrices(CITIES, GOODS),
  quests: createInitialQuests(),
  activeEvent: null,
  activeEventResult: null,
  gameOver: false,
  victory: false,
  gameStarted: false,
  mapView: { x: 0.5, y: 0.5, zoom: 1 },
})

export const useGameStore = defineStore('game', {
  state: (): GameState => createInitialState(),

  getters: {
    currentCity: (state) => getCityById(state.caravan.currentCityId),
    connectedCities: (state) => getConnectedCities(state.caravan.currentCityId),
    currentCityPrices: (state) => state.prices.filter((p) => p.cityId === state.caravan.currentCityId),
    allCities: () => CITIES,
    allGoods: () => GOODS,
    allRoutes: () => getAllRoutes(),
    isInCity: (state) => !state.caravan.isMoving && state.caravan.currentCityId && !state.activeEvent,
  },

  actions: {
    startNewGame() {
      Object.assign(this.$state, createInitialState())
      this.gameStarted = true
    },

    loadFromSlot(slot: number) {
      const saved = loadGame(slot)
      if (saved) {
        Object.assign(this.$state, saved)
        this.gameStarted = true
      }
    },

    saveToSlot(slot: number) {
      saveGame(slot, this.$state)
    },

    buyGood(goodId: string, quantity: number) {
      const good = getGoodById(goodId)
      const price = this.prices.find(
        (p) => p.cityId === this.caravan.currentCityId && p.goodId === goodId
      )
      if (!good || !price) return false

      const totalCost = price.currentBuyPrice * quantity
      const totalWeight = good.weight * quantity

      if (this.caravan.gold < totalCost) return false
      if (this.caravan.currentWeight + totalWeight > this.caravan.maxCapacity) return false

      this.caravan.gold -= totalCost
      this.caravan.currentWeight += totalWeight

      const existingCargo = this.caravan.cargo.find((c) => c.goodId === goodId)
      if (existingCargo) {
        const avgBuyPrice =
          (existingCargo.buyPrice * existingCargo.quantity + price.currentBuyPrice * quantity) /
          (existingCargo.quantity + quantity)
        existingCargo.quantity += quantity
        existingCargo.buyPrice = Math.round(avgBuyPrice)
      } else {
        this.caravan.cargo.push({
          goodId,
          quantity,
          buyPrice: price.currentBuyPrice,
          remainingLife: good.shelfLife,
        })
      }

      return true
    },

    sellGood(goodId: string, quantity: number) {
      const price = this.prices.find(
        (p) => p.cityId === this.caravan.currentCityId && p.goodId === goodId
      )
      const good = getGoodById(goodId)
      const cargoItem = this.caravan.cargo.find((c) => c.goodId === goodId)

      if (!price || !cargoItem || cargoItem.quantity < quantity) return false

      const totalRevenue = price.currentSellPrice * quantity
      this.caravan.gold += totalRevenue

      if (good) {
        this.caravan.currentWeight -= good.weight * quantity
      }

      cargoItem.quantity -= quantity
      if (cargoItem.quantity <= 0) {
        this.caravan.cargo = this.caravan.cargo.filter((c) => c.goodId !== goodId)
      }

      this.quests = checkQuestProgress(this.quests, this.caravan, this.caravan.currentCityId)

      if (this.caravan.gold >= 5000) {
        this.victory = true
      }

      return true
    },

    startJourney(toCityId: string) {
      const route = getRoute(this.caravan.currentCityId, toCityId)
      if (!route || this.caravan.isMoving) return false
      if (this.caravan.gold < route.tollCost) return false

      this.caravan.gold -= route.tollCost
      this.caravan.isMoving = true
      this.caravan.movingTo = toCityId
      this.caravan.moveProgress = 0
      this.caravan.moveRoute = route

      return true
    },

    updateMovement(deltaMs: number) {
      if (!this.caravan.isMoving || !this.caravan.moveRoute) return

      const speed = 0.3 / (this.caravan.moveRoute.distance * 1000)
      this.caravan.moveProgress += speed * deltaMs

      if (this.caravan.moveProgress >= 0.5 && !this.activeEvent) {
        const event = pickRandomEvent(this.caravan.moveRoute)
        if (event) {
          this.activeEvent = event
        }
      }

      if (this.caravan.moveProgress >= 1) {
        this.arriveAtCity()
      }
    },

    resolveEventChoice(choiceIndex: number) {
      if (!this.activeEvent) return

      const result = resolveEventChoice(this.activeEvent, choiceIndex, this.caravan)
      this.caravan = result.newCaravan
      this.activeEventResult = result.resultText
    },

    closeEvent() {
      this.activeEvent = null
      this.activeEventResult = null

      if (this.caravan.reputation <= 0) {
        this.gameOver = true
      }
    },

    arriveAtCity() {
      if (!this.caravan.movingTo) return

      this.caravan.currentCityId = this.caravan.movingTo
      this.caravan.isMoving = false
      this.caravan.movingTo = null
      this.caravan.moveProgress = 0
      this.caravan.moveRoute = null
      this.caravan.day++

      this.caravan.cargo = this.caravan.cargo.map((item) => {
        const good = getGoodById(item.goodId)
        if (good && good.shelfLife < 999) {
          return { ...item, remainingLife: item.remainingLife - 1 }
        }
        return item
      }).filter((item) => item.remainingLife > 0)

      this.caravan.currentWeight = this.caravan.cargo.reduce((total, item) => {
        const good = getGoodById(item.goodId)
        return total + (good ? good.weight * item.quantity : 0)
      }, 0)

      this.prices = updatePrices(this.prices, CITIES, GOODS)

      this.quests = checkQuestProgress(this.quests, this.caravan, this.caravan.currentCityId)

      const allQuestsComplete = this.quests.every((q) => q.steps.every((s) => s.completed))
      if (allQuestsComplete || this.caravan.gold >= 5000) {
        this.victory = true
      }

      if (this.caravan.gold <= 0) {
        this.gameOver = true
      }
    },

    upgradeGuard() {
      const cost = this.caravan.guardLevel * 200
      if (this.caravan.gold >= cost && this.caravan.guardLevel < 5) {
        this.caravan.gold -= cost
        this.caravan.guardLevel++
        return true
      }
      return false
    },

    upgradeCapacity() {
      const cost = this.caravan.maxCapacity * 5
      if (this.caravan.gold >= cost) {
        this.caravan.gold -= cost
        this.caravan.maxCapacity += 10
        return true
      }
      return false
    },
  },
})
