"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";

// Product type matching Convex schema
export interface Product {
  _id: string;
  name: string;
  sku: string;
  lists: number;
  price: number;
  sourceUrl: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  image7?: string;
  image8?: string;
  image9?: string;
  image10?: string;
}

interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  onSelect: (productId: string, checked: boolean) => void;
  onClick: (productId: string, productName: string) => void;
}

export function ProductRow({ 
  product, 
  isSelected, 
  onSelect, 
  onClick 
}: ProductRowProps) {
  
  const handleRowClick = () => {
    onClick(product._id, product.name);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking checkbox
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking source link
    if (product.sourceUrl) {
      window.open(product.sourceUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Format price display (assuming price is in cents or as decimal)
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex items-center gap-4 px-4 py-3 bg-[#1e1e1e] border-b border-[#2d2d2d] hover:bg-[#252526] cursor-pointer transition-colors"
    >
      {/* 1. Checkbox Selection */}
      <div onClick={handleCheckboxClick} className="shrink-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(product._id, checked as boolean)}
          className="border-[#858585] data-[state=checked]:bg-[#007acc] data-[state=checked]:border-[#007acc]"
        />
      </div>

      {/* 2. Image Card Placeholder */}
      <div className="w-16 h-16 bg-[#252526] border border-[#2d2d2d] rounded shrink-0 flex items-center justify-center overflow-hidden">
        {product.image1 ? (
          <img 
            src={product.image1} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[#858585] text-xs">No image</span>
        )}
      </div>

      {/* 3. Product Title / SKU / Lists */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-[#cccccc] font-medium truncate">
          {product.name}
        </h3>
        <p className="text-xs text-[#858585] mt-0.5">
          SKU: {product.sku}
        </p>
        <p className="text-xs text-[#858585] mt-0.5">
          Lists: {product.lists}
        </p>
      </div>

      {/* 4. Price */}
      <div className="shrink-0 text-right min-w-20">
        <span className="text-sm text-[#cccccc]">
          {formatPrice(product.price)}
        </span>
      </div>

      {/* 5. Source URL */}
      <div className="shrink-0 min-w-25">
        {product.sourceUrl ? (
          <button
            onClick={handleSourceClick}
            className="flex items-center gap-1 text-xs text-[#007acc] hover:text-[#3794ff] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-20">Source</span>
          </button>
        ) : (
          <span className="text-xs text-[#858585]">No source</span>
        )}
      </div>
    </div>
  );
}
