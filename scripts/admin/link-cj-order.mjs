#!/usr/bin/env node

/**
 * Link a CJ order to a Medusa order in the shipping tracking system.
 *
 * Usage:
 *   node scripts/admin/link-cj-order.mjs \
 *     --medusa-order-id ord_xxx \
 *     --cj-order-id 12345 \
 *     --tracking-number CJ1234567 \
 *     [--logistic-name "CJ Packet"]
 */

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "medusa-order-id": { type: "string" },
    "cj-order-id": { type: "string" },
    "tracking-number": { type: "string" },
    "logistic-name": { type: "string" },
  },
});

const medusaOrderId = values["medusa-order-id"];
const cjOrderId = values["cj-order-id"];
const trackingNumber = values["tracking-number"];
const logisticName = values["logistic-name"];

if (!medusaOrderId || !cjOrderId) {
  console.error(
    "Usage: node scripts/admin/link-cj-order.mjs --medusa-order-id <id> --cj-order-id <id> [--tracking-number <num>] [--logistic-name <name>]"
  );
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
  cjOrderId,
  ...(trackingNumber && { trackingNumber }),
  ...(logisticName && { logisticName }),
};

console.log(`Linking CJ order ${cjOrderId} → Medusa order ${medusaOrderId}...`);
if (trackingNumber) console.log(`  Tracking: ${trackingNumber}`);
if (logisticName) console.log(`  Carrier: ${logisticName}`);

const res = await fetch(`${CONVEX_URL}/shipping/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-secret": WEBHOOK_SECRET,
  },
  body: JSON.stringify({ action: "link_cj_order", payload }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`Failed (${res.status}): ${text}`);
  process.exit(1);
}

const result = await res.json();
console.log("Success:", result);
