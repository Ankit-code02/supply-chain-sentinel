
export type ShipmentStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'DELAYED'
  | 'DELIVERED'
  | 'CANCELLED'
  | string

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string

export interface Shipment {
  id: number
  reference: string
  origin: string
  destination: string
  supplierName: string | null
  expectedDelivery: string
  actualDelivery: string | null
  status: ShipmentStatus
}

export interface InventoryItem {
  id: number
  sku: string
  name: string
  category: string
  warehouseLocation: string
  supplierName: string
  quantityOnHand: number
  reorderPoint: number
  averageDailyDemand: number
  leadTimeDays: number
  unitCost: number
  lowStock: boolean
  estimatedDaysOfStock: number
}

export interface RiskAlert {
  id: number
  shipmentId: number
  shipmentReference: string
  riskType: string
  severity: RiskSeverity
  message: string
  status: string
  createdAt: string
}

export interface InventoryRisk {
  id: number
  inventoryItemId: number
  sku: string
  itemName: string
  riskType: string
  severity: RiskSeverity
  message: string
  status: string
  createdAt: string
}

export interface SupplierRisk {
  supplierName: string
  totalShipments: number
  completedDeliveries: number
  lateDeliveries: number
  onTimeDeliveryRate: number
  averageDelayDays: number
  riskScore: number
  riskLevel: RiskSeverity
  dataQuality: string
  reasons: string[]
}

export interface ReplenishmentRecommendation {
  inventoryItemId: number
  sku: string
  itemName: string
  supplierName: string
  quantityOnHand: number
  reorderPoint: number
  leadTimeDays: number
  averageDailyDemand: number
  estimatedDaysOfStock: number
  leadTimeDemand: number
  recommendedOrderQuantity: number
  estimatedOrderCost: number
  priority: RiskSeverity
  explanation: string
}
