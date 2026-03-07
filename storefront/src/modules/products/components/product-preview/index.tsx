import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import PreviewPrice from "./price"
import { getCdnThumbnail } from "@lib/data/convex-images"
import { convertToLocale } from "@lib/util/money"

/**
 * Map common finish / colour names to hex values.
 * Falls back to a neutral grey for unknown values.
 */
const COLOR_MAP: Record<string, string> = {
  // Neutrals
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#808080",
  grey: "#808080",

  // Metals
  gold: "#D4AF37",
  golden: "#DAA520",
  "rose gold": "#B76E79",
  silver: "#C0C0C0",
  chrome: "#CCCCCC",
  copper: "#B87333",
  bronze: "#CD7F32",
  brass: "#B5A642",
  nickel: "#A9A9A9",
  "brushed nickel": "#B0B0B0",
  "satin nickel": "#B8B8B8",
  "antique brass": "#986F33",
  "antique gold": "#9E7C0C",
  "matte black": "#222222",

  // Colours
  red: "#C0392B",
  blue: "#2980B9",
  green: "#27AE60",
  amber: "#F0A30A",
  clear: "#E8E8E8",
  transparent: "#E0E0E0",
  warm: "#F5DEB3",
  cool: "#B0C4DE",
}

function getSwatchColor(value: string): string {
  const lower = value.toLowerCase().trim()
  return COLOR_MAP[lower] ?? "#CCCCCC"
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

  // Resolve CDN thumbnail (falls back to original if not ingested)
  const cdnThumb = product.handle
    ? await getCdnThumbnail(product.handle)
    : null
  const thumbnail = cdnThumb ?? product.thumbnail ?? product.images?.[0]?.url ?? null

  // Extract finish / colour option for swatches
  const finishOption = product.options?.find(
    (o) => o.title?.toLowerCase() === "finish" || o.title?.toLowerCase() === "color" || o.title?.toLowerCase() === "colour"
  )
  const finishSwatches = (finishOption?.values ?? []).map((v: { value: string }) => ({
    label: v.value,
    color: getSwatchColor(v.value),
  }))

  // Total option count across ALL option types (finish + size + voltage + …)
  const totalOptionCount = (product.options ?? []).reduce(
    (sum, opt) => sum + (opt.values?.length ?? 0),
    0
  )

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group w-full">
      <div
        data-testid="product-wrapper"
        className="relative rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.04] group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 ease-out w-full"
      >
        {/* Image container — edge-to-edge, no inner border */}
        <div className="relative overflow-hidden bg-grey-5 before:content-[''] before:block before:pt-[133.33%]">
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
        <div className="flex flex-col px-4 pt-3.5 pb-4 gap-2">
          {/* Product title */}
          <h3 className="text-[13px] font-medium leading-snug text-grey-80 line-clamp-2">
            {product.title}
          </h3>

          {/* Finish swatches */}
          {finishSwatches.length > 0 && (
            <div className="flex items-center gap-1.5">
              {finishSwatches.slice(0, 6).map((swatch) => (
                <span
                  key={swatch.label}
                  title={swatch.label}
                  className="w-4 h-4 rounded-full ring-1 ring-black/10 inline-block shadow-sm"
                  style={{ backgroundColor: swatch.color }}
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
      </div>
    </LocalizedClientLink>
  )
}
