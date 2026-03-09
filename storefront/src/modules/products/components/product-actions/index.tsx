"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import ShippingSelector from "../shipping-selector"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [shippingSurcharge, setShippingSurcharge] = useState(0)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Reset shipping surcharge when variant changes
  useEffect(() => {
    setShippingSurcharge(0)
  }, [selectedVariant?.id])

  // For each option, determine which values are available given the other
  // currently-selected options.
  const availableOptionValues = useMemo(() => {
    const result: Record<string, Set<string>> = {}
    for (const option of product.options || []) {
      const available = new Set<string>()
      const otherSelected = Object.entries(options).filter(
        ([id]) => id !== option.id
      )
      for (const variant of product.variants || []) {
        const variantOpts = optionsAsKeymap(variant.options) ?? {}
        const matchesOthers = otherSelected.every(
          ([id, val]) => !val || variantOpts[id] === val
        )
        if (matchesOthers && variantOpts[option.id]) {
          available.add(variantOpts[option.id])
        }
      }
      result[option.id] = available
    }
    return result
  }, [product.variants, product.options, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => {
      const next = { ...prev, [optionId]: value }

      // Auto-correct other options that become invalid with the new selection
      for (const option of product.options || []) {
        if (option.id === optionId) continue
        const currentVal = next[option.id]
        if (!currentVal) continue

        const otherSelected = Object.entries(next).filter(
          ([id]) => id !== option.id
        )
        const stillAvailable = (product.variants || []).some((variant) => {
          const vo = optionsAsKeymap(variant.options) ?? {}
          return (
            vo[option.id] === currentVal &&
            otherSelected.every(([id, val]) => !val || vo[id] === val)
          )
        })

        if (!stillAvailable) {
          const firstAvailable = (product.variants || []).find((variant) => {
            const vo = optionsAsKeymap(variant.options) ?? {}
            return otherSelected.every(
              ([id, val]) => !val || vo[id] === val
            )
          })
          if (firstAvailable) {
            const vo = optionsAsKeymap(firstAvailable.options) ?? {}
            next[option.id] = vo[option.id]
          }
        }
      }

      return next
    })
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.options?.length ?? 0) > 0 && (() => {
            // Skip options where every value is "Default" (single-variant placeholders)
            const meaningfulOptions = (product.options || []).filter(
              (o) => !(o.values?.length === 1 && o.values[0]?.value?.toLowerCase() === "default")
            )
            if (meaningfulOptions.length === 0) return null
            return (
              <div className="flex flex-col gap-y-4">
                {meaningfulOptions.map((option) => (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      availableValues={availableOptionValues[option.id]}
                    />
                  </div>
                ))}
                <Divider />
              </div>
            )
          })()}
        </div>

        <ProductPrice product={product} variant={selectedVariant} shippingSurcharge={shippingSurcharge} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Select variant"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
        </Button>

        <ShippingSelector
          variant={selectedVariant}
          currencyCode={product.variants?.[0]?.calculated_price?.currency_code || "usd"}
          selectedSurcharge={shippingSurcharge}
          onSurchargeChange={setShippingSurcharge}
        />

        {/* SKU */}
        {(selectedVariant?.sku || product.variants?.[0]?.sku) && (
          <div className="pt-4 mt-4 border-t border-ui-border-base flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted">SKU</span>
            <span className="text-xs font-mono text-ui-fg-base">{selectedVariant?.sku || product.variants?.[0]?.sku}</span>
          </div>
        )}

        {/* Shipping & Returns */}
        <div className="pt-6 mt-4 border-t border-ui-border-base">
          <h3 className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted mb-4">
            Shipping &amp; Returns
          </h3>
          <div className="flex flex-col gap-y-4">
            <div className="flex items-start gap-x-3">
              <svg className="w-5 h-5 text-ui-fg-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-8.688 2.014 2.014 0 0 0-1.527-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <div>
                <span className="text-sm font-medium text-ui-fg-base">Fast delivery</span>
                <p className="text-xs text-ui-fg-muted">3-5 business days</p>
              </div>
            </div>
            <div className="flex items-start gap-x-3">
              <svg className="w-5 h-5 text-ui-fg-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
              </svg>
              <div>
                <span className="text-sm font-medium text-ui-fg-base">Simple exchanges</span>
                <p className="text-xs text-ui-fg-muted">Hassle-free swaps</p>
              </div>
            </div>
            <div className="flex items-start gap-x-3">
              <svg className="w-5 h-5 text-ui-fg-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
              <div>
                <span className="text-sm font-medium text-ui-fg-base">Easy returns</span>
                <p className="text-xs text-ui-fg-muted">No questions asked</p>
              </div>
            </div>
          </div>
        </div>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          shippingSurcharge={shippingSurcharge}
          onSurchargeChange={setShippingSurcharge}
        />
      </div>
    </>
  )
}
