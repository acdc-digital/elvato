import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  // Surface the variant axes (e.g. "Color", "Size") as headline highlights —
  // only options that actually offer a choice (>1 value) are included.
  const variantHighlights = (product.options ?? [])
    .map((option) => {
      const values = Array.from(
        new Set(
          (option.values ?? [])
            .map((v) => v.value?.trim())
            .filter((v): v is string => Boolean(v))
        )
      )
      if (values.length < 2) return null
      const preview = values.slice(0, 4).join(" · ")
      const more = values.length > 4 ? ` +${values.length - 4} more` : ""
      return {
        label: `${values.length} ${option.title} options`,
        detail: `${preview}${more}`,
      }
    })
    .filter((h): h is { label: string; detail: string } => h !== null)

  // Secondary feature bullets pulled from structured product fields.
  const featureHighlights: { label: string; detail?: string }[] = []
  featureHighlights.push({ label: "Free shipping", detail: "Worldwide" })
  if (product.material) {
    featureHighlights.push({ label: "Material", detail: product.material })
  }
  if (product.length && product.width && product.height) {
    featureHighlights.push({
      label: "Dimensions",
      detail: `${product.length} × ${product.width} × ${product.height} mm`,
    })
  }
  if (product.weight) {
    featureHighlights.push({ label: "Weight", detail: `${product.weight} g` })
  }

  const specs = [
    { label: "Material", value: product.material },
    { label: "Origin", value: product.origin_country },
    { label: "Type", value: product.type?.value },
    { label: "Weight", value: product.weight ? `${product.weight} g` : null },
    {
      label: "Dimensions",
      value:
        product.length && product.width && product.height
          ? `${product.length}L x ${product.width}W x ${product.height}H`
          : null,
    },
  ].filter((s) => s.value)

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-5">
        {/* Category badge + Free Shipping tag */}
        <div className="flex items-center gap-x-3">
          {product.collection && (
            <LocalizedClientLink
              href={`/collections/${product.collection.handle}`}
              className="text-sm font-medium uppercase tracking-wider text-ui-fg-muted hover:text-ui-fg-base transition-colors w-fit"
            >
              {product.collection.title}
            </LocalizedClientLink>
          )}
          <span className="inline-flex items-center gap-x-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 006.5 3zM2 12v2.5A1.5 1.5 0 003.5 16h.041a3 3 0 015.918 0h1.082a3 3 0 015.918 0H17a1.5 1.5 0 001.5-1.5V12H2z" />
              <path d="M12.5 7.556V10H17v-.277a1.5 1.5 0 00-.629-1.217l-2.21-1.584A1.5 1.5 0 0012.5 7.556zM7 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Free Shipping
          </span>
        </div>

        {/* Product title */}
        <Heading
          level="h2"
          className="text-2xl small:text-3xl leading-tight text-ui-fg-base font-semibold"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Description (full, no truncation — supports paragraph breaks) */}
        {product.description && (
          <Text
            className="text-sm leading-relaxed text-ui-fg-subtle whitespace-pre-line"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        )}

        {/* Highlights — variant choices first, then key features */}
        {(variantHighlights.length > 0 || featureHighlights.length > 0) && (
          <ul className="flex flex-col gap-y-2 pt-1">
            {variantHighlights.map((h) => (
              <li
                key={`variant-${h.label}`}
                className="flex items-start gap-x-2 text-sm text-ui-fg-base"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                />
                <span>
                  <span className="font-medium">{h.label}</span>
                  <span className="text-ui-fg-subtle"> — {h.detail}</span>
                </span>
              </li>
            ))}
            {featureHighlights.map((h) => (
              <li
                key={`feature-${h.label}`}
                className="flex items-start gap-x-2 text-sm text-ui-fg-base"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-fg-muted/50"
                />
                <span>
                  <span className="font-medium">{h.label}</span>
                  {h.detail && (
                    <span className="text-ui-fg-subtle"> — {h.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Product specs */}
        {specs.length > 0 && (
          <div className="pt-4 border-t border-ui-border-base">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted mb-3">
              Specifications
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <span className="text-xs text-ui-fg-muted">
                    {spec.label}
                  </span>
                  <p className="text-sm text-ui-fg-base">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
