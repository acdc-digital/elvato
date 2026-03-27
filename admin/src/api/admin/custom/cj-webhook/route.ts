import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * CJ Dropshipping Logistics Webhook Relay
 *
 * CJ sends LOGISTICS topic webhooks here. We validate, map the payload,
 * and forward it to Convex HTTP endpoint for real-time tracking updates.
 *
 * CJ webhook payload shape:
 * {
 *   messageType: "LOGISTICS",
 *   params: {
 *     orderId: string,         // CJ order ID
 *     trackNumber: string,     // Tracking number
 *     logisticStatus: number,  // 0-14 status code
 *     logisticName: string,    // Carrier name
 *     trackEvents: [{ eventDescription, eventDate, eventAddress }]
 *   }
 * }
 */

// CJ status code to human-readable description
const CJ_STATUS_DESCRIPTIONS: Record<number, string> = {
  0: "Order created, awaiting processing",
  1: "Picked up by logistics",
  2: "Dispatched from origin warehouse",
  3: "In transit to consolidation point",
  4: "Departed origin country",
  5: "In international transit",
  6: "Arrived at destination country",
  7: "Customs clearance in progress",
  8: "Customs cleared",
  9: "Handed to local carrier",
  10: "At local sorting facility",
  11: "Out for delivery",
  12: "Delivered",
  13: "Delivery issue — contact support",
  14: "Returned to sender",
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  const convexUrl = process.env.CONVEX_URL
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET
  const cjWebhookSecret = process.env.CJ_WEBHOOK_SECRET

  if (!convexUrl || !webhookSecret) {
    logger.error("CJ webhook relay: CONVEX_URL or CONVEX_WEBHOOK_SECRET not configured")
    res.status(500).json({ error: "Server configuration error" })
    return
  }

  // Validate CJ webhook secret if configured
  if (cjWebhookSecret) {
    const incomingSecret = req.headers["x-cj-secret"] as string | undefined
    if (incomingSecret !== cjWebhookSecret) {
      logger.warn("CJ webhook relay: Invalid webhook secret")
      res.status(401).json({ error: "Unauthorized" })
      return
    }
  }

  try {
    const body = req.body as any

    if (!body?.params) {
      logger.warn("CJ webhook relay: Missing params in payload")
      res.status(400).json({ error: "Invalid payload" })
      return
    }

    const { params } = body
    const trackNumber = params.trackNumber || params.trackingNumber
    const cjStatusCode =
      params.logisticStatus ?? params.logisticsStatus ?? params.status

    if (!trackNumber || cjStatusCode === undefined) {
      logger.warn("CJ webhook relay: Missing trackNumber or logisticStatus")
      res.status(400).json({ error: "Missing required fields" })
      return
    }

    logger.info(
      `CJ webhook relay: trackNumber=${trackNumber}, status=${cjStatusCode}`
    )

    // Forward tracking status update to Convex
    const statusPayload = {
      trackingNumber: trackNumber,
      cjStatusCode: Number(cjStatusCode),
      description:
        CJ_STATUS_DESCRIPTIONS[Number(cjStatusCode)] ??
        `CJ status code ${cjStatusCode}`,
      location: params.trackEvents?.[0]?.eventAddress ?? undefined,
      timestamp: params.trackEvents?.[0]?.eventDate
        ? new Date(params.trackEvents[0].eventDate).getTime()
        : Date.now(),
      lastMileCarrier: params.lastMileCarrier ?? undefined,
      lastMileTrackingNumber: params.lastMileTrackNumber ?? undefined,
    }

    const statusResponse = await fetch(`${convexUrl}/shipping/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify({
        action: "update_tracking_status",
        payload: statusPayload,
      }),
    })

    if (!statusResponse.ok) {
      const text = await statusResponse.text()
      logger.error(`CJ webhook relay: Convex status update failed: ${text}`)
    }

    // If CJ provides detailed track events, batch-update them
    if (params.trackEvents?.length > 0) {
      const events = params.trackEvents.map(
        (e: { eventDescription?: string; eventDate?: string; eventAddress?: string }) => ({
          status: "tracking_event",
          description: e.eventDescription ?? "Tracking update",
          location: e.eventAddress ?? undefined,
          timestamp: e.eventDate
            ? new Date(e.eventDate).getTime()
            : Date.now(),
        })
      )

      await fetch(`${convexUrl}/shipping/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": webhookSecret,
        },
        body: JSON.stringify({
          action: "update_tracking_events",
          payload: {
            trackingNumber: trackNumber,
            events,
          },
        }),
      })
    }

    // CJ requires 200 within 3 seconds
    res.status(200).json({ success: true })
  } catch (error: any) {
    logger.error(`CJ webhook relay: Error processing webhook: ${error.message}`)
    // Still return 200 to CJ to prevent retries for malformed payloads
    res.status(200).json({ success: false, error: error.message })
  }
}
