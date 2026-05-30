import { get } from './request'
import type { ApiResult, CostData } from '@/types'

export const getCostStructure = () => {
  return get<ApiResult<CostData[]>>('/cost/structure')
}

export const getDrugRatioTrend = () => {
  return get<ApiResult<any[]>>('/cost/drug-ratio')
}

export const getPaymentType = () => {
  return get<ApiResult<any[]>>('/cost/payment')
}

export const getCostByDepartment = () => {
  return get<ApiResult<any[]>>('/cost/department')
}
