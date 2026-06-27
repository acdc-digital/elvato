import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const blogSectionValidator = v.object({
  heading: v.string(),
  body: v.array(v.string()),
});

const blogPostArgs = {
  slug: v.string(),
  category: v.string(),
  title: v.string(),
  excerpt: v.string(),
  image: v.string(),
  alt: v.string(),
  readTime: v.string(),
  publishedAt: v.string(),
  dek: v.string(),
  sections: v.array(blogSectionValidator),
  relatedHref: v.string(),
  relatedLabel: v.string(),
  status: v.optional(
    v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
  ),
};

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
  },
});

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const upsert = mutation({
  args: blogPostArgs,
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    const post = {
      ...args,
      status: args.status ?? "published",
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, post);
      return { id: existing._id, action: "updated" };
    }

    const id = await ctx.db.insert("blogPosts", {
      ...post,
      createdAt: now,
    });

    return { id, action: "created" };
  },
});

export const batchUpsert = mutation({
  args: {
    posts: v.array(v.object(blogPostArgs)),
  },
  handler: async (ctx, { posts }) => {
    const results = [];

    for (const args of posts) {
      const now = Date.now();
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique();

      const post = {
        ...args,
        status: args.status ?? "published",
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, post);
        results.push({ slug: args.slug, id: existing._id, action: "updated" });
      } else {
        const id = await ctx.db.insert("blogPosts", {
          ...post,
          createdAt: now,
        });
        results.push({ slug: args.slug, id, action: "created" });
      }
    }

    return results;
  },
});