export type ServiceBillingRow = {
  _id?: string
  serviceId: string
  period: string
  amountCents: number
  currency: string
  note?: string
}

export type ServiceBillingInput = {
  serviceId: string
  period: string
  amountCents: number
  note?: string
}

export const getRollingBillingPeriods = (date = new Date()) => {
  return Array.from({ length: 3 }, (_, index) => {
    const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - (2 - index), 1))
    return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`
  })
}

export const formatBillingPeriod = (period: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period}-01T00:00:00Z`))
}

export const formatBillingCurrency = (amountCents: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100)
}

export const centsToDollarInput = (amountCents: number) => {
  return (amountCents / 100).toFixed(2)
}

export const dollarsToCents = (value: string) => {
  const parsed = Number(value.replace(/,/g, "").trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return Math.round(parsed * 100)
}

export const billingKey = (serviceId: string, period: string) => {
  return `${serviceId}:${period}`
}

export const normalizeServiceBillingRows = ({
  serviceId,
  periods,
  rows,
}: {
  serviceId: string
  periods: string[]
  rows: ServiceBillingRow[]
}) => {
  return periods.map((period) => {
    return (
      rows.find((row) => row.serviceId === serviceId && row.period === period) ?? {
        serviceId,
        period,
        amountCents: 0,
        currency: "USD",
      }
    )
  })
}