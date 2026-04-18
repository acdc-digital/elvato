import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import { withCdnImages } from "@lib/data/convex-images"
import { getBaseURL } from "@lib/util/env"
import { buildAlternates } from "@lib/util/seo"

// ISR: serve cached HTML and revalidate in the background every 5 minutes.
// The page is still dynamically rendered per-request (cookies in downstream
// data functions), but removing force-dynamic re-enables Next.js router cache
// and avoids blanket disabling of fetch caching.
export const revalidate = 300

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

/**
 * React.cache deduplicates this call within a single request so
 * generateMetadata and ProductPage share one Medusa round-trip.
 */
const getProduct = cache(async (countryCode: string, handle: string) => {
  return listProducts({
    countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])
})

/**
 * Pre-generate routes for all published products × regions.
 * Next.js will also dynamically render any product not returned here
 * (fallback: "blocking" is the default with dynamicParams = true).
 */
export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions
        ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
        .filter(Boolean) as string[]
    )

    const { response } = await listProducts({
      countryCode: countryCodes[0] ?? "us",
      queryParams: { limit: 100, fields: "handle" },
    })

    return countryCodes.flatMap((countryCode) =>
      response.products.map((p) => ({
        countryCode,
        handle: p.handle!,
      }))
    )
  } catch {
    return []
  }
}

// TODO: Re-enable once CDN images carry Medusa image IDs so
// variant-level filtering can match them.
// function getImagesForVariant(
//   product: HttpTypes.StoreProduct,
//   selectedVariantId?: string
// ) {
//   if (!selectedVariantId || !product.variants) {
//     return product.images ?? []
//   }
//
//   const variant = product.variants!.find((v) => v.id === selectedVariantId)
//   if (!variant || !variant.images?.length) {
//     return product.images ?? []
//   }
//
//   const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
//   return (product.images ?? []).filter((i) => imageIdsMap.has(i.id))
// }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params

  // Defensive: any backend hiccup must produce a clean 404, never a 500.
  // Repeated 5xx is the single most damaging signal to crawl rate (see
  // .docs/SEO/05-indexing-recovery.md).
  let region: HttpTypes.StoreRegion | undefined | null
  let product: HttpTypes.StoreProduct | undefined
  let countryCodes: string[] = []

  try {
    region = await getRegion(countryCode)
    if (!region) notFound()

    product = await getProduct(countryCode, handle)
    if (!product) notFound()

    const regions = await listRegions()
    countryCodes = regions
      ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
      .filter((c): c is string => Boolean(c)) ?? []
  } catch (e) {
    // Distinguish notFound() (which throws a special error Next handles)
    // from real failures we want to swallow into a 404.
    if ((e as Error)?.message?.includes("NEXT_NOT_FOUND")) throw e
    console.error(
      `[seo] product generateMetadata failed for ${countryCode}/${handle}:`,
      e
    )
    notFound()
  }

  const description =
    product!.description?.slice(0, 155) || `Shop ${product!.title} at Elvato.`

  return {
    title: product!.title,
    description,
    openGraph: {
      title: `${product!.title} | Elvato`,
      description,
      images: product!.thumbnail
        ? [{ url: product!.thumbnail, width: 1200, height: 630, alt: product!.title }]
        : [],
    },
    alternates: buildAlternates(`/products/${handle}`, countryCodes),
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  // Defensive: any backend hiccup must yield notFound() (404), never throw
  // up to a 500. See .docs/SEO/05-indexing-recovery.md.
  let region: HttpTypes.StoreRegion | undefined | null
  let rawProduct: HttpTypes.StoreProduct | undefined
  let pricedProduct: HttpTypes.StoreProduct
  try {
    region = await getRegion(params.countryCode)
    if (!region) notFound()

    rawProduct = await getProduct(params.countryCode, params.handle)
    if (!rawProduct) notFound()

    pricedProduct = await withCdnImages(rawProduct)
  } catch (e) {
    if ((e as Error)?.message?.includes("NEXT_NOT_FOUND")) throw e
    console.error(
      `[product] render failed for ${params.countryCode}/${params.handle}:`,
      e
    )
    notFound()
  }

  // If the URL pins a specific variant, lift its variant-level image (if any)
  // to the front of the gallery so the hero image matches the selection.
  // Variant images are stored as metadata.image (string URL) by the CJ
  // expansion script, since Medusa's variant.images relation is sparsely
  // wired through the CDN pipeline today.
  const baseImages = pricedProduct!.images ?? []
  let images = baseImages
  if (selectedVariantId) {
    const selectedVariant = pricedProduct!.variants?.find(
      (v) => v.id === selectedVariantId
    )
    const variantImageUrl =
      (selectedVariant?.metadata as { image?: string } | null | undefined)
        ?.image
    if (variantImageUrl) {
      const filtered = baseImages.filter((i) => i.url !== variantImageUrl)
      images = [
        { id: `variant-${selectedVariantId}`, url: variantImageUrl } as
          HttpTypes.StoreProductImage,
        ...filtered,
      ]
    }
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct!.title,
    description: pricedProduct!.description,
    image: pricedProduct!.images?.map((i) => i.url) ?? [],
    sku: pricedProduct!.variants?.[0]?.sku ?? pricedProduct!.id,
    brand: {
      "@type": "Brand",
      name: "Elvato",
    },
    offers: pricedProduct!.variants?.map((v) => ({
      "@type": "Offer",
      url: `${getBaseURL()}/${params.countryCode}/products/${pricedProduct!.handle}?v_id=${v.id}`,
      priceCurrency: region!.currency_code?.toUpperCase() ?? "USD",
      price: v.calculated_price?.calculated_amount
        ? (v.calculated_price.calculated_amount / 100).toFixed(2)
        : undefined,
      availability:
        (v.inventory_quantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })) ?? [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct!}
        region={region!}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
