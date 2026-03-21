import { listProductsWithSort } from "@lib/data/products"
import { searchProducts } from "@lib/data/search"
import { prefetchThumbnails } from "@lib/data/convex-images"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list"

const DEFAULT_PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryIds,
  categoryId,
  productsIds,
  countryCode,
  query,
  limit: limitProp,
  materials,
  styles,
  roomTypes,
  subCategories,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryIds?: string[]
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  query?: string
  limit?: number
  materials?: string[]
  styles?: string[]
  roomTypes?: string[]
  subCategories?: string[]
}) {
  const PRODUCT_LIMIT = limitProp || DEFAULT_PRODUCT_LIMIT
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Resolve category filter: prefer categoryIds array, fall back to single categoryId
  const resolvedCategoryIds =
    categoryIds && categoryIds.length > 0
      ? categoryIds
      : categoryId
        ? [categoryId]
        : []

  // Always try MeiliSearch first — it handles search, filtering, sorting, and pagination
  let searchResult: Awaited<ReturnType<typeof searchProducts>> = null

  try {
    searchResult = await searchProducts({
      query: query || "",
      categoryIds: resolvedCategoryIds,
      sortBy,
      page: Math.max(page, 1),
      limit: PRODUCT_LIMIT,
      materials,
      styles,
      roomTypes,
      subCategories,
    })
  } catch (e) {
    // MeiliSearch unavailable — fall through to Medusa API
    searchResult = null
  }

  if (searchResult && searchResult.hits.length > 0) {
    // Fetch full product data from Medusa for the search hits
    const hitIds = searchResult.hits.map((h) => h.id)

    const {
      response: { products },
    } = await listProductsWithSort({
      page: 1,
      queryParams: { limit: hitIds.length, id: hitIds } as any,
      sortBy: "created_at",
      countryCode,
    })

    // Maintain MeiliSearch sort order
    const productMap = new Map(products.map((p) => [p.id, p]))
    const orderedProducts = hitIds
      .map((id) => productMap.get(id))
      .filter(Boolean) as typeof products

    const handles = orderedProducts
      .map((p) => p.handle)
      .filter(Boolean) as string[]
    await prefetchThumbnails(handles)

    return (
      <>
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="products-list"
        >
          {orderedProducts.map((p) => (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          ))}
        </ul>
        {searchResult.totalPages > 1 && (
          <Pagination
            data-testid="product-pagination"
            page={page}
            totalPages={searchResult.totalPages}
          />
        )}
      </>
    )
  }

  // If MeiliSearch returned no results for a search query, show empty state
  if (searchResult && query) {
    return (
      <p className="text-ui-fg-subtle py-10 text-center">
        No products found for &ldquo;{query}&rdquo;
      </p>
    )
  }

  // Fallback: use Medusa API directly
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (resolvedCategoryIds.length > 0) {
    queryParams["category_id"] = resolvedCategoryIds
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  // Batch-prefetch CDN thumbnails in one Convex query
  const handles = products.map((p) => p.handle).filter(Boolean) as string[]
  await prefetchThumbnails(handles)

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
