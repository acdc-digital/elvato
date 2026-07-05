import { Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

import {
  billingKey,
  centsToDollarInput,
  dollarsToCents,
  formatBillingCurrency,
  formatBillingPeriod,
  normalizeServiceBillingRows,
  type ServiceBillingInput,
  type ServiceBillingRow,
} from "./service-billing"
import type { ServiceMeta } from "./service-data"

type DraftRow = {
  amount: string
  note: string
}

type ServiceBillingTableProps = {
  service: ServiceMeta
  periods: string[]
  rows: ServiceBillingRow[]
  isLoading: boolean
  error: string | null
  savingKey: string | null
  onSave: (input: ServiceBillingInput) => Promise<void>
}

export const ServiceBillingTable = ({
  service,
  periods,
  rows,
  isLoading,
  error,
  savingKey,
  onSave,
}: ServiceBillingTableProps) => {
  const serviceRows = useMemo(
    () => normalizeServiceBillingRows({ serviceId: service.id, periods, rows }),
    [periods, rows, service.id]
  )
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        serviceRows.map((row) => [
          row.period,
          {
            amount: centsToDollarInput(row.amountCents),
            note: row.note ?? "",
          },
        ])
      )
    )
    setRowErrors({})
  }, [serviceRows])

  const handleDraftChange = (period: string, field: keyof DraftRow, value: string) => {
    setDrafts((current) => ({
      ...current,
      [period]: {
        amount: current[period]?.amount ?? "0.00",
        note: current[period]?.note ?? "",
        [field]: value,
      },
    }))
  }

  const handleSave = async (period: string) => {
    const draft = drafts[period]
    const amountCents = dollarsToCents(draft?.amount ?? "0")

    if (amountCents === null) {
      setRowErrors((current) => ({ ...current, [period]: "Enter a valid cost" }))
      return
    }

    setRowErrors((current) => ({ ...current, [period]: "" }))
    await onSave({
      serviceId: service.id,
      period,
      amountCents,
      note: draft?.note.trim() || undefined,
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      <div className="flex flex-col gap-1 border-b border-ui-border-base bg-ui-bg-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level="h3">Billing</Heading>
          <Text size="xsmall" className="font-mono text-ui-fg-subtle">
            Rolling 3-month service cost history
          </Text>
        </div>
        {isLoading ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            Loading costs...
          </Text>
        ) : null}
      </div>

      {error ? (
        <div className="border-b border-ui-border-base px-3 py-1.5">
          <Text size="xsmall" className="font-mono text-ui-fg-error">
            {error}
          </Text>
        </div>
      ) : null}

      <div className="divide-y divide-ui-border-base">
        {serviceRows.map((row) => {
          const draft = drafts[row.period] ?? {
            amount: centsToDollarInput(row.amountCents),
            note: row.note ?? "",
          }
          const key = billingKey(service.id, row.period)
          const isSaving = savingKey === key

          return (
            <div
              key={row.period}
              className="grid grid-cols-1 gap-2 px-3 py-2 md:grid-cols-[minmax(112px,0.75fr)_minmax(112px,0.75fr)_minmax(160px,1.4fr)_auto] md:items-end"
            >
              <div>
                <Text size="small" weight="plus" className="font-mono text-ui-fg-base">
                  {formatBillingPeriod(row.period)}
                </Text>
                <Text size="xsmall" className="font-mono text-ui-fg-muted">
                  {formatBillingCurrency(row.amountCents, row.currency)} saved
                </Text>
              </div>

              <div>
                <Text size="xsmall" className="mb-1 font-mono uppercase tracking-wider text-ui-fg-muted">
                  Amount
                </Text>
                <Input
                  value={draft.amount}
                  onChange={(event) => handleDraftChange(row.period, "amount", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isLoading || isSaving}
                  className="h-7 font-mono text-xs"
                />
                {rowErrors[row.period] ? (
                  <Text size="xsmall" className="mt-1 font-mono text-ui-fg-error">
                    {rowErrors[row.period]}
                  </Text>
                ) : null}
              </div>

              <div>
                <Text size="xsmall" className="mb-1 font-mono uppercase tracking-wider text-ui-fg-muted">
                  Note
                </Text>
                <Input
                  value={draft.note}
                  onChange={(event) => handleDraftChange(row.period, "note", event.target.value)}
                  placeholder="Optional note"
                  disabled={isLoading || isSaving}
                  className="h-7 font-mono text-xs"
                />
              </div>

              <button
                type="button"
                disabled={isLoading || isSaving}
                onClick={() => handleSave(row.period)}
                className="h-7 rounded-md border border-ui-border-base bg-ui-bg-base px-2 font-mono text-xs text-ui-fg-base shadow-borders-base transition-colors hover:bg-ui-bg-base-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}