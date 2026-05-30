import type { GameEvent, CaravanState, Route, EventChoiceEffect } from '../types'
import { EVENT_POOL } from './eventPool'

export { EVENT_POOL } from './eventPool'

function applyEffects(
  caravan: CaravanState,
  effects: EventChoiceEffect,
): CaravanState {
  const newCaravan = { ...caravan, cargo: [...caravan.cargo] }

  if (effects.gold !== undefined) {
    newCaravan.gold = Math.max(0, newCaravan.gold + effects.gold)
  }

  if (effects.reputation !== undefined) {
    newCaravan.reputation = Math.max(0, newCaravan.reputation + effects.reputation)
  }

  if (effects.guardLevel !== undefined) {
    newCaravan.guardLevel = Math.max(0, newCaravan.guardLevel + effects.guardLevel)
  }

  if (effects.loseCargoPercent !== undefined && effects.loseCargoPercent > 0) {
    const percent = effects.loseCargoPercent / 100
    newCaravan.cargo = newCaravan.cargo.map((item) => {
      const lostQuantity = Math.ceil(item.quantity * percent)
      const newQuantity = Math.max(0, item.quantity - lostQuantity)
      return { ...item, quantity: newQuantity }
    })
    newCaravan.currentWeight = newCaravan.cargo.reduce(
      (sum, item) => sum + item.quantity,
      0,
    )
  }

  if (effects.restoreShelfLife !== undefined && effects.restoreShelfLife > 0) {
    newCaravan.cargo = newCaravan.cargo.map((item) => ({
      ...item,
      remainingLife: item.remainingLife + effects.restoreShelfLife!,
    }))
  }

  if (effects.addDays !== undefined) {
    newCaravan.day = newCaravan.day + effects.addDays
  }

  return newCaravan
}

export function pickRandomEvent(route: Route): GameEvent | null {
  const roll = Math.random()
  const adjustedProbability = roll * (1 + route.dangerLevel)
  if (adjustedProbability > 0.5) {
    return null
  }

  const eligibleEvents = EVENT_POOL.filter((event) => {
    const eventRoll = Math.random()
    return eventRoll < event.probability * (1 + route.dangerLevel * 0.5)
  })

  if (eligibleEvents.length === 0) {
    return null
  }

  const index = Math.floor(Math.random() * eligibleEvents.length)
  return eligibleEvents[index]
}

export function resolveEventChoice(
  event: GameEvent,
  choiceIndex: number,
  caravan: CaravanState,
): { newCaravan: CaravanState; resultText: string } {
  const choice = event.choices[choiceIndex]
  if (!choice) {
    return { newCaravan: caravan, resultText: '无效选择' }
  }

  let effects: EventChoiceEffect
  let resultText: string

  if (choice.successChance !== undefined && choice.successEffects && choice.failEffects) {
    const successRoll = Math.random()
    if (successRoll < choice.successChance) {
      effects = choice.successEffects
      resultText = `成功！你选择了"${choice.text}"，事情如你所愿。`
    } else {
      effects = choice.failEffects
      resultText = `失败！你选择了"${choice.text}"，但运气不佳。`
    }
  } else {
    effects = choice.effects
    resultText = `你选择了"${choice.text}"。`
  }

  const newCaravan = applyEffects(caravan, effects)

  const effectParts: string[] = []
  if (effects.gold) effectParts.push(`金币 ${effects.gold > 0 ? '+' : ''}${effects.gold}`)
  if (effects.reputation) effectParts.push(`声望 ${effects.reputation > 0 ? '+' : ''}${effects.reputation}`)
  if (effects.loseCargoPercent) effectParts.push(`损失 ${effects.loseCargoPercent}% 货物`)
  if (effects.restoreShelfLife) effectParts.push(`货物保质期 +${effects.restoreShelfLife} 天`)
  if (effects.addDays) effectParts.push(`耗时 +${effects.addDays} 天`)

  if (effectParts.length > 0) {
    resultText += ' ' + effectParts.join('，') + '。'
  }

  return { newCaravan, resultText }
}
