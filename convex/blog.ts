import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const blogSectionValidator = v.object({
  heading: v.string(),
  body: v.array(v.string()),
});

const blogLinkValidator = v.object({
  label: v.string(),
  href: v.string(),
  reason: v.optional(v.string()),
});

const blogImageValidator = v.object({
  src: v.string(),
  serpapiSearchQuery: v.optional(v.string()),
  alt: v.string(),
  caption: v.optional(v.string()),
  placement: v.optional(v.string()),
});

const blogCtaValidator = v.object({
  label: v.string(),
  href: v.string(),
  copy: v.string(),
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
  editorial: v.optional(
    v.object({
      date: v.string(),
      topic: v.string(),
      objective: v.string(),
      primaryKeyword: v.string(),
      secondaryKeywords: v.array(v.string()),
      searchIntent: v.string(),
      targetAudience: v.string(),
      funnelStage: v.string(),
      articleType: v.string(),
      estimatedReadingTime: v.string(),
      confidenceScore: v.string(),
    })
  ),
  seo: v.optional(
    v.object({
      metaTitle: v.string(),
      metaDescription: v.string(),
      ogTitle: v.string(),
      ogDescription: v.string(),
      canonicalPath: v.string(),
    })
  ),
  hero: v.optional(
    v.object({
      headline: v.string(),
      subtitle: v.string(),
      featuredImagePrompt: v.optional(v.string()),
    })
  ),
  images: v.optional(v.array(blogImageValidator)),
  internalLinks: v.optional(v.array(blogLinkValidator)),
  productPlacements: v.optional(
    v.array(
      v.object({
        title: v.string(),
        href: v.string(),
        context: v.string(),
      })
    )
  ),
  ctas: v.optional(
    v.object({
      newsletter: v.optional(blogCtaValidator),
      shopping: v.optional(blogCtaValidator),
      consultation: v.optional(blogCtaValidator),
    })
  ),
  faq: v.optional(
    v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      })
    )
  ),
  editorialNotes: v.optional(
    v.object({
      whyChosenToday: v.string(),
      expectedSeoValue: v.string(),
      futureFollowUps: v.array(v.string()),
    })
  ),
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