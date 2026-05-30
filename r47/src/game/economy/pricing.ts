import type { City, Good, CityPrice } from '../types'

export function calculateBuyPrice(
  basePrice: number,
  demand: number,
  isSpecialty: boolean,
): number {
  const modifier = isSpecialty
    ? 0.6 + Math.random() * 0.2
    : 1.0 + (demand - 1.0) * 0.3
  const price = basePrice * modifier * (0.9 + demand * 0.1)
  return Math.round(price)
}

export function calculateSellPrice(
  basePrice: number,
  demand: number,
  isSpecialty: boolean,
): number {
  const buyPrice = calculateBuyPrice(basePrice, demand, isSpecialty)
  const sellMultiplier = 0.7 + demand * 0.3
  return Math.round(buyPrice * sellMultiplier)
}

export function generateInitialPrices(
  cities: City[],
  goods: Good[],
): CityPrice[] {
  const prices: CityPrice[] = []
  for (const city of cities) {
    for (const good of goods) {
      const isSpecialty = city.specialties.includes(good.id)
      const demand = isSpecialty
        ? 0.5 + Math.random() * 0.5
        : 0.8 + Math.random() * 0.7
      const currentBuyPrice = calculateBuyPrice(
        good.basePrice,
        demand,
        isSpecialty,
      )
      const currentSellPrice = calculateSellPrice(
        good.basePrice,
        demand,
        isSpecialty,
      )
      prices.push({
        cityId: city.id,
        goodId: good.id,
        currentBuyPrice,
        currentSellPrice,
        demand,
      })
    }
  }
  return prices
}

export function updatePrices(
  prices: CityPrice[],
  cities: City[],
  goods: Good[],
): CityPrice[] {
  return prices.map((price) => {
    const city = cities.find((c) => c.id === price.cityId)
    const good = goods.find((g) => g.id === price.goodId)
    if (!city || !good) return price

    const isSpecialty = city.specialties.includes(good.id)
    const demandShift = (Math.random() - 0.5) * 0.2
    const newDemand = Math.max(0.3, Math.min(2.0, price.demand + demandShift))
    const noise = 0.95 + Math.random() * 0.1

    const currentBuyPrice = Math.round(
      calculateBuyPrice(good.basePrice, newDemand, isSpecialty) * noise,
    )
    const currentSellPrice = Math.round(
      calculateSellPrice(good.basePrice, newDemand, isSpecialty) * noise,
    )

    return {
      ...price,
      currentBuyPrice,
      currentSellPrice,
      demand: newDemand,
    }
  })
}
