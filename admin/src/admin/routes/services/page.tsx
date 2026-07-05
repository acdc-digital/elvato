import { defineRouteConfig } from "@medusajs/admin-sdk"
import { HouseStar, Tools } from "@medusajs/icons"
import { Container, Heading, IconButton, Text, Tooltip } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

import { ServiceHierarchyGraph } from "./components/service-hierarchy-graph"
import { ServiceDetailPanel } from "./components/service-detail-panel"
import { sdk } from "../../lib/sdk"
import { SERVICES } from "./components/service-data"
import {
  billingKey,
  getRollingBillingPeriods,
  type ServiceBillingInput,
  type ServiceBillingRow,
} from "./components/service-billing"

const ServicesPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [billingRows, setBillingRows] = useState<ServiceBillingRow[]>([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [savingBillingKey, setSavingBillingKey] = useState<string | null>(null)
  const billingPeriods = useMemo(() => getRollingBillingPeriods(), [])
  const serviceIds = useMemo(() => SERVICES.map((service) => service.id), [])

  useEffect(() => {
    const loadBilling = async () => {
      setBillingLoading(true)
      setBillingError(null)

      try {
        const data = await sdk.client.fetch<{ rows?: ServiceBillingRow[] }>(
          "/admin/services/billing",
          {
            query: {
              serviceIds: serviceIds.join(","),
              periods: billingPeriods.join(","),
            },
          }
        )
        setBillingRows(data.rows ?? [])
      } catch (error: any) {
        setBillingError(
          error?.status === 401
            ? "Billing requires an active Medusa admin session. Sign in locally and refresh Services."
            : error?.message ?? "Billing values could not be loaded"
        )
      } finally {
        setBillingLoading(false)
      }
    }

    loadBilling()
  }, [billingPeriods, serviceIds])

  const handleBillingSave = async (input: ServiceBillingInput) => {
    const key = billingKey(input.serviceId, input.period)
    setSavingBillingKey(key)
    setBillingError(null)

    try {
      await sdk.client.fetch("/admin/services/billing", {
        method: "POST",
        body: input,
      })

      setBillingRows((current) => {
        const nextRow: ServiceBillingRow = {
          ...input,
          currency: "USD",
        }
        const existingIndex = current.findIndex(
          (row) => row.serviceId === input.serviceId && row.period === input.period
        )

        if (existingIndex === -1) {
          return [...current, nextRow]
        }

        return current.map((row, index) =>
          index === existingIndex ? { ...row, ...nextRow } : row
        )
      })
    } catch (error: any) {
      setBillingError(
        error?.status === 401
          ? "Billing requires an active Medusa admin session. Sign in locally and refresh Services."
          : error?.message ?? "Billing value could not be saved"
      )
    } finally {
      setSavingBillingKey(null)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Tooltip content="Service home base">
            <IconButton
              size="large"
              variant="secondary"
              disabled={!selectedId}
              aria-label="Service home base"
              onClick={() => setSelectedId(null)}
            >
              <HouseStar />
            </IconButton>
          </Tooltip>
          <div>
            <Heading level="h2">Services</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Manage operational services
            </Text>
          </div>
        </div>
      </div>
      <div className="grid min-h-[640px] grid-cols-1 divide-y divide-ui-border-base lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="bg-ui-bg-subtle px-6 py-5">
          <ServiceHierarchyGraph
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        <section className="px-6 py-5">
          <ServiceDetailPanel
            selectedId={selectedId}
            billingPeriods={billingPeriods}
            billingRows={billingRows}
            billingLoading={billingLoading}
            billingError={billingError}
            savingBillingKey={savingBillingKey}
            onBillingSave={handleBillingSave}
          />
        </section>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Services",
  icon: Tools,
  rank: 20,
})

export default ServicesPage