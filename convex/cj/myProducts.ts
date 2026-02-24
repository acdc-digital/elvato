import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";

/**
 * Remove image tags from HTML and clean up the result
 * Used to clean CJ descriptions before saving
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

// Get all CJ My Products, sorted by syncedAt descending (most recent first)
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const products = await ctx.db
      .query("cjMyProducts")
      .order("desc")
      .take(limit);
    return products;
  },
});

// Get total count of CJ My Products
export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("cjMyProducts").collect();
    return products.length;
  },
});

// Get a single product by CJ Product ID
export const getByCjProductId = query({
  args: {
    cjProductId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("cjMyProducts")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .first();
    return product;
  },
});

// Get product by SKU
export const getBySku = query({
  args: {
    sku: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("cjMyProducts")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
    return product;
  },
});

// Search products by name or SKU
export const search = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const searchLower = args.searchTerm.toLowerCase();
    
    const allProducts = await ctx.db
      .query("cjMyProducts")
      .collect();
    
    const filtered = allProducts.filter(product => 
      product.nameEn.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower)
    );
    
    return filtered.slice(0, limit);
  },
});

// Upsert a single CJ My Product (insert or update if exists)
export const upsert = mutation({
  args: {
    cjProductId: v.string(),
    sku: v.string(),
    nameEn: v.string(),
    productNames: v.array(v.string()),
    bigImage: v.string(),
    price: v.number(),
    productType: v.number(),
    listedShopNum: v.optional(v.string()),
    cjCreatedAt: v.union(v.string(), v.number()),  // ISO string or Unix timestamp
    description: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    categoryName: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    inventory: v.optional(v.number()),
    isRemovedFromShelves: v.optional(v.boolean()),
    cjStatusMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if product already exists
    const existing = await ctx.db
      .query("cjMyProducts")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .first();
    
    if (existing) {
      // Update existing product
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return { action: "updated", id: existing._id };
    } else {
      // Insert new product
      const id = await ctx.db.insert("cjMyProducts", {
        ...args,
        syncedAt: now,
        updatedAt: now,
      });
      return { action: "created", id };
    }
  },
});

// Batch upsert multiple products (for sync operations)
export const batchUpsert = mutation({
  args: {
    products: v.array(v.object({
      cjProductId: v.string(),
      sku: v.string(),
      nameEn: v.string(),
      productNames: v.array(v.string()),
      bigImage: v.string(),
      price: v.number(),
      productType: v.number(),
      listedShopNum: v.optional(v.string()),
      cjCreatedAt: v.union(v.string(), v.number()),  // ISO string or Unix timestamp
      description: v.optional(v.string()),
      categoryId: v.optional(v.string()),
      categoryName: v.optional(v.string()),
      supplierName: v.optional(v.string()),
      inventory: v.optional(v.number()),
      isRemovedFromShelves: v.optional(v.boolean()),
      cjStatusMessage: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let removedCount = 0;
    
    for (const product of args.products) {
      // Clean description if present (remove img tags)
      const cleanedDescription = product.description 
        ? stripImagesFromHtml(product.description) 
        : undefined;
      
      const productData = {
        ...product,
        description: cleanedDescription,
      };
      
      // Check if product already exists
      const existing = await ctx.db
        .query("cjMyProducts")
        .withIndex("by_cjProductId", (q) => q.eq("cjProductId", product.cjProductId))
        .first();
      
      if (existing) {
        // Update existing product
        await ctx.db.patch(existing._id, {
          ...productData,
          updatedAt: now,
        });
        updated++;
      } else {
        // Insert new product
        await ctx.db.insert("cjMyProducts", {
          ...productData,
          syncedAt: now,
          updatedAt: now,
        });
        created++;
      }
      
      // If product is removed from shelves, add to removedFromShelves table
      if (product.isRemovedFromShelves) {
        // Check if already in removedFromShelves
        const existingRemoved = await ctx.db
          .query("removedFromShelves")
          .withIndex("by_cjProductId", (q) => q.eq("cjProductId", product.cjProductId))
          .first();
        
        if (!existingRemoved) {
          await ctx.db.insert("removedFromShelves", {
            cjProductId: product.cjProductId,
            sku: product.sku,
            nameEn: product.nameEn,
            bigImage: product.bigImage || undefined,
            price: product.price || undefined,
            cjStatusMessage: product.cjStatusMessage,
            cjMyProductRef: existing?._id,
            removedAt: now,
            lastSeenAt: existing?.updatedAt,
          });
          removedCount++;
        }
      }
    }
    
    return { created, updated, removed: removedCount, total: args.products.length };
  },
});

// Clear all CJ My Products (use with caution - for full re-sync)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("cjMyProducts").collect();
    let deleted = 0;
    
    for (const product of products) {
      await ctx.db.delete(product._id);
      deleted++;
    }
    
    return { deleted };
  },
});

// Delete a single product by CJ Product ID
export const deleteByCjProductId = mutation({
  args: {
    cjProductId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("cjMyProducts")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .first();
    
    if (product) {
      await ctx.db.delete(product._id);
      return { deleted: true };
    }
    
    return { deleted: false };
  },
});

// Get sync stats
export const getSyncStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("cjMyProducts").collect();
    
    if (products.length === 0) {
      return {
        totalProducts: 0,
        lastSyncedAt: null,
        oldestSyncedAt: null,
      };
    }
    
    const syncTimes = products.map(p => p.syncedAt);
    const lastSyncedAt = Math.max(...syncTimes);
    const oldestSyncedAt = Math.min(...syncTimes);
    
    return {
      totalProducts: products.length,
      lastSyncedAt,
      oldestSyncedAt,
    };
  },
});

// =============================================================================
// REMOVED FROM SHELVES TABLE OPERATIONS
// =============================================================================

// Get all removed products, sorted by removedAt descending
export const getRemovedProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const products = await ctx.db
      .query("removedFromShelves")
      .withIndex("by_removedAt")
      .order("desc")
      .take(limit);
    return products;
  },
});

// Get count of removed products
export const getRemovedCount = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("removedFromShelves").collect();
    return products.length;
  },
});

// Check if a product is in the removed list
export const isProductRemoved = query({
  args: {
    cjProductId: v.string(),
  },
  handler: async (ctx, args) => {
    const removed = await ctx.db
      .query("removedFromShelves")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .first();
    return removed !== null;
  },
});

// Remove a product from the removed list (if it comes back in stock)
export const restoreProduct = mutation({
  args: {
    cjProductId: v.string(),
  },
  handler: async (ctx, args) => {
    const removed = await ctx.db
      .query("removedFromShelves")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .first();
    
    if (removed) {
      await ctx.db.delete(removed._id);
      
      // Also update the cjMyProducts record if it exists
      const product = await ctx.db
        .query("cjMyProducts")
        .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
        .first();
      
      if (product) {
        await ctx.db.patch(product._id, {
          isRemovedFromShelves: false,
          cjStatusMessage: undefined,
          updatedAt: Date.now(),
        });
      }
      
      return { restored: true };
    }
    
    return { restored: false };
  },
});

// Clear all removed products
export const clearRemovedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("removedFromShelves").collect();
    let deleted = 0;
    
    for (const product of products) {
      await ctx.db.delete(product._id);
      deleted++;
    }
    
    return { deleted };
  },
});

/**
 * Bulk clean descriptions - remove img tags from all cjMyProducts
 * Run once to clean existing data, future syncs will clean automatically
 */
export const bulkCleanDescriptions = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 300;
    const now = Date.now();
    
    // Get products with descriptions that contain img tags
    const allProducts = await ctx.db.query("cjMyProducts").collect();
    const productsWithImages = allProducts.filter(p => 
      p.description && /<img[^>]+src=/i.test(p.description)
    ).slice(0, limit);
    
    let cleaned = 0;
    
    for (const product of productsWithImages) {
      if (product.description) {
        const cleanedDescription = stripImagesFromHtml(product.description);
        await ctx.db.patch(product._id, {
          description: cleanedDescription,
          updatedAt: now,
        });
        cleaned++;
      }
    }
    
    const remaining = allProducts.filter(p => 
      p.description && /<img[^>]+src=/i.test(p.description)
    ).length - cleaned;
    
    return {
      cleaned,
      remaining,
      totalProducts: allProducts.length,
    };
  },
});

/**
 * Analyze descriptions to find variant patterns (sizes, colors, wattages, etc.)
 * Returns aggregated stats on what options are commonly found in lighting products
 */
export const analyzeDescriptionVariants = query({
  args: {
    limit: v.optional(v.number()),
    sampleDescriptions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    const products = await ctx.db.query("cjMyProducts").take(limit);
    
    // Patterns common in lighting product descriptions
    const patterns = {
      // Sizes
      diameter: /diameter[:\s]*(\d+(?:\.\d+)?)\s*(cm|mm|m|inch|in|")/gi,
      size: /size[:\s]*([^<\n]+?)(?:<|$|\n)/gi,
      dimensions: /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:[x×]\s*(\d+(?:\.\d+)?))?\s*(cm|mm)/gi,
      
      // Colors/Finishes
      color: /color[:\s]*([^<\n,]+)/gi,
      colorOptions: /(gold|silver|black|white|bronze|copper|brass|chrome|nickel|rose gold|amber|clear|frosted|matte)/gi,
      
      // Light specs
      wattage: /(\d+)\s*w(?:att)?(?:\s|,|<|$)/gi,
      voltage: /(\d+)\s*v(?:olt)?/gi,
      colorTemp: /(warm\s*white|cool\s*white|neutral\s*light|daylight|2700k|3000k|4000k|5000k|6000k|6500k)/gi,
      
      // Bulb types
      bulbType: /(led|e26|e27|e14|e12|g9|gu10|mr16)/gi,
      
      // Quantity of lights
      heads: /(\d+)\s*(?:head|light|arm|branch)/gi,
    };
    
    const stats: Record<string, { count: number; samples: string[] }> = {};
    const samples: { name: string; description: string; found: string[] }[] = [];
    
    for (const pattern of Object.keys(patterns)) {
      stats[pattern] = { count: 0, samples: [] };
    }
    
    for (const product of products) {
      if (!product.description) continue;
      
      const desc = product.description.toLowerCase();
      const foundPatterns: string[] = [];
      
      for (const [patternName, regex] of Object.entries(patterns)) {
        regex.lastIndex = 0;
        const matches = desc.match(regex);
        
        if (matches && matches.length > 0) {
          stats[patternName].count++;
          
          for (const match of matches.slice(0, 3)) {
            const cleaned = match.trim();
            if (cleaned && stats[patternName].samples.length < 10 && 
                !stats[patternName].samples.includes(cleaned)) {
              stats[patternName].samples.push(cleaned);
            }
          }
          foundPatterns.push(patternName);
        }
      }
      
      if (args.sampleDescriptions && foundPatterns.length > 0 && samples.length < 10) {
        samples.push({
          name: product.nameEn,
          description: product.description.substring(0, 500),
          found: foundPatterns,
        });
      }
    }
    
    const sortedStats = Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as typeof stats);
    
    return {
      totalAnalyzed: products.filter(p => p.description).length,
      patternStats: sortedStats,
      ...(args.sampleDescriptions && { sampleDescriptions: samples }),
    };
  },
});

/**
 * Clear descriptions from cjMyProducts that have been staged and processed
 * Run after variant parsing to remove source descriptions
 */
export const clearProcessedDescriptions = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const now = Date.now();
    
    // Get all cjMyProducts that have been staged
    const allProducts = await ctx.db.query("cjMyProducts").collect();
    const stagedProducts = allProducts.filter(p => 
      p.stagedToMedusa && 
      p.medusaProductRef && 
      p.description && 
      p.description.trim().length > 0
    ).slice(0, limit);
    
    let cleared = 0;
    
    for (const product of stagedProducts) {
      // Verify the medusaProduct has been processed (description cleared)
      const medusaProduct = await ctx.db.get(product.medusaProductRef!);
      if (medusaProduct && (!medusaProduct.description || medusaProduct.description.trim() === '')) {
        // Medusa staging has been processed, clear CJ description
        await ctx.db.patch(product._id, {
          description: "",
          updatedAt: now,
        });
        cleared++;
      }
    }
    
    const remaining = allProducts.filter(p => 
      p.stagedToMedusa && 
      p.description && 
      p.description.trim().length > 0
    ).length - cleared;
    
    return {
      cleared,
      remaining,
      totalCjProducts: allProducts.length,
    };
  },
});

/**
 * Get stats on cjMyProducts descriptions
 */
export const getDescriptionStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("cjMyProducts").collect();
    
    const withDescription = products.filter(p => p.description && p.description.trim().length > 0);
    const staged = products.filter(p => p.stagedToMedusa);
    const stagedWithDescription = products.filter(p => 
      p.stagedToMedusa && 
      p.description && 
      p.description.trim().length > 0
    );
    
    return {
      totalProducts: products.length,
      withDescription: withDescription.length,
      withoutDescription: products.length - withDescription.length,
      staged: staged.length,
      stagedWithDescription: stagedWithDescription.length,
      stagedWithoutDescription: staged.length - stagedWithDescription.length,
    };
  },
});
