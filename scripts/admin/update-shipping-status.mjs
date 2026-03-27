#!/usr/bin/env node

/**
 * Manually push a shipping status update to Convex (for testing / manual ops).
 *
 * Usage:
 *   node scripts/admin/update-shipping-status.mjs \
 *     --medusa-order-id ord_xxx \
 *     --status in_transit \
 *     [--description "Package departed origin facility"]
 *
 * Valid statuses:
 *   order_placed, processing, shipped, in_transit,
 *   out_for_delivery, delivered, exception, returned, cancelled
 */

import { parseArgs } from "node:util";

const VALID_STATUSES = [
  "order_placed",
  "processing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
  "cancelled",
];

const { values } = parseArgs({
  options: {
    "medusa-order-id": { type: "string" },
    status: { type: "string" },
    description: { type: "string" },
  },
});

const medusaOrderId = values["medusa-order-id"];
const status = values["status"];
const description = values["description"];

if (!medusaOrderId || !status) {
  console.error(
    "Usage: node scripts/admin/update-shipping-status.mjs --medusa-order-id <id> --status <status> [--description <text>]"
  );
  console.error(`\nValid statuses: ${VALID_STATUSES.join(", ")}`);
  process.exit(1);
}

if (!VALID_STATUSES.includes(status)) {
  console.error(`Invalid status: "${status}"`);
  console.error(`Valid statuses: ${VALID_STATUSES.join(", ")}`);
  process.exit(1);
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const WEBHOOK_SECRET = process.env.CONVEX_WEBHOOK_SECRET;

if (!CONVEX_URL || !WEBHOOK_SECRET) {
  console.error(
    "Error: CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) and CONVEX_WEBHOOK_SECRET env vars required"
  );
  process.exit(1);
}

const payload = {
  medusaOrderId,
  status,
  ...(description && { description }),
};

console.log(`Updating ${medusaOrderId} → status: ${status}`);
if (description) console.log(`  Description: ${description}`);

const res = await fetch(`${CONVEX_URL}/shipping/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-secret": WEBHOOK_SECRET,
  },
  body: JSON.stringify({ action: "update_tracking_status", payload }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`Failed (${res.status}): ${text}`);
  process.exit(1);
}

const result = await res.json();
console.log("Success:", result);
