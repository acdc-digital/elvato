import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import PreviewPrice from "./price"
import { getCdnThumbnail } from "@lib/data/convex-images"

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

/** Placeholder price range — will be replaced by dynamic pricing API */
const PLACEHOLDER_PRICE_RANGE = "$320 - $485"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

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
        className="relative border border-black rounded-t-2xl rounded-b-none overflow-visible bg-white group-hover:shadow-lg transition-shadow ease-in-out duration-150 w-full"
      >
        {/* Inner image container with fixed aspect ratio */}
        <div className="m-2 border border-black rounded-t-xl rounded-b-none overflow-hidden bg-gray-100 relative before:content-[''] before:block before:pt-[133.33%]">
          {/* Fixture name bar — overlays top of image */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-black px-2 py-1">
            <p className="text-[11px] font-mono text-black leading-tight text-center">
              {product.title}
            </p>
          </div>
          <div className="absolute inset-0">
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
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-mono">
                No image
              </div>
            )}
          </div>
        </div>

        {/* Options & pricing below image — left-aligned with inner image (m-2) */}
        <div className="flex flex-col items-start py-3 mx-2 gap-1.5">
          {/* Finish swatches */}
          {finishSwatches.length > 0 && (
            <div className="flex items-center gap-1.5">
              {finishSwatches.slice(0, 6).map((swatch) => (
                <span
                  key={swatch.label}
                  title={swatch.label}
                  className="w-5 h-5 rounded-full border border-black/30 inline-block"
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          )}
          {/* Total option count */}
          {totalOptionCount > 0 && (
            <p className="text-xs text-black font-mono">
              {totalOptionCount} {totalOptionCount === 1 ? "Option" : "Options"}
            </p>
          )}
          {/* Price range */}
          <p className="text-sm text-black font-semibold mt-0.5" data-testid="product-price">
            {PLACEHOLDER_PRICE_RANGE}
          </p>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
