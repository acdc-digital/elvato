import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/** Get all certification records, most recently scanned first. */
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    return ctx.db
      .query("cjCertifications")
      .withIndex("by_lastScannedAt")
      .order("desc")
      .take(limit);
  },
});

/** Get a single record by SKU. */
export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("cjCertifications")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
  },
});

/** Get a single record by CJ product ID. */
export const getByCjProductId = query({
  args: { cjProductId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("cjCertifications")
      .withIndex("by_cjProductId", (q) => q.eq("cjProductId", args.cjProductId))
      .unique();
  },
});

/** Get all records where no certifications were found and no question submitted. */
export const getNeedingQuestions = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("cjCertifications")
      .withIndex("by_questionSubmitted", (q) => q.eq("questionSubmitted", false))
      .collect();
    return all.filter((r) => r.listings.length === 0 && r.draftQuestion != null);
  },
});

/** Get total counts by scan status. */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("cjCertifications").collect();
    const stats = {
      total: all.length,
      withListings: all.filter((r) => r.listings.length > 0).length,
      noListings: all.filter((r) => r.listings.length === 0).length,
      questionPending: all.filter(
        (r) => !r.questionSubmitted && r.listings.length === 0 && r.draftQuestion != null
      ).length,
      questionSubmitted: all.filter((r) => r.questionSubmitted).length,
      byStatus: {} as Record<string, number>,
    };
    for (const r of all) {
      stats.byStatus[r.scanStatus] = (stats.byStatus[r.scanStatus] ?? 0) + 1;
    }
    return stats;
  },
});

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Upsert a certification audit record by SKU.
 * Creates if not present, merges new data if it exists.
 * Safe to call repeatedly — re-scans overwrite all fields.
 */
export const upsert = mutation({
  args: {
    sku:                v.string(),
    cjProductId:        v.string(),
    nameEn:             v.string(),
    apiAttributes:      v.optional(v.array(v.any())),
    apiDescriptionHtml: v.optional(v.string()),
    listings:           v.array(v.string()),
    listingsSources:    v.array(v.string()),
    buyerReviews:       v.optional(v.array(v.any())),
    buyerReviewsTotal:  v.optional(v.number()),
    buyerRatingSummary: v.optional(v.any()),
    merchantComments:      v.optional(v.array(v.any())),
    merchantCommentsTotal: v.optional(v.number()),
    draftQuestion:      v.optional(v.string()),
    scanStatus:         v.union(
      v.literal("ok"),
      v.literal("api_error"),
      v.literal("scrape_error"),
      v.literal("partial"),
      v.literal("skipped")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("cjCertifications")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();

    const payload = {
      sku:                args.sku,
      cjProductId:        args.cjProductId,
      nameEn:             args.nameEn,
      apiAttributes:      args.apiAttributes,
      apiDescriptionHtml: args.apiDescriptionHtml,
      listings:           args.listings,
      listingsSources:    args.listingsSources,
      buyerReviews:       args.buyerReviews,
      buyerReviewsTotal:  args.buyerReviewsTotal,
      buyerRatingSummary: args.buyerRatingSummary,
      merchantComments:      args.merchantComments,
      merchantCommentsTotal: args.merchantCommentsTotal,
      draftQuestion:      args.draftQuestion,
      scanStatus:         args.scanStatus,
      errorMessage:       args.errorMessage,
      lastScannedAt:      now,
      updatedAt:          now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...payload,
        // Preserve question submission state — don't overwrite on re-scan
        questionSubmitted:   existing.questionSubmitted,
        questionSubmittedAt: existing.questionSubmittedAt,
      });
      return existing._id;
    } else {
      return ctx.db.insert("cjCertifications", {
        ...payload,
        questionSubmitted: false,
        createdAt: now,
      });
    }
  },
});

/**
 * Mark a draft question as submitted (after Playwright posts it to CJ).
 */
export const markQuestionSubmitted = mutation({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("cjCertifications")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (!record) throw new Error(`No certification record for SKU: ${args.sku}`);
    await ctx.db.patch(record._id, {
      questionSubmitted:   true,
      questionSubmittedAt: Date.now(),
      updatedAt:           Date.now(),
    });
  },
});
