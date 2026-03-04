import { v } from "convex/values";
import { query, mutation, action, internalAction, internalQuery } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { buildDownloadUrl } from "convex-fs";
import { internal } from "./_generated/api";
import { fs } from "./fs";

declare const process: { env: Record<string, string | undefined> };

// =============================================================================
// PRODUCT IMAGE FILE OPERATIONS (ConvexFS)
// =============================================================================
// Path convention:  /products/{productHandle}/images/{rank}.{ext}
// Thumbnail path:   /products/{productHandle}/thumbnail.{ext}
// =============================================================================

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/** List all files under a path prefix (paginated). */
export const listFiles = query({
  args: {
    prefix: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await fs.list(ctx, {
      prefix: args.prefix,
      paginationOpts: args.paginationOpts,
    });
  },
});

/** Get metadata for a single file by path. */
export const getFile = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await fs.stat(ctx, args.path);
  },
});

/** Get a signed CDN download URL for a file path. */
export const getFileUrl = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const file = await fs.stat(ctx, args.path);
    if (!file) return null;
    return buildDownloadUrl(siteUrl, "/fs", file.blobId, args.path);
  },
});

/** Batch-resolve CDN URLs for multiple paths (e.g. all images for a product). */
export const getFileUrls = query({
  args: { paths: v.array(v.string()) },
  handler: async (ctx, args) => {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const results: Record<string, string | null> = {};
    for (const path of args.paths) {
      const file = await fs.stat(ctx, path);
      results[path] = file
        ? buildDownloadUrl(siteUrl, "/fs", file.blobId, path)
        : null;
    }
    return results;
  },
});

/** List all images for a product handle and return their CDN URLs. */
export const getProductImages = query({
  args: { productHandle: v.string() },
  handler: async (ctx, args) => {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const prefix = `/products/${args.productHandle}/`;
    const result = await fs.list(ctx, {
      prefix,
      paginationOpts: { numItems: 50, cursor: null },
    });

    return result.page.map((file) => ({
      path: file.path,
      url: buildDownloadUrl(siteUrl, "/fs", file.blobId, file.path),
      contentType: file.contentType,
      size: file.size,
    }));
  },
});

/** Batch-resolve CDN thumbnail URLs for multiple product handles in one query. */
export const getBatchThumbnails = query({
  args: { handles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    const results: Record<string, string | null> = {};

    for (const handle of args.handles) {
      const prefix = `/products/${handle}/thumbnail.`;
      const result = await fs.list(ctx, {
        prefix,
        paginationOpts: { numItems: 1, cursor: null },
      });
      const thumb = result.page[0];
      results[handle] = thumb
        ? buildDownloadUrl(siteUrl, "/fs", thumb.blobId, thumb.path)
        : null;
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/** Commit an uploaded blob to a filesystem path. */
export const commitFile = mutation({
  args: {
    path: v.string(),
    blobId: v.string(),
  },
  handler: async (ctx, args) => {
    await fs.commitFiles(ctx, [{ path: args.path, blobId: args.blobId }]);
  },
});

/** Commit multiple uploaded blobs at once (e.g. batch image upload). */
export const commitFiles = mutation({
  args: {
    files: v.array(
      v.object({
        path: v.string(),
        blobId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await fs.commitFiles(ctx, args.files);
  },
});

/** Delete a file by path. */
export const deleteFile = mutation({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    await fs.delete(ctx, args.path);
  },
});

/** Move / rename a file. */
export const moveFile = mutation({
  args: { sourcePath: v.string(), destPath: v.string() },
  handler: async (ctx, args) => {
    await fs.move(ctx, args.sourcePath, args.destPath);
  },
});

// ---------------------------------------------------------------------------
// ACTIONS (server-side blob I/O — for ingesting images from external URLs)
// ---------------------------------------------------------------------------

/**
 * Ingest a single image from an external URL into ConvexFS.
 * Used to pull a CJ product image into the CDN.
 */
export const ingestImage = action({
  args: {
    sourceUrl: v.string(),
    destPath: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(args.sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from ${args.sourceUrl}: ${response.status}`
      );
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const data = await response.arrayBuffer();

    await fs.writeFile(ctx, args.destPath, data, contentType);

    return { path: args.destPath, size: data.byteLength, contentType };
  },
});

/**
 * Ingest all images for a Medusa product from their CJ source URLs.
 * Pulls the thumbnail + all medusaImages rows and writes them to ConvexFS.
 */
export const ingestProductImages = action({
  args: {
    productHandle: v.string(),
    thumbnail: v.optional(v.string()),
    images: v.array(
      v.object({
        url: v.string(),
        rank: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      path: string;
      size: number;
      contentType: string;
    }> = [];

    // Helper to determine file extension from content-type
    const extFromType = (ct: string) => {
      if (ct.includes("png")) return "png";
      if (ct.includes("webp")) return "webp";
      if (ct.includes("gif")) return "gif";
      return "jpg";
    };

    // Ingest thumbnail
    if (args.thumbnail) {
      try {
        const res = await fetch(args.thumbnail);
        if (res.ok) {
          const ct = res.headers.get("content-type") || "image/jpeg";
          const data = await res.arrayBuffer();
          const ext = extFromType(ct);
          const path = `/products/${args.productHandle}/thumbnail.${ext}`;
          await fs.writeFile(ctx, path, data, ct);
          results.push({ path, size: data.byteLength, contentType: ct });
        }
      } catch {
        // Skip failed thumbnail — non-fatal
      }
    }

    // Ingest gallery images
    for (const img of args.images) {
      try {
        const res = await fetch(img.url);
        if (!res.ok) continue;
        const ct = res.headers.get("content-type") || "image/jpeg";
        const data = await res.arrayBuffer();
        const ext = extFromType(ct);
        const path = `/products/${args.productHandle}/images/${img.rank}.${ext}`;
        await fs.writeFile(ctx, path, data, ct);
        results.push({ path, size: data.byteLength, contentType: ct });
      } catch {
        // Skip individual failed images — continue with the rest
      }
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// BATCH INGESTION — pull all medusaProduct images into ConvexFS/Bunny CDN
// ---------------------------------------------------------------------------

/**
 * Ingest images for a single product by its medusaProducts ID.
 * Reads the product + its medusaImages rows from the DB, then downloads
 * each image and writes it to Bunny.net via ConvexFS.
 */
export const ingestProductById = internalAction({
  args: { productId: v.string() },
  handler: async (ctx, args): Promise<{
    status: string;
    reason?: string;
    handle?: string;
    ingested?: number;
    errors?: number;
    totalBytes?: number;
  }> => {
    // Read product
    const product: {
      handle: string;
      thumbnail?: string;
      images: Array<{ url: string; rank: number }>;
    } | null = await ctx.runQuery(
      internal.files.getProductForIngestion,
      { productId: args.productId }
    );
    if (!product) {
      return { status: "skipped", reason: "product not found" };
    }

    const extFromType = (ct: string) => {
      if (ct.includes("png")) return "png";
      if (ct.includes("webp")) return "webp";
      if (ct.includes("gif")) return "gif";
      return "jpg";
    };

    const ingested: Array<{ path: string; size: number }> = [];
    let errors = 0;

    // Ingest thumbnail
    if (product.thumbnail) {
      try {
        const res = await fetch(product.thumbnail);
        if (res.ok) {
          const ct = res.headers.get("content-type") || "image/jpeg";
          const data = await res.arrayBuffer();
          const ext = extFromType(ct);
          const path = `/products/${product.handle}/thumbnail.${ext}`;
          await fs.writeFile(ctx, path, data, ct);
          ingested.push({ path, size: data.byteLength });
        }
      } catch {
        errors++;
      }
    }

    // Ingest gallery images
    for (const img of product.images) {
      try {
        const res = await fetch(img.url);
        if (!res.ok) { errors++; continue; }
        const ct = res.headers.get("content-type") || "image/jpeg";
        const data = await res.arrayBuffer();
        const ext = extFromType(ct);
        const path = `/products/${product.handle}/images/${img.rank}.${ext}`;
        await fs.writeFile(ctx, path, data, ct);
        ingested.push({ path, size: data.byteLength });
      } catch {
        errors++;
      }
    }

    return {
      status: "done",
      handle: product.handle,
      ingested: ingested.length,
      errors,
      totalBytes: ingested.reduce((s, i) => s + i.size, 0),
    };
  },
});

/** Internal query: read product + images for ingestion. */
export const getProductForIngestion = internalQuery({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId as any);
    if (!product) return null;

    const images = await ctx.db
      .query("medusaImages")
      .withIndex("by_medusaProductId", (q) =>
        q.eq("medusaProductId", args.productId as any)
      )
      .collect();

    return {
      handle: (product as any).handle as string,
      thumbnail: (product as any).thumbnail as string | undefined,
      images: images.map((i) => ({ url: i.url, rank: i.rank })),
    };
  },
});

/**
 * Kick off ingestion for published Medusa products only.
 * Queries the Medusa Store API to get the list of published product handles,
 * then matches each against Convex medusaProducts to get gallery images.
 */
export const ingestPublishedProductImages = action({
  args: {},
  handler: async (ctx): Promise<{
    scheduled: number;
    skipped: string[];
    products: string[];
  }> => {
    const medusaUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
    const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY;

    // Fetch ALL published products from Medusa Store API (paginated)
    const publishedHandles: Array<{ handle: string; thumbnail: string | null }> = [];
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const res = await fetch(
        `${medusaUrl}/store/products?limit=${pageSize}&offset=${offset}&fields=handle,thumbnail`,
        {
          headers: publishableKey
            ? { "x-publishable-api-key": publishableKey }
            : {},
        }
      );
      if (!res.ok) {
        throw new Error(`Medusa API error: ${res.status} ${res.statusText}`);
      }
      const data: {
        products: Array<{ handle: string; thumbnail: string | null }>;
        count: number;
      } = await res.json();

      publishedHandles.push(...data.products);

      if (publishedHandles.length >= data.count || data.products.length < pageSize) {
        break;
      }
      offset += pageSize;
    }

    // Match each published handle to its Convex record
    const allConvex: Array<{ id: string; handle: string }> =
      await ctx.runQuery(internal.files.getAllProductIds);
    const convexByHandle = new Map(allConvex.map((p) => [p.handle, p.id]));

    const scheduled: string[] = [];
    const skipped: string[] = [];

    for (const pub of publishedHandles) {
      const convexId = convexByHandle.get(pub.handle);
      if (!convexId) {
        skipped.push(pub.handle);
        continue;
      }
      await ctx.scheduler.runAfter(0, internal.files.ingestProductById, {
        productId: convexId,
      });
      scheduled.push(pub.handle);
    }

    return {
      scheduled: scheduled.length,
      skipped,
      products: scheduled,
    };
  },
});

/** Internal query: get all synced medusaProduct IDs and handles. */
export const getAllProductIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("medusaProducts")
      .withIndex("by_syncStatus", (q) => q.eq("syncStatus", "synced"))
      .collect();
    return products.map((p) => ({ id: p._id, handle: p.handle }));
  },
});
