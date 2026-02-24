import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// =============================================================================
// VARIANT MAPPING - Physical vs. Non-Physical Option Classification
// =============================================================================
// Physical Options (Require unique images):
//   - Finish/Color (Black, Gold, White, etc.)
//   - Number of Lights (1-head, 3-head, 5-head, etc.)
//
// Non-Physical Options (Share images):
//   - Size (when shape is the same, just scaling)
//   - Color Temperature (3000K, 4000K, Warm White, Cool White)
//   - Wattage (5W, 10W, 15W, etc.)
//   - Voltage (110V, 220V, 110-240V)
//   - Dimmable (Yes/No)
//   - Bulb Type (E26, E27, G9, etc.)
//   - Material
//   - Style
//   - Cord Length
// =============================================================================

// Physical option names that require unique images
const PHYSICAL_OPTIONS = new Set([
  "finish",
  "color",
  "colour",
  "number of lights",
  "lights",
  "heads",
  "number of heads",
  "fixture color",
  "frame color",
  "body color",
  "shade color",
]);

// Non-physical option names that share images
const NON_PHYSICAL_OPTIONS = new Set([
  "size",
  "diameter",
  "length",
  "width",
  "height",
  "color temperature",
  "light color",
  "kelvin",
  "wattage",
  "power",
  "watts",
  "voltage",
  "dimmable",
  "dimming",
  "bulb type",
  "base type",
  "socket type",
  "material",
  "style",
  "cord length",
  "cable length",
  "chain length",
]);

/**
 * Classify an option as physical or non-physical
 */
function classifyOption(optionName: string): "physical" | "non-physical" {
  const normalized = optionName.toLowerCase().trim();
  
  // Check if it's explicitly physical
  if (PHYSICAL_OPTIONS.has(normalized)) {
    return "physical";
  }
  
  // Check if it's explicitly non-physical
  if (NON_PHYSICAL_OPTIONS.has(normalized)) {
    return "non-physical";
  }
  
  // Partial matching for variations
  for (const physicalOpt of PHYSICAL_OPTIONS) {
    if (normalized.includes(physicalOpt) || physicalOpt.includes(normalized)) {
      return "physical";
    }
  }
  
  // Default to non-physical for unknown options
  // (conservative - we'd rather miss an image than require unnecessary ones)
  return "non-physical";
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all variant mappings with pagination
 */
export const getVariantMappings = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("complete"),
      v.literal("partial"),
      v.literal("missing")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    if (args.status) {
      return await ctx.db
        .query("variantMapping")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit);
    }
    
    return await ctx.db
      .query("variantMapping")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get products that need more images
 */
export const getProductsNeedingImages = query({
  args: {
    minMissingImages: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const minMissing = args.minMissingImages ?? 1;
    
    const mappings = await ctx.db
      .query("variantMapping")
      .withIndex("by_status", (q) => q.eq("status", "partial"))
      .collect();
    
    const missing = await ctx.db
      .query("variantMapping")
      .withIndex("by_status", (q) => q.eq("status", "missing"))
      .collect();
    
    const all = [...mappings, ...missing]
      .filter(m => m.missingImages >= minMissing)
      .sort((a, b) => b.missingImages - a.missingImages);
    
    return all.slice(0, limit);
  },
});

/**
 * Get variant mapping for a specific product
 */
export const getProductVariantMapping = query({
  args: {
    productId: v.id("medusaProducts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variantMapping")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();
  },
});

/**
 * Get summary statistics for variant mappings
 */
export const getVariantMappingSummary = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("variantMapping").collect();
    
    const complete = all.filter(m => m.status === "complete").length;
    const partial = all.filter(m => m.status === "partial").length;
    const missing = all.filter(m => m.status === "missing").length;
    
    const totalVariants = all.reduce((sum, m) => sum + m.totalVariants, 0);
    const totalPhysicalVariants = all.reduce((sum, m) => sum + m.physicalVariants, 0);
    const totalRequiredImages = all.reduce((sum, m) => sum + m.requiredImages, 0);
    const totalCurrentImages = all.reduce((sum, m) => sum + m.currentImages, 0);
    const totalMissingImages = all.reduce((sum, m) => sum + m.missingImages, 0);
    
    const avgImageCoverage = all.length > 0
      ? all.reduce((sum, m) => sum + m.imageCoverage, 0) / all.length
      : 0;
    
    return {
      totalProducts: all.length,
      byStatus: {
        complete,
        partial,
        missing,
      },
      totalVariants,
      totalPhysicalVariants,
      totalNonPhysicalVariants: totalVariants - totalPhysicalVariants,
      totalRequiredImages,
      totalCurrentImages,
      totalMissingImages,
      averageImageCoverage: Math.round(avgImageCoverage * 10) / 10,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Analyze a single product and create/update its variant mapping
 */
export const analyzeProduct = mutation({
  args: {
    productId: v.id("medusaProducts"),
  },
  handler: async (ctx, args) => {
    const { productId } = args;
    
    // Get product
    const product = await ctx.db.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    
    // Get CJ product for cjProductId
    const cjProduct = await ctx.db.get(product.cjMyProductId);
    const cjProductId = cjProduct?.cjProductId ?? "unknown";
    
    // Get all variants for this product
    const variants = await ctx.db
      .query("medusaProductVariants")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", productId))
      .collect();
    
    // Get images for this product
    const images = await ctx.db
      .query("medusaImages")
      .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", productId))
      .collect();
    
    // Analyze options across all variants
    const physicalOptionsMap: Map<string, Set<string>> = new Map();
    const nonPhysicalOptionsMap: Map<string, Set<string>> = new Map();
    
    for (const variant of variants) {
      if (!variant.options || typeof variant.options !== "object") continue;
      
      const options = variant.options as Record<string, string>;
      
      for (const [optName, optValue] of Object.entries(options)) {
        if (!optValue) continue;
        
        const classification = classifyOption(optName);
        const targetMap = classification === "physical" ? physicalOptionsMap : nonPhysicalOptionsMap;
        
        if (!targetMap.has(optName)) {
          targetMap.set(optName, new Set());
        }
        targetMap.get(optName)!.add(String(optValue));
      }
    }
    
    // Build physical and non-physical options arrays
    const physicalOptions = Array.from(physicalOptionsMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
      count: values.size,
    }));
    
    const nonPhysicalOptions = Array.from(nonPhysicalOptionsMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
      count: values.size,
    }));
    
    // Build physical variant groups
    const physicalGroupsMap: Map<string, {
      physicalOptionValues: Record<string, string>;
      variantIds: Id<"medusaProductVariants">[];
    }> = new Map();
    
    for (const variant of variants) {
      const options = (variant.options || {}) as Record<string, string>;
      
      // Extract only physical options for this variant
      const physicalOptionValues: Record<string, string> = {};
      
      for (const [optName, optValue] of Object.entries(options)) {
        if (classifyOption(optName) === "physical" && optValue) {
          physicalOptionValues[optName] = String(optValue);
        }
      }
      
      // Create group key from sorted physical option values
      const groupKey = Object.entries(physicalOptionValues)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|") || "default";
      
      if (!physicalGroupsMap.has(groupKey)) {
        physicalGroupsMap.set(groupKey, {
          physicalOptionValues,
          variantIds: [],
        });
      }
      physicalGroupsMap.get(groupKey)!.variantIds.push(variant._id);
    }
    
    const physicalVariantGroups = Array.from(physicalGroupsMap.entries()).map(([groupKey, data]) => ({
      groupKey,
      physicalOptionValues: data.physicalOptionValues,
      variantIds: data.variantIds,
      variantCount: data.variantIds.length,
      assignedImageUrl: undefined, // To be assigned later
    }));
    
    // Calculate metrics
    const totalVariants = variants.length;
    const physicalVariants = physicalVariantGroups.length;
    const nonPhysicalVariants = totalVariants - physicalVariants;
    const requiredImages = physicalVariants;
    const currentImages = images.length;
    const missingImages = Math.max(0, requiredImages - currentImages);
    const imageCoverage = requiredImages > 0 
      ? Math.round((Math.min(currentImages, requiredImages) / requiredImages) * 100)
      : 100;
    
    // Determine status
    let status: "complete" | "partial" | "missing";
    if (currentImages >= requiredImages) {
      status = "complete";
    } else if (currentImages > 0) {
      status = "partial";
    } else {
      status = "missing";
    }
    
    const now = Date.now();
    
    // Check if mapping already exists
    const existing = await ctx.db
      .query("variantMapping")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .first();
    
    const mappingData = {
      productId,
      cjProductId,
      title: product.title,
      totalVariants,
      physicalVariants,
      nonPhysicalVariants,
      physicalOptions,
      nonPhysicalOptions,
      physicalVariantGroups,
      requiredImages,
      currentImages,
      imageCoverage,
      missingImages,
      status,
      analyzedAt: now,
      updatedAt: now,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, mappingData);
      return existing._id;
    } else {
      return await ctx.db.insert("variantMapping", mappingData);
    }
  },
});

/**
 * Bulk analyze all products (internal mutation for batch processing)
 */
export const bulkAnalyzeProducts = internalMutation({
  args: {
    productIds: v.array(v.id("medusaProducts")),
  },
  handler: async (ctx, args) => {
    const results: { productId: Id<"medusaProducts">; success: boolean; error?: string }[] = [];
    
    for (const productId of args.productIds) {
      try {
        const product = await ctx.db.get(productId);
        if (!product) {
          results.push({ productId, success: false, error: "Product not found" });
          continue;
        }
        
        // Get CJ product for cjProductId
        const cjProduct = await ctx.db.get(product.cjMyProductId);
        const cjProductId = cjProduct?.cjProductId ?? "unknown";
        
        // Get all variants for this product
        const variants = await ctx.db
          .query("medusaProductVariants")
          .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", productId))
          .collect();
        
        // Get images for this product
        const images = await ctx.db
          .query("medusaImages")
          .withIndex("by_medusaProductId", (q) => q.eq("medusaProductId", productId))
          .collect();
        
        // Analyze options across all variants
        const physicalOptionsMap: Map<string, Set<string>> = new Map();
        const nonPhysicalOptionsMap: Map<string, Set<string>> = new Map();
        
        for (const variant of variants) {
          if (!variant.options || typeof variant.options !== "object") continue;
          
          const options = variant.options as Record<string, string>;
          
          for (const [optName, optValue] of Object.entries(options)) {
            if (!optValue) continue;
            
            const classification = classifyOption(optName);
            const targetMap = classification === "physical" ? physicalOptionsMap : nonPhysicalOptionsMap;
            
            if (!targetMap.has(optName)) {
              targetMap.set(optName, new Set());
            }
            targetMap.get(optName)!.add(String(optValue));
          }
        }
        
        // Build physical and non-physical options arrays
        const physicalOptions = Array.from(physicalOptionsMap.entries()).map(([name, values]) => ({
          name,
          values: Array.from(values).sort(),
          count: values.size,
        }));
        
        const nonPhysicalOptions = Array.from(nonPhysicalOptionsMap.entries()).map(([name, values]) => ({
          name,
          values: Array.from(values).sort(),
          count: values.size,
        }));
        
        // Build physical variant groups
        const physicalGroupsMap: Map<string, {
          physicalOptionValues: Record<string, string>;
          variantIds: Id<"medusaProductVariants">[];
        }> = new Map();
        
        for (const variant of variants) {
          const options = (variant.options || {}) as Record<string, string>;
          
          // Extract only physical options for this variant
          const physicalOptionValues: Record<string, string> = {};
          
          for (const [optName, optValue] of Object.entries(options)) {
            if (classifyOption(optName) === "physical" && optValue) {
              physicalOptionValues[optName] = String(optValue);
            }
          }
          
          // Create group key from sorted physical option values
          const groupKey = Object.entries(physicalOptionValues)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join("|") || "default";
          
          if (!physicalGroupsMap.has(groupKey)) {
            physicalGroupsMap.set(groupKey, {
              physicalOptionValues,
              variantIds: [],
            });
          }
          physicalGroupsMap.get(groupKey)!.variantIds.push(variant._id);
        }
        
        const physicalVariantGroups = Array.from(physicalGroupsMap.entries()).map(([groupKey, data]) => ({
          groupKey,
          physicalOptionValues: data.physicalOptionValues,
          variantIds: data.variantIds,
          variantCount: data.variantIds.length,
          assignedImageUrl: undefined,
        }));
        
        // Calculate metrics
        const totalVariants = variants.length;
        const physicalVariants = physicalVariantGroups.length;
        const nonPhysicalVariants = totalVariants - physicalVariants;
        const requiredImages = physicalVariants;
        const currentImages = images.length;
        const missingImages = Math.max(0, requiredImages - currentImages);
        const imageCoverage = requiredImages > 0 
          ? Math.round((Math.min(currentImages, requiredImages) / requiredImages) * 100)
          : 100;
        
        // Determine status
        let status: "complete" | "partial" | "missing";
        if (currentImages >= requiredImages) {
          status = "complete";
        } else if (currentImages > 0) {
          status = "partial";
        } else {
          status = "missing";
        }
        
        const now = Date.now();
        
        // Check if mapping already exists
        const existing = await ctx.db
          .query("variantMapping")
          .withIndex("by_productId", (q) => q.eq("productId", productId))
          .first();
        
        const mappingData = {
          productId,
          cjProductId,
          title: product.title,
          totalVariants,
          physicalVariants,
          nonPhysicalVariants,
          physicalOptions,
          nonPhysicalOptions,
          physicalVariantGroups,
          requiredImages,
          currentImages,
          imageCoverage,
          missingImages,
          status,
          analyzedAt: now,
          updatedAt: now,
        };
        
        if (existing) {
          await ctx.db.patch(existing._id, mappingData);
        } else {
          await ctx.db.insert("variantMapping", mappingData);
        }
        
        results.push({ productId, success: true });
      } catch (error) {
        results.push({ 
          productId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
    
    return results;
  },
});

/**
 * Assign an image to a physical variant group
 */
export const assignImageToGroup = mutation({
  args: {
    mappingId: v.id("variantMapping"),
    groupKey: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { mappingId, groupKey, imageUrl } = args;
    
    const mapping = await ctx.db.get(mappingId);
    if (!mapping) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }
    
    // Update the specific group's assignedImageUrl
    const updatedGroups = mapping.physicalVariantGroups.map(group => {
      if (group.groupKey === groupKey) {
        return { ...group, assignedImageUrl: imageUrl };
      }
      return group;
    });
    
    // Recalculate coverage based on assigned images
    const assignedCount = updatedGroups.filter(g => g.assignedImageUrl).length;
    const requiredImages = updatedGroups.length;
    const imageCoverage = requiredImages > 0
      ? Math.round((assignedCount / requiredImages) * 100)
      : 100;
    
    let status: "complete" | "partial" | "missing";
    if (assignedCount >= requiredImages) {
      status = "complete";
    } else if (assignedCount > 0) {
      status = "partial";
    } else {
      status = "missing";
    }
    
    await ctx.db.patch(mappingId, {
      physicalVariantGroups: updatedGroups,
      imageCoverage,
      status,
      updatedAt: Date.now(),
    });
    
    return mappingId;
  },
});

/**
 * Clear all variant mappings (for re-analysis)
 */
export const clearAllMappings = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("variantMapping").collect();
    
    for (const mapping of all) {
      await ctx.db.delete(mapping._id);
    }
    
    return { deleted: all.length };
  },
});
