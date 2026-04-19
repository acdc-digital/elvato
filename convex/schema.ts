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
  // COPILOT USAGE TRACKING
  // ---------------------------------------------------------------------------
  
  copilotUsage: defineTable({
    usageInputs: v.record(v.string(), v.string()), // Day number (as string) -> percentage input
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

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
    
    // CJ Product Status
    isRemovedFromShelves: v.optional(v.boolean()), // true if CJ says "removed from shelves"
    cjStatusMessage: v.optional(v.string()),       // Last status message from CJ API
    
    // Staging reference - links to medusaProducts when staged
    stagedToMedusa: v.optional(v.boolean()), // true when copied to staging
    medusaProductRef: v.optional(v.id("medusaProducts")), // FK to staging table
  })
    .index("by_cjProductId", ["cjProductId"])
    .index("by_sku", ["sku"])
    .index("by_syncedAt", ["syncedAt"])
    .index("by_stagedToMedusa", ["stagedToMedusa"]),

  // Products removed from CJ shelves - auto-populated during sync
  removedFromShelves: defineTable({
    cjProductId: v.string(),           // CJ's productId
    sku: v.string(),                   // Product SKU
    nameEn: v.string(),                // English product name
    bigImage: v.optional(v.string()),  // Last known image URL
    price: v.optional(v.number()),     // Last known price
    cjStatusMessage: v.optional(v.string()), // Message from CJ API
    
    // Reference to original cjMyProducts record (if still exists)
    cjMyProductRef: v.optional(v.id("cjMyProducts")),
    
    // Timestamps
    removedAt: v.number(),             // When we detected removal
    lastSeenAt: v.optional(v.number()), // Last time product was available
  })
    .index("by_cjProductId", ["cjProductId"])
    .index("by_sku", ["sku"])
    .index("by_removedAt", ["removedAt"]),

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
      v.literal("failed"),               // Sync failed
      v.literal("duplicate"),            // Exists in Medusa but not reconciled
      v.literal("exhausted")             // Failed max retry attempts
    ),
    syncAttempts: v.optional(v.number()),    // Number of sync attempts made
    medusaProductId: v.optional(v.string()), // Medusa's product ID after sync
    lastSyncedAt: v.optional(v.number()),    // Unix timestamp of last sync
    syncError: v.optional(v.string()),       // Error message if sync failed
    
    // --- Image Extraction Tracking ---
    imagesExtractedAt: v.optional(v.number()), // When images were extracted from description
    
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
    
    // --- VARIANT OPTIONS ---
    // Key-value pairs matching Medusa's format
    // e.g., { "Color Temperature": "Warm White", "Size": "40cm", "Finish": "Black" }
    options: v.optional(v.any()),
    
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

  // ===========================================================================
  // TABLE: medusaProductOptions (Child of medusaProducts)
  // Maps to: Medusa PostgreSQL `product_option` table
  // Defines what options a product has (e.g., "Color Temperature", "Size")
  // ===========================================================================
  medusaProductOptions: defineTable({
    // --- Parent Reference ---
    medusaProductId: v.id("medusaProducts"), // FK to parent product
    
    // --- Medusa Core Fields ---
    title: v.string(),                   // Option name: "Color Temperature", "Size", "Finish"
    
    // --- Metadata ---
    metadata: v.optional(v.any()),       // Custom JSON data
    
    // --- Sync Tracking ---
    medusaOptionId: v.optional(v.string()), // Medusa's option ID after sync
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_medusaProductId", ["medusaProductId"])
    .index("by_title", ["title"]),

  // ===========================================================================
  // TABLE: variantMapping (Variant Image Analysis)
  // Analyzes product variants to categorize physical vs. non-physical options
  // Used for determining image requirements per product
  // ===========================================================================
  variantMapping: defineTable({
    // --- Product Reference ---
    productId: v.id("medusaProducts"),   // FK to parent product
    cjProductId: v.string(),             // CJ product ID for reference
    title: v.string(),                   // Product title
    
    // --- Variant Counts ---
    totalVariants: v.number(),           // Total number of variants
    physicalVariants: v.number(),        // Unique physical combinations (need images)
    nonPhysicalVariants: v.number(),     // Variants sharing same physical appearance
    
    // --- Physical Options (Require unique images) ---
    // Options that change the visible appearance of the fixture
    physicalOptions: v.array(v.object({
      name: v.string(),                  // Option name (e.g., "Finish", "Number of Lights")
      values: v.array(v.string()),       // Available values
      count: v.number(),                 // Number of unique values
    })),
    
    // --- Non-Physical Options (Share images) ---
    // Options that don't change visible appearance
    nonPhysicalOptions: v.array(v.object({
      name: v.string(),                  // Option name (e.g., "Color Temperature", "Wattage")
      values: v.array(v.string()),       // Available values
      count: v.number(),                 // Number of unique values
    })),
    
    // --- Physical Variant Groups ---
    // Groups of variants that share the same physical appearance
    physicalVariantGroups: v.array(v.object({
      groupKey: v.string(),              // Unique key (e.g., "Black|3-head")
      physicalOptionValues: v.record(v.string(), v.string()), // Physical options for this group
      variantIds: v.array(v.id("medusaProductVariants")), // Variants in this group
      variantCount: v.number(),          // Number of variants in group
      assignedImageUrl: v.optional(v.string()), // Image assigned to this group
    })),
    
    // --- Image Requirements ---
    requiredImages: v.number(),          // = number of physical variant groups
    currentImages: v.number(),           // Number of images currently on product
    imageCoverage: v.number(),           // Percentage 0-100
    missingImages: v.number(),           // requiredImages - currentImages (min 0)
    
    // --- Status ---
    status: v.union(
      v.literal("complete"),             // All physical variants have images
      v.literal("partial"),              // Some physical variants missing images
      v.literal("missing")               // No images assigned
    ),
    
    // --- Timestamps ---
    analyzedAt: v.number(),              // When analysis was performed
    updatedAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_status", ["status"])
    .index("by_missingImages", ["missingImages"])
    .index("by_imageCoverage", ["imageCoverage"]),

  // ===========================================================================
  // TABLE: lightingOptionDefinitions (Master Reference Table)
  // Defines available option types and valid values for lighting products
  // Used for parsing CJ descriptions and creating product variants
  // ===========================================================================
  lightingOptionDefinitions: defineTable({
    // --- Option Type ---
    optionType: v.string(),              // e.g., "Color Temperature", "Size", "Finish"
    
    // --- Valid Values ---
    values: v.array(v.string()),         // e.g., ["Warm White", "Cool White", "Neutral Light"]
    
    // --- Parsing Patterns ---
    regexPatterns: v.optional(v.array(v.string())), // Regex patterns to find in descriptions
    
    // --- Display Config ---
    displayOrder: v.number(),            // Order in UI (1 = first)
    isRequired: v.boolean(),             // Is this option required for all products?
    
    // --- Metadata ---
    description: v.optional(v.string()), // Description of this option type
    metadata: v.optional(v.any()),       // Custom JSON data
    
    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_optionType", ["optionType"])
    .index("by_displayOrder", ["displayOrder"]),

  // ===========================================================================
  // TABLE: cjCertifications (CJ Product Compliance Audit)
  // Stores ALL certification data, buyer reviews, and merchant Q&A scraped
  // from CJ API and product pages. One record per CJ product (upsert on re-scan).
  // ===========================================================================
  cjCertifications: defineTable({
    // --- Identity (links back to cjMyProducts) ---
    sku:         v.string(),   // CJ SKU (e.g. CJSN1234567)
    cjProductId: v.string(),   // CJ productId
    nameEn:      v.string(),   // Product name

    // --- Phase 1: CJ API data ---
    // Raw product attributes array as returned by /api2.0/v1/product/query
    apiAttributes:   v.optional(v.array(v.any())),
    // Raw description HTML from the API response
    apiDescriptionHtml: v.optional(v.string()),

    // --- Certifications found (extracted from ALL sources) ---
    // e.g. ["UL", "CE", "RoHS", "CCC", "ETL", "CSA", "IP44", ...]
    listings:       v.array(v.string()),
    // Which source(s) contained the certifications
    listingsSources: v.array(v.string()), // e.g. ["api_attributes", "scrape_reviews"]

    // --- Phase 2: All buyer reviews (scraped, no cap) ---
    // Each entry: { rating, author, date, title, text, images[], verified }
    buyerReviews:       v.optional(v.array(v.any())),
    buyerReviewsTotal:  v.optional(v.number()),  // total count displayed on page
    buyerRatingSummary: v.optional(v.any()),      // { avg, 5star%, 4star%, ... } if shown

    // --- Phase 2: All merchant Q&A pairs (scraped, no cap) ---
    // Each entry: { question, answer, askedBy, askedDate, answeredDate }
    merchantComments:      v.optional(v.array(v.any())),
    merchantCommentsTotal: v.optional(v.number()), // total Q&A count shown on page

    // --- Draft question for cert inquiry (set when listings === []) ---
    draftQuestion:         v.optional(v.string()),
    questionSubmitted:     v.boolean(),
    questionSubmittedAt:   v.optional(v.number()),

    // --- Scan metadata ---
    lastScannedAt: v.number(),
    scanStatus:    v.union(
      v.literal("ok"),
      v.literal("api_error"),
      v.literal("scrape_error"),
      v.literal("partial"),    // API ok, scrape failed or skipped
      v.literal("skipped")
    ),
    errorMessage: v.optional(v.string()),

    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sku",               ["sku"])
    .index("by_cjProductId",       ["cjProductId"])
    .index("by_lastScannedAt",     ["lastScannedAt"])
    .index("by_scanStatus",        ["scanStatus"])
    .index("by_questionSubmitted", ["questionSubmitted"]),

  // ===========================================================================
  // TABLE: shippingTracking (Real-Time Order Shipping Tracking)
  // Stores shipping status for customer orders. Updated by CJ Dropshipping
  // logistics webhooks relayed through Medusa admin backend.
  // Data Flow: Medusa order.placed → Convex record → CJ webhook → status updates
  // ===========================================================================
  shippingTracking: defineTable({
    // --- Order References ---
    medusaOrderId: v.string(),
    medusaOrderDisplayId: v.number(),
    customerId: v.string(),

    // --- CJ Dropshipping References ---
    cjOrderId: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    lastMileCarrier: v.optional(v.string()),
    lastMileTrackingNumber: v.optional(v.string()),
    logisticName: v.optional(v.string()),

    // --- Order Details ---
    orderItems: v.array(v.object({
      title: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      thumbnail: v.optional(v.string()),
      sku: v.optional(v.string()),
    })),
    orderTotal: v.number(),
    currencyCode: v.string(),

    // --- Dates ---
    orderDate: v.number(),
    estimatedDeliveryDate: v.optional(v.number()),
    actualDeliveryDate: v.optional(v.number()),

    // --- Shipping Address ---
    shippingAddress: v.object({
      firstName: v.string(),
      lastName: v.string(),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      postalCode: v.string(),
      countryCode: v.string(),
      phone: v.optional(v.string()),
    }),

    // --- Progress ---
    currentStatus: v.union(
      v.literal("order_placed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("in_transit"),
      v.literal("arrived_in_country"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("issue"),
      v.literal("returned")
    ),
    cjStatusCode: v.optional(v.number()),

    // --- Tracking Timeline ---
    trackingEvents: v.array(v.object({
      status: v.string(),
      description: v.string(),
      location: v.optional(v.string()),
      timestamp: v.number(),
      cjStatusCode: v.optional(v.number()),
    })),

    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customerId", ["customerId"])
    .index("by_medusaOrderId", ["medusaOrderId"])
    .index("by_trackingNumber", ["trackingNumber"])
    .index("by_currentStatus", ["currentStatus"]),

  // ===========================================================================
  // TABLE: customerComments (Per-product Q&A / Comments)
  // Public comment threads scoped to a Medusa product. Customers post a
  // question; site staff (or future authenticated users) can reply via
  // parentId threading. Records the Medusa product handle for fast lookup
  // by the storefront and the productId for reliable joins.
  // ===========================================================================
  customerComments: defineTable({
    // --- Product references ---
    medusaProductId: v.string(),         // prod_xxx — stable id
    medusaProductHandle: v.string(),     // url-safe handle for storefront query

    // --- Author ---
    authorName: v.string(),              // display name (free-text on submit)
    authorEmail: v.optional(v.string()), // optional contact, never displayed
    customerId: v.optional(v.string()),  // Medusa customer id if logged in

    // --- Content ---
    body: v.string(),                    // plain-text comment body
    parentId: v.optional(v.id("customerComments")), // reply-to (threading)

    // --- Moderation ---
    status: v.union(
      v.literal("published"),            // visible on the storefront
      v.literal("pending"),               // awaiting moderation
      v.literal("hidden")                 // soft-removed
    ),
    isStaff: v.boolean(),                // true => rendered as official reply

    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product",        ["medusaProductId"])
    .index("by_handle",         ["medusaProductHandle"])
    .index("by_product_status", ["medusaProductId", "status"])
    .index("by_parent",         ["parentId"]),
});
