import type { City, Route } from '../types'
import { cities } from './cities'
import { routes } from './routes'

export { cities } from './cities'
export { cities as CITIES } from './cities'
export { routes } from './routes'
export { routes as ROUTES } from './routes'

export function getConnectedCities(cityId: string): string[] {
  const connected: string[] = []
  for (const route of routes) {
    if (route.from === cityId) {
      connected.push(route.to)
    } else if (route.to === cityId) {
      connected.push(route.from)
    }
  }
  return connected
}

export function getRoute(from: string, to: string): Route | undefined {
  return routes.find(
    (r) =>
      (r.from === from && r.to === to) ||
      (r.from === to && r.to === from),
  )
}

export function getAllRoutes(): Route[] {
  return routes
}

export function getCityById(id: string): City | undefined {
  return cities.find((c) => c.id === id)
}
