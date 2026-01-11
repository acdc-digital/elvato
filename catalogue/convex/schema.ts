import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// ELVATO CATALOGUE SCHEMA
// =============================================================================
// This schema defines:
// 1. Legacy tables (projects, products, actionHistory)
// 2. CJ Dropshipping sync table (cjMyProducts)
// 3. Medusa staging tables (medusaProducts, medusaProductVariants, 
//    medusaImages, medusaPrices, medusaCategories)
//
// Data Flow: CJ API → cjMyProducts → medusa* tables → Medusa PostgreSQL
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // LEGACY TABLES
  // ---------------------------------------------------------------------------
  
  projects: defineTable({
    value: v.number(),
  }),
  
  // Products table for catalogue management (legacy)
  products: defineTable({
    // Core product info
    name: v.string(),
    sku: v.string(),
    lists: v.number(), // Number of lists this product appears in
    price: v.number(), // Price in decimal format (e.g., 8.60)
    sourceUrl: v.string(), // External source URL
    
    // Image URLs (up to 10 images per product)
    image1: v.optional(v.string()),
    image2: v.optional(v.string()),
    image3: v.optional(v.string()),
    image4: v.optional(v.string()),
    image5: v.optional(v.string()),
    image6: v.optional(v.string()),
    image7: v.optional(v.string()),
    image8: v.optional(v.string()),
    image9: v.optional(v.string()),
    image10: v.optional(v.string()),
    
    // Metadata
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    deletedAt: v.optional(v.number()), // Soft delete timestamp
  })
    .index("by_sku", ["sku"])
    .index("by_name", ["name"])
    .index("by_createdAt", ["createdAt"])
    .index("by_deletedAt", ["deletedAt"]),
  
  // Action history for undo/redo functionality
  actionHistory: defineTable({
    actionType: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("restore")
    ),
    entityType: v.string(), // "products", etc.
    entityId: v.string(), // ID of the affected entity
    previousState: v.optional(v.any()), // State before action
    newState: v.optional(v.any()), // State after action
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"]),

  // ---------------------------------------------------------------------------
  // CJ DROPSHIPPING SYNC TABLE
  // ---------------------------------------------------------------------------
  
  // CJ My Products - synced from CJ Dropshipping "My Products" section
  // This is the RAW data from CJ API, stored as-is for reference
  cjMyProducts: defineTable({
    // CJ-specific identifiers
    cjProductId: v.string(),      // CJ's productId
    sku: v.string(),              // Product SKU
    
    // Product info
    nameEn: v.string(),           // English product name
    productNames: v.array(v.string()), // All product names from CJ
    bigImage: v.string(),         // Main image URL
    price: v.number(),            // Price in USD (totalPrice from CJ)
    productType: v.number(),      // Product type code from CJ
    listedShopNum: v.optional(v.string()), // Number of shops listed on
    
    // Sync metadata
    cjCreatedAt: v.union(v.string(), v.number()), // ISO string (legacy) or Unix timestamp (new)
    syncedAt: v.number(),         // When we synced this record (Unix timestamp)
    updatedAt: v.number(),        // Last update timestamp
    
    // Optional extended data (populated if we fetch details)
    description: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    categoryName: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    inventory: v.optional(v.number()),
    
    // Staging reference - links to medusaProducts when staged
    stagedToMedusa: v.optional(v.boolean()), // true when copied to staging
    medusaProductRef: v.optional(v.id("medusaProducts")), // FK to staging table
  })
    .index("by_cjProductId", ["cjProductId"])
    .index("by_sku", ["sku"])
    .index("by_syncedAt", ["syncedAt"])
    .index("by_stagedToMedusa", ["stagedToMedusa"]),

  // ---------------------------------------------------------------------------
  // MEDUSA STAGING TABLES
  // ---------------------------------------------------------------------------
  // These tables mirror Medusa's PostgreSQL schema structure.
  // Data is curated here before syncing to the production Medusa database.
  // Master sync flag on medusaProducts cascades to all child tables.
  // ---------------------------------------------------------------------------

  // ===========================================================================
  // TABLE: medusaCategories (Independent - sync before products)
  // Maps to: Medusa PostgreSQL `product_category` table
  // ===========================================================================
  medusaCategories: defineTable({
    // --- Medusa Core Fields ---
    name: v.string(),                    // Category name (e.g., "Chandeliers")
    handle: v.string(),                  // URL slug (auto-generated from name)
    description: v.string(),             // Category description (default: "")
    isActive: v.boolean(),               // Visible to customers (default: true)
    isInternal: v.boolean(),             // Internal only flag (default: false)
    rank: v.number(),                    // Display order
    
    // --- Hierarchy ---
    parentCategoryId: v.optional(v.id("medusaCategories")), // FK for nesting
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON data
    
    // --- CJ Reference ---
    cjCategoryId: v.optional(v.string()),   // Original CJ category ID
    cjCategoryName: v.optional(v.string()), // Original CJ category name
    
    // --- Sync Control ---
    syncStatus: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("synced"),
      v.literal("failed")
    ),
    medusaCategoryId: v.optional(v.string()), // Medusa's ID after sync
    lastSyncedAt: v.optional(v.number()),     // Unix timestamp
    syncError: v.optional(v.string()),        // Error message if failed
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_handle", ["handle"])
    .index("by_cjCategoryId", ["cjCategoryId"])
    .index("by_syncStatus", ["syncStatus"])
    .index("by_parentCategoryId", ["parentCategoryId"]),

  // ===========================================================================
  // TABLE: medusaProducts (Master Table - controls sync cascade)
  // Maps to: Medusa PostgreSQL `product` table
  // ===========================================================================
  medusaProducts: defineTable({
    // --- Source Reference ---
    cjMyProductId: v.id("cjMyProducts"), // FK to source CJ product
    
    // --- Medusa Core Fields (Required) ---
    title: v.string(),                   // Product title (from CJ nameEn or custom)
    handle: v.string(),                  // URL slug (auto-generated from title)
    status: v.union(                     // Product status
      v.literal("draft"),
      v.literal("proposed"),
      v.literal("published"),
      v.literal("rejected")
    ),
    isGiftcard: v.boolean(),             // Is this a gift card? (default: false)
    discountable: v.boolean(),           // Can discounts apply? (default: true)
    
    // --- Medusa Core Fields (Optional) ---
    subtitle: v.optional(v.string()),    // Product subtitle
    description: v.optional(v.string()), // Full description (from CJ or custom)
    thumbnail: v.optional(v.string()),   // Main thumbnail URL
    
    // --- Dimensions ---
    weight: v.optional(v.string()),      // Product weight
    length: v.optional(v.string()),      // Length dimension
    height: v.optional(v.string()),      // Height dimension
    width: v.optional(v.string()),       // Width dimension
    
    // --- Classification ---
    originCountry: v.optional(v.string()), // Country of origin (e.g., "CN")
    hsCode: v.optional(v.string()),        // Harmonized System code for customs
    midCode: v.optional(v.string()),       // Manufacturer ID code
    material: v.optional(v.string()),      // Material composition
    
    // --- Relationships (populated after category/collection sync) ---
    medusaCategoryId: v.optional(v.id("medusaCategories")), // FK to staging category
    collectionHandle: v.optional(v.string()), // Collection to assign (by handle)
    typeValue: v.optional(v.string()),        // Product type value
    
    // --- External Reference ---
    externalId: v.string(),              // = CJ's cjProductId (links back to CJ)
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON: supplier, cj_created_at, etc.
    
    // --- Sync Control (MASTER FLAGS) ---
    isReadyToSync: v.boolean(),          // MASTER FLAG: triggers cascade sync
    syncStatus: v.union(
      v.literal("pending"),              // Not yet synced
      v.literal("syncing"),              // Currently syncing
      v.literal("synced"),               // Successfully synced
      v.literal("failed")                // Sync failed
    ),
    medusaProductId: v.optional(v.string()), // Medusa's product ID after sync
    lastSyncedAt: v.optional(v.number()),    // Unix timestamp of last sync
    syncError: v.optional(v.string()),       // Error message if sync failed
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_cjMyProductId", ["cjMyProductId"])
    .index("by_handle", ["handle"])
    .index("by_status", ["status"])
    .index("by_isReadyToSync", ["isReadyToSync"])
    .index("by_syncStatus", ["syncStatus"])
    .index("by_externalId", ["externalId"])
    .index("by_medusaCategoryId", ["medusaCategoryId"]),

  // ===========================================================================
  // TABLE: medusaProductVariants (Child of medusaProducts)
  // Maps to: Medusa PostgreSQL `product_variant` table
  // ===========================================================================
  medusaProductVariants: defineTable({
    // --- Parent Reference ---
    medusaProductId: v.id("medusaProducts"), // FK to parent product
    
    // --- Medusa Core Fields (Required) ---
    title: v.string(),                   // Variant title (e.g., "Default", "Large")
    allowBackorder: v.boolean(),         // Allow backorders? (default: false)
    manageInventory: v.boolean(),        // Track inventory? (default: true)
    
    // --- Medusa Core Fields (Optional) ---
    sku: v.optional(v.string()),         // Stock Keeping Unit
    barcode: v.optional(v.string()),     // Barcode
    ean: v.optional(v.string()),         // European Article Number
    upc: v.optional(v.string()),         // Universal Product Code
    
    // --- Dimensions (integers in Medusa) ---
    weight: v.optional(v.number()),      // Weight (grams)
    length: v.optional(v.number()),      // Length (mm)
    height: v.optional(v.number()),      // Height (mm)
    width: v.optional(v.number()),       // Width (mm)
    
    // --- Classification ---
    hsCode: v.optional(v.string()),      // HS code
    originCountry: v.optional(v.string()), // Country of origin
    midCode: v.optional(v.string()),     // MID code
    material: v.optional(v.string()),    // Material
    
    // --- Display ---
    variantRank: v.optional(v.number()), // Sort order (0-based)
    thumbnail: v.optional(v.string()),   // Variant-specific image
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON data
    
    // --- Sync Tracking ---
    medusaVariantId: v.optional(v.string()), // Medusa's variant ID after sync
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_medusaProductId", ["medusaProductId"])
    .index("by_sku", ["sku"]),

  // ===========================================================================
  // TABLE: medusaImages (Child of medusaProducts)
  // Maps to: Medusa PostgreSQL `image` table
  // ===========================================================================
  medusaImages: defineTable({
    // --- Parent Reference ---
    medusaProductId: v.id("medusaProducts"), // FK to parent product
    
    // --- Medusa Core Fields ---
    url: v.string(),                     // Image URL (from CJ bigImage or additional)
    rank: v.number(),                    // Display order (0 = primary, 1, 2, ...)
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON: alt text, source, etc.
    
    // --- Sync Tracking ---
    medusaImageId: v.optional(v.string()), // Medusa's image ID after sync
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_medusaProductId", ["medusaProductId"])
    .index("by_rank", ["rank"]),

  // ===========================================================================
  // TABLE: medusaPrices (Child of medusaProductVariants)
  // Maps to: Medusa PostgreSQL `price` table (via price_set)
  // ===========================================================================
  medusaPrices: defineTable({
    // --- Parent Reference ---
    medusaVariantId: v.id("medusaProductVariants"), // FK to parent variant
    
    // --- Medusa Core Fields ---
    currencyCode: v.string(),            // ISO currency code: "usd", "cad", "eur"
    amount: v.number(),                  // Price in CENTS (e.g., 1999 = $19.99)
    
    // --- Quantity-based Pricing (optional) ---
    minQuantity: v.optional(v.number()), // Minimum quantity for this price tier
    maxQuantity: v.optional(v.number()), // Maximum quantity for this price tier
    
    // --- Our Business Fields ---
    costPrice: v.optional(v.number()),   // Original CJ price in cents (for margin calc)
    markupPercent: v.optional(v.number()), // Our markup percentage
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON data
    
    // --- Sync Tracking ---
    medusaPriceId: v.optional(v.string()),   // Medusa's price ID after sync
    medusaPriceSetId: v.optional(v.string()), // Medusa's price_set ID
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_medusaVariantId", ["medusaVariantId"])
    .index("by_currencyCode", ["currencyCode"]),
});
