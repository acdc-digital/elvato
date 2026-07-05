import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type BillingPayload = Record<string, unknown>

const DEFAULT_CURRENCY = "USD"

const isPeriod = (value: unknown): value is string => {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value)
}

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseList(item))
  }

  if (typeof value !== "string") {
    return []
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const getCurrentPeriod = () => {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

const forwardToConvex = async (action: string, payload: BillingPayload) => {
  const convexUrl = process.env.CONVEX_URL
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET

  if (!convexUrl || !webhookSecret) {
    throw new Error("CONVEX_URL or CONVEX_WEBHOOK_SECRET is not configured")
  }

  const response = await fetch(`${convexUrl}/admin/service-billing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": webhookSecret,
    },
    body: JSON.stringify({ action, payload }),
  })

  const text = await response.text()
  const data = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      })()
    : null

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Convex billing endpoint rejected the admin secret. Check CONVEX_WEBHOOK_SECRET in Medusa and Convex.")
    }

    throw new Error(data?.error ?? text ?? `Convex request failed: ${response.status}`)
  }

  return data
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const query = req.query as Record<string, unknown>
  const serviceIds = parseList(query.serviceIds)
  const periods = parseList(query.periods)

  if (!serviceIds.length || !periods.length || periods.some((period) => !isPeriod(period))) {
    res.status(400).json({ error: "serviceIds and valid periods are required" })
    return
  }

  try {
    await forwardToConvex("seedDefaults", { period: getCurrentPeriod() })
    const data = await forwardToConvex("list", { serviceIds, periods })
    res.json(data)
  } catch (error: any) {
    logger.error(`Service billing list failed: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const body = req.body as Record<string, unknown>
  const serviceId = body.serviceId
  const period = body.period
  const amountCents = body.amountCents
  const note = body.note

  if (typeof serviceId !== "string" || !isPeriod(period)) {
    res.status(400).json({ error: "serviceId and valid period are required" })
    return
  }

  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents < 0) {
    res.status(400).json({ error: "amountCents must be a non-negative integer" })
    return
  }

  if (note !== undefined && typeof note !== "string") {
    res.status(400).json({ error: "note must be a string" })
    return
  }

  try {
    const data = await forwardToConvex("upsert", {
      serviceId,
      period,
      amountCents,
      currency: DEFAULT_CURRENCY,
      note: note || undefined,
    })
    res.json(data)
  } catch (error: any) {
    logger.error(`Service billing upsert failed: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
}