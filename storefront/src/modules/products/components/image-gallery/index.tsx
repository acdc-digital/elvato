"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  /**
   * Server-rendered image list. Used for SSR / initial paint and as the
   * fallback when no variant is selected.
   */
  images: HttpTypes.StoreProductImage[]
  /**
   * All product variants. When provided, the gallery will react to the
   * `?v_id=` URL search param (set by ProductActions on first render) and
   * to the `elvato:variant-change` custom event (dispatched on subsequent
   * client-side option changes) — switching to the matching variant's
   * `metadata.image` instantly without a server round-trip.
   */
  variants?: HttpTypes.StoreProductVariant[]
}

const ImageGallery = ({ images: initialImages, variants }: ImageGalleryProps) => {
  // Seed from SSR-visible search params so hydration matches.
  const searchParams = useSearchParams()
  const ssrVId = searchParams.get("v_id")
  const [vId, setVId] = useState<string | null>(ssrVId)

  // Listen for client-side variant changes from ProductActions. We avoid
  // router.replace() over there to skip the RSC refetch — instead the
  // actions component dispatches this custom event after updating the URL
  // via history.replaceState.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ variantId: string | null }>).detail
      setVId(detail?.variantId ?? null)
    }
    window.addEventListener("elvato:variant-change", handler as EventListener)
    return () =>
      window.removeEventListener(
        "elvato:variant-change",
        handler as EventListener
      )
  }, [])

  // Pick the gallery layout + which image to show. If the variant's image is
  // already present in the initial gallery (the common case), we just point
  // the selected index at it — no array mutation, no new <img src>, no
  // network round-trip. Browsers reuse the cached thumbnail instantly.
  const { displayImages, targetIndex } = useMemo(() => {
    if (!vId || !variants?.length) {
      return { displayImages: initialImages, targetIndex: 0 }
    }
    const variant = variants.find((v) => v.id === vId)
    const meta = variant?.metadata as
      | { image?: string; color_image?: string }
      | null
      | undefined
    const variantImageUrl = meta?.image || meta?.color_image
    if (!variantImageUrl) return { displayImages: initialImages, targetIndex: 0 }

    const existing = initialImages.findIndex((i) => i.url === variantImageUrl)
    if (existing !== -1) {
      // Reuse the existing thumbnail position — instant swap.
      return { displayImages: initialImages, targetIndex: existing }
    }

    // Variant image isn't in the SSR gallery — prepend it as the new hero.
    const variantImageId = `variant-${vId}`
    const rest = initialImages.filter(
      (i) => i.id !== variantImageId && !String(i.id).startsWith("variant-")
    )
    return {
      displayImages: [
        { id: variantImageId, url: variantImageUrl } as HttpTypes.StoreProductImage,
        ...rest,
      ],
      targetIndex: 0,
    }
  }, [vId, variants, initialImages])

  const [selectedIndex, setSelectedIndex] = useState(targetIndex)

  // When the variant changes (and thus targetIndex), follow it.
  useEffect(() => {
    setSelectedIndex(targetIndex)
  }, [targetIndex])

  const selectedImage = displayImages[selectedIndex] ?? displayImages[0]

  return (
    <div className="flex flex-col gap-y-3 w-full">
      {/* Main expanded image — 1:1 keeps the hero compact and balanced.
          The bg-ui-bg-subtle behind the image acts as a gentle skeleton
          while a not-yet-cached variant image loads. */}
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle rounded-lg">
        {selectedImage?.url && (
          <Image
            // key forces a clean swap (and lets the bg show briefly if the
            // image isn't cached yet)
            key={selectedImage.url}
            src={selectedImage.url}
            priority
            className="absolute inset-0 animate-enter"
            alt={`Product image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 40vw, 460px"
            style={{ objectFit: "cover" }}
          />
        )}
      </Container>

      {/* Thumbnail row */}
      {displayImages.length > 1 && (
        <div className="flex gap-x-2 overflow-x-auto no-scrollbar pb-1">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-[60px] h-[60px] small:w-[68px] small:h-[68px] rounded-md overflow-hidden bg-ui-bg-subtle transition-all duration-150 ${
                index === selectedIndex
                  ? "ring-2 ring-ui-fg-base ring-offset-2"
                  : "ring-1 ring-ui-border-base hover:ring-ui-fg-muted"
              }`}
            >
              {image.url && (
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="68px"
                  className="rounded-md"
                  style={{ objectFit: "cover" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
