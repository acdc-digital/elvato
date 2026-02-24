import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// =============================================================================
// FILE STORAGE UTILITIES
// =============================================================================
// Convex file storage helpers for generating public URLs
// =============================================================================

/**
 * Get a public URL for a stored file by its storage ID.
 * Use this to get URLs for images, documents, etc.
 * 
 * The URL is temporary (valid for a limited time) - suitable for email signatures
 * if refreshed periodically, or for direct display in the app.
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

/**
 * Generate an upload URL for client-side file uploads.
 * Call this before uploading a file from the browser.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get metadata for a stored file.
 */
export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const metadata = await ctx.storage.getMetadata(args.storageId);
    return metadata;
  },
});
