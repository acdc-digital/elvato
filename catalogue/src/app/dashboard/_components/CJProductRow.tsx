"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Video, Truck, TrendingUp, Package } from "lucide-react";
import { CJProduct } from "@/types/cj-dropshipping";

interface CJProductRowProps {
  product: CJProduct;
  isSelected: boolean;
  onSelect: (productId: string, checked: boolean) => void;
}

export function CJProductRow({ 
  product, 
  isSelected, 
  onSelect, 
}: CJProductRowProps) {
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open CJ product page
    const cjUrl = `https://www.cjdropshipping.com/product/${product.sku || product.id}`;
    window.open(cjUrl, "_blank", "noopener,noreferrer");
  };

  // Format price display
  const formatPrice = (price: string | undefined) => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    return isNaN(num) ? price : `$${num.toFixed(2)}`;
  };

  // Get best available price
  const getBestPrice = () => {
    if (product.discountPrice) return product.discountPrice;
    if (product.nowPrice) return product.nowPrice;
    return product.sellPrice;
  };

  // Check if there's a discount
  const hasDiscount = product.discountPrice && 
    parseFloat(product.discountPrice) < parseFloat(product.sellPrice);

  // Truncate description
  const truncateDescription = (desc: string | undefined, maxLength: number = 100) => {
    if (!desc) return 'No description available';
    // Strip HTML tags
    const stripped = desc.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + '...';
  };

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-b border-[#2d2d2d] transition-colors ${
        isSelected 
          ? 'bg-[#094771] hover:bg-[#0a5286]' 
          : 'bg-[#1e1e1e] hover:bg-[#252526]'
      }`}
    >
      {/* 1. Checkbox Selection */}
      <div onClick={handleCheckboxClick} className="shrink-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(product.id, checked as boolean)}
          className="border-[#858585] data-[state=checked]:bg-[#007acc] data-[state=checked]:border-[#007acc]"
        />
      </div>

      {/* 2. Product Image */}
      <div className="w-16 h-16 bg-[#252526] border border-[#2d2d2d] rounded shrink-0 flex items-center justify-center overflow-hidden">
        {product.bigImage ? (
          <img 
            src={product.bigImage} 
            alt={product.nameEn}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package className="w-6 h-6 text-[#858585]" />
        )}
      </div>

      {/* 3. Product Info - Name / SKU / Description */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-sm text-[#cccccc] font-medium truncate">
          {product.nameEn || 'Untitled Product'}
        </h3>
        <div className="flex items-center gap-3 text-xs text-[#858585]">
          <span>SKU: {product.sku || product.id}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {product.listedNum?.toLocaleString() || 0} listings
          </span>
        </div>
        <p className="text-xs text-[#6e6e6e] line-clamp-1">
          {truncateDescription(product.description)}
        </p>
      </div>

      {/* 4. Badges */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          {product.addMarkStatus === 1 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-green-900/50 text-green-400 rounded" title="Free Shipping">
              <Truck className="w-2.5 h-2.5" />
              Free
            </span>
          )}
          {product.isVideo === 1 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-purple-900/50 text-purple-400 rounded" title="Has Video">
              <Video className="w-2.5 h-2.5" />
              Video
            </span>
          )}
        </div>
        {product.warehouseInventoryNum !== undefined && product.warehouseInventoryNum > 0 && (
          <span className="text-[10px] text-[#858585]">
            Stock: {product.warehouseInventoryNum.toLocaleString()}
          </span>
        )}
      </div>

      {/* 5. Price */}
      <div className="shrink-0 text-right min-w-24">
        <div className="text-sm text-[#cccccc] font-medium">
          {formatPrice(getBestPrice())}
        </div>
        {hasDiscount && (
          <div className="text-xs text-[#858585] line-through">
            {formatPrice(product.sellPrice)}
          </div>
        )}
      </div>

      {/* 6. Source Link */}
      <div className="shrink-0">
        <button
          onClick={handleSourceClick}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[#007acc] hover:text-[#3794ff] hover:bg-[#2d2d2d] rounded transition-colors"
          title="View on CJ Dropshipping"
        >
          <ExternalLink className="w-3 h-3" />
          <span>CJ</span>
        </button>
      </div>
    </div>
  );
}
