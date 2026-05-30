import type { Route } from '../types'

export const routes: Route[] = [
  {
    from: 'changan',
    to: 'dunhuang',
    distance: 3,
    tollCost: 20,
    dangerLevel: 0.2,
  },
  {
    from: 'dunhuang',
    to: 'kashgar',
    distance: 2,
    tollCost: 15,
    dangerLevel: 0.3,
  },
  {
    from: 'kashgar',
    to: 'samarkand',
    distance: 3,
    tollCost: 25,
    dangerLevel: 0.25,
  },
  {
    from: 'samarkand',
    to: 'baghdad',
    distance: 4,
    tollCost: 30,
    dangerLevel: 0.35,
  },
  {
    from: 'baghdad',
    to: 'constantinople',
    distance: 3,
    tollCost: 25,
    dangerLevel: 0.2,
  },
  {
    from: 'changan',
    to: 'kashgar',
    distance: 4,
    tollCost: 35,
    dangerLevel: 0.4,
  },
  {
    from: 'dunhuang',
    to: 'samarkand',
    distance: 5,
    tollCost: 40,
    dangerLevel: 0.45,
  },
  {
    from: 'kashgar',
    to: 'baghdad',
    distance: 5,
    tollCost: 45,
    dangerLevel: 0.5,
  },
]
