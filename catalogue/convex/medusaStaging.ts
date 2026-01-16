import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id, DataModel } from "./_generated/dataModel";

// =============================================================================
// MEDUSA STAGING QUERIES
// =============================================================================

// Get all staged products with their sync status
export const getAllProducts = query({
  args: {
    limit: v.optional(v.number()),
    syncStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("synced"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    if (args.syncStatus) {
      return await ctx.db
        .query("medusaProducts")
        .withIndex("by_syncStatus", (q) => q.eq("syncStatus", args.syncStatus!))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db.query("medusaProducts").order("desc").take(limit);
  },
});

// Get a product by its Medusa external ID
export const getProductByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medusaProducts")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

// Get product with all children (variants, images, prices)
export const getProductWithChildren = query({
  args: { productId: v.id("medusaProducts") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    
    const variants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.productId))
      .collect();
    
    const images = await ctx.db
      .query("medusaImages")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.productId))
      .collect();
    
    const variantsWithPrices = await Promise.all(
      variants.map(async (variant) => {
        const prices = await ctx.db
          .query("medusaPrices")
          .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
          .collect();
        return { ...variant, prices };
      })
    );
    
    return { ...product, variants: variantsWithPrices, images };
  },
});

// Get sync stats for Medusa staging tables
export const getSyncStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("medusaProducts").collect();
    const variants = await ctx.db.query("medusaProductVariants").collect();
    const images = await ctx.db.query("medusaImages").collect();
    const prices = await ctx.db.query("medusaPrices").collect();
    const categories = await ctx.db.query("medusaCategories").collect();
    
    const statusCounts = { pending: 0, syncing: 0, synced: 0, failed: 0 };
    products.forEach(p => { statusCounts[p.syncStatus]++; });
    
    return {
      products: { total: products.length, ...statusCounts },
      variants: variants.length,
      images: images.length,
      prices: prices.length,
      categories: categories.length,
    };
  },
});

// =============================================================================
// MEDUSA STAGING MUTATIONS
// =============================================================================

// Delete products by title pattern (e.g., "Medusa" demo products)
export const deleteProductsByTitle = mutation({
  args: { titlePattern: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("medusaProducts").collect();
    const toDelete = products.filter(p => p.title.includes(args.titlePattern));
    
    let deleted = { products: 0, variants: 0, images: 0, prices: 0 };
    
    for (const product of toDelete) {
      // Delete variants and their prices
      const variants = await ctx.db
        .query("medusaProductVariants")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
        .collect();
      
      for (const variant of variants) {
        const prices = await ctx.db
          .query("medusaPrices")
          .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
          .collect();
        for (const price of prices) {
          await ctx.db.delete(price._id);
          deleted.prices++;
        }
        await ctx.db.delete(variant._id);
        deleted.variants++;
      }
      
      // Delete images
      const images = await ctx.db
        .query("medusaImages")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
        .collect();
      for (const image of images) {
        await ctx.db.delete(image._id);
        deleted.images++;
      }
      
      // Delete product
      await ctx.db.delete(product._id);
      deleted.products++;
    }
    
    return deleted;
  },
});

// Batch import products from Medusa PostgreSQL
export const batchImportFromMedusa = mutation({
  args: {
    products: v.array(v.object({
      title: v.string(),
      handle: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("proposed"),
        v.literal("published"),
        v.literal("rejected")
      ),
      isGiftcard: v.boolean(),
      discountable: v.boolean(),
      subtitle: v.optional(v.string()),
      description: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      externalId: v.string(),
      metadata: v.optional(v.any()),
      variants: v.array(v.object({
        title: v.string(),
        sku: v.optional(v.string()),
        medusaVariantId: v.string(),
        allowBackorder: v.boolean(),
        manageInventory: v.boolean(),
        prices: v.array(v.object({
          currencyCode: v.string(),
          amount: v.number(),
        })),
      })),
      images: v.array(v.object({
        url: v.string(),
        rank: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let productsCreated = 0, productsUpdated = 0;
    let variantsCreated = 0, imagesCreated = 0, pricesCreated = 0;
    
    for (const product of args.products) {
      const existing = await ctx.db
        .query("medusaProducts")
        .withIndex("by_externalId", (q) => q.eq("externalId", product.externalId))
        .first();
      
      let productId: Id<"medusaProducts">;
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          title: product.title,
          handle: product.handle,
          status: product.status,
          isGiftcard: product.isGiftcard,
          discountable: product.discountable,
          subtitle: product.subtitle,
          description: product.description,
          thumbnail: product.thumbnail,
          metadata: product.metadata,
          medusaProductId: product.externalId,
          syncStatus: "synced" as const,
          lastSyncedAt: now,
          updatedAt: now,
        });
        productId = existing._id;
        productsUpdated++;
      } else {
        // Create placeholder cjMyProducts entry for products from Medusa
        const placeholderId = await ctx.db.insert("cjMyProducts", {
          cjProductId: `medusa-import-${product.externalId}`,
          sku: product.variants[0]?.sku || `MEDUSA-${product.externalId.slice(0, 8)}`,
          nameEn: product.title,
          productNames: [product.title],
          bigImage: product.thumbnail || "",
          price: 0,
          productType: 0,
          cjCreatedAt: now,
          syncedAt: now,
          updatedAt: now,
          stagedToMedusa: true,
        });
        
        productId = await ctx.db.insert("medusaProducts", {
          cjMyProductId: placeholderId,
          title: product.title,
          handle: product.handle,
          status: product.status,
          isGiftcard: product.isGiftcard,
          discountable: product.discountable,
          subtitle: product.subtitle,
          description: product.description,
          thumbnail: product.thumbnail,
          externalId: product.externalId,
          medusaProductId: product.externalId,
          metadata: product.metadata,
          isReadyToSync: false,
          syncStatus: "synced" as const,
          lastSyncedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        productsCreated++;
      }
      
      // Insert variants
      for (const variant of product.variants) {
        const variantId = await ctx.db.insert("medusaProductVariants", {
          medusaProductId: productId,
          title: variant.title,
          sku: variant.sku,
          medusaVariantId: variant.medusaVariantId,
          allowBackorder: variant.allowBackorder,
          manageInventory: variant.manageInventory,
          createdAt: now,
          updatedAt: now,
        });
        variantsCreated++;
        
        for (const price of variant.prices) {
          await ctx.db.insert("medusaPrices", {
            medusaVariantId: variantId,
            currencyCode: price.currencyCode,
            amount: price.amount,
            createdAt: now,
            updatedAt: now,
          });
          pricesCreated++;
        }
      }
      
      // Insert images
      for (const image of product.images) {
        await ctx.db.insert("medusaImages", {
          medusaProductId: productId,
          url: image.url,
          rank: image.rank,
          createdAt: now,
          updatedAt: now,
        });
        imagesCreated++;
      }
    }
    
    return { productsCreated, productsUpdated, variantsCreated, imagesCreated, pricesCreated };
  },
});

// Clear all Medusa staging tables
export const clearAllStaging = mutation({
  args: {},
  handler: async (ctx) => {
    const prices = await ctx.db.query("medusaPrices").collect();
    const variants = await ctx.db.query("medusaProductVariants").collect();
    const images = await ctx.db.query("medusaImages").collect();
    const products = await ctx.db.query("medusaProducts").collect();
    const categories = await ctx.db.query("medusaCategories").collect();
    
    for (const price of prices) await ctx.db.delete(price._id);
    for (const variant of variants) await ctx.db.delete(variant._id);
    for (const image of images) await ctx.db.delete(image._id);
    for (const product of products) await ctx.db.delete(product._id);
    for (const category of categories) await ctx.db.delete(category._id);
    
    return {
      deleted: {
        prices: prices.length,
        variants: variants.length,
        images: images.length,
        products: products.length,
        categories: categories.length,
      },
    };
  },
});

// =============================================================================
// CJ → MEDUSA STAGING MUTATIONS
// =============================================================================

// Helper: Generate URL-friendly handle from title
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Stage a CJ product to the Medusa staging tables
export const stageCjProduct = mutation({
  args: {
    cjMyProductId: v.id("cjMyProducts"),
    // Optional overrides
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priceInCents: v.optional(v.number()), // Override price (in cents)
    markupPercent: v.optional(v.number()), // Markup percentage (e.g., 50 = 50%)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Fetch the CJ product
    const cjProduct = await ctx.db.get(args.cjMyProductId);
    if (!cjProduct) {
      throw new Error(`CJ product not found: ${args.cjMyProductId}`);
    }
    
    // Check if already staged
    if (cjProduct.stagedToMedusa && cjProduct.medusaProductRef) {
      const existing = await ctx.db.get(cjProduct.medusaProductRef);
      if (existing) {
        return { 
          success: false, 
          error: "Product already staged",
          medusaProductId: existing._id,
        };
      }
    }
    
    // Calculate price
    const costPriceInCents = Math.round(cjProduct.price * 100);
    const markupPercent = args.markupPercent ?? 100; // Default 100% markup
    const sellingPriceInCents = args.priceInCents ?? Math.round(costPriceInCents * (1 + markupPercent / 100));
    
    // Build product data
    const title = args.title || cjProduct.nameEn;
    const handle = generateHandle(title);
    
    // Create the medusaProducts record
    const medusaProductId = await ctx.db.insert("medusaProducts", {
      cjMyProductId: args.cjMyProductId,
      title,
      handle,
      status: "draft",
      isGiftcard: false,
      discountable: true,
      description: args.description || cjProduct.description,
      thumbnail: cjProduct.bigImage,
      externalId: cjProduct.cjProductId,
      metadata: {
        cjProductId: cjProduct.cjProductId,
        cjSku: cjProduct.sku,
        cjCategoryId: cjProduct.categoryId,
        cjCategoryName: cjProduct.categoryName,
        cjSupplierName: cjProduct.supplierName,
        costPriceInCents,
        markupPercent,
      },
      isReadyToSync: false,
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    
    // Create default variant
    const variantId = await ctx.db.insert("medusaProductVariants", {
      medusaProductId,
      title: "Default",
      sku: cjProduct.sku,
      allowBackorder: false,
      manageInventory: true,
      variantRank: 0,
      metadata: {
        cjProductId: cjProduct.cjProductId,
      },
      createdAt: now,
      updatedAt: now,
    });
    
    // Create price for the variant
    await ctx.db.insert("medusaPrices", {
      medusaVariantId: variantId,
      currencyCode: "usd",
      amount: sellingPriceInCents,
      costPrice: costPriceInCents,
      markupPercent,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create image
    if (cjProduct.bigImage) {
      await ctx.db.insert("medusaImages", {
        medusaProductId,
        url: cjProduct.bigImage,
        rank: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // Update the CJ product to mark as staged
    await ctx.db.patch(args.cjMyProductId, {
      stagedToMedusa: true,
      medusaProductRef: medusaProductId,
      updatedAt: now,
    });
    
    return {
      success: true,
      medusaProductId,
      variantId,
      title,
      handle,
      priceInCents: sellingPriceInCents,
    };
  },
});

/**
 * Bulk stage all CJ products that haven't been staged yet
 * Stages products in batches to avoid timeout
 */
export const bulkStageCjProducts = mutation({
  args: {
    limit: v.optional(v.number()),
    markupPercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200; // Conservative limit per mutation
    const markupPercent = args.markupPercent ?? 100;
    const now = Date.now();
    
    // Get CJ products not yet staged
    const allCjProducts = await ctx.db.query("cjMyProducts").collect();
    const unstagedProducts = allCjProducts
      .filter(p => !p.stagedToMedusa && !p.isRemovedFromShelves)
      .slice(0, limit);
    
    let staged = 0;
    let skipped = 0;
    
    for (const cjProduct of unstagedProducts) {
      // Double-check not already staged
      if (cjProduct.stagedToMedusa && cjProduct.medusaProductRef) {
        skipped++;
        continue;
      }
      
      // Calculate price
      const costPriceInCents = Math.round(cjProduct.price * 100);
      const sellingPriceInCents = Math.round(costPriceInCents * (1 + markupPercent / 100));
      
      // Build product data
      const title = cjProduct.nameEn;
      const handle = generateHandle(title);
      
      // Create the medusaProducts record
      const medusaProductId = await ctx.db.insert("medusaProducts", {
        cjMyProductId: cjProduct._id,
        title,
        handle,
        status: "draft",
        isGiftcard: false,
        discountable: true,
        description: cjProduct.description,
        thumbnail: cjProduct.bigImage,
        externalId: cjProduct.cjProductId,
        metadata: {
          cjProductId: cjProduct.cjProductId,
          cjSku: cjProduct.sku,
          cjCategoryId: cjProduct.categoryId,
          cjCategoryName: cjProduct.categoryName,
          cjSupplierName: cjProduct.supplierName,
          costPriceInCents,
          markupPercent,
        },
        isReadyToSync: false,
        syncStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });
      
      // Create default variant
      const variantId = await ctx.db.insert("medusaProductVariants", {
        medusaProductId,
        title: "Default",
        sku: cjProduct.sku,
        allowBackorder: false,
        manageInventory: true,
        variantRank: 0,
        metadata: {
          cjProductId: cjProduct.cjProductId,
        },
        createdAt: now,
        updatedAt: now,
      });
      
      // Create price for the variant
      await ctx.db.insert("medusaPrices", {
        medusaVariantId: variantId,
        currencyCode: "usd",
        amount: sellingPriceInCents,
        costPrice: costPriceInCents,
        markupPercent,
        createdAt: now,
        updatedAt: now,
      });
      
      // Create main image
      if (cjProduct.bigImage) {
        await ctx.db.insert("medusaImages", {
          medusaProductId,
          url: cjProduct.bigImage,
          rank: 0,
          metadata: { source: "cj_main_image" },
          createdAt: now,
          updatedAt: now,
        });
      }
      
      // Update the CJ product to mark as staged
      await ctx.db.patch(cjProduct._id, {
        stagedToMedusa: true,
        medusaProductRef: medusaProductId,
        updatedAt: now,
      });
      
      staged++;
    }
    
    const totalUnstaged = allCjProducts.filter(p => !p.stagedToMedusa && !p.isRemovedFromShelves).length;
    
    return {
      staged,
      skipped,
      remaining: totalUnstaged - staged,
      totalCjProducts: allCjProducts.length,
    };
  },
});

// Mark a staged product as ready to sync to Medusa
export const markReadyToSync = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) {
      throw new Error(`Product not found: ${args.medusaProductId}`);
    }
    
    await ctx.db.patch(args.medusaProductId, {
      isReadyToSync: true,
      syncStatus: "pending",
      updatedAt: Date.now(),
    });
    
    return { success: true, productId: args.medusaProductId };
  },
});

// Update sync status after pushing to Medusa
export const updateSyncStatus = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    status: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("synced"),
      v.literal("failed")
    ),
    medusaId: v.optional(v.string()), // The actual Medusa product ID
    error: v.optional(v.string()),
    variantMappings: v.optional(v.array(v.object({
      convexVariantId: v.id("medusaProductVariants"),
      medusaVariantId: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.patch(args.medusaProductId, {
      syncStatus: args.status,
      medusaProductId: args.medusaId,
      syncError: args.error,
      lastSyncedAt: args.status === "synced" ? now : undefined,
      updatedAt: now,
    });
    
    // Update variant IDs if provided
    if (args.variantMappings) {
      for (const mapping of args.variantMappings) {
        await ctx.db.patch(mapping.convexVariantId, {
          medusaVariantId: mapping.medusaVariantId,
          updatedAt: now,
        });
      }
    }
    
    return { success: true };
  },
});

// Update product and variant dimensions from CJ API data
export const updateProductDimensions = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    material: v.optional(v.string()),
    productWeight: v.optional(v.number()), // grams
    variantDimensions: v.optional(v.array(v.object({
      variantTitle: v.string(), // Match by title
      weight: v.optional(v.number()), // grams
      length: v.optional(v.number()), // mm
      width: v.optional(v.number()),  // mm
      height: v.optional(v.number()), // mm
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Update product material
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.material) {
      updates.material = args.material;
    }
    if (args.productWeight) {
      // Store weight in string format (Medusa uses string for dimensions)
      updates.weight = String(args.productWeight);
    }
    
    await ctx.db.patch(args.medusaProductId, updates);

    // Update variant dimensions
    let variantsUpdated = 0;
    if (args.variantDimensions && args.variantDimensions.length > 0) {
      const variants = await ctx.db
        .query("medusaProductVariants")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
        .collect();

      for (const dimData of args.variantDimensions) {
        // Find variant by title match (case-insensitive)
        const matchingVariant = variants.find(
          (v) => v.title.toUpperCase() === dimData.variantTitle.toUpperCase()
        );

        if (matchingVariant) {
          const variantUpdates: Record<string, unknown> = { updatedAt: now };
          if (dimData.weight) variantUpdates.weight = dimData.weight;
          if (dimData.length) variantUpdates.length = dimData.length;
          if (dimData.width) variantUpdates.width = dimData.width;
          if (dimData.height) variantUpdates.height = dimData.height;

          await ctx.db.patch(matchingVariant._id, variantUpdates);
          variantsUpdated++;
        }
      }
    }

    return { 
      success: true, 
      productId: args.medusaProductId,
      materialSet: !!args.material,
      variantsUpdated,
    };
  },
});

// Bulk update dimensions for multiple products
export const bulkUpdateDimensions = mutation({
  args: {
    updates: v.array(v.object({
      externalId: v.string(), // CJ product ID
      material: v.optional(v.string()),
      productWeight: v.optional(v.number()),
      variantDimensions: v.optional(v.array(v.object({
        variantTitle: v.string(),
        weight: v.optional(v.number()),
        length: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let productsUpdated = 0;
    let totalVariantsUpdated = 0;
    const errors: Array<{ externalId: string; error: string }> = [];

    for (const update of args.updates) {
      try {
        // Find product by external ID (CJ product ID)
        const product = await ctx.db
          .query("medusaProducts")
          .withIndex("by_externalId", (q) => q.eq("externalId", update.externalId))
          .first();

        if (!product) {
          errors.push({ externalId: update.externalId, error: "Product not found" });
          continue;
        }

        // Update product
        const productUpdates: Record<string, unknown> = { updatedAt: now };
        if (update.material) {
          productUpdates.material = update.material;
        }
        if (update.productWeight) {
          productUpdates.weight = String(update.productWeight);
        }
        
        // Set product-level dimensions from first variant if available
        // (CJ API only provides dimensions at variant level)
        if (update.variantDimensions && update.variantDimensions.length > 0) {
          const firstWithDims = update.variantDimensions.find(v => v.length || v.width || v.height);
          if (firstWithDims) {
            if (firstWithDims.length) productUpdates.length = String(firstWithDims.length);
            if (firstWithDims.width) productUpdates.width = String(firstWithDims.width);
            if (firstWithDims.height) productUpdates.height = String(firstWithDims.height);
          }
        }
        
        await ctx.db.patch(product._id, productUpdates);
        productsUpdated++;

        // Update variants
        if (update.variantDimensions && update.variantDimensions.length > 0) {
          const variants = await ctx.db
            .query("medusaProductVariants")
            .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
            .collect();
          
          // Track which variants have been updated to avoid duplicates
          const updatedVariantIds = new Set<string>();

          for (const dimData of update.variantDimensions) {
            // Try multiple matching strategies:
            // 1. Exact title match
            // 2. CJ title contains our variant title (case insensitive)
            // 3. Normalize and match (handle COOL/COLD variations)
            const cjTitleUpper = dimData.variantTitle.toUpperCase();
            // Normalize common variations
            const normalizedCjTitle = cjTitleUpper
              .replace(/COLD/g, 'COOL')
              .replace(/COLOUR/g, 'COLOR');
            
            const matchingVariant = variants.find((v) => {
              // Skip if already updated
              if (updatedVariantIds.has(v._id)) return false;
              
              const ourTitleUpper = v.title.toUpperCase();
              const normalizedOurTitle = ourTitleUpper
                .replace(/COLD/g, 'COOL')
                .replace(/COLOUR/g, 'COLOR');
              
              // Exact match
              if (ourTitleUpper === cjTitleUpper) return true;
              
              // CJ title contains our variant title
              // e.g., "Bedside Lamp... warm white" contains "WARM WHITE"
              if (cjTitleUpper.includes(ourTitleUpper)) return true;
              if (normalizedCjTitle.includes(normalizedOurTitle)) return true;
              
              // Check if our title words appear in CJ title
              // This handles cases like "COOL WHITE" matching "...Cold white"
              const ourWords = normalizedOurTitle.split(/\s+/).filter(w => w.length > 2);
              const matchCount = ourWords.filter(word => normalizedCjTitle.includes(word)).length;
              if (matchCount >= ourWords.length * 0.7) return true;
              
              return false;
            });

            if (matchingVariant) {
              updatedVariantIds.add(matchingVariant._id);
              const variantUpdates: Record<string, unknown> = { updatedAt: now };
              if (dimData.weight) variantUpdates.weight = dimData.weight;
              if (dimData.length) variantUpdates.length = dimData.length;
              if (dimData.width) variantUpdates.width = dimData.width;
              if (dimData.height) variantUpdates.height = dimData.height;

              await ctx.db.patch(matchingVariant._id, variantUpdates);
              totalVariantsUpdated++;
            }
          }
        }
      } catch (error) {
        errors.push({ 
          externalId: update.externalId, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return {
      success: true,
      productsUpdated,
      variantsUpdated: totalVariantsUpdated,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Get products ready to sync (isReadyToSync = true, syncStatus = pending)
export const getProductsReadyToSync = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    const products = await ctx.db
      .query("medusaProducts")
      .withIndex("by_isReadyToSync", (q) => q.eq("isReadyToSync", true))
      .collect();
    
    // Filter to pending only and limit
    const pendingProducts = products
      .filter(p => p.syncStatus === "pending")
      .slice(0, limit);
    
    // Fetch children for each product
    const result = await Promise.all(
      pendingProducts.map(async (product) => {
        const variants = await ctx.db
          .query("medusaProductVariants")
          .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
          .collect();
        
        const images = await ctx.db
          .query("medusaImages")
          .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
          .collect();
        
        const variantsWithPrices = await Promise.all(
          variants.map(async (variant) => {
            const prices = await ctx.db
              .query("medusaPrices")
              .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
              .collect();
            return { ...variant, prices };
          })
        );
        
        return { ...product, variants: variantsWithPrices, images };
      })
    );
    
    return result;
  },
});

// =============================================================================
// IMAGE EXTRACTION FROM DESCRIPTIONS
// =============================================================================

/**
 * Check if HTML contains any image tags
 */
function hasImages(html: string): boolean {
  return /<img[^>]+src=/i.test(html);
}

/**
 * Extract image URLs from HTML content (CJ descriptions)
 * Returns array of unique image URLs in order of appearance
 */
function extractImagesFromHtml(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  const seen = new Set<string>();
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    // Only include valid HTTP/HTTPS URLs, skip data URIs and duplicates
    if ((url.startsWith('http://') || url.startsWith('https://')) && !seen.has(url)) {
      urls.push(url);
      seen.add(url);
    }
  }
  
  return urls;
}

/**
 * Remove image tags from HTML and clean up the result
 * Preserves text content, removes empty elements
 */
function stripImagesFromHtml(html: string): string {
  let cleaned = html;
  
  // Remove <img> tags
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  
  // Remove empty paragraphs (with optional whitespace/breaks inside)
  cleaned = cleaned.replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '');
  
  // Remove trailing breaks before closing tags
  cleaned = cleaned.replace(/(<br\s*\/?>)+\s*(<\/p>)/gi, '$2');
  
  // Collapse multiple consecutive breaks to max 2
  cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');
  
  // Remove leading/trailing breaks
  cleaned = cleaned.replace(/^(\s*<br\s*\/?>)+/gi, '');
  cleaned = cleaned.replace(/(<br\s*\/?>)+\s*$/gi, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  return cleaned.trim();
}

/**
 * Extract images from a single product's CJ description
 * Always cleans the description after extraction
 */
export const extractImagesFromDescription = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    includeMainImage: v.optional(v.boolean()),
    force: v.optional(v.boolean()), // Re-extract even if already done
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) throw new Error("Product not found");
    
    // Skip if already processed (unless forced)
    if (product.imagesExtractedAt && !args.force) {
      return {
        productId: args.medusaProductId,
        skipped: true,
        reason: "already_extracted",
        imagesAdded: 0,
      };
    }
    
    // Get the CJ product for description and main image
    const cjProduct = await ctx.db.get(product.cjMyProductId);
    if (!cjProduct) throw new Error("CJ product not found");
    
    // Check if description has images
    const descriptionHasImages = cjProduct.description && hasImages(cjProduct.description);
    const hasMainImage = args.includeMainImage && cjProduct.bigImage;
    
    // Skip if no images to extract
    if (!descriptionHasImages && !hasMainImage) {
      // Mark as processed anyway (no images to extract)
      await ctx.db.patch(args.medusaProductId, {
        imagesExtractedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return {
        productId: args.medusaProductId,
        skipped: true,
        reason: "no_images_in_description",
        imagesAdded: 0,
      };
    }
    
    const now = Date.now();
    const existingImages = await ctx.db
      .query("medusaImages")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    const existingUrls = new Set(existingImages.map(img => img.url));
    let rank = existingImages.length;
    let imagesAdded = 0;
    
    // Add main image first (rank 0)
    if (hasMainImage && !existingUrls.has(cjProduct.bigImage!)) {
      await ctx.db.insert("medusaImages", {
        medusaProductId: args.medusaProductId,
        url: cjProduct.bigImage!,
        rank: 0,
        metadata: { source: "cj_main_image" },
        createdAt: now,
        updatedAt: now,
      });
      existingUrls.add(cjProduct.bigImage!);
      imagesAdded++;
      rank = Math.max(rank, 1);
    }
    
    // Extract images from description
    let cleanedDescription: string | undefined;
    if (cjProduct.description) {
      const imageUrls = extractImagesFromHtml(cjProduct.description);
      
      for (const url of imageUrls) {
        if (!existingUrls.has(url)) {
          await ctx.db.insert("medusaImages", {
            medusaProductId: args.medusaProductId,
            url,
            rank: rank++,
            metadata: { source: "cj_description" },
            createdAt: now,
            updatedAt: now,
          });
          existingUrls.add(url);
          imagesAdded++;
        }
      }
      
      // Always clean the description after extraction
      if (descriptionHasImages) {
        cleanedDescription = stripImagesFromHtml(cjProduct.description);
      }
    }
    
    // Update product with cleaned description and extraction timestamp
    await ctx.db.patch(args.medusaProductId, {
      ...(cleanedDescription !== undefined && { description: cleanedDescription }),
      imagesExtractedAt: now,
      updatedAt: now,
    });
    
    return {
      productId: args.medusaProductId,
      skipped: false,
      imagesAdded,
      totalImages: rank,
      descriptionCleaned: cleanedDescription !== undefined,
    };
  },
});

/**
 * Bulk extract images from all staged products that haven't been processed yet
 * - Skips products already processed (imagesExtractedAt is set)
 * - Skips products without images in description
 * - Always cleans descriptions after extraction
 */
export const bulkExtractImages = mutation({
  args: {
    limit: v.optional(v.number()),
    includeMainImage: v.optional(v.boolean()),
    force: v.optional(v.boolean()), // Re-process all, even if already done
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    const includeMainImage = args.includeMainImage ?? true;
    
    // Get all products, we'll filter in code
    const allProducts = await ctx.db.query("medusaProducts").collect();
    
    // Filter to unprocessed products (unless force)
    const products = args.force 
      ? allProducts.slice(0, limit)
      : allProducts.filter(p => !p.imagesExtractedAt).slice(0, limit);
    
    const now = Date.now();
    let processed = 0;
    let skippedNoImages = 0;
    let totalImagesAdded = 0;
    let descriptionsCleaned = 0;
    
    for (const product of products) {
      const cjProduct = await ctx.db.get(product.cjMyProductId);
      if (!cjProduct) continue;
      
      // Check if there are images to extract
      const descriptionHasImages = cjProduct.description && hasImages(cjProduct.description);
      const hasMainImage = includeMainImage && cjProduct.bigImage;
      
      if (!descriptionHasImages && !hasMainImage) {
        // Mark as processed (no images to extract)
        await ctx.db.patch(product._id, {
          imagesExtractedAt: now,
          updatedAt: now,
        });
        skippedNoImages++;
        continue;
      }
      
      const existingImages = await ctx.db
        .query("medusaImages")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
        .collect();
      
      const existingUrls = new Set(existingImages.map(img => img.url));
      let rank = existingImages.length;
      let imagesAdded = 0;
      
      // Add main image (rank 0)
      if (hasMainImage && !existingUrls.has(cjProduct.bigImage!)) {
        await ctx.db.insert("medusaImages", {
          medusaProductId: product._id,
          url: cjProduct.bigImage!,
          rank: 0,
          metadata: { source: "cj_main_image" },
          createdAt: now,
          updatedAt: now,
        });
        existingUrls.add(cjProduct.bigImage!);
        imagesAdded++;
        rank = Math.max(rank, 1);
      }
      
      // Extract from description
      let cleanedDescription: string | undefined;
      if (cjProduct.description) {
        const imageUrls = extractImagesFromHtml(cjProduct.description);
        
        for (const url of imageUrls) {
          if (!existingUrls.has(url)) {
            await ctx.db.insert("medusaImages", {
              medusaProductId: product._id,
              url,
              rank: rank++,
              metadata: { source: "cj_description" },
              createdAt: now,
              updatedAt: now,
            });
            existingUrls.add(url);
            imagesAdded++;
          }
        }
        
        // Clean description
        if (descriptionHasImages) {
          cleanedDescription = stripImagesFromHtml(cjProduct.description);
          descriptionsCleaned++;
        }
      }
      
      // Update product
      await ctx.db.patch(product._id, {
        ...(cleanedDescription !== undefined && { description: cleanedDescription }),
        imagesExtractedAt: now,
        updatedAt: now,
      });
      
      processed++;
      totalImagesAdded += imagesAdded;
    }
    
    return {
      processed,
      skippedNoImages,
      skippedAlreadyDone: allProducts.length - products.length,
      totalImagesAdded,
      descriptionsCleaned,
      remaining: allProducts.filter(p => !p.imagesExtractedAt).length - processed - skippedNoImages,
    };
  },
});

/**
 * Query to get images for a product, sorted by rank
 */
export const getProductImages = query({
  args: { medusaProductId: v.id("medusaProducts") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("medusaImages")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    return images.sort((a, b) => a.rank - b.rank);
  },
});

/**
 * Get extraction status for all products
 */
export const getImageExtractionStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("medusaProducts").collect();
    const images = await ctx.db.query("medusaImages").collect();
    
    const extracted = products.filter(p => p.imagesExtractedAt).length;
    const pending = products.length - extracted;
    
    // Count images by source
    const bySource = { cj_main_image: 0, cj_description: 0, other: 0 };
    for (const img of images) {
      const source = (img.metadata as { source?: string })?.source;
      if (source === "cj_main_image") bySource.cj_main_image++;
      else if (source === "cj_description") bySource.cj_description++;
      else bySource.other++;
    }
    
    return {
      totalProducts: products.length,
      extracted,
      pending,
      totalImages: images.length,
      imagesBySource: bySource,
    };
  },
});

// =============================================================================
// PRODUCT OPTIONS & VARIANTS MANAGEMENT
// =============================================================================

/**
 * Add a product option to a staged product
 */
export const addProductOption = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    title: v.string(), // e.g., "Color Temperature", "Size"
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) throw new Error("Product not found");
    
    const now = Date.now();
    
    // Check if option already exists
    const existing = await ctx.db
      .query("medusaProductOptions")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    if (existing.some(o => o.title === args.title)) {
      return { success: false, error: "Option already exists" };
    }
    
    const optionId = await ctx.db.insert("medusaProductOptions", {
      medusaProductId: args.medusaProductId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    
    return { success: true, optionId };
  },
});

/**
 * Get all options for a product
 */
export const getProductOptions = query({
  args: { medusaProductId: v.id("medusaProducts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medusaProductOptions")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
  },
});

/**
 * Create a variant with options for a staged product
 */
export const createVariantWithOptions = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    title: v.string(),                    // e.g., "Warm White / 40cm / Black"
    options: v.any(),                     // { "Color Temperature": "Warm White", "Size": "40cm" }
    sku: v.optional(v.string()),
    priceInCents: v.number(),
    costPriceInCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) throw new Error("Product not found");
    
    const now = Date.now();
    
    // Get existing variants to determine rank
    const existingVariants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    const variantRank = existingVariants.length;
    
    // Generate SKU if not provided
    const sku = args.sku || `${product.externalId}-V${variantRank + 1}`;
    
    // Create variant
    const variantId = await ctx.db.insert("medusaProductVariants", {
      medusaProductId: args.medusaProductId,
      title: args.title,
      sku,
      options: args.options,
      allowBackorder: false,
      manageInventory: true,
      variantRank,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create price for variant
    await ctx.db.insert("medusaPrices", {
      medusaVariantId: variantId,
      currencyCode: "usd",
      amount: args.priceInCents,
      costPrice: args.costPriceInCents,
      createdAt: now,
      updatedAt: now,
    });
    
    return { success: true, variantId, sku };
  },
});

/**
 * Bulk create variants from option combinations
 * Given options like { "Color Temperature": ["Warm", "Cool"], "Size": ["S", "M"] }
 * Creates 4 variants: Warm/S, Warm/M, Cool/S, Cool/M
 */
export const bulkCreateVariantsFromOptions = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    optionValues: v.any(), // { "Color Temperature": ["Warm White", "Cool White"], "Size": ["40cm", "60cm"] }
    basePriceInCents: v.number(),
    costPriceInCents: v.optional(v.number()),
    deleteExisting: v.optional(v.boolean()), // Delete existing variants first
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) throw new Error("Product not found");
    
    const now = Date.now();
    const optionValues = args.optionValues as Record<string, string[]>;
    const optionNames = Object.keys(optionValues);
    
    // Optionally delete existing variants and their prices
    if (args.deleteExisting) {
      const existingVariants = await ctx.db
        .query("medusaProductVariants")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
        .collect();
      
      for (const variant of existingVariants) {
        // Delete prices first
        const prices = await ctx.db
          .query("medusaPrices")
          .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
          .collect();
        for (const price of prices) {
          await ctx.db.delete(price._id);
        }
        // Delete variant
        await ctx.db.delete(variant._id);
      }
      
      // Delete existing options
      const existingOptions = await ctx.db
        .query("medusaProductOptions")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
        .collect();
      for (const option of existingOptions) {
        await ctx.db.delete(option._id);
      }
    }
    
    // Create options
    for (const optionName of optionNames) {
      const existing = await ctx.db
        .query("medusaProductOptions")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
        .collect();
      
      if (!existing.some(o => o.title === optionName)) {
        await ctx.db.insert("medusaProductOptions", {
          medusaProductId: args.medusaProductId,
          title: optionName,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    // Generate all combinations
    function getCombinations(arrays: string[][], current: string[] = []): string[][] {
      if (arrays.length === 0) return [current];
      const [first, ...rest] = arrays;
      return first.flatMap(value => getCombinations(rest, [...current, value]));
    }
    
    const valueArrays = optionNames.map(name => optionValues[name]);
    const combinations = getCombinations(valueArrays);
    
    // Get existing variants (after potential deletion)
    const existingVariants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    let variantRank = existingVariants.length;
    let created = 0;
    
    for (const combo of combinations) {
      // Build options object
      const options: Record<string, string> = {};
      optionNames.forEach((name, i) => {
        options[name] = combo[i];
      });
      
      // Build title from combination
      const title = combo.join(" / ");
      
      // Check if this exact combination already exists
      const exists = existingVariants.some(v => {
        const vOptions = v.options as Record<string, string> | undefined;
        if (!vOptions) return false;
        return optionNames.every(name => vOptions[name] === options[name]);
      });
      
      if (exists) continue;
      
      // Create variant
      const sku = `${product.externalId}-${combo.map(v => v.replace(/\s+/g, '').substring(0, 4)).join('-')}`;
      
      const variantId = await ctx.db.insert("medusaProductVariants", {
        medusaProductId: args.medusaProductId,
        title,
        sku,
        options,
        allowBackorder: false,
        manageInventory: true,
        variantRank: variantRank++,
        createdAt: now,
        updatedAt: now,
      });
      
      // Create price
      await ctx.db.insert("medusaPrices", {
        medusaVariantId: variantId,
        currencyCode: "usd",
        amount: args.basePriceInCents,
        costPrice: args.costPriceInCents,
        createdAt: now,
        updatedAt: now,
      });
      
      created++;
    }
    
    return {
      success: true,
      variantsCreated: created,
      totalCombinations: combinations.length,
      skipped: combinations.length - created,
      optionsCreated: optionNames.length,
    };
  },
});

/**
 * Get all variants for a product with their options and prices
 */
export const getProductVariantsWithDetails = query({
  args: { medusaProductId: v.id("medusaProducts") },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    const result = await Promise.all(
      variants.map(async (variant) => {
        const prices = await ctx.db
          .query("medusaPrices")
          .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
          .collect();
        
        return {
          ...variant,
          prices,
        };
      })
    );
    
    return result.sort((a, b) => (a.variantRank ?? 0) - (b.variantRank ?? 0));
  },
});

/**
 * Get variant statistics across all products
 */
export const getVariantStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("medusaProducts").collect();
    const variants = await ctx.db.query("medusaProductVariants").collect();
    const options = await ctx.db.query("medusaProductOptions").collect();
    
    // Count products with multiple variants
    const variantsByProduct = new Map<string, number>();
    for (const v of variants) {
      const count = variantsByProduct.get(v.medusaProductId) || 0;
      variantsByProduct.set(v.medusaProductId, count + 1);
    }
    
    const productsWithVariants = Array.from(variantsByProduct.values()).filter(c => c > 1).length;
    const productsWithDefaultOnly = products.length - productsWithVariants;
    
    // Count option types used
    const optionCounts: Record<string, number> = {};
    for (const opt of options) {
      optionCounts[opt.title] = (optionCounts[opt.title] || 0) + 1;
    }
    
    return {
      totalProducts: products.length,
      totalVariants: variants.length,
      totalOptions: options.length,
      productsWithVariants,
      productsWithDefaultOnly,
      avgVariantsPerProduct: variants.length / products.length,
      optionTypeCounts: optionCounts,
    };
  },
});

// =============================================================================
// LIGHTING OPTION DEFINITIONS (Master Reference Data)
// =============================================================================

/**
 * Seed the lighting option definitions with standard values
 * Run once to populate the master reference table
 */
export const seedLightingOptionDefinitions = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Clear existing if requested
    if (args.clearExisting) {
      const existing = await ctx.db.query("lightingOptionDefinitions").collect();
      for (const opt of existing) {
        await ctx.db.delete(opt._id);
      }
    }
    
    // Standard lighting option definitions based on analysis
    const definitions = [
      {
        optionType: "Color Temperature",
        values: ["Warm White", "Cool White", "Neutral Light", "Daylight", "3000K", "4000K", "5000K", "6000K", "6500K"],
        regexPatterns: ["warm\\s*white", "cool\\s*white", "neutral\\s*light", "daylight", "\\d{4}k"],
        displayOrder: 1,
        isRequired: true,
        description: "Light color temperature - warm (yellowish) to cool (bluish)",
      },
      {
        optionType: "Size",
        values: ["20cm", "25cm", "30cm", "40cm", "50cm", "60cm", "80cm", "100cm", "120cm"],
        regexPatterns: ["diameter[:\\s]*(\\d+)\\s*(cm|mm)", "size[:\\s]*(\\d+)\\s*(cm|mm)", "(\\d+)\\s*cm"],
        displayOrder: 2,
        isRequired: false,
        description: "Fixture diameter or main dimension",
      },
      {
        optionType: "Finish",
        values: ["Black", "White", "Gold", "Silver", "Bronze", "Brass", "Chrome", "Nickel", "Copper", "Rose Gold", "Matte Black", "Brushed Nickel"],
        regexPatterns: ["(black|white|gold|silver|bronze|brass|chrome|nickel|copper|rose\\s*gold|matte|brushed)"],
        displayOrder: 3,
        isRequired: false,
        description: "Metal finish or housing color",
      },
      {
        optionType: "Bulb Type",
        values: ["LED Integrated", "E26", "E27", "E14", "E12", "G9", "GU10", "MR16"],
        regexPatterns: ["(led|e26|e27|e14|e12|g9|gu10|mr16)"],
        displayOrder: 4,
        isRequired: false,
        description: "Light bulb socket type",
      },
      {
        optionType: "Wattage",
        values: ["3W", "5W", "7W", "9W", "10W", "12W", "15W", "18W", "24W", "36W"],
        regexPatterns: ["(\\d+)\\s*w(?:att)?(?:\\s|,|<|$)"],
        displayOrder: 5,
        isRequired: false,
        description: "Power consumption / brightness level",
      },
      {
        optionType: "Number of Lights",
        values: ["1 Light", "2 Lights", "3 Lights", "4 Lights", "5 Lights", "6 Lights", "8 Lights", "10 Lights", "12 Lights"],
        regexPatterns: ["(\\d+)\\s*(?:head|light|arm|branch)"],
        displayOrder: 6,
        isRequired: false,
        description: "Number of light heads for chandeliers/multi-light fixtures",
      },
      {
        optionType: "Voltage",
        values: ["110V", "220V", "110-240V (Universal)"],
        regexPatterns: ["(110|220|240)\\s*v", "110.*240.*v"],
        displayOrder: 7,
        isRequired: false,
        description: "Operating voltage (regional)",
      },
      {
        optionType: "Cord Length",
        values: ["50cm", "100cm", "150cm", "200cm", "Adjustable"],
        regexPatterns: ["cord[:\\s]*(\\d+)\\s*(cm|m)", "suspension[:\\s]*(\\d+)\\s*(cm|m)", "hanging[:\\s]*(\\d+)\\s*(cm|m)"],
        displayOrder: 8,
        isRequired: false,
        description: "Pendant/hanging cord or wire length",
      },
      {
        optionType: "Dimmable",
        values: ["Yes", "No"],
        regexPatterns: ["dimmable", "dimmer"],
        displayOrder: 9,
        isRequired: false,
        description: "Whether the light can be dimmed",
      },
      {
        optionType: "Style",
        values: ["Modern", "Nordic", "Industrial", "Vintage", "Minimalist", "Art Deco", "Traditional", "Rustic"],
        regexPatterns: ["style[:\\s]*(modern|nordic|industrial|vintage|minimalist|art\\s*deco|traditional|rustic)"],
        displayOrder: 10,
        isRequired: false,
        description: "Design aesthetic / style category",
      },
    ];
    
    let created = 0;
    for (const def of definitions) {
      // Check if already exists
      const existing = await ctx.db
        .query("lightingOptionDefinitions")
        .withIndex("by_optionType", (q) => q.eq("optionType", def.optionType))
        .first();
      
      if (!existing) {
        await ctx.db.insert("lightingOptionDefinitions", {
          ...def,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }
    
    return {
      created,
      totalDefinitions: definitions.length,
      skipped: definitions.length - created,
    };
  },
});

/**
 * Get all lighting option definitions
 */
export const getLightingOptionDefinitions = query({
  args: {},
  handler: async (ctx) => {
    const definitions = await ctx.db.query("lightingOptionDefinitions").collect();
    return definitions.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get a specific option definition by type
 */
export const getLightingOptionByType = query({
  args: { optionType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lightingOptionDefinitions")
      .withIndex("by_optionType", (q) => q.eq("optionType", args.optionType))
      .first();
  },
});

/**
 * Add a value to an existing option definition
 */
export const addValueToOptionDefinition = mutation({
  args: {
    optionType: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db
      .query("lightingOptionDefinitions")
      .withIndex("by_optionType", (q) => q.eq("optionType", args.optionType))
      .first();
    
    if (!definition) {
      throw new Error(`Option type "${args.optionType}" not found`);
    }
    
    if (definition.values.includes(args.value)) {
      return { success: false, error: "Value already exists" };
    }
    
    await ctx.db.patch(definition._id, {
      values: [...definition.values, args.value],
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Update an option definition
 */
export const updateOptionDefinition = mutation({
  args: {
    optionType: v.string(),
    values: v.optional(v.array(v.string())),
    regexPatterns: v.optional(v.array(v.string())),
    displayOrder: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db
      .query("lightingOptionDefinitions")
      .withIndex("by_optionType", (q) => q.eq("optionType", args.optionType))
      .first();
    
    if (!definition) {
      throw new Error(`Option type "${args.optionType}" not found`);
    }
    
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.values !== undefined) updates.values = args.values;
    if (args.regexPatterns !== undefined) updates.regexPatterns = args.regexPatterns;
    if (args.displayOrder !== undefined) updates.displayOrder = args.displayOrder;
    if (args.isRequired !== undefined) updates.isRequired = args.isRequired;
    if (args.description !== undefined) updates.description = args.description;
    
    await ctx.db.patch(definition._id, updates);
    
    return { success: true };
  },
});

// =============================================================================
// DESCRIPTION PARSING & VARIANT GENERATION
// =============================================================================

/**
 * Generate a random 6-digit SKU with ELV prefix
 * Checks for uniqueness against existing SKUs
 */
async function generateUniqueSku(
  ctx: MutationCtx,
  existingSkus: Set<string>
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate random 6-digit number (100000-999999)
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const sku = `ELV${randomNum}`;
    
    // Check if already in our local set
    if (existingSkus.has(sku)) {
      attempts++;
      continue;
    }
    
    // Check if exists in database
    const existingVariant = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_sku", (q) => q.eq("sku", sku))
      .first();
    
    if (!existingVariant) {
      existingSkus.add(sku);
      return sku;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp-based SKU
  const fallbackSku = `ELV${Date.now().toString().slice(-6)}`;
  existingSkus.add(fallbackSku);
  return fallbackSku;
}

/**
 * Parse HTML text content, removing all tags
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract all variant/option data from a CJ description
 * Uses comprehensive pattern matching to find sizes, colors, voltages, etc.
 */
function parseDescriptionForOptions(description: string): {
  extractedOptions: Record<string, string[]>;
  extractedSpecs: Record<string, string>;
  remainingText: string;
  allExtractedText: string[];
} {
  const text = htmlToText(description);
  const extractedOptions: Record<string, string[]> = {};
  const extractedSpecs: Record<string, string> = {};
  const allExtractedText: string[] = [];
  
  // =========================================================================
  // PATTERN DEFINITIONS - Comprehensive extraction
  // =========================================================================
  
  // Size/Diameter patterns
  const sizePatterns = [
    /(?:size|diameter|dimension)[:\s]*(\d+(?:\.\d+)?)\s*(cm|mm|m|inch|in|")/gi,
    /(\d+(?:\.\d+)?)\s*(cm|mm)\s*(?:diameter|size)/gi,
    /(?:φ|Φ|ø|Ø)?\s*(\d+(?:\.\d+)?)\s*(cm|mm)/gi,
    /(\d+)\s*[x×]\s*(\d+)(?:\s*[x×]\s*(\d+))?\s*(cm|mm)/gi,
  ];
  
  // Color/Finish patterns - extract multiple values
  const colorPatterns = [
    /(?:color|colour|finish)[:\s]*([^<\n,\.]+(?:,\s*[^<\n,\.]+)*)/gi,
    /(?:color classification|Light color)[:\s]*([^<\n\.]+)/gi,
  ];
  
  // Individual color keywords to find
  const colorKeywords = [
    'black', 'white', 'gold', 'golden', 'silver', 'bronze', 'brass', 'chrome', 
    'nickel', 'copper', 'rose gold', 'matte black', 'brushed nickel', 'antique',
    'amber', 'clear', 'frosted', 'smoke', 'gray', 'grey', 'cream', 'brown',
    'ash wood', 'black walnut', 'wood'
  ];
  
  // Light specs patterns
  const wattagePatterns = [
    /(?:power|wattage)[:\s]*(\d+)\s*w/gi,
    /(\d+)\s*w(?:att)?(?:\s*\([^)]+\))?(?:\s|,|<|$)/gi,
    /-(\d+)w(?:\s|,|<|$|\()/gi,
  ];
  
  const voltagePatterns = [
    /(?:voltage)[:\s]*(\d+)\s*v/gi,
    /(\d+)\s*v(?:olt)?(?:\s|,|<|$)/gi,
    /(110|220|240|110-240|100-240)\s*v/gi,
  ];
  
  // Color temperature patterns
  const colorTempPatterns = [
    /(warm\s*white|cool\s*white|neutral\s*(?:light|white)|daylight|natural\s*(?:light|white))/gi,
    /(\d{4}k)(?:\s*(?:yellow|warm|cool|white|neutral)\s*(?:light)?)?/gi,
    /(3000k|4000k|5000k|6000k|6500k|2700k)/gi,
    /(?:color temperature|light color)[:\s]*([^<\n,]+)/gi,
  ];
  
  // Bulb type patterns
  const bulbTypePatterns = [
    /(?:specification|bulb type|lamp holder|socket)[:\s]*(e\d{1,2}|g\d{1,2}|gu\d{1,2}|mr\d{1,2})/gi,
    /\b(e27|e26|e14|e12|g9|g4|gu10|mr16)\b/gi,
  ];
  
  // Number of lights/heads
  const lightsPatterns = [
    /(\d+)\s*(?:head|light|arm|branch|lamp)s?/gi,
    /(?:number of (?:light sources?|heads?))[:\s]*(\d+)/gi,
  ];
  
  // Material patterns
  const materialPatterns = [
    /(?:material|main material)[:\s]*([^<\n,]+)/gi,
    /(?:lamp body|lampshade|body material)[:\s]*([^<\n,]+)/gi,
  ];
  
  // Style patterns
  const stylePatterns = [
    /(?:style)[:\s]*(modern|nordic|industrial|vintage|minimalist|contemporary|simple|retro|art deco)/gi,
  ];
  
  // Dimmable patterns
  const dimmablePatterns = [
    /\b(dimmable|dimmer|dimming)\b/gi,
    /(?:dimmable)[:\s]*(yes|no)/gi,
  ];
  
  // Cord/suspension length patterns
  const cordPatterns = [
    /(?:cord|cable|wire|suspension|hanging|chain)\s*(?:length)?[:\s]*(\d+)\s*(cm|m)/gi,
    /(?:adjustable|adjust)\s*(?:length|height)?/gi,
  ];
  
  // =========================================================================
  // EXTRACTION LOGIC
  // =========================================================================
  
  // Extract sizes
  const sizes: string[] = [];
  for (const pattern of sizePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      allExtractedText.push(fullMatch);
      
      // Parse dimensions (could be single or multiple dimensions)
      if (match[3]) {
        // L x W x H format
        sizes.push(`${match[1]}x${match[2]}${match[3] ? 'x' + match[3] : ''}${match[4]}`);
      } else if (match[1] && match[2]) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        // Normalize to cm
        let normalizedValue = value;
        if (unit === 'mm') normalizedValue = value / 10;
        if (unit === 'm') normalizedValue = value * 100;
        if (unit === 'inch' || unit === 'in' || unit === '"') normalizedValue = value * 2.54;
        
        const sizeStr = `${Math.round(normalizedValue)}cm`;
        if (!sizes.includes(sizeStr) && normalizedValue > 0 && normalizedValue < 500) {
          sizes.push(sizeStr);
        }
      }
    }
  }
  if (sizes.length > 0) {
    extractedOptions["Size"] = [...new Set(sizes)];
  }
  
  // Extract colors/finishes
  const colors: string[] = [];
  for (const pattern of colorPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const colorStr = match[1].toLowerCase();
      allExtractedText.push(match[0]);
      
      // Split by comma and process each color
      const colorParts = colorStr.split(/[,\/]/).map(c => c.trim());
      for (const part of colorParts) {
        // Clean up the color name
        let cleaned = part
          .replace(/^(black|white|gold|golden|silver)\s+(cream|water)\s+mask.*$/i, '$1')
          .replace(/\s+-\s+.*/g, '')
          .replace(/\s*-\s*round ball$/i, '')
          .trim();
        
        if (cleaned && cleaned.length > 1 && cleaned.length < 30) {
          // Capitalize first letter
          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          if (!colors.includes(cleaned)) {
            colors.push(cleaned);
          }
        }
      }
    }
  }
  
  // Also find individual color keywords
  for (const keyword of colorKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(text) && !colors.some(c => c.toLowerCase() === keyword.toLowerCase())) {
      colors.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  
  if (colors.length > 0) {
    extractedOptions["Finish"] = [...new Set(colors)].slice(0, 10); // Limit to 10 colors
  }
  
  // Extract wattage
  const wattages: string[] = [];
  for (const pattern of wattagePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const watts = parseInt(match[1]);
      if (watts > 0 && watts <= 500) {
        const wattStr = `${watts}W`;
        if (!wattages.includes(wattStr)) {
          wattages.push(wattStr);
          allExtractedText.push(match[0]);
        }
      }
    }
  }
  if (wattages.length > 0) {
    extractedOptions["Wattage"] = wattages;
  }
  
  // Extract voltage
  const voltages: string[] = [];
  for (const pattern of voltagePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const voltStr = match[1].includes('-') ? `${match[1]}V (Universal)` : `${match[1]}V`;
      if (!voltages.includes(voltStr)) {
        voltages.push(voltStr);
        allExtractedText.push(match[0]);
      }
    }
  }
  if (voltages.length > 0) {
    extractedOptions["Voltage"] = voltages;
  }
  
  // Extract color temperature
  const colorTemps: string[] = [];
  for (const pattern of colorTempPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let temp = match[1].trim();
      allExtractedText.push(match[0]);
      
      // Normalize names
      temp = temp
        .replace(/warm\s*white/gi, 'Warm White')
        .replace(/cool\s*white/gi, 'Cool White')
        .replace(/neutral\s*(?:light|white)/gi, 'Neutral Light')
        .replace(/natural\s*(?:light|white)/gi, 'Natural Light')
        .replace(/daylight/gi, 'Daylight')
        .replace(/yellow\s*light/gi, 'Warm White')
        .toUpperCase().replace(/(\d{4})K/i, '$1K');
      
      if (temp && !colorTemps.includes(temp) && temp.length < 20) {
        colorTemps.push(temp);
      }
    }
  }
  if (colorTemps.length > 0) {
    extractedOptions["Color Temperature"] = [...new Set(colorTemps)];
  }
  
  // Extract bulb type
  const bulbTypes: string[] = [];
  for (const pattern of bulbTypePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const bulb = match[1].toUpperCase();
      if (!bulbTypes.includes(bulb)) {
        bulbTypes.push(bulb);
        allExtractedText.push(match[0]);
      }
    }
  }
  if (bulbTypes.length > 0) {
    extractedOptions["Bulb Type"] = bulbTypes;
  }
  
  // Extract number of lights
  const numLights: string[] = [];
  for (const pattern of lightsPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1]);
      if (num > 0 && num <= 50) {
        const lightStr = num === 1 ? '1 Light' : `${num} Lights`;
        if (!numLights.includes(lightStr)) {
          numLights.push(lightStr);
          allExtractedText.push(match[0]);
        }
      }
    }
  }
  if (numLights.length > 0) {
    extractedOptions["Number of Lights"] = numLights;
  }
  
  // Extract material (spec, not variant)
  for (const pattern of materialPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      extractedSpecs["Material"] = match[1].trim();
      allExtractedText.push(match[0]);
    }
  }
  
  // Extract style (spec, not variant)
  for (const pattern of stylePatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      extractedSpecs["Style"] = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      allExtractedText.push(match[0]);
    }
  }
  
  // Check for dimmable
  for (const pattern of dimmablePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      extractedSpecs["Dimmable"] = "Yes";
    }
  }
  
  // Extract cord length
  for (const pattern of cordPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1]) {
      const length = parseInt(match[1]);
      const unit = match[2]?.toLowerCase() || 'cm';
      const normalized = unit === 'm' ? length * 100 : length;
      extractedSpecs["Cord Length"] = `${normalized}cm`;
      allExtractedText.push(match[0]);
    }
  }
  
  // Generate remaining text by removing extracted parts
  let remaining = text;
  // Remove common boilerplate
  remaining = remaining
    .replace(/product\s*information\s*:?/gi, '')
    .replace(/size\s*information\s*:?/gi, '')
    .replace(/packing\s*list\s*:?.*$/gim, '')
    .replace(/package\s*(?:includes|contents)\s*:?.*$/gim, '')
    .replace(/specifications?\s*:?/gi, '')
    .replace(/features?\s*:?/gi, '')
    .replace(/note\s*:?.*$/gim, '')
    .replace(/\|\s*\|/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return {
    extractedOptions,
    extractedSpecs,
    remainingText: remaining,
    allExtractedText,
  };
}

/**
 * Parse a single product's description and generate variants
 * This is the main mutation for processing individual products
 */
export const parseAndGenerateVariants = mutation({
  args: {
    medusaProductId: v.id("medusaProducts"),
    force: v.optional(v.boolean()), // Re-process even if already done
    deleteExistingVariants: v.optional(v.boolean()), // Default true
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const deleteExisting = args.deleteExistingVariants ?? true;
    
    // Get the product
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) throw new Error("Product not found");
    
    // Get the CJ product for original description
    const cjProduct = await ctx.db.get(product.cjMyProductId);
    if (!cjProduct) throw new Error("CJ product not found");
    
    // Get current description (from staging or CJ)
    const description = product.description || cjProduct.description;
    
    if (!description || description.trim().length === 0) {
      return {
        productId: args.medusaProductId,
        skipped: true,
        reason: "no_description",
        variantsCreated: 0,
      };
    }
    
    // Parse the description
    const parsed = parseDescriptionForOptions(description);
    
    // Determine which options have multiple values (these become variants)
    const variantOptions: Record<string, string[]> = {};
    const singleValueSpecs: Record<string, string> = { ...parsed.extractedSpecs };
    
    for (const [optionType, values] of Object.entries(parsed.extractedOptions)) {
      if (values.length > 1) {
        // Multiple values = variant option
        variantOptions[optionType] = values;
      } else if (values.length === 1) {
        // Single value = spec (goes in metadata)
        singleValueSpecs[optionType] = values[0];
      }
    }
    
    // Get the base price from existing variant or CJ price
    const existingVariants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
      .collect();
    
    let basePriceInCents = Math.round(cjProduct.price * 100);
    let costPriceInCents = basePriceInCents;
    
    if (existingVariants.length > 0) {
      const existingPrices = await ctx.db
        .query("medusaPrices")
        .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", existingVariants[0]._id))
        .collect();
      if (existingPrices.length > 0) {
        basePriceInCents = existingPrices[0].amount;
        costPriceInCents = existingPrices[0].costPrice ?? costPriceInCents;
      }
    }
    
    // Delete existing variants if requested
    if (deleteExisting && existingVariants.length > 0) {
      for (const variant of existingVariants) {
        // Delete prices first
        const prices = await ctx.db
          .query("medusaPrices")
          .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
          .collect();
        for (const price of prices) {
          await ctx.db.delete(price._id);
        }
        await ctx.db.delete(variant._id);
      }
      
      // Delete existing options
      const existingOptions = await ctx.db
        .query("medusaProductOptions")
        .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", args.medusaProductId))
        .collect();
      for (const option of existingOptions) {
        await ctx.db.delete(option._id);
      }
    }
    
    // Track generated SKUs to avoid duplicates
    const usedSkus = new Set<string>();
    
    // If we have variant options, create the matrix
    let variantsCreated = 0;
    const optionNames = Object.keys(variantOptions);
    
    if (optionNames.length > 0) {
      // Create product options
      for (const optionName of optionNames) {
        await ctx.db.insert("medusaProductOptions", {
          medusaProductId: args.medusaProductId,
          title: optionName,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      // Generate all combinations
      function getCombinations(arrays: string[][], current: string[] = []): string[][] {
        if (arrays.length === 0) return [current];
        const [first, ...rest] = arrays;
        return first.flatMap(value => getCombinations(rest, [...current, value]));
      }
      
      const valueArrays = optionNames.map(name => variantOptions[name]);
      const combinations = getCombinations(valueArrays);
      
      let variantRank = 0;
      for (const combo of combinations) {
        // Build options object
        const options: Record<string, string> = {};
        optionNames.forEach((name, i) => {
          options[name] = combo[i];
        });
        
        // Build title from combination
        const title = combo.join(" / ");
        
        // Generate unique SKU
        const sku = await generateUniqueSku(ctx, usedSkus);
        
        // Create variant
        const variantId = await ctx.db.insert("medusaProductVariants", {
          medusaProductId: args.medusaProductId,
          title,
          sku,
          options,
          allowBackorder: false,
          manageInventory: true,
          variantRank: variantRank++,
          metadata: singleValueSpecs,
          createdAt: now,
          updatedAt: now,
        });
        
        // Create price
        await ctx.db.insert("medusaPrices", {
          medusaVariantId: variantId,
          currencyCode: "usd",
          amount: basePriceInCents,
          costPrice: costPriceInCents,
          createdAt: now,
          updatedAt: now,
        });
        
        variantsCreated++;
      }
    } else {
      // No variant options found - create single "Default" variant
      // Keep the original CJ SKU for the default variant
      const sku = cjProduct.sku;
      
      const variantId = await ctx.db.insert("medusaProductVariants", {
        medusaProductId: args.medusaProductId,
        title: "Default",
        sku,
        options: {},
        allowBackorder: false,
        manageInventory: true,
        variantRank: 0,
        metadata: singleValueSpecs,
        createdAt: now,
        updatedAt: now,
      });
      
      await ctx.db.insert("medusaPrices", {
        medusaVariantId: variantId,
        currencyCode: "usd",
        amount: basePriceInCents,
        costPrice: costPriceInCents,
        createdAt: now,
        updatedAt: now,
      });
      
      variantsCreated = 1;
    }
    
    // Clear the description (all data extracted)
    await ctx.db.patch(args.medusaProductId, {
      description: "", // Clear description - data extracted
      metadata: {
        ...(product.metadata as Record<string, unknown> || {}),
        extractedSpecs: singleValueSpecs,
        variantOptionsFound: optionNames,
        descriptionParsedAt: now,
      },
      updatedAt: now,
    });
    
    return {
      productId: args.medusaProductId,
      skipped: false,
      variantsCreated,
      optionsCreated: optionNames.length,
      optionTypes: optionNames,
      specsExtracted: Object.keys(singleValueSpecs),
      descriptionCleared: true,
    };
  },
});

/**
 * Bulk parse descriptions and generate variants for all products
 * Processes in batches to avoid timeout
 */
export const bulkParseAndGenerateVariants = mutation({
  args: {
    limit: v.optional(v.number()),
    skipAlreadyProcessed: v.optional(v.boolean()), // Skip if description already empty
    deleteExistingVariants: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const skipProcessed = args.skipAlreadyProcessed ?? true;
    const deleteExisting = args.deleteExistingVariants ?? true;
    const now = Date.now();
    
    // Get all products
    const allProducts = await ctx.db.query("medusaProducts").collect();
    
    // Filter to products that need processing
    const productsToProcess = allProducts.filter(p => {
      if (skipProcessed) {
        // Skip if description is already empty (already processed)
        return p.description && p.description.trim().length > 0;
      }
      return true;
    }).slice(0, limit);
    
    let processed = 0;
    let skipped = 0;
    let totalVariantsCreated = 0;
    let totalOptionsCreated = 0;
    const errors: { productId: string; error: string }[] = [];
    
    // Track all used SKUs for this batch
    const usedSkus = new Set<string>();
    
    // Pre-load existing SKUs
    const existingVariants = await ctx.db.query("medusaProductVariants").collect();
    for (const v of existingVariants) {
      if (v.sku) usedSkus.add(v.sku);
    }
    
    for (const product of productsToProcess) {
      try {
        const cjProduct = await ctx.db.get(product.cjMyProductId);
        if (!cjProduct) {
          skipped++;
          continue;
        }
        
        const description = product.description || cjProduct.description;
        if (!description || description.trim().length === 0) {
          skipped++;
          continue;
        }
        
        // Parse description
        const parsed = parseDescriptionForOptions(description);
        
        // Separate variant options from single-value specs
        const variantOptions: Record<string, string[]> = {};
        const singleValueSpecs: Record<string, string> = { ...parsed.extractedSpecs };
        
        for (const [optionType, values] of Object.entries(parsed.extractedOptions)) {
          if (values.length > 1) {
            variantOptions[optionType] = values;
          } else if (values.length === 1) {
            singleValueSpecs[optionType] = values[0];
          }
        }
        
        // Get base price
        const currentVariants = await ctx.db
          .query("medusaProductVariants")
          .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
          .collect();
        
        let basePriceInCents = Math.round(cjProduct.price * 100);
        let costPriceInCents = basePriceInCents;
        
        if (currentVariants.length > 0) {
          const prices = await ctx.db
            .query("medusaPrices")
            .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", currentVariants[0]._id))
            .collect();
          if (prices.length > 0) {
            basePriceInCents = prices[0].amount;
            costPriceInCents = prices[0].costPrice ?? costPriceInCents;
          }
        }
        
        // Delete existing if requested
        if (deleteExisting && currentVariants.length > 0) {
          for (const variant of currentVariants) {
            const prices = await ctx.db
              .query("medusaPrices")
              .withIndex("by_medusaVariantId", (q) => q.eq("medusaVariantId", variant._id))
              .collect();
            for (const price of prices) {
              await ctx.db.delete(price._id);
            }
            await ctx.db.delete(variant._id);
          }
          
          const currentOptions = await ctx.db
            .query("medusaProductOptions")
            .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", product._id))
            .collect();
          for (const option of currentOptions) {
            await ctx.db.delete(option._id);
          }
        }
        
        // Create options and variants
        const optionNames = Object.keys(variantOptions);
        let variantsCreated = 0;
        
        if (optionNames.length > 0) {
          // Create product options
          for (const optionName of optionNames) {
            await ctx.db.insert("medusaProductOptions", {
              medusaProductId: product._id,
              title: optionName,
              createdAt: now,
              updatedAt: now,
            });
            totalOptionsCreated++;
          }
          
          // Generate combinations
          function getCombinations(arrays: string[][], current: string[] = []): string[][] {
            if (arrays.length === 0) return [current];
            const [first, ...rest] = arrays;
            return first.flatMap(value => getCombinations(rest, [...current, value]));
          }
          
          const valueArrays = optionNames.map(name => variantOptions[name]);
          const combinations = getCombinations(valueArrays);
          
          let variantRank = 0;
          for (const combo of combinations) {
            const options: Record<string, string> = {};
            optionNames.forEach((name, i) => {
              options[name] = combo[i];
            });
            
            const title = combo.join(" / ");
            const sku = await generateUniqueSku(ctx, usedSkus);
            
            const variantId = await ctx.db.insert("medusaProductVariants", {
              medusaProductId: product._id,
              title,
              sku,
              options,
              allowBackorder: false,
              manageInventory: true,
              variantRank: variantRank++,
              metadata: singleValueSpecs,
              createdAt: now,
              updatedAt: now,
            });
            
            await ctx.db.insert("medusaPrices", {
              medusaVariantId: variantId,
              currencyCode: "usd",
              amount: basePriceInCents,
              costPrice: costPriceInCents,
              createdAt: now,
              updatedAt: now,
            });
            
            variantsCreated++;
          }
        } else {
          // Create default variant with CJ SKU
          const variantId = await ctx.db.insert("medusaProductVariants", {
            medusaProductId: product._id,
            title: "Default",
            sku: cjProduct.sku,
            options: {},
            allowBackorder: false,
            manageInventory: true,
            variantRank: 0,
            metadata: singleValueSpecs,
            createdAt: now,
            updatedAt: now,
          });
          
          await ctx.db.insert("medusaPrices", {
            medusaVariantId: variantId,
            currencyCode: "usd",
            amount: basePriceInCents,
            costPrice: costPriceInCents,
            createdAt: now,
            updatedAt: now,
          });
          
          variantsCreated = 1;
        }
        
        // Clear description
        await ctx.db.patch(product._id, {
          description: "",
          metadata: {
            ...(product.metadata as Record<string, unknown> || {}),
            extractedSpecs: singleValueSpecs,
            variantOptionsFound: optionNames,
            descriptionParsedAt: now,
          },
          updatedAt: now,
        });
        
        processed++;
        totalVariantsCreated += variantsCreated;
        
      } catch (error) {
        errors.push({
          productId: product._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return {
      processed,
      skipped,
      totalVariantsCreated,
      totalOptionsCreated,
      errors: errors.length > 0 ? errors : undefined,
      remaining: allProducts.filter(p => p.description && p.description.trim().length > 0).length - processed,
    };
  },
});

/**
 * Get parsing stats - how many products have been processed
 */
export const getParsingStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("medusaProducts").collect();
    const variants = await ctx.db.query("medusaProductVariants").collect();
    const options = await ctx.db.query("medusaProductOptions").collect();
    
    const processed = products.filter(p => !p.description || p.description.trim() === '').length;
    const pending = products.length - processed;
    
    // Count products with multiple variants
    const variantsByProduct = new Map<string, number>();
    for (const v of variants) {
      const count = variantsByProduct.get(v.medusaProductId) || 0;
      variantsByProduct.set(v.medusaProductId, count + 1);
    }
    
    const productsWithMultipleVariants = Array.from(variantsByProduct.values()).filter(c => c > 1).length;
    
    // Count option types
    const optionTypes = new Map<string, number>();
    for (const o of options) {
      optionTypes.set(o.title, (optionTypes.get(o.title) || 0) + 1);
    }
    
    return {
      totalProducts: products.length,
      processed,
      pending,
      totalVariants: variants.length,
      totalOptions: options.length,
      productsWithMultipleVariants,
      avgVariantsPerProduct: products.length > 0 ? (variants.length / products.length).toFixed(2) : '0',
      optionTypeCounts: Object.fromEntries(optionTypes),
    };
  },
});

/**
 * Preview what would be extracted from a description without saving
 */
export const previewDescriptionParsing = query({
  args: {
    medusaProductId: v.id("medusaProducts"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.medusaProductId);
    if (!product) return null;
    
    const cjProduct = await ctx.db.get(product.cjMyProductId);
    if (!cjProduct) return null;
    
    const description = product.description || cjProduct.description;
    if (!description) {
      return {
        productTitle: product.title,
        hasDescription: false,
        extractedOptions: {},
        extractedSpecs: {},
        potentialVariants: 0,
      };
    }
    
    const parsed = parseDescriptionForOptions(description);
    
    // Calculate potential variant count
    const variantOptions = Object.entries(parsed.extractedOptions)
      .filter(([, values]) => values.length > 1);
    
    let potentialVariants = 1;
    for (const [, values] of variantOptions) {
      potentialVariants *= values.length;
    }
    
    return {
      productTitle: product.title,
      hasDescription: true,
      originalDescription: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
      extractedOptions: parsed.extractedOptions,
      extractedSpecs: parsed.extractedSpecs,
      variantOptionTypes: variantOptions.map(([name]) => name),
      potentialVariants,
      remainingText: parsed.remainingText.substring(0, 300),
    };
  },
});