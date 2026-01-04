// CJ Dropshipping API Types
// Based on API v2.0 documentation

// ============================================================================
// Authentication Types
// ============================================================================

export interface CJAuthResponse {
  code: number;
  result: boolean;
  message?: string;
  data: {
    openId: number;
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken: string;
    refreshTokenExpiryDate: string;
    createDate: string;
  };
}

export interface CJTokenState {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

// ============================================================================
// Category Types
// ============================================================================

export interface CJCategoryThird {
  categoryId: string;
  categoryName: string;
}

export interface CJCategorySecond {
  categorySecondName: string;
  categorySecondList: CJCategoryThird[];
}

export interface CJCategoryFirst {
  categoryFirstName: string;
  categoryFirstList: CJCategorySecond[];
}

export interface CJCategoryResponse {
  code: number;
  result: boolean;
  message?: string;
  data: CJCategoryFirst[];
}

// Flattened category for UI dropdowns
export interface CJCategoryOption {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  parentName?: string;
  fullPath: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface CJProduct {
  id: string;               // Product ID (pid)
  nameEn: string;           // English product name
  sku: string;              // Product SKU
  spu: string;              // Product SPU
  bigImage: string;         // Main image URL
  sellPrice: string;        // Sell price (USD)
  nowPrice?: string;        // Current/discount price
  discountPrice?: string;   // Best discount price
  listedNum: number;        // Times listed on platforms
  categoryId: string;       // Third level category ID
  twoCategoryId?: string;   // Second level category ID
  oneCategoryId?: string;   // First level category ID
  addMarkStatus: number;    // Free shipping flag (0=no, 1=yes)
  isVideo: number;          // Has video (0=no, 1=yes)
  supplierName?: string;    // Supplier name
  createAt: number;         // Create timestamp
  warehouseInventoryNum?: number; // Total inventory
  description?: string;     // Product description (with enable_description)
  variants?: CJProductVariant[]; // Product variants (from detail API)
}

// Product variant type for detailed product info
export interface CJProductVariant {
  vid: string;              // Variant ID
  pid: string;              // Product ID
  variantName?: string;     // Variant name (Chinese)
  variantNameEn?: string;   // Variant name (English)
  variantSku: string;       // Variant SKU
  variantImage: string;     // Variant image URL
  variantStandard?: string; // Variant specification
  variantUnit?: string;     // Variant selling unit
  variantProperty?: string; // Variant property type
  variantKey?: string;      // Variant attribute keywords
  variantLength?: number;   // Length in mm
  variantWidth?: number;    // Width in mm
  variantHeight?: number;   // Height in mm
  variantVolume?: number;   // Volume in mm3
  variantWeight?: number;   // Weight in grams
  variantSellPrice?: number; // Sell price in USD
  variantSugSellPrice?: number; // Suggested sell price in USD
  createTime?: number;      // Creation timestamp
}

export interface CJProductListResponse {
  code: number;
  result: boolean;
  message?: string;
  data: {
    pageSize: number;
    pageNumber: number;
    totalRecords: number;
    totalPages: number;
    content: {
      productList: CJProduct[];
      relatedCategoryList?: CJCategoryOption[];
      keyWord?: string;
      keyWordOld?: string;
    };
  };
}

// Product detail response (for single product query)
export interface CJProductDetailResponse {
  code: number;
  result: boolean;
  message?: string;
  data: {
    pid: string;
    productName: string;
    productNameEn: string;
    productSku: string;
    productImage: string;
    productWeight: number;
    productType: string;
    productUnit?: string;
    categoryId?: string;
    categoryName?: string;
    description?: string;
    sellPrice?: string;
    variants: CJProductVariant[];
    productVideo?: string;
    status?: number;
  };
}

// ============================================================================
// Search/Filter Types
// ============================================================================

export interface CJSearchParams {
  // Text search
  keyWord?: string;
  
  // Pagination
  page?: number;            // Default 1, max 1000
  size?: number;            // Default 10, max 100
  
  // Category filters
  categoryId?: string;      // Third level category ID
  lv2categoryList?: string[]; // Second level category IDs
  lv3categoryList?: string[]; // Third level category IDs
  
  // Location/inventory
  countryCode?: string;     // CN, US, GB, FR, etc.
  isWarehouse?: boolean;    // Global warehouse search
  startWarehouseInventory?: number;
  endWarehouseInventory?: number;
  verifiedWarehouse?: number; // 1=verified, 2=unverified
  
  // Price filters
  startSellPrice?: number;  // USD
  endSellPrice?: number;    // USD
  currency?: string;        // USD, AUD, EUR, etc.
  
  // Product attributes
  addMarkStatus?: number;   // 0=not free shipping, 1=free shipping
  productType?: number;     // 4=Supplier, 10=Video, 11=Non-video
  productFlag?: number;     // 0=Trending, 1=New, 2=Video, 3=Slow-moving
  hasCertification?: number; // 0=No, 1=Yes (CE cert)
  customization?: number;   // 0=No, 1=Yes (POD products)
  
  // Sorting
  sort?: 'asc' | 'desc';
  orderBy?: number;         // 0=best match, 1=listing count, 2=price, 3=create time, 4=inventory
  
  // Time filters
  timeStart?: number;       // Listing start timestamp (ms)
  timeEnd?: number;         // Listing end timestamp (ms)
  
  // Platform
  zonePlatform?: 'shopify' | 'ebay' | 'amazon' | 'tiktok' | 'etsy';
  
  // Supplier
  supplierId?: string;
  
  // Features to include in response
  features?: ('enable_description' | 'enable_category' | 'enable_combine' | 'enable_video')[];
}

// ============================================================================
// Lighting Preset Configuration
// ============================================================================

export interface LightingPreset {
  name: string;
  keywords: string[];
  categoryKeywords: string[];  // Used to match category names
  description: string;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    name: "All Lighting",
    keywords: ["lamp", "light", "lighting", "LED"],
    categoryKeywords: ["light", "lamp", "LED", "lighting"],
    description: "All lighting-related products"
  },
  {
    name: "LED Lights",
    keywords: ["LED light", "LED strip", "LED bulb"],
    categoryKeywords: ["LED"],
    description: "LED-based lighting products"
  },
  {
    name: "Pendant & Chandeliers",
    keywords: ["pendant light", "chandelier", "hanging light"],
    categoryKeywords: ["pendant", "chandelier", "hanging"],
    description: "Ceiling-mounted hanging lights"
  },
  {
    name: "Table & Desk Lamps",
    keywords: ["table lamp", "desk lamp", "bedside lamp"],
    categoryKeywords: ["table lamp", "desk lamp"],
    description: "Portable table and desk lighting"
  },
  {
    name: "Wall Lights",
    keywords: ["wall light", "wall sconce", "wall lamp"],
    categoryKeywords: ["wall light", "sconce"],
    description: "Wall-mounted lighting fixtures"
  },
  {
    name: "Smart Lighting",
    keywords: ["smart light", "smart bulb", "wifi light", "RGB light"],
    categoryKeywords: ["smart", "wifi", "RGB"],
    description: "App-controlled and smart lighting"
  },
  {
    name: "Decorative Lights",
    keywords: ["decorative light", "fairy light", "string light", "neon"],
    categoryKeywords: ["decorative", "fairy", "string", "neon"],
    description: "Decorative and ambient lighting"
  },
  {
    name: "Outdoor Lighting",
    keywords: ["outdoor light", "garden light", "solar light", "pathway light"],
    categoryKeywords: ["outdoor", "garden", "solar", "pathway"],
    description: "Exterior and garden lighting"
  }
];

// Default lighting search - combines common keywords for initial filter
export const DEFAULT_LIGHTING_SEARCH: Partial<CJSearchParams> = {
  keyWord: "light lamp LED",
  orderBy: 1,          // Order by listing count (popular items)
  sort: 'desc',
  size: 20,
  features: ['enable_description'],
};

// ============================================================================
// API Response Wrapper Types
// ============================================================================

export interface CJApiError {
  code: number;
  message: string;
  result: false;
}

export type CJApiResponse<T> = T | CJApiError;

// Rate limit error code
export const CJ_RATE_LIMIT_ERROR = 1600200;

// ============================================================================
// UI State Types
// ============================================================================

export interface InventorySearchState {
  // Current search parameters
  params: CJSearchParams;
  
  // Results
  products: CJProduct[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  
  // Loading/error states
  isLoading: boolean;
  error: string | null;
  
  // Selection
  selectedProductIds: Set<string>;
  
  // Active preset
  activePreset: string | null;
}

export interface CJProductForImport {
  cjProductId: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  images: string[];
  sourceUrl: string;
  category: string;
  supplier: string;
  inventory: number;
}
