import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ChevronLeft,
  ChevronRight,
  GridLayout,
  GridList,
  Images,
  MagnifyingGlass,
  Photo,
} from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Select,
  Skeleton,
  StatusBadge,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { sdk } from "../../lib/sdk"

const PAGE_SIZE = 24

type ProductStatus = "draft" | "proposed" | "published" | "rejected"

type ProductCard = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  status: ProductStatus
  collection?: {
    title?: string | null
  } | null
  categories?: Array<{
    id: string
    name?: string | null
  }> | null
  variants?: Array<{
    id: string
  }> | null
}

type ProductCardResponse = {
  products: ProductCard[]
  count: number
}

const statusLabels: Record<ProductStatus, string> = {
  draft: "Draft",
  proposed: "Proposed",
  published: "Published",
  rejected: "Rejected",
}

const statusColors: Record<ProductStatus, "green" | "orange" | "red" | "grey"> = {
  draft: "grey",
  proposed: "orange",
  published: "green",
  rejected: "red",
}

const productFields = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "status",
  "collection.title",
  "categories.id",
  "categories.name",
  "variants.id",
].join(",")

const getPrimaryCategory = (product: ProductCard) => {
  return product.categories?.[0]?.name || product.collection?.title || "Uncategorized"
}

const ProductImage = ({ product }: { product: ProductCard }) => {
  if (!product.thumbnail) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ui-bg-subtle text-ui-fg-muted">
        <Photo />
      </div>
    )
  }

  return (
    <img
      src={product.thumbnail}
      alt={product.title}
      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      loading="lazy"
    />
  )
}

const ProductCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

const ProductCardsPage = () => {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState<ProductStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setOffset(0)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const query: Record<string, string | number | boolean> = {
          fields: productFields,
          limit: PAGE_SIZE,
          offset,
          is_giftcard: false,
        }

        if (status !== "all") {
          query.status = status
        }

        if (debouncedSearch) {
          query.q = debouncedSearch
        }

        const response = (await sdk.admin.product.list(query)) as ProductCardResponse

        if (!cancelled) {
          setProducts(response.products ?? [])
          setCount(response.count ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([])
          setCount(0)
          setError(err instanceof Error ? err.message : "Unable to load products")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, offset, status])

  const pageStart = count === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + PAGE_SIZE, count)
  const canGoBack = offset > 0
  const canGoForward = offset + PAGE_SIZE < count

  const cardSummary = useMemo(() => {
    if (count === 0) {
      return "No products"
    }

    return `${pageStart}-${pageEnd} of ${count}`
  }, [count, pageEnd, pageStart])

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Heading level="h1">Products</Heading>
          <div className="flex overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-base shadow-borders-base">
            <Tooltip content="List view">
              <IconButton size="small" variant="transparent" asChild>
                <Link to="/products" aria-label="List view">
                  <GridList />
                </Link>
              </IconButton>
            </Tooltip>
            <Tooltip content="Cards view">
              <IconButton size="small" variant="secondary" aria-label="Cards view">
                <GridLayout />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-60">
            <MagnifyingGlass className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ui-fg-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as ProductStatus | "all")}>
            <Select.Trigger className="min-w-[140px]">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All statuses</Select.Item>
              <Select.Item value="draft">Draft</Select.Item>
              <Select.Item value="published">Published</Select.Item>
              <Select.Item value="proposed">Proposed</Select.Item>
              <Select.Item value="rejected">Rejected</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      <div className="bg-ui-bg-subtle px-6 py-5">
        {error ? (
          <div className="rounded-lg border border-ui-border-error bg-ui-bg-base p-6">
            <Text className="text-ui-fg-error">{error}</Text>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest outline-none transition-shadow hover:shadow-elevation-card-hover focus-visible:shadow-elevation-card-hover"
              >
                <div className="aspect-4/3 overflow-hidden bg-ui-bg-subtle">
                  <ProductImage product={product} />
                </div>
                <div className="space-y-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <Text
                      size="small"
                      weight="plus"
                      className="line-clamp-2 min-h-10 text-ui-fg-base"
                    >
                      {product.title}
                    </Text>
                    <Text size="xsmall" className="truncate text-ui-fg-subtle">
                      {getPrimaryCategory(product)}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge color={statusColors[product.status]}>
                      {statusLabels[product.status]}
                    </StatusBadge>
                    <Text size="xsmall" className="shrink-0 text-ui-fg-muted">
                      {product.variants?.length ?? 0} variants
                    </Text>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ui-border-base bg-ui-bg-base px-6 text-center">
            <Images className="text-ui-fg-muted" />
            <Heading level="h2">No products found</Heading>
            <Text size="small" className="max-w-[360px] text-ui-fg-subtle">
              Try a different search or status filter.
            </Text>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Text size="small" className="text-ui-fg-subtle">
          {cardSummary}
        </Text>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            disabled={!canGoBack || isLoading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft />
            Previous
          </Button>
          <Button
            size="small"
            variant="secondary"
            disabled={!canGoForward || isLoading}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Product Cards",
  icon: Images,
  nested: "/products",
  rank: 5,
})

export default ProductCardsPage