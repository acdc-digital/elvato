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
  // Optional package size — set via product.metadata.packageSize (string).
  // e.g. "A: 590x240x180(mm); B: 390x240x180(mm)"
  const packageSize = (product.metadata as { packageSize?: string } | null | undefined)?.packageSize
  if (packageSize) {
    featureHighlights.push({ label: "Package Size", detail: packageSize })
  }

  // Optional side-by-side comparison table, sourced from product.metadata.
  // Schema:
  // metadata.comparisonTable = {
  //   headers: string[]                              // column headers (e.g. ["Option A","Option B"])
  //   rows:    { label: string; values: string[] }[] // per-option differences
  //   shared?: { label: string; value: string }[]    // rows that span all columns
  // }
  const comparisonTable = (() => {
    const ct = (product.metadata as any)?.comparisonTable
    if (!ct || !Array.isArray(ct.headers) || !Array.isArray(ct.rows)) return null
    if (ct.headers.length === 0 || ct.rows.length === 0) return null
    return {
      headers: ct.headers as string[],
      rows: ct.rows as { label: string; values: string[] }[],
      shared: Array.isArray(ct.shared)
        ? (ct.shared as { label: string; value: string }[])
        : [],
    }
  })()

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

        {/* Side-by-side comparison table (driven by metadata.comparisonTable) */}
        {comparisonTable && (
          <div
            className="overflow-hidden rounded-lg border border-ui-border-base"
            data-testid="product-comparison-table"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ui-bg-subtle">
                  <th className="w-32 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ui-fg-muted">
                    {/* spacer */}
                  </th>
                  {comparisonTable.headers.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ui-fg-base"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonTable.rows.map((row, i) => (
                  <tr
                    key={`row-${row.label}`}
                    className={
                      i % 2 === 1
                        ? "bg-ui-bg-subtle/40 border-t border-ui-border-base"
                        : "border-t border-ui-border-base"
                    }
                  >
                    <td className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ui-fg-muted align-top">
                      {row.label}
                    </td>
                    {comparisonTable.headers.map((_, ci) => (
                      <td
                        key={ci}
                        className="px-4 py-2.5 text-ui-fg-base align-top"
                      >
                        {row.values[ci] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {comparisonTable.shared.map((row) => (
                  <tr
                    key={`shared-${row.label}`}
                    className="border-t border-ui-border-base bg-ui-bg-base"
                  >
                    <td className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ui-fg-muted align-top">
                      {row.label}
                    </td>
                    <td
                      colSpan={comparisonTable.headers.length}
                      className="px-4 py-2.5 text-ui-fg-base align-top"
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </div>
    </div>
  )
}

export default ProductInfo
