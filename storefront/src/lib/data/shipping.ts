"use client"

import { useQuery } from "convex/react"
import { anyApi } from "convex/server"

/**
 * Real-time hook: all shipments for a customer, ordered by date desc.
 */
export function useShipments(customerId: string | undefined) {
  return useQuery(
    anyApi.shipping.tracking.getByCustomerId,
    customerId ? { customerId } : "skip"
  )
}

/**
 * Real-time hook: single shipment by Medusa order ID.
 */
export function useShipment(medusaOrderId: string | undefined) {
  return useQuery(
    anyApi.shipping.tracking.getByMedusaOrderId,
    medusaOrderId ? { medusaOrderId } : "skip"
  )
}
