import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
  shippingSurcharge = 0,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  shippingSurcharge?: number
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const hasSurcharge = shippingSurcharge > 0 && variant
  const combinedAmount = hasSurcharge
    ? selectedPrice.calculated_price_number + shippingSurcharge
    : selectedPrice.calculated_price_number
  const combinedFormatted = hasSurcharge
    ? convertToLocale({
        amount: combinedAmount,
        currency_code: selectedPrice.currency_code,
      })
    : selectedPrice.calculated_price

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi", {
          "text-ui-fg-interactive": selectedPrice.price_type === "sale" || hasSurcharge,
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={combinedAmount}
        >
          {combinedFormatted}
        </span>
      </span>
      {hasSurcharge && (
        <p className="text-small-regular text-ui-fg-subtle">
          <span className="line-through">{selectedPrice.calculated_price}</span>
          <span className="ml-1 text-ui-fg-muted">(expedited shipping)</span>
        </p>
      )}
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span className="text-ui-fg-subtle">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
