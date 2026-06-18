import { Badge, Heading, Text } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"
import type { ReactNode } from "react"

import {
  SERVICE_BY_ID,
  SERVICES,
  TONE_META,
  type ServiceMeta,
} from "./service-data"

type ServiceDetailPanelProps = {
  selectedId: string | null
}

export const ServiceDetailPanel = ({ selectedId }: ServiceDetailPanelProps) => {
  const service = selectedId ? SERVICE_BY_ID[selectedId] : null

  if (!service) {
    return <ServiceOverview />
  }

  return <ServiceDetail service={service} />
}

const ServiceDetail = ({ service }: { service: ServiceMeta }) => {
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

const ServiceOverview = () => {
  const counts = SERVICES.reduce<Record<string, number>>((acc, service) => {
    acc[service.tone] = (acc[service.tone] ?? 0) + 1
    return acc
  }, {})

  const adminCount = SERVICES.filter((s) => s.column === "Admin").length
  const storefrontCount = SERVICES.filter(
    (s) => s.column === "Storefront"
  ).length

  return (
    <div className="flex h-full flex-col gap-y-5">
      <div>
        <Heading level="h3">Service overview</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Elvato runs as a split, headless stack across managed services. Select
          a node to inspect its role, provider, and reference docs.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Admin services" value={adminCount} />
        <StatCard label="Storefront services" value={storefrontCount} />
      </div>

      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
        <Text
          size="xsmall"
          className="uppercase tracking-wider text-ui-fg-muted"
        >
          By category
        </Text>
        <div className="mt-2 flex flex-col gap-y-2">
          {(["section", "host", "app", "paid"] as const).map((tone) => (
            <div
              key={tone}
              className="flex items-center justify-between gap-x-3"
            >
              <div className="flex items-center gap-x-2">
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${TONE_META[tone].swatch}`}
                />
                <Text size="small" className="text-ui-fg-base">
                  {TONE_META[tone].label}
                </Text>
              </div>
              <Text size="small" className="text-ui-fg-subtle">
                {counts[tone] ?? 0}
              </Text>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-x-2 rounded-lg border border-dashed border-ui-border-base px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-ui-fg-muted" />
        <Text size="xsmall" className="text-ui-fg-muted">
          Static service map. Live health checks are not wired yet.
        </Text>
      </div>
    </div>
  )
}

const StatCard = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-3 shadow-borders-base">
      <Heading level="h2" className="text-ui-fg-base">
        {value}
      </Heading>
      <Text size="xsmall" className="text-ui-fg-subtle">
        {label}
      </Text>
    </div>
  )
}
