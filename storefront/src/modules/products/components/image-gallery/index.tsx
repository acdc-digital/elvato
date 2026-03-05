"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useEffect, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset to first image when images change (e.g. variant switch)
  useEffect(() => {
    setSelectedIndex(0)
  }, [images])

  const selectedImage = images[selectedIndex]

  return (
    <div className="flex flex-col gap-y-4 w-full">
      {/* Main expanded image */}
      <Container className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle">
        {selectedImage?.url && (
          <Image
            src={selectedImage.url}
            priority
            className="absolute inset-0 rounded-rounded transition-opacity duration-200"
            alt={`Product image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 600px"
            style={{ objectFit: "cover" }}
          />
        )}
      </Container>

      {/* Thumbnail row */}
      {images.length > 1 && (
        <div className="flex gap-x-3 overflow-x-auto no-scrollbar pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-[72px] h-[72px] small:w-[80px] small:h-[80px] rounded-md overflow-hidden bg-ui-bg-subtle transition-all duration-150 ${
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
                  sizes="80px"
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
