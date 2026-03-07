import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { withCdnImages } from "@lib/data/convex-images"
import { getBaseURL } from "@lib/util/env"

// Product pages rely on cookies (auth headers, cache tags) and searchParams,
// which are dynamic server APIs incompatible with static generation in Next 15.
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images ?? []
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images ?? []
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return (product.images ?? []).filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

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

  const rawProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  const pricedProduct = await withCdnImages(rawProduct)

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

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
