import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import PreviewPrice from "./price"
import CardActions from "./card-actions"
import { convertToLocale } from "@lib/util/money"

/**
 * Map common finish / colour names to hex values.
 * Falls back to a neutral grey for unknown values.
 */
const COLOR_CLASS_MAP: Record<string, string> = {
  // Neutrals
  white: "bg-white",
  black: "bg-[#1A1A1A]",
  gray: "bg-[#808080]",
  grey: "bg-[#808080]",

  // Metals
  gold: "bg-[#D4AF37]",
  golden: "bg-[#DAA520]",
  "rose gold": "bg-[#B76E79]",
  silver: "bg-[#C0C0C0]",
  chrome: "bg-[#CCCCCC]",
  copper: "bg-[#B87333]",
  bronze: "bg-[#CD7F32]",
  brass: "bg-[#B5A642]",
  nickel: "bg-[#A9A9A9]",
  "brushed nickel": "bg-[#B0B0B0]",
  "satin nickel": "bg-[#B8B8B8]",
  "antique brass": "bg-[#986F33]",
  "antique gold": "bg-[#9E7C0C]",
  "matte black": "bg-[#222222]",

  // Colours
  red: "bg-[#C0392B]",
  blue: "bg-[#2980B9]",
  green: "bg-[#27AE60]",
  amber: "bg-[#F0A30A]",
  clear: "bg-[#E8E8E8]",
  transparent: "bg-[#E0E0E0]",
  warm: "bg-[#F5DEB3]",
  cool: "bg-[#B0C4DE]",
}

function getSwatchClassName(value: string): string {
  const lower = value.toLowerCase().trim()
  return COLOR_CLASS_MAP[lower] ?? "bg-[#CCCCCC]"
}

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // Compute real price display from variant calculated_prices
  const pricedVariants = (product.variants ?? []).filter(
    (v: any) => v.calculated_price?.calculated_amount != null
  )
  let priceDisplay = ""
  if (pricedVariants.length > 0) {
    const amounts = pricedVariants.map(
      (v: any) => v.calculated_price.calculated_amount as number
    )
    const currencyCode =
      (pricedVariants[0] as any).calculated_price.currency_code ?? "cad"
    const min = Math.min(...amounts)
    const max = Math.max(...amounts)
    const fmt = (n: number) =>
      convertToLocale({ amount: n, currency_code: currencyCode })
    priceDisplay = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
  }

  // Product image fields are canonicalized upstream to Convex/Bunny CDN URLs.
  const thumbnail = product.thumbnail ?? null

  // Resolve default variant for quick-add
  const defaultVariantId =
    pricedVariants.length > 0
      ? (pricedVariants[0] as any).id as string
      : product.variants?.[0]?.id ?? null

  // Extract finish / colour option for swatches
  const finishOption = product.options?.find(
    (o) => o.title?.toLowerCase() === "finish" || o.title?.toLowerCase() === "color" || o.title?.toLowerCase() === "colour"
  )
  const finishSwatches = (finishOption?.values ?? []).map((v: { value: string }) => ({
    label: v.value,
    className: getSwatchClassName(v.value),
  }))

  // Total option count across ALL option types (finish + size + voltage + …)
  const totalOptionCount = (product.options ?? []).reduce(
    (sum, opt) => sum + (opt.values?.length ?? 0),
    0
  )

  const cardClassName = isFeatured
    ? "relative overflow-hidden rounded-lg bg-[#FDFCFA] ring-1 ring-black/[0.08] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:ring-black/[0.16] w-full"
    : "relative rounded-2xl overflow-hidden bg-[#FDFCFA] ring-1 ring-black/[0.14] group-hover:ring-black/[0.22] group-hover:-translate-y-1 transition-all duration-300 ease-out w-full"
  const imageRatioClassName = isFeatured
    ? "relative overflow-hidden bg-grey-5 before:content-[''] before:block before:pt-[105%]"
    : "relative overflow-hidden bg-grey-5 before:content-[''] before:block before:pt-[133.33%]"
  const detailClassName = isFeatured
    ? "flex flex-col gap-1.5 px-3 pt-2.5 pb-2.5"
    : "flex flex-col px-4 pt-3.5 pb-3 gap-2"
  const titleClassName = isFeatured
    ? "line-clamp-2 text-[12px] font-medium leading-snug text-grey-80"
    : "text-[13px] font-medium leading-snug text-grey-80 line-clamp-2"

  return (
    <div className="group w-full">
      <div
        data-testid="product-wrapper"
        className={cardClassName}
      >
        {/* Clickable area — image + product info */}
        <LocalizedClientLink href={`/products/${product.handle}`}>
          {/* Image container — edge-to-edge, no inner border */}
          <div className={imageRatioClassName}>
            <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={product.title || 'Product'}
                  fill
                  loading="lazy"
                  className="object-cover object-center"
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-grey-30 text-xs font-sans">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Product details — clean, warm typography */}
          <div className={detailClassName}>
            {/* Product title */}
            <h3 className={titleClassName}>
              {product.title}
            </h3>

            {/* Finish swatches */}
            {finishSwatches.length > 0 && (
              <div className="flex items-center gap-1.5">
                {finishSwatches.slice(0, 6).map((swatch) => (
                  <span
                    key={swatch.label}
                    title={swatch.label}
                    className={`w-4 h-4 rounded-full ring-1 ring-black/10 inline-block ${swatch.className}`}
                  />
                ))}
                {finishSwatches.length > 6 && (
                  <span className="text-[11px] text-grey-40 ml-0.5">
                    +{finishSwatches.length - 6}
                  </span>
                )}
              </div>
            )}

            {/* Option count + Price row */}
            <div className="flex items-baseline justify-between mt-0.5">
              <p className="text-sm font-semibold text-grey-80 tracking-tight" data-testid="product-price">
                {priceDisplay || "Price unavailable"}
              </p>
              {totalOptionCount > 0 && (
                <p className="text-[11px] text-grey-40 font-sans">
                  {totalOptionCount} {totalOptionCount === 1 ? "option" : "options"}
                </p>
              )}
            </div>
          </div>
        </LocalizedClientLink>

        {/* Quick-add row — quantity picker + add to cart */}
        <CardActions variantId={defaultVariantId} productHandle={product.handle ?? ""} />
      </div>
    </div>
  )
}
