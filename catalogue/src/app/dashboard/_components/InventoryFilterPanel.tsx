"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  X,
  Filter,
  Loader2
} from "lucide-react";
import { 
  CJSearchParams, 
  CJCategoryOption, 
  LightingPreset,
  LIGHTING_PRESETS 
} from "@/types/cj-dropshipping";

interface InventoryFilterPanelProps {
  onSearch: (params: CJSearchParams) => void;
  isLoading: boolean;
  activePreset: string | null;
  onPresetChange: (presetName: string | null) => void;
}

export function InventoryFilterPanel({ 
  onSearch, 
  isLoading, 
  activePreset,
  onPresetChange 
}: InventoryFilterPanelProps) {
  // Filter states
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<number>(1); // 1 = listing count
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [productFlag, setProductFlag] = useState<number | null>(null);
  
  // UI states
  const [isExpanded, setIsExpanded] = useState(true);
  const [categories, setCategories] = useState<CJCategoryOption[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // Fetch lighting categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Track if this is the initial mount
  const [hasMounted, setHasMounted] = useState(false);
  
  // Set mounted after first render
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Apply preset when selected (but not on initial mount)
  useEffect(() => {
    if (!hasMounted) return; // Skip on initial mount
    
    if (activePreset) {
      const preset = LIGHTING_PRESETS.find(p => p.name === activePreset);
      if (preset) {
        setKeyword(preset.keywords[0] || "");
        // Trigger search with preset keywords
        handleSearch(preset.keywords.join(" "));
      }
    }
  }, [activePreset, hasMounted]);

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const response = await fetch('/api/cj/categories?lighting=true');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleSearch = (overrideKeyword?: string) => {
    const params: CJSearchParams = {
      keyWord: overrideKeyword || keyword || "light lamp LED",
      page: 1,
      size: 20,
      sort: sortOrder,
      orderBy: orderBy,
      features: ['enable_description'],
    };

    if (selectedCategory) {
      params.categoryId = selectedCategory;
    }

    if (minPrice) {
      params.startSellPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      params.endSellPrice = parseFloat(maxPrice);
    }

    if (freeShippingOnly) {
      params.addMarkStatus = 1;
    }

    if (productFlag !== null) {
      params.productFlag = productFlag;
    }

    onSearch(params);
  };

  const handlePresetClick = (preset: LightingPreset) => {
    if (activePreset === preset.name) {
      onPresetChange(null);
      setKeyword("");
    } else {
      onPresetChange(preset.name);
    }
  };

  const handleClearFilters = () => {
    setKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortOrder('desc');
    setOrderBy(1);
    setFreeShippingOnly(false);
    setProductFlag(null);
    onPresetChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="border-b border-[#2d2d2d] bg-[#1e1e1e]">
      {/* Lighting Preset Quick Filters */}
      <div className="px-4 py-2 border-b border-[#2d2d2d] bg-[#252526]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-[#858585] mr-2">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Lighting Presets:</span>
          </div>
          {LIGHTING_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activePreset === preset.name
                  ? 'bg-[#007acc] text-white'
                  : 'bg-[#3d3d3d] text-[#cccccc] hover:bg-[#4d4d4d]'
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Filter Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#252526]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-xs text-[#cccccc]">
          <Filter className="w-3.5 h-3.5" />
          <span>Advanced Filters</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#858585]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#858585]" />
        )}
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Search Row */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#858585]" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products (e.g., pendant lamp, LED strip)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="px-4 py-1.5 text-xs bg-[#007acc] text-white rounded hover:bg-[#0069ac] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              Search
            </button>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Category Select */}
            <div className="col-span-2">
              <label className="block text-xs text-[#858585] mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              >
                <option value="">All Lighting Categories</option>
                {isCategoriesLoading ? (
                  <option disabled>Loading categories...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs text-[#858585] mb-1">Min Price ($)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#858585] mb-1">Max Price ($)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs text-[#858585] mb-1">Sort By</label>
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(parseInt(e.target.value, 10))}
                className="w-full px-2 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              >
                <option value={0}>Best Match</option>
                <option value={1}>Popularity</option>
                <option value={2}>Price</option>
                <option value={3}>Newest</option>
                <option value={4}>Inventory</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label className="block text-xs text-[#858585] mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-2 py-1.5 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-[#cccccc] cursor-pointer">
              <input
                type="checkbox"
                checked={freeShippingOnly}
                onChange={(e) => setFreeShippingOnly(e.target.checked)}
                className="rounded border-[#3d3d3d] bg-[#3c3c3c] text-[#007acc] focus:ring-[#007acc]"
              />
              Free Shipping Only
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#858585]">Product Type:</span>
              {[
                { value: null, label: "All" },
                { value: 0, label: "Trending" },
                { value: 1, label: "New" },
                { value: 2, label: "Video" },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => setProductFlag(option.value)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    productFlag === option.value
                      ? 'bg-[#007acc] text-white'
                      : 'bg-[#3d3d3d] text-[#cccccc] hover:bg-[#4d4d4d]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs text-[#858585] hover:text-[#cccccc]"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
