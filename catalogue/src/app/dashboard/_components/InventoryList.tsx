"use client";

import { useState, useCallback, useEffect } from "react";
import { Package, AlertCircle, Loader2 } from "lucide-react";
import { InventoryFilterPanel } from "./InventoryFilterPanel";
import { InventoryToolbar } from "./InventoryToolbar";
import { CJProductRow } from "./CJProductRow";
import { 
  CJProduct, 
  CJSearchParams, 
  CJProductForImport,
  DEFAULT_LIGHTING_SEARCH 
} from "@/types/cj-dropshipping";

interface InventoryListProps {
  onImportProducts?: (products: CJProductForImport[]) => void;
}

interface PaginationState {
  page: number;
  size: number;
  totalRecords: number;
  totalPages: number;
}

export function InventoryList({ onImportProducts }: InventoryListProps) {
  // Product state
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    size: 20,
    totalRecords: 0,
    totalPages: 0,
  });
  
  // Current search params (for refresh/pagination)
  const [currentParams, setCurrentParams] = useState<CJSearchParams | null>(null);
  
  // Active preset
  const [activePreset, setActivePreset] = useState<string | null>("All Lighting");

  // Initial load with default lighting search
  useEffect(() => {
    // Small delay to prevent race conditions with other effects
    const timer = setTimeout(() => {
      const initialParams: CJSearchParams = {
        ...DEFAULT_LIGHTING_SEARCH,
        page: 1,
        size: pagination.size,
      };
      setCurrentParams(initialParams);
      fetchProducts(initialParams);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = async (params: CJSearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (params.keyWord) queryParams.set('keyWord', params.keyWord);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.size) queryParams.set('size', params.size.toString());
      if (params.categoryId) queryParams.set('categoryId', params.categoryId);
      if (params.startSellPrice !== undefined) queryParams.set('startSellPrice', params.startSellPrice.toString());
      if (params.endSellPrice !== undefined) queryParams.set('endSellPrice', params.endSellPrice.toString());
      if (params.addMarkStatus !== undefined) queryParams.set('addMarkStatus', params.addMarkStatus.toString());
      if (params.productFlag !== undefined) queryParams.set('productFlag', params.productFlag.toString());
      if (params.sort) queryParams.set('sort', params.sort);
      if (params.orderBy !== undefined) queryParams.set('orderBy', params.orderBy.toString());

      const response = await fetch(`/api/cj/products?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products);
      setPagination({
        page: data.pagination.page,
        size: data.pagination.size,
        totalRecords: data.pagination.totalRecords,
        totalPages: data.pagination.totalPages,
      });
      setCurrentParams(params);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback((params: CJSearchParams) => {
    // Reset to first page on new search
    const searchParams = {
      ...params,
      page: 1,
      size: pagination.size,
    };
    setSelectedIds(new Set()); // Clear selection on new search
    fetchProducts(searchParams);
  }, [pagination.size]);

  const handleRefresh = useCallback(() => {
    if (currentParams) {
      fetchProducts(currentParams);
    }
  }, [currentParams]);

  const handlePageChange = useCallback((page: number) => {
    if (currentParams) {
      const newParams = { ...currentParams, page };
      fetchProducts(newParams);
    }
  }, [currentParams]);

  const handlePageSizeChange = useCallback((size: number) => {
    if (currentParams) {
      const newParams = { ...currentParams, page: 1, size };
      setPagination(prev => ({ ...prev, size }));
      fetchProducts(newParams);
    }
  }, [currentParams]);

  const handleSelect = useCallback((productId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleImportSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    // Convert selected products to import format
    const productsToImport: CJProductForImport[] = products
      .filter(p => selectedIds.has(p.id))
      .map(p => ({
        cjProductId: p.id,
        name: p.nameEn || 'Untitled Product',
        sku: p.sku || p.id,
        description: p.description || '',
        price: parseFloat(p.discountPrice || p.nowPrice || p.sellPrice) || 0,
        images: p.bigImage ? [p.bigImage] : [],
        sourceUrl: `https://www.cjdropshipping.com/product/${p.sku || p.id}`,
        category: p.categoryId || '',
        supplier: p.supplierName || 'CJ Dropshipping',
        inventory: p.warehouseInventoryNum || 0,
      }));

    if (onImportProducts) {
      onImportProducts(productsToImport);
    } else {
      // Log for now - in the future this will add to Products
      console.log('Products to import:', productsToImport);
      alert(`Ready to import ${productsToImport.length} product(s). Database integration pending.`);
    }

    // Clear selection after import
    setSelectedIds(new Set());
  }, [selectedIds, products, onImportProducts]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Filter Panel */}
      <InventoryFilterPanel
        onSearch={handleSearch}
        isLoading={isLoading}
        activePreset={activePreset}
        onPresetChange={setActivePreset}
      />

      {/* Toolbar */}
      <InventoryToolbar
        selectedCount={selectedIds.size}
        totalRecords={pagination.totalRecords}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.size}
        isLoading={isLoading}
        onImportSelected={handleImportSelected}
        onRefresh={handleRefresh}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Product List */}
      <div className="flex-1 overflow-auto">
        {/* Error State */}
        {error && (
          <div className={`flex items-center gap-2 px-4 py-3 border-b text-sm ${
            error.includes('429') || error.includes('Rate limit') || error.includes('wait')
              ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-400'
              : 'bg-red-900/20 border-red-900/50 text-red-400'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              {error.includes('429') || error.includes('Rate limit') || error.includes('wait') ? (
                <>
                  <span className="font-medium">Rate Limited: </span>
                  <span>CJ API limits token requests to once per 5 minutes. Please wait and try again.</span>
                </>
              ) : (
                <span>{error}</span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-64 text-[#858585]">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Searching CJ Dropshipping...</p>
          </div>
        )}

        {/* Product Rows */}
        {products.map(product => (
          <CJProductRow
            key={product.id}
            product={product}
            isSelected={selectedIds.has(product.id)}
            onSelect={handleSelect}
          />
        ))}

        {/* Empty State */}
        {!isLoading && products.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-[#858585] text-sm gap-2">
            <Package className="w-8 h-8 opacity-50" />
            <p>No products found</p>
            <p className="text-xs">Try adjusting your search filters or selecting a different preset</p>
          </div>
        )}
      </div>
    </div>
  );
}
