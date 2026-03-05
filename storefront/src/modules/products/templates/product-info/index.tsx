import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
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
        {/* Category badge */}
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted hover:text-ui-fg-base transition-colors w-fit"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        {/* Product title */}
        <Heading
          level="h2"
          className="text-2xl small:text-3xl leading-tight text-ui-fg-base font-semibold"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Description */}
        <Text
          className="text-sm leading-relaxed text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>

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
