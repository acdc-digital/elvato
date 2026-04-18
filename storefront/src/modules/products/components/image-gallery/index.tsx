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
   * `?v_id=` URL search param (set by ProductActions) and hoist the
   * matching variant's `metadata.image` to the front client-side, so the
   * hero image updates instantly when the user changes options — without
   * waiting for a server re-render.
   */
  variants?: HttpTypes.StoreProductVariant[]
}

const ImageGallery = ({ images: initialImages, variants }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const vId = searchParams.get("v_id")

  // Re-derive the gallery whenever the selected variant changes. This runs
  // on the client without any network round-trip; the server has already
  // produced the correct `initialImages` for the URL's initial `v_id`, so
  // the first client render matches SSR (no hydration mismatch).
  const images = useMemo(() => {
    if (!vId || !variants?.length) return initialImages
    const variant = variants.find((v) => v.id === vId)
    const variantImageUrl = (variant?.metadata as { image?: string } | null | undefined)?.image
    if (!variantImageUrl) return initialImages

    const variantImageId = `variant-${vId}`
    // Drop any prior variant-image marker AND any base image with the same
    // URL, then prepend the variant image so it becomes the hero.
    const rest = initialImages.filter(
      (i) => i.id !== variantImageId && i.url !== variantImageUrl && !String(i.id).startsWith("variant-")
    )
    return [
      { id: variantImageId, url: variantImageUrl } as HttpTypes.StoreProductImage,
      ...rest,
    ]
  }, [vId, variants, initialImages])

  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset to first (hero / variant) image when the variant or image set changes.
  useEffect(() => {
    setSelectedIndex(0)
  }, [vId, images])

  const selectedImage = images[selectedIndex]

  return (
    <div className="flex flex-col gap-y-3 w-full">
      {/* Main expanded image — 1:1 keeps the hero compact and balanced */}
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle rounded-lg">
        {selectedImage?.url && (
          <Image
            src={selectedImage.url}
            priority
            className="absolute inset-0 transition-opacity duration-200"
            alt={`Product image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 40vw, 460px"
            style={{ objectFit: "cover" }}
          />
        )}
      </Container>

      {/* Thumbnail row */}
      {images.length > 1 && (
        <div className="flex gap-x-2 overflow-x-auto no-scrollbar pb-1">
          {images.map((image, index) => (
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
