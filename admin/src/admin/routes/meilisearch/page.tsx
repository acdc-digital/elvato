import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import { Container, Heading, Button, Text } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

const MeilisearchPage = () => {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    productsProcessed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    setError(null)

    try {
      const response = await sdk.client.fetch<{
        success: boolean
        productsProcessed: number
      }>("/admin/meilisearch/sync", { method: "POST" })
      setResult(response)
    } catch (err: any) {
      setError(err?.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">MeiliSearch</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage your product search index
          </Text>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-col gap-4">
          <Text size="small" className="text-ui-fg-subtle">
            Trigger a full re-index of all products to MeiliSearch. This
            will sync all published products and remove any unpublished
            ones from the search index.
          </Text>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? "Syncing..." : "Sync All Products"}
            </Button>
            {result && (
              <Text size="small" className="text-ui-fg-interactive">
                Synced {result.productsProcessed} products successfully
              </Text>
            )}
            {error && (
              <Text size="small" className="text-ui-fg-error">
                {error}
              </Text>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "MeiliSearch",
  icon: MagnifyingGlass,
})

export default MeilisearchPage
