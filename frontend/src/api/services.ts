
import { apiGet } from './client'
import type {
  InventoryItem,
  InventoryRisk,
  ReplenishmentRecommendation,
  RiskAlert,
  Shipment,
  SupplierRisk,
} from './types'

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export const shipmentService = {
  getAll: () => apiGet<Shipment[]>('/api/shipments'),
}

export const inventoryService = {
  getAll: async () => {
    const response = await apiGet<InventoryItem | InventoryItem[]>(
      '/api/inventory',
    )
    return asArray(response)
  },
}

export const riskService = {
  getShipmentAlerts: async () => {
    const response = await apiGet<RiskAlert | RiskAlert[]>('/api/alerts')
    return asArray(response)
  },

  getInventoryRisks: async () => {
    const response = await apiGet<InventoryRisk | InventoryRisk[]>(
      '/api/inventory/risks',
    )
    return asArray(response)
  },
}

export const supplierService = {
  getRisks: async () => {
    const response = await apiGet<SupplierRisk | SupplierRisk[]>(
      '/api/suppliers/risks',
    )
    return asArray(response)
  },
}

export const replenishmentService = {
  getRecommendations: async () => {
    const response = await apiGet<
      ReplenishmentRecommendation | ReplenishmentRecommendation[]
    >('/api/inventory/replenishment')

    return asArray(response)
  },
}
