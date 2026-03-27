import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// =============================================================================
// CJ STATUS CODE → USER-FACING MILESTONE MAPPING
// =============================================================================
// CJ codes 0-14:
//   0  → processing
//   1,2,3,4 → shipped
//   5  → in_transit
//   6,7,8   → arrived_in_country
//   9,10,11 → out_for_delivery
//   12 → delivered
//   13 → issue
//   14 → returned

const CJ_STATUS_MAP: Record<number, string> = {
  0: "processing",
  1: "shipped",
  2: "shipped",
  3: "shipped",
  4: "shipped",
  5: "in_transit",
  6: "arrived_in_country",
  7: "arrived_in_country",
  8: "arrived_in_country",
  9: "out_for_delivery",
  10: "out_for_delivery",
  11: "out_for_delivery",
  12: "delivered",
  13: "issue",
  14: "returned",
};

// Status progression order for preventing backward status movement
const STATUS_ORDER: Record<string, number> = {
  order_placed: 0,
  processing: 1,
  shipped: 2,
  in_transit: 3,
  arrived_in_country: 4,
  out_for_delivery: 5,
  delivered: 6,
  // Exception statuses can override at any point
  issue: -1,
  returned: -1,
};

// =============================================================================
// QUERIES
// =============================================================================

export const getByCustomerId = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shippingTracking")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const getByMedusaOrderId = query({
  args: { medusaOrderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shippingTracking")
      .withIndex("by_medusaOrderId", (q) =>
        q.eq("medusaOrderId", args.medusaOrderId)
      )
      .first();
  },
});

export const getByTrackingNumber = query({
  args: { trackingNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shippingTracking")
      .withIndex("by_trackingNumber", (q) =>
        q.eq("trackingNumber", args.trackingNumber)
      )
      .first();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

const shippingAddressValidator = v.object({
  firstName: v.string(),
  lastName: v.string(),
  address1: v.string(),
  address2: v.optional(v.string()),
  city: v.string(),
  postalCode: v.string(),
  countryCode: v.string(),
  phone: v.optional(v.string()),
});

const orderItemValidator = v.object({
  title: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  thumbnail: v.optional(v.string()),
  sku: v.optional(v.string()),
});

/**
 * Create a new shipment record when a Medusa order is placed.
 */
export const createShipment = mutation({
  args: {
    medusaOrderId: v.string(),
    medusaOrderDisplayId: v.number(),
    customerId: v.string(),
    orderItems: v.array(orderItemValidator),
    orderTotal: v.number(),
    currencyCode: v.string(),
    orderDate: v.number(),
    estimatedDeliveryDate: v.optional(v.number()),
    shippingAddress: shippingAddressValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for duplicate — don't create if already exists for this order
    const existing = await ctx.db
      .query("shippingTracking")
      .withIndex("by_medusaOrderId", (q) =>
        q.eq("medusaOrderId", args.medusaOrderId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("shippingTracking", {
      medusaOrderId: args.medusaOrderId,
      medusaOrderDisplayId: args.medusaOrderDisplayId,
      customerId: args.customerId,
      orderItems: args.orderItems,
      orderTotal: args.orderTotal,
      currencyCode: args.currencyCode,
      orderDate: args.orderDate,
      estimatedDeliveryDate: args.estimatedDeliveryDate,
      shippingAddress: args.shippingAddress,
      currentStatus: "order_placed",
      trackingEvents: [
        {
          status: "order_placed",
          description: "Order confirmed and payment received",
          timestamp: args.orderDate,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Link a CJ order ID and tracking number to an existing shipment.
 * Called manually by admin when CJ order is created.
 */
export const linkCjOrder = mutation({
  args: {
    medusaOrderId: v.string(),
    cjOrderId: v.string(),
    trackingNumber: v.optional(v.string()),
    logisticName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db
      .query("shippingTracking")
      .withIndex("by_medusaOrderId", (q) =>
        q.eq("medusaOrderId", args.medusaOrderId)
      )
      .first();

    if (!shipment) {
      throw new Error(
        `No shipment found for Medusa order ${args.medusaOrderId}`
      );
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      cjOrderId: args.cjOrderId,
      updatedAt: now,
    };

    if (args.trackingNumber) {
      updates.trackingNumber = args.trackingNumber;
    }
    if (args.logisticName) {
      updates.logisticName = args.logisticName;
    }

    // Advance to "processing" if still at "order_placed"
    if (shipment.currentStatus === "order_placed") {
      updates.currentStatus = "processing";
      updates.trackingEvents = [
        ...shipment.trackingEvents,
        {
          status: "processing",
          description: "Order received by fulfillment partner",
          timestamp: now,
        },
      ];
    }

    await ctx.db.patch(shipment._id, updates);
    return shipment._id;
  },
});

/**
 * Update tracking status from CJ webhook data.
 * Maps CJ status codes to user-facing milestones.
 * Prevents backward status movement (except for exception statuses).
 */
export const updateTrackingStatus = mutation({
  args: {
    trackingNumber: v.string(),
    cjStatusCode: v.number(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    lastMileCarrier: v.optional(v.string()),
    lastMileTrackingNumber: v.optional(v.string()),
    estimatedDeliveryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db
      .query("shippingTracking")
      .withIndex("by_trackingNumber", (q) =>
        q.eq("trackingNumber", args.trackingNumber)
      )
      .first();

    if (!shipment) {
      // Try to find by CJ order ID field — tracking number might not be set yet
      return null;
    }

    const newStatus = CJ_STATUS_MAP[args.cjStatusCode];
    if (!newStatus) return shipment._id;

    const now = Date.now();
    const eventTimestamp = args.timestamp ?? now;

    // Determine if we should advance status
    const currentOrder = STATUS_ORDER[shipment.currentStatus] ?? 0;
    const newOrder = STATUS_ORDER[newStatus] ?? 0;
    const shouldAdvance = newOrder === -1 || newOrder > currentOrder;

    const updates: Record<string, unknown> = {
      cjStatusCode: args.cjStatusCode,
      updatedAt: now,
    };

    if (shouldAdvance) {
      updates.currentStatus = newStatus;
    }

    if (args.lastMileCarrier) {
      updates.lastMileCarrier = args.lastMileCarrier;
    }
    if (args.lastMileTrackingNumber) {
      updates.lastMileTrackingNumber = args.lastMileTrackingNumber;
    }
    if (args.estimatedDeliveryDate) {
      updates.estimatedDeliveryDate = args.estimatedDeliveryDate;
    }
    if (newStatus === "delivered") {
      updates.actualDeliveryDate = eventTimestamp;
    }

    // Append tracking event
    updates.trackingEvents = [
      ...shipment.trackingEvents,
      {
        status: newStatus,
        description:
          args.description ?? `Status updated to ${newStatus.replace(/_/g, " ")}`,
        location: args.location,
        timestamp: eventTimestamp,
        cjStatusCode: args.cjStatusCode,
      },
    ];

    await ctx.db.patch(shipment._id, updates);
    return shipment._id;
  },
});

/**
 * Batch-update tracking events from CJ logisticsTrackEvents payload.
 */
export const updateTrackingEvents = mutation({
  args: {
    trackingNumber: v.string(),
    events: v.array(
      v.object({
        status: v.string(),
        description: v.string(),
        location: v.optional(v.string()),
        timestamp: v.number(),
        cjStatusCode: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db
      .query("shippingTracking")
      .withIndex("by_trackingNumber", (q) =>
        q.eq("trackingNumber", args.trackingNumber)
      )
      .first();

    if (!shipment) return null;

    // Merge events — deduplicate by timestamp + status
    const existingKeys = new Set(
      shipment.trackingEvents.map(
        (e: { timestamp: number; status: string }) => `${e.timestamp}:${e.status}`
      )
    );

    const newEvents = args.events.filter(
      (e) => !existingKeys.has(`${e.timestamp}:${e.status}`)
    );

    if (newEvents.length === 0) return shipment._id;

    const allEvents = [...shipment.trackingEvents, ...newEvents].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    await ctx.db.patch(shipment._id, {
      trackingEvents: allEvents,
      updatedAt: Date.now(),
    });

    return shipment._id;
  },
});
