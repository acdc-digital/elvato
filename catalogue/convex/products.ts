import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all active (non-deleted) products, sorted by createdAt descending (newest first)
export const getProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(limit);
    return products;
  },
});

// Get a single product by ID
export const getProduct = query({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    return product;
  },
});

// Get product by SKU
export const getProductBySku = query({
  args: {
    sku: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
    return product;
  },
});

// Create a new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    lists: v.number(),
    price: v.number(),
    sourceUrl: v.string(),
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
    recordHistory: v.optional(v.boolean()), // Whether to record this in action history
  },
  handler: async (ctx, args) => {
    const { recordHistory, ...productData } = args;
    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      ...productData,
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
    });
    
    // Record action in history if requested (default true)
    if (recordHistory !== false) {
      const product = await ctx.db.get(productId);
      await ctx.db.insert("actionHistory", {
        actionType: "create",
        entityType: "products",
        entityId: productId,
        previousState: undefined,
        newState: product,
        timestamp: now,
      });
    }
    
    return productId;
  },
});

// Update an existing product
export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    lists: v.optional(v.number()),
    price: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
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
    recordHistory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, recordHistory, ...updates } = args;
    
    // Get previous state for history
    const previousState = recordHistory !== false ? await ctx.db.get(id) : null;
    
    // Filter out undefined values
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }
    
    // Always update the updatedAt timestamp
    const now = Date.now();
    fieldsToUpdate.updatedAt = now;
    
    await ctx.db.patch(id, fieldsToUpdate);
    
    // Record action in history if requested
    if (recordHistory !== false && previousState) {
      const newState = await ctx.db.get(id);
      await ctx.db.insert("actionHistory", {
        actionType: "update",
        entityType: "products",
        entityId: id,
        previousState,
        newState,
        timestamp: now,
      });
    }
    
    return id;
  },
});

// Soft delete a product (move to trash)
export const softDeleteProduct = mutation({
  args: {
    id: v.id("products"),
    recordHistory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, recordHistory } = args;
    const now = Date.now();
    
    // Get previous state for history
    const previousState = recordHistory !== false ? await ctx.db.get(id) : null;
    
    // Set deletedAt timestamp
    await ctx.db.patch(id, {
      deletedAt: now,
      updatedAt: now,
    });
    
    // Record action in history if requested
    if (recordHistory !== false && previousState) {
      const newState = await ctx.db.get(id);
      await ctx.db.insert("actionHistory", {
        actionType: "delete",
        entityType: "products",
        entityId: id,
        previousState,
        newState,
        timestamp: now,
      });
    }
    
    return id;
  },
});

// Restore a product from trash
export const restoreProduct = mutation({
  args: {
    id: v.id("products"),
    recordHistory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, recordHistory } = args;
    const now = Date.now();
    
    // Get previous state for history
    const previousState = recordHistory !== false ? await ctx.db.get(id) : null;
    
    // Clear deletedAt and update createdAt to make it appear as "new"
    await ctx.db.patch(id, {
      deletedAt: undefined,
      createdAt: now, // Update createdAt so it appears at the top
      updatedAt: now,
    });
    
    // Record action in history if requested
    if (recordHistory !== false && previousState) {
      const newState = await ctx.db.get(id);
      await ctx.db.insert("actionHistory", {
        actionType: "restore",
        entityType: "products",
        entityId: id,
        previousState,
        newState,
        timestamp: now,
      });
    }
    
    return id;
  },
});

// Hard delete a product (permanent)
export const deleteProduct = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Search products by name
export const searchProducts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const searchLower = args.searchTerm.toLowerCase();
    
    // Note: For production, consider using a full-text search solution
    // This is a simple filter-based approach
    const allProducts = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
    
    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower)
    );
    
    return filtered.slice(0, limit);
  },
});

// Get all deleted products (trash)
export const getDeletedProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const deletedProducts = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(limit);
    return deletedProducts;
  },
});
