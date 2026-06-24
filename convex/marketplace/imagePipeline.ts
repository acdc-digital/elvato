import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

const productStatus = v.union(
  v.literal("draft"),
  v.literal("processing"),
  v.literal("enriched"),
  v.literal("needs_review")
);

const imageType = v.union(v.literal("original"), v.literal("discovered"));

const validationStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("duplicate")
);

const discoveryMethod = v.union(
  v.literal("reverse_image"),
  v.literal("search_api"),
  v.literal("manual"),
  v.literal("internal_similarity")
);

function scoreCandidate(args: {
  imageSimilarity?: number;
  titleSimilarity?: number;
  metadataMatchScore?: number;
  domainConfidence?: number;
}) {
  const imageSimilarity = args.imageSimilarity ?? 0;
  const titleSimilarity = args.titleSimilarity ?? 0;
  const metadataMatchScore = args.metadataMatchScore ?? 0;
  const domainConfidence = args.domainConfidence ?? 0;
  return Number((
    imageSimilarity * 0.4 +
    titleSimilarity * 0.3 +
    metadataMatchScore * 0.2 +
    domainConfidence * 0.1
  ).toFixed(4));
}

export const upsertProductFromEtsy = mutation({
  args: {
    etsyListingId: v.string(),
    title: v.string(),
    slug: v.string(),
    status: productStatus,
    etsyState: v.optional(v.string()),
    etsyUrl: v.optional(v.string()),
    sourceImageUrls: v.array(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("marketplaceProducts")
      .withIndex("by_etsyListingId", (index) => index.eq("etsyListingId", args.etsyListingId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        slug: args.slug,
        status: args.status,
        etsyState: args.etsyState,
        etsyUrl: args.etsyUrl,
        sourceImageUrls: args.sourceImageUrls,
        metadata: args.metadata,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("marketplaceProducts", {
      etsyListingId: args.etsyListingId,
      title: args.title,
      slug: args.slug,
      status: args.status,
      etsyState: args.etsyState,
      etsyUrl: args.etsyUrl,
      sourceImageUrls: args.sourceImageUrls,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getProductByEtsyListingId = query({
  args: { etsyListingId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketplaceProducts")
      .withIndex("by_etsyListingId", (index) => index.eq("etsyListingId", args.etsyListingId))
      .first();
  },
});

export const listProducts = query({
  args: {
    status: v.optional(productStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.status) {
      return await ctx.db
        .query("marketplaceProducts")
        .withIndex("by_status", (index) => index.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("marketplaceProducts").order("desc").take(limit);
  },
});

export const upsertProductImage = mutation({
  args: {
    productId: v.id("marketplaceProducts"),
    imageUrl: v.string(),
    type: imageType,
    sourceUrl: v.optional(v.string()),
    sourceDomain: v.optional(v.string()),
    localPath: v.optional(v.string()),
    rank: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    contentType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    validationStatus: validationStatus,
    confidence: v.optional(v.number()),
    provenance: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const images = await ctx.db
      .query("marketplaceProductImages")
      .withIndex("by_product", (index) => index.eq("productId", args.productId))
      .collect();
    const existing = images.find((image) => image.imageUrl === args.imageUrl && image.type === args.type);

    if (existing) {
      await ctx.db.patch(existing._id, {
        sourceUrl: args.sourceUrl,
        sourceDomain: args.sourceDomain,
        localPath: args.localPath,
        rank: args.rank,
        width: args.width,
        height: args.height,
        contentType: args.contentType,
        sizeBytes: args.sizeBytes,
        validationStatus: args.validationStatus,
        confidence: args.confidence,
        provenance: args.provenance,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("marketplaceProductImages", {
      productId: args.productId,
      imageUrl: args.imageUrl,
      type: args.type,
      sourceUrl: args.sourceUrl,
      sourceDomain: args.sourceDomain,
      localPath: args.localPath,
      rank: args.rank,
      width: args.width,
      height: args.height,
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
      validationStatus: args.validationStatus,
      confidence: args.confidence,
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listProductImages = query({
  args: {
    productId: v.id("marketplaceProducts"),
    type: v.optional(imageType),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("marketplaceProductImages")
      .withIndex("by_product", (index) => index.eq("productId", args.productId))
      .collect();
    return args.type ? images.filter((image) => image.type === args.type) : images;
  },
});

export const listImagesNeedingEmbeddings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const images = await ctx.db.query("marketplaceProductImages").collect();
    return images.filter((image) => image.embedding === undefined).slice(0, limit);
  },
});

export const attachImageEmbedding = mutation({
  args: {
    imageId: v.id("marketplaceProductImages"),
    embedding: v.array(v.float64()),
    embeddingModel: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      updatedAt: Date.now(),
    });
    return args.imageId;
  },
});

export const attachImageHash = mutation({
  args: {
    imageId: v.id("marketplaceProductImages"),
    phash: v.string(),
    clusterId: v.optional(v.string()),
    validationStatus: v.optional(validationStatus),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      phash: args.phash,
      clusterId: args.clusterId,
      validationStatus: args.validationStatus,
      updatedAt: Date.now(),
    });
    return args.imageId;
  },
});

export const recordCandidate = mutation({
  args: {
    productId: v.id("marketplaceProducts"),
    sourceUrl: v.string(),
    sourceDomain: v.optional(v.string()),
    imageUrl: v.string(),
    productTitle: v.optional(v.string()),
    description: v.optional(v.string()),
    sku: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    discoveryMethod: discoveryMethod,
    imageSimilarity: v.optional(v.number()),
    titleSimilarity: v.optional(v.number()),
    metadataMatchScore: v.optional(v.number()),
    domainConfidence: v.optional(v.number()),
    score: v.optional(v.number()),
    approved: v.optional(v.boolean()),
    reason: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    embeddingModel: v.optional(v.string()),
    provenance: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const score = args.score ?? scoreCandidate(args);
    const approved = args.approved ?? score >= 0.85;
    const candidates = await ctx.db
      .query("marketplaceProductCandidates")
      .withIndex("by_product", (index) => index.eq("productId", args.productId))
      .collect();
    const existing = candidates.find((candidate) => candidate.imageUrl === args.imageUrl);

    const value = {
      sourceUrl: args.sourceUrl,
      sourceDomain: args.sourceDomain,
      imageUrl: args.imageUrl,
      productTitle: args.productTitle,
      description: args.description,
      sku: args.sku,
      dimensions: args.dimensions,
      discoveryMethod: args.discoveryMethod,
      imageSimilarity: args.imageSimilarity,
      titleSimilarity: args.titleSimilarity,
      metadataMatchScore: args.metadataMatchScore,
      domainConfidence: args.domainConfidence,
      score,
      approved,
      reason: args.reason,
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      provenance: args.provenance,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }

    return await ctx.db.insert("marketplaceProductCandidates", {
      productId: args.productId,
      ...value,
      createdAt: now,
    });
  },
});

export const listCandidates = query({
  args: {
    productId: v.id("marketplaceProducts"),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.approved !== undefined) {
      return await ctx.db
        .query("marketplaceProductCandidates")
        .withIndex("by_product_approved", (index) =>
          index.eq("productId", args.productId).eq("approved", args.approved!)
        )
        .collect();
    }
    return await ctx.db
      .query("marketplaceProductCandidates")
      .withIndex("by_product", (index) => index.eq("productId", args.productId))
      .collect();
  },
});

export const updateProductStatus = mutation({
  args: {
    productId: v.id("marketplaceProducts"),
    status: productStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.productId;
  },
});

export const upsertSourceDomain = mutation({
  args: {
    domain: v.string(),
    confidence: v.number(),
    acceptedCount: v.optional(v.number()),
    rejectedCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("marketplaceSourceDomains")
      .withIndex("by_domain", (index) => index.eq("domain", args.domain))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        confidence: args.confidence,
        acceptedCount: args.acceptedCount ?? existing.acceptedCount,
        rejectedCount: args.rejectedCount ?? existing.rejectedCount,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("marketplaceSourceDomains", {
      domain: args.domain,
      confidence: args.confidence,
      acceptedCount: args.acceptedCount ?? 0,
      rejectedCount: args.rejectedCount ?? 0,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const findSimilarImages = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    productId: v.optional(v.id("marketplaceProducts")),
    validationStatus: v.optional(validationStatus),
  },
  handler: async (ctx, args) => {
    return await ctx.vectorSearch("marketplaceProductImages", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 10,
      filter: (filterBuilder) => {
        let filter = filterBuilder;
        if (args.productId) filter = filter.eq("productId", args.productId);
        if (args.validationStatus) filter = filter.eq("validationStatus", args.validationStatus);
        return filter;
      },
    });
  },
});
