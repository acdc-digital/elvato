import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import { withCdnImages } from "@lib/data/convex-images"
import { getBaseURL } from "@lib/util/env"

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
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProduct(params.countryCode, handle)

  if (!product) {
    notFound()
  }

  const description =
    product.description?.slice(0, 155) || `Shop ${product.title} at Elvato.`

  return {
    title: product.title,
    description,
    openGraph: {
      title: `${product.title} | Elvato`,
      description,
      images: product.thumbnail
        ? [{ url: product.thumbnail, width: 1200, height: 630, alt: product.title }]
        : [],
    },
    alternates: {
      canonical: `${getBaseURL()}/${params.countryCode}/products/${handle}`,
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const rawProduct = await getProduct(params.countryCode, params.handle)

  if (!rawProduct) {
    notFound()
  }

  const pricedProduct = await withCdnImages(rawProduct)

  const images = pricedProduct.images ?? []

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description: pricedProduct.description,
    image: pricedProduct.images?.map((i) => i.url) ?? [],
    sku: pricedProduct.variants?.[0]?.sku ?? pricedProduct.id,
    brand: {
      "@type": "Brand",
      name: "Elvato",
    },
    offers: pricedProduct.variants?.map((v) => ({
      "@type": "Offer",
      url: `${getBaseURL()}/${params.countryCode}/products/${pricedProduct.handle}?v_id=${v.id}`,
      priceCurrency: region.currency_code?.toUpperCase() ?? "USD",
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
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
