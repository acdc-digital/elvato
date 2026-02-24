import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// Get the copilot usage data
export const getUsageData = query({
  args: {},
  handler: async (ctx) => {
    const data = await ctx.db.query("copilotUsage").first();
    return data;
  },
});

// Save or update copilot usage data
export const saveUsageData = mutation({
  args: {
    usageInputs: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("copilotUsage").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        usageInputs: args.usageInputs,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("copilotUsage", {
        usageInputs: args.usageInputs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});
