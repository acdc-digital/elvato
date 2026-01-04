"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductImageModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
}

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  description?: string;
  images: string[];
}

export function ProductImageModal({
  productId,
  productName,
  isOpen,
  onClose,
  initialImage,
}: ProductImageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch product details when modal opens
  useEffect(() => {
    if (isOpen && !productDetail) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  // Reset current image index when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen]);

  const fetchProductDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cj/products/${productId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch product details');
      }

      setProductDetail(data.product);

      // If we have an initial image, set the index to that image
      if (initialImage && data.product.images) {
        const index = data.product.images.indexOf(initialImage);
        if (index !== -1) {
          setCurrentImageIndex(index);
        }
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (productDetail && productDetail.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? productDetail.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (productDetail && productDetail.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === productDetail.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full bg-[#1e1e1e] border-[#2d2d2d] text-[#cccccc]"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-[#cccccc] pr-8">
            {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-96 text-[#858585]">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading images...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-96 text-red-400">
              <X className="w-8 h-8 mb-2" />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchProductDetails}
                className="mt-4 px-4 py-2 text-xs bg-[#007acc] hover:bg-[#005a9e] rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Images Loaded */}
          {productDetail && !isLoading && !error && (
            <>
              {/* Main Image Display */}
              <div className="relative bg-[#252526] rounded-lg overflow-hidden">
                {productDetail.images.length > 0 ? (
                  <>
                    <div className="flex items-center justify-center min-h-[400px] max-h-[600px]">
                      <img
                        src={productDetail.images[currentImageIndex]}
                        alt={`${productName} - Image ${currentImageIndex + 1}`}
                        className="max-w-full max-h-[600px] object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Navigation Arrows */}
                    {productDetail.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                      {currentImageIndex + 1} / {productDetail.images.length}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-[#858585]">
                    <p className="text-sm">No images available</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {productDetail.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {productDetail.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all overflow-hidden ${
                        index === currentImageIndex
                          ? 'border-[#007acc] ring-2 ring-[#007acc]/50'
                          : 'border-[#2d2d2d] hover:border-[#858585]'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Info */}
              {productDetail.description && (
                <div className="pt-2 border-t border-[#2d2d2d]">
                  <p className="text-xs text-[#858585] line-clamp-3">
                    {productDetail.description.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
