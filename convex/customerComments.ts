import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// listByProduct — public read for the storefront
// Returns published comments for a product (newest first).
// ---------------------------------------------------------------------------
export const listByProduct = query({
  args: {
    medusaProductId: v.string(),
  },
  handler: async (ctx, { medusaProductId }) => {
    const rows = await ctx.db
      .query("customerComments")
      .withIndex("by_product_status", (q) =>
        q.eq("medusaProductId", medusaProductId).eq("status", "published")
      )
      .order("desc")
      .collect();

    // Strip private fields (email, customerId) before returning to the client.
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      authorName: r.authorName,
      body: r.body,
      parentId: r.parentId,
      isStaff: r.isStaff,
      createdAt: r.createdAt,
    }));
  },
});

// ---------------------------------------------------------------------------
// post — public write from the storefront comment box
// Basic length / shape validation; defaults status to "published" so
// questions appear immediately. Swap to "pending" if moderation is added.
// ---------------------------------------------------------------------------
export const post = mutation({
  args: {
    medusaProductId: v.string(),
    medusaProductHandle: v.string(),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    body: v.string(),
    parentId: v.optional(v.id("customerComments")),
    customerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.authorName.trim().slice(0, 80);
    const body = args.body.trim().slice(0, 2000);
    if (name.length < 2) throw new Error("Name must be at least 2 characters.");
    if (body.length < 4) throw new Error("Comment must be at least 4 characters.");

    const now = Date.now();
    const id = await ctx.db.insert("customerComments", {
      medusaProductId: args.medusaProductId,
      medusaProductHandle: args.medusaProductHandle,
      authorName: name,
      authorEmail: args.authorEmail?.trim() || undefined,
      customerId: args.customerId,
      body,
      parentId: args.parentId,
      status: "published",
      isStaff: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});
