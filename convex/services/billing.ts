import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const DEFAULT_CURRENCY = "USD";

const DEFAULT_CURRENT_BILLING: Array<{
  serviceId: string;
  amountCents: number;
  note?: string;
}> = [
  { serviceId: "admin", amountCents: 0, note: "Vercel free plan" },
  { serviceId: "admin-railway", amountCents: 1288, note: "Railway monthly billing" },
  { serviceId: "admin-medusa-docker", amountCents: 0 },
  { serviceId: "admin-medusa-app", amountCents: 0 },
  { serviceId: "admin-meilisearch", amountCents: 1450, note: "MeiliSearch monthly billing" },
  { serviceId: "admin-convex", amountCents: 0, note: "Convex usage billing" },
  { serviceId: "admin-bunny", amountCents: 331, note: "Bunny.net monthly billing" },
  { serviceId: "storefront", amountCents: 0, note: "Vercel free plan" },
  { serviceId: "storefront-vercel", amountCents: 0, note: "Vercel free plan" },
  { serviceId: "storefront-next", amountCents: 0 },
  { serviceId: "storefront-stripe", amountCents: 0, note: "Payment processing fees separate" },
  { serviceId: "storefront-upstash", amountCents: 2, note: "Upstash usage billing" },
  { serviceId: "storefront-neon", amountCents: 173, note: "Neon monthly billing" },
];

export const list = internalQuery({
  args: {
    serviceIds: v.array(v.string()),
    periods: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = [];

    for (const serviceId of args.serviceIds) {
      for (const period of args.periods) {
        const row = await ctx.db
          .query("serviceBilling")
          .withIndex("by_service_period", (q) =>
            q.eq("serviceId", serviceId).eq("period", period)
          )
          .first();

        if (row) {
          rows.push(row);
        }
      }
    }

    return rows;
  },
});

export const upsert = internalMutation({
  args: {
    serviceId: v.string(),
    period: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("serviceBilling")
      .withIndex("by_service_period", (q) =>
        q.eq("serviceId", args.serviceId).eq("period", args.period)
      )
      .first();

    const next = {
      serviceId: args.serviceId,
      period: args.period,
      amountCents: args.amountCents,
      currency: args.currency ?? DEFAULT_CURRENCY,
      note: args.note,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return { action: "updated", id: existing._id };
    }

    const id = await ctx.db.insert("serviceBilling", {
      ...next,
      createdAt: now,
    });

    return { action: "created", id };
  },
});

export const seedDefaults = internalMutation({
  args: {
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;

    for (const row of DEFAULT_CURRENT_BILLING) {
      const existing = await ctx.db
        .query("serviceBilling")
        .withIndex("by_service_period", (q) =>
          q.eq("serviceId", row.serviceId).eq("period", args.period)
        )
        .first();

      if (existing) {
        continue;
      }

      await ctx.db.insert("serviceBilling", {
        ...row,
        period: args.period,
        currency: DEFAULT_CURRENCY,
        createdAt: now,
        updatedAt: now,
      });
      created += 1;
    }

    return { created };
  },
});