import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tools } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useState } from "react"

import { ServiceHierarchyGraph } from "./components/service-hierarchy-graph"
import { ServiceDetailPanel } from "./components/service-detail-panel"

const ServicesPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Services</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage operational services
          </Text>
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
          <ServiceDetailPanel selectedId={selectedId} />
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