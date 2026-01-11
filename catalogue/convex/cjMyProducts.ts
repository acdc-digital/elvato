import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

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
    cjCreatedAt: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    categoryName: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    inventory: v.optional(v.number()),
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
      cjCreatedAt: v.string(),
      description: v.optional(v.string()),
      categoryId: v.optional(v.string()),
      categoryName: v.optional(v.string()),
      supplierName: v.optional(v.string()),
      inventory: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;
    let updated = 0;
    
    for (const product of args.products) {
      // Check if product already exists
      const existing = await ctx.db
        .query("cjMyProducts")
        .withIndex("by_cjProductId", (q) => q.eq("cjProductId", product.cjProductId))
        .first();
      
      if (existing) {
        // Update existing product
        await ctx.db.patch(existing._id, {
          ...product,
          updatedAt: now,
        });
        updated++;
      } else {
        // Insert new product
        await ctx.db.insert("cjMyProducts", {
          ...product,
          syncedAt: now,
          updatedAt: now,
        });
        created++;
      }
    }
    
    return { created, updated, total: args.products.length };
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
