"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { ProductRow } from "./ProductRow";
import { ActionToolbar } from "./ActionToolbar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// ============================================================================
// MULTI-SELECT PSEUDO-CODE (Commented out for future implementation)
// ============================================================================
// 
// import { useCallback, useMemo } from "react";
// 
// interface MultiSelectState {
//   selectedIds: Set<Id<"products">>;
//   lastSelectedId: Id<"products"> | null;
// }
// 
// // Initialize multi-select state
// const [multiSelect, setMultiSelect] = useState<MultiSelectState>({
//   selectedIds: new Set(),
//   lastSelectedId: null,
// });
// 
// // Handle individual selection
// const handleSelect = useCallback((productId: Id<"products">, checked: boolean) => {
//   setMultiSelect(prev => {
//     const newSelected = new Set(prev.selectedIds);
//     if (checked) {
//       newSelected.add(productId);
//     } else {
//       newSelected.delete(productId);
//     }
//     return { selectedIds: newSelected, lastSelectedId: productId };
//   });
// }, []);
// 
// // Handle shift-click for range selection
// const handleShiftSelect = useCallback((productId: Id<"products">, productIds: Id<"products">[]) => {
//   if (!multiSelect.lastSelectedId) return;
//   
//   const lastIndex = productIds.indexOf(multiSelect.lastSelectedId);
//   const currentIndex = productIds.indexOf(productId);
//   
//   if (lastIndex === -1 || currentIndex === -1) return;
//   
//   const start = Math.min(lastIndex, currentIndex);
//   const end = Math.max(lastIndex, currentIndex);
//   const rangeIds = productIds.slice(start, end + 1);
//   
//   setMultiSelect(prev => {
//     const newSelected = new Set(prev.selectedIds);
//     rangeIds.forEach(id => newSelected.add(id));
//     return { selectedIds: newSelected, lastSelectedId: productId };
//   });
// }, [multiSelect.lastSelectedId]);
// 
// // Select all products
// const handleSelectAll = useCallback((productIds: Id<"products">[]) => {
//   setMultiSelect({
//     selectedIds: new Set(productIds),
//     lastSelectedId: null,
//   });
// }, []);
// 
// // Clear all selections
// const handleClearSelection = useCallback(() => {
//   setMultiSelect({
//     selectedIds: new Set(),
//     lastSelectedId: null,
//   });
// }, []);
// 
// // Get selected count for bulk action UI
// const selectedCount = useMemo(() => multiSelect.selectedIds.size, [multiSelect.selectedIds]);
// 
// // Bulk action handlers
// const handleBulkDelete = useCallback(async () => {
//   const ids = Array.from(multiSelect.selectedIds);
//   // await Promise.all(ids.map(id => deleteProduct({ id })));
//   handleClearSelection();
// }, [multiSelect.selectedIds, handleClearSelection]);
// 
// const handleBulkExport = useCallback(() => {
//   const ids = Array.from(multiSelect.selectedIds);
//   // Export logic here
// }, [multiSelect.selectedIds]);
// 
// ============================================================================

interface ProductListProps {
  onProductClick: (productId: string, productName: string) => void;
  onAddProduct: () => void;
}

export function ProductList({ onProductClick, onAddProduct }: ProductListProps) {
  // Simple single-select state for now
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Convex queries and mutations
  const products = useQuery(api.products.getProducts, {});
  const lastAction = useQuery(api.actionHistory.getLastAction, {});
  const softDelete = useMutation(api.products.softDeleteProduct);
  const undoAction = useMutation(api.actionHistory.undoLastAction);

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

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    
    // Soft delete all selected products
    await Promise.all(
      Array.from(selectedIds).map(id => 
        softDelete({ id: id as Id<"products"> })
      )
    );
    
    setSelectedIds(new Set());
  };

  const handleUndo = async () => {
    try {
      await undoAction();
    } catch (error) {
      console.error("Failed to undo:", error);
    }
  };

  const handleRedo = async () => {
    // TODO: Implement redo functionality
    console.log("Redo action - not yet implemented");
  };

  // Check if we can undo (there's an action in history)
  const canUndo = lastAction !== null && lastAction !== undefined;
  const canRedo = false; // Not implemented yet

  // Handle loading state
  if (products === undefined) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ActionToolbar
          selectedCount={0}
          canUndo={false}
          canRedo={false}
          onAddProduct={onAddProduct}
          onDelete={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
        />
        <div className="flex-1 flex items-center justify-center text-[#858585] text-sm">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Action Toolbar */}
      <ActionToolbar
        selectedCount={selectedIds.size}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddProduct={onAddProduct}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Product Rows */}
      <div className="flex-1 overflow-auto">
        {products.map(product => (
          <ProductRow
            key={product._id}
            product={{
              _id: product._id,
              name: product.name,
              sku: product.sku,
              lists: product.lists,
              price: product.price,
              sourceUrl: product.sourceUrl,
              image1: product.image1,
              image2: product.image2,
              image3: product.image3,
              image4: product.image4,
              image5: product.image5,
              image6: product.image6,
              image7: product.image7,
              image8: product.image8,
              image9: product.image9,
              image10: product.image10,
            }}
            isSelected={selectedIds.has(product._id)}
            onSelect={handleSelect}
            onClick={onProductClick}
          />
        ))}
        
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#858585] text-sm gap-2">
            <Package className="w-8 h-8 opacity-50" />
            <p>No products found</p>
            <p className="text-xs">Click + to add your first product</p>
          </div>
        )}
      </div>
    </div>
  );
}
