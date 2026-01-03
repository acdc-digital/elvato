import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Record an action in the history
export const recordAction = mutation({
  args: {
    actionType: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("restore")
    ),
    entityType: v.string(),
    entityId: v.string(),
    previousState: v.optional(v.any()),
    newState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const actionId = await ctx.db.insert("actionHistory", {
      ...args,
      timestamp: Date.now(),
    });
    return actionId;
  },
});

// Get recent actions for undo/redo (limit to last 50)
export const getRecentActions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const actions = await ctx.db
      .query("actionHistory")
      .order("desc")
      .take(limit);
    return actions;
  },
});

// Get the last action (for undo)
export const getLastAction = query({
  handler: async (ctx) => {
    const lastAction = await ctx.db
      .query("actionHistory")
      .order("desc")
      .first();
    return lastAction;
  },
});

// Undo the last action
export const undoLastAction = mutation({
  handler: async (ctx) => {
    const lastAction = await ctx.db
      .query("actionHistory")
      .order("desc")
      .first();
    
    if (!lastAction) {
      throw new Error("No action to undo");
    }
    
    // Remove this action from history
    await ctx.db.delete(lastAction._id);
    
    // Restore previous state based on action type
    const entityId = lastAction.entityId as Id<"products">;
    
    switch (lastAction.actionType) {
      case "create":
        // Undo create: delete the entity (hard delete since it was just created)
        await ctx.db.delete(entityId);
        break;
        
      case "update":
        // Undo update: restore previous state
        if (lastAction.previousState) {
          const { _id, _creationTime, ...fields } = lastAction.previousState as any;
          await ctx.db.patch(entityId, fields);
        }
        break;
        
      case "delete":
        // Undo delete: restore product (clear deletedAt)
        if (lastAction.previousState) {
          await ctx.db.patch(entityId, {
            deletedAt: undefined,
            updatedAt: Date.now(),
          });
        }
        break;
        
      case "restore":
        // Undo restore: re-delete the product
        if (lastAction.previousState) {
          const prevState = lastAction.previousState as any;
          await ctx.db.patch(entityId, {
            deletedAt: prevState.deletedAt,
            updatedAt: Date.now(),
          });
        }
        break;
    }
    
    return { 
      undone: true, 
      actionType: lastAction.actionType,
      entityId: lastAction.entityId 
    };
  },
});

// Redo storage - we'll keep deleted actions temporarily for redo
const redoStack: any[] = [];

// Clear action history (optional - for testing/cleanup)
export const clearHistory = mutation({
  handler: async (ctx) => {
    const allActions = await ctx.db.query("actionHistory").collect();
    await Promise.all(
      allActions.map(action => ctx.db.delete(action._id))
    );
    return { cleared: allActions.length };
  },
});
