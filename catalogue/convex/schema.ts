import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  projects: defineTable({
    value: v.number(),
  }),
  
  // Products table for catalogue management
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
});
