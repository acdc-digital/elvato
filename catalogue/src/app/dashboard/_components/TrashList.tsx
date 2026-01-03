"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ProductRow } from "./ProductRow";
import { Button } from "@/components/ui/button";

interface TrashListProps {
  onProductClick: (productId: string, productName: string) => void;
}

export function TrashList({ onProductClick }: TrashListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Convex queries and mutations
  const deletedProductsData = useQuery(api.products.getDeletedProducts, {});
  const restoreProduct = useMutation(api.products.restoreProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);

  // Transform data to match ProductRow interface
  const deletedProducts = (deletedProductsData ?? []).map(p => ({
    ...p,
    _id: p._id as string,
  }));

  const handleSelect = (productId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleRestore = async () => {
    if (selectedIds.size === 0) return;
    
    await Promise.all(
      Array.from(selectedIds).map(id => 
        restoreProduct({ id: id as Id<"products"> })
      )
    );
    
    setSelectedIds(new Set());
  };

  const handlePermanentDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(
      `Are you sure you want to permanently delete ${selectedIds.size} item(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    await Promise.all(
      Array.from(selectedIds).map(id => 
        deleteProduct({ id: id as Id<"products"> })
      )
    );
    
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with action buttons */}
      <div className="px-4 py-2 border-b border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-between">
        <span className="text-xs text-[#858585]">
          {deletedProducts.length} items in trash
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </span>
        
        {/* Action buttons - only show when items are selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestore}
              className="h-7 px-2 text-xs text-[#858585] hover:text-[#007acc] hover:bg-[#2d2d2d] border border-[#2d2d2d]"
              title="Restore selected items"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePermanentDelete}
              className="h-7 px-2 text-xs text-[#858585] hover:text-[#f14c4c] hover:bg-[#2d2d2d] border border-[#2d2d2d]"
              title="Permanently delete selected items"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Forever
            </Button>
          </div>
        )}
      </div>

      {/* Deleted Product Rows */}
      <div className="flex-1 overflow-auto">
        {deletedProducts.map(product => (
          <ProductRow
            key={product._id}
            product={product}
            isSelected={selectedIds.has(product._id)}
            onSelect={handleSelect}
            onClick={onProductClick}
          />
        ))}
        
        {deletedProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#858585] text-sm gap-2">
            <Trash2 className="w-8 h-8 opacity-50" />
            <p>Trash is empty</p>
            <p className="text-xs">Deleted items will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
