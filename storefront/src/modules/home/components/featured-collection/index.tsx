import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import {
  prefetchThumbnails,
  getCdnGalleryImages,
} from "@lib/data/convex-images"
import { convertToLocale } from "@lib/util/money"
import EditorialFeature from "./editorial-feature"

/**
 * Featured Collection — "The Elvato Edit"
 *
 * An editorial, non-transactional showcase of the storefront's published
 * listings. The layout is intentionally asymmetric with varied image scales,
 * large-format photography, and generous negative space on a smoky charcoal
 * canvas so the lighting itself becomes the light source on the page.
 *
 * This is NOT a product grid. It sells a finished room, not a SKU.
 */

const FEATURE_COUNT = 5

type Feature = {
  title: string
  handle: string
  image: string | null
  price: string | null
  eyebrow: string
}

/** Compute the lowest "from" price for a product from calculated variant prices. */
function getFromPrice(product: HttpTypes.StoreProduct): string | null {
  const priced = (product.variants ?? []).filter(
    (v: any) => v.calculated_price?.calculated_amount != null
  )
  if (priced.length === 0) return null
  const amounts = priced.map(
    (v: any) => v.calculated_price.calculated_amount as number
  )
  const currency =
    (priced[0] as any).calculated_price.currency_code ?? "cad"
  return convertToLocale({ amount: Math.min(...amounts), currency_code: currency })
}

export default async function FeaturedCollection({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  // Pull the most recent published listings for the region. The storefront
  // only surfaces published, in-channel products, so this is the live "edit".
  const {
    response: { products, count },
  } = await listProducts({
    regionId: region.id,
    cacheScope: "public",
    queryParams: {
      limit: 12,
      order: "-created_at",
      fields:
        "*variants.calculated_price,title,handle,thumbnail,images.url,collection.title,type.value,categories.name",
    },
  })

  const pool = (products ?? []).filter((p) => p.handle)
  if (pool.length < FEATURE_COUNT) return null

  const chosen = pool.slice(0, FEATURE_COUNT)

  // Batch the thumbnails for every chosen piece in a single Convex round-trip.
  const handles = chosen.map((p) => p.handle as string)
  const thumbs = await prefetchThumbnails(handles)

  // For the hero piece, prefer a full-resolution gallery frame for impact.
  const heroGallery = await getCdnGalleryImages(chosen[0].handle as string)
  const heroImage =
    heroGallery[0]?.url ??
    thumbs[chosen[0].handle as string] ??
    chosen[0].thumbnail ??
    chosen[0].images?.[0]?.url ??
    null

  const toEyebrow = (p: HttpTypes.StoreProduct): string => {
    const type = (p as any).type?.value as string | undefined
    const cat = (p as any).categories?.[0]?.name as string | undefined
    const col = (p as any).collection?.title as string | undefined
    return (type || cat || col || "Lighting").toString()
  }

  const features: Feature[] = chosen.map((p, i) => ({
    title: p.title ?? "Untitled",
    handle: p.handle as string,
    image:
      i === 0
        ? heroImage
        : thumbs[p.handle as string] ??
          p.thumbnail ??
          p.images?.[0]?.url ??
          null,
    price: getFromPrice(p),
    eyebrow: toEyebrow(p),
  }))

  return <EditorialFeature features={features} totalCount={count} />
}
