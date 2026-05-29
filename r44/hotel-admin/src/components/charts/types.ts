export interface OccupancyRateDataItem {
  date: string
  rate: number
}

export interface ADRDataItem {
  date: string
  adr: number
}

export interface RevPARData {
  value: number
  max?: number
  unit?: string
}

export interface ChannelDataItem {
  name: string
  value: number
}

export interface CancellationDataItem {
  date: string
  count: number
  isSurge?: boolean
}

export interface RoomForecastDataItem {
  date: string
  occupied: number
  reserved: number
  available: number
}

export type KpiType = 'occupancy' | 'adr' | 'revpar'

export interface KpiCardData {
  type: KpiType
  title: string
  value: number
  trend: number
  mom: number
  wow: number
  sparklineData: number[]
  prefix?: string
  suffix?: string
  decimals?: number
}
