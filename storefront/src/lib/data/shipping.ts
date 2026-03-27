"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

/**
 * Real-time hook: all shipments for a customer, ordered by date desc.
 */
export function useShipments(customerId: string | undefined) {
  return useQuery(
    api.shipping.tracking.getByCustomerId,
    customerId ? { customerId } : "skip"
  )
}

/**
 * Real-time hook: single shipment by Medusa order ID.
 */
export function useShipment(medusaOrderId: string | undefined) {
  return useQuery(
    api.shipping.tracking.getByMedusaOrderId,
    medusaOrderId ? { medusaOrderId } : "skip"
  )
}
