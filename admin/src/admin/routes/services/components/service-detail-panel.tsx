import { Badge, Heading, Text } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"
import type { ReactNode } from "react"

import { ServiceBillingTable } from "./service-billing-table"
import {
  formatBillingCurrency,
  formatBillingPeriod,
  type ServiceBillingInput,
  type ServiceBillingRow,
} from "./service-billing"
import {
  SERVICE_BY_ID,
  SERVICES,
  TONE_META,
  type ServiceMeta,
} from "./service-data"

type ServiceDetailPanelProps = {
  selectedId: string | null
  billingPeriods: string[]
  billingRows: ServiceBillingRow[]
  billingLoading: boolean
  billingError: string | null
  savingBillingKey: string | null
  onBillingSave: (input: ServiceBillingInput) => Promise<void>
}

export const ServiceDetailPanel = ({
  selectedId,
  billingPeriods,
  billingRows,
  billingLoading,
  billingError,
  savingBillingKey,
  onBillingSave,
}: ServiceDetailPanelProps) => {
  const service = selectedId ? SERVICE_BY_ID[selectedId] : null

  if (!service) {
    return (
      <ServiceOverview
        billingPeriods={billingPeriods}
        billingRows={billingRows}
        billingLoading={billingLoading}
        billingError={billingError}
      />
    )
  }

  return (
    <ServiceDetail
      service={service}
      billingPeriods={billingPeriods}
      billingRows={billingRows}
      billingLoading={billingLoading}
      billingError={billingError}
      savingBillingKey={savingBillingKey}
      onBillingSave={onBillingSave}
    />
  )
}

const ServiceDetail = ({
  service,
  billingPeriods,
  billingRows,
  billingLoading,
  billingError,
  savingBillingKey,
  onBillingSave,
}: {
  service: ServiceMeta
  billingPeriods: string[]
  billingRows: ServiceBillingRow[]
  billingLoading: boolean
  billingError: string | null
  savingBillingKey: string | null
  onBillingSave: (input: ServiceBillingInput) => Promise<void>
}) => {
  const Icon = service.icon
  const tone = TONE_META[service.tone]

  return (
    <div className="flex h-full flex-col gap-y-5">
      <div className="flex items-start gap-x-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ui-bg-subtle text-ui-fg-base shadow-borders-base">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level="h3">{service.label}</Heading>
            <Badge size="2xsmall" color={tone.badgeColor}>
              {tone.label}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {service.layer}
          </Text>
        </div>
        <span className="mt-1 flex items-center gap-x-1.5">
          <span className="h-2 w-2 rounded-full bg-ui-fg-muted" />
          <Text size="xsmall" className="text-ui-fg-muted">
            Documented
          </Text>
        </span>
      </div>

      <Text size="small" className="text-ui-fg-base">
        {service.role}
      </Text>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailField label="Provider / Runtime" value={service.provider} />
        <DetailField label="Surface" value={service.column} />
        {service.url ? (
          <DetailField
            label="URL"
            value={
              <a
                href={`https://${service.url}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-x-1 text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              >
                {service.url}
                <ArrowUpRightOnBox />
              </a>
            }
          />
        ) : null}
        <DetailField
          label="Reference"
          value={
            <code className="rounded bg-ui-bg-subtle px-1.5 py-0.5 font-mono text-ui-fg-subtle">
              {service.docs}
            </code>
          }
        />
      </div>

      <ServiceBillingTable
        service={service}
        periods={billingPeriods}
        rows={billingRows}
        isLoading={billingLoading}
        error={billingError}
        savingKey={savingBillingKey}
        onSave={onBillingSave}
      />

      <div className="mt-auto border-t border-ui-border-base pt-3">
        <Text size="xsmall" className="text-ui-fg-muted">
          Click the node again or the canvas background to clear the selection.
        </Text>
      </div>
    </div>
  )
}

const DetailField = ({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
      <Text
        size="xsmall"
        className="uppercase tracking-wider text-ui-fg-muted"
      >
        {label}
      </Text>
      <div className="txt-compact-small mt-0.5 wrap-break-word text-ui-fg-base">
        {value}
      </div>
    </div>
  )
}

const ServiceOverview = ({
  billingPeriods,
  billingRows,
  billingLoading,
  billingError,
}: {
  billingPeriods: string[]
  billingRows: ServiceBillingRow[]
  billingLoading: boolean
  billingError: string | null
}) => {
  const counts = SERVICES.reduce<Record<string, number>>((acc, service) => {
    acc[service.tone] = (acc[service.tone] ?? 0) + 1
    return acc
  }, {})

  const currentPeriod = billingPeriods[billingPeriods.length - 1]
  const currentRows = billingRows.filter((row) => row.period === currentPeriod)
  const currentTotalCents = currentRows.reduce(
    (total, row) => total + row.amountCents,
    0
  )
  const paidCurrentRows = currentRows.filter((row) => row.amountCents > 0)
  const freeCurrentCount = SERVICES.length - paidCurrentRows.length
  const adminCount = SERVICES.filter((s) => s.column === "Admin").length
  const storefrontCount = SERVICES.filter(
    (s) => s.column === "Storefront"
  ).length

  return (
    <div className="flex h-full flex-col gap-y-3">
      <div>
        <Heading level="h3">Service overview</Heading>
        <Text size="xsmall" className="font-mono text-ui-fg-subtle">
          Elvato runs as a split, headless stack across managed services. Select
          a node to inspect its role, provider, and reference docs.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Admin services" value={adminCount} />
        <StatCard label="Storefront services" value={storefrontCount} />
      </div>

      <div className="rounded-lg border border-ui-border-base bg-ui-bg-base shadow-borders-base">
        <div className="flex items-center justify-between border-b border-ui-border-base bg-ui-bg-subtle px-3 py-2">
          <Text
            size="xsmall"
            className="font-mono uppercase tracking-wider text-ui-fg-muted"
          >
            Current month cost
          </Text>
          <Text size="xsmall" className="font-mono text-ui-fg-muted">
            {currentPeriod ? formatBillingPeriod(currentPeriod) : "Current"}
          </Text>
        </div>
        <div className="grid grid-cols-1 divide-y divide-ui-border-base sm:grid-cols-[1fr_auto] sm:divide-x sm:divide-y-0">
          <div className="px-3 py-2">
            <div className="font-mono text-2xl leading-none text-ui-fg-base">
              {billingLoading
                ? "..."
                : formatBillingCurrency(currentTotalCents)}
            </div>
            <Text size="xsmall" className="mt-1 font-mono text-ui-fg-muted">
              {paidCurrentRows.length} paid / {freeCurrentCount} free services
            </Text>
          </div>
          <div className="grid min-w-36 grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 font-mono text-xs text-ui-fg-subtle sm:block sm:space-y-1">
            {paidCurrentRows.length ? (
              paidCurrentRows.map((row) => (
                <div key={row.serviceId} className="flex justify-between gap-x-4">
                  <span className="truncate">{SERVICE_BY_ID[row.serviceId]?.label ?? row.serviceId}</span>
                  <span className="text-ui-fg-base">
                    {formatBillingCurrency(row.amountCents, row.currency)}
                  </span>
                </div>
              ))
            ) : (
              <span>No paid costs logged</span>
            )}
          </div>
        </div>
        {billingError ? (
          <Text size="xsmall" className="border-t border-ui-border-base px-3 py-1.5 font-mono text-ui-fg-error">
            {billingError}
          </Text>
        ) : null}
      </div>

      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
        <Text size="xsmall" className="font-mono uppercase tracking-wider text-ui-fg-muted">
          By category
        </Text>
        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
          {(["section", "host", "app", "paid"] as const).map((tone) => (
            <div
              key={tone}
              className="flex items-center justify-between gap-x-3"
            >
              <div className="flex items-center gap-x-2">
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${TONE_META[tone].swatch}`}
                />
                <Text size="xsmall" className="font-mono text-ui-fg-base">
                  {TONE_META[tone].label}
                </Text>
              </div>
              <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                {counts[tone] ?? 0}
              </Text>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-x-2 rounded-lg border border-dashed border-ui-border-base px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-ui-fg-muted" />
        <Text size="xsmall" className="font-mono text-ui-fg-muted">
          Static service map. Live health checks are not wired yet.
        </Text>
      </div>
    </div>
  )
}

const StatCard = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 shadow-borders-base">
      <div className="font-mono text-xl leading-none text-ui-fg-base">
        {String(value).padStart(2, "0")}
      </div>
      <Text size="xsmall" className="font-mono text-ui-fg-subtle">
        {label}
      </Text>
    </div>
  )
}
