import { getCostStructure as _getCostStructure, getDrugRatioTrend as _getDrugRatioTrend, getPaymentType as _getPaymentType, getCostByDepartment as _getCostByDepartment } from '@/services/dataService'

export function getCostStructure() {
  return Promise.resolve(_getCostStructure())
}

export function getDrugRatioTrend() {
  return Promise.resolve(_getDrugRatioTrend())
}

export function getPaymentType() {
  return Promise.resolve(_getPaymentType())
}

export function getCostByDepartment() {
  return Promise.resolve(_getCostByDepartment())
}
