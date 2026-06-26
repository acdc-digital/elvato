import { getRegion } from "@lib/data/regions"
import { withCdnImages } from "@lib/data/convex-images"
import { convertToLocale } from "@lib/util/money"
import { pickFamilySibling } from "@lib/util/pick-family-sibling"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

type FamilyShowcaseProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/**
 * Compact "from the same family" card — surfaces a single related CJ product
 * alongside the customer reviews block, without competing with the full
 * "You might also like" grid further down the page.
 *
 * Selection priority:
 *   1. Same collection
 *   2. Same product type
 *   3. Shared tags
 * Falls back to nothing if no candidates are found.
 */
export default async function FamilyShowcase({
  product,
  countryCode,
}: FamilyShowcaseProps) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const result = await pickFamilySibling({
    product,
    countryCode,
    regionId: region.id,
  })
  if (!result) return null

  const sibling = await withCdnImages(result.sibling)
  const pricedVariants = (sibling.variants ?? []).filter(
    (v: any) => v.calculated_price?.calculated_amount != null
  )
  let priceDisplay = ""
  if (pricedVariants.length > 0) {
    const amounts = pricedVariants.map(
      (v: any) => v.calculated_price.calculated_amount as number
    )
    const currencyCode =
      (pricedVariants[0] as any).calculated_price.currency_code ?? "usd"
    const min = Math.min(...amounts)
    const max = Math.max(...amounts)
    const fmt = (n: number) =>
      convertToLocale({ amount: n, currency_code: currencyCode })
    priceDisplay = min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
  }

  const thumbnail = sibling.thumbnail ?? null

  const familyLabel =
    sibling.collection?.title ??
    (sibling.type?.value as string | undefined) ??
    "Family"

  return (
    <div className="border-t border-ui-border-base pt-12">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted mb-1">
          From the same family
        </p>
        <h2 className="text-xl font-semibold text-ui-fg-base">{familyLabel}</h2>
        <p className="text-sm text-ui-fg-subtle mt-2">
          A complementary piece from the same collection.
        </p>
      </div>

      <LocalizedClientLink
        href={`/products/${sibling.handle}`}
        className="group block rounded-2xl overflow-hidden bg-[#FDFCFA] ring-1 ring-black/[0.14] hover:ring-black/[0.22] hover:-translate-y-1 transition-all duration-300 ease-out"
      >
        <div className="relative overflow-hidden bg-grey-5 before:content-[''] before:block before:pt-[100%]">
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={sibling.title || "Family product"}
                fill
                loading="lazy"
                sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 320px"
                className="object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-grey-30 text-xs">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col px-4 pt-3.5 pb-4 gap-2">
          <h3 className="text-sm font-medium leading-snug text-grey-80 line-clamp-2">
            {sibling.title}
          </h3>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-sm font-semibold text-grey-80 tracking-tight">
              {priceDisplay || "Price unavailable"}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-ui-fg-muted group-hover:text-ui-fg-base transition-colors">
              View →
            </span>
          </div>
        </div>
      </LocalizedClientLink>
    </div>
  )
}
