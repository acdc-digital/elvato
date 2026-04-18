#!/usr/bin/env node

/**
 * Seed a realistic mock shipment into the Convex production database.
 * Uses the Convex HTTP API to run the createShipment mutation directly,
 * then updates it through several status progression stages.
 *
 * Usage:
 *   CONVEX_DEPLOY_KEY="prod:superb-dotterel-37|..." node scripts/debug/_tmp_seed_mock_shipment.mjs
 */

const CONVEX_URL = process.env.CONVEX_URL || "https://superb-dotterel-37.convex.cloud";
const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

if (!DEPLOY_KEY) {
  console.error("CONVEX_DEPLOY_KEY env var required. Check .env.local");
  process.exit(1);
}

async function runMutation(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${DEPLOY_KEY}`,
    },
    body: JSON.stringify({
      path: fnPath,
      args,
      format: "json",
    }),
  });
  const data = await res.json();
  if (data.status === "error") {
    throw new Error(`Mutation ${fnPath} failed: ${data.errorMessage}`);
  }
  return data.value;
}

// ── Mock data ──
const now = Date.now();
const orderDate = now - 5 * 24 * 60 * 60 * 1000; // 5 days ago
const estimatedDelivery = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now

const mockShipment = {
  medusaOrderId: "order_mock_demo_001",
  medusaOrderDisplayId: 10042,
  customerId: "cus_mock_demo_001",
  orderTotal: 18999, // $189.99 in cents
  currencyCode: "usd",
  orderDate,
  estimatedDeliveryDate: estimatedDelivery,
  shippingAddress: {
    firstName: "Alex",
    lastName: "Johnson",
    address1: "742 Evergreen Terrace",
    address2: "Apt 3B",
    city: "Springfield",
    postalCode: "62704",
    countryCode: "us",
    phone: "+1 (555) 123-4567",
  },
  orderItems: [
    {
      title: "Modern LED Crystal Chandelier - Gold Finish",
      quantity: 1,
      unitPrice: 12999,
      thumbnail: "https://cf.cjdropshipping.com/newday/20240815/1cb1a6f697e74a60935a58693df34ed0.jpg",
      sku: "LED-CHAN-GOLD-001",
    },
    {
      title: "Minimalist Wall Sconce - Warm White LED",
      quantity: 2,
      unitPrice: 3000,
      thumbnail: "https://cf.cjdropshipping.com/newday/20240815/4fc94d0d6a6748258a57e6d3adc97e10.jpg",
      sku: "LED-SCONCE-WW-002",
    },
  ],
};

// ── Seed ──
async function main() {
  console.log("Creating mock shipment...");
  const id = await runMutation("shipping/tracking:createShipment", mockShipment);
  console.log(`  Created shipment: ${id}`);

  // Link CJ order — this also advances status to "processing"
  console.log("Linking CJ order (→ processing)...");
  await runMutation("shipping/tracking:linkCjOrder", {
    medusaOrderId: "order_mock_demo_001",
    cjOrderId: "CJ2026032600042",
    trackingNumber: "YT2426801234567890",
    logisticName: "YunExpress Sensitive",
  });

  // Use updateTrackingStatus with CJ status codes (requires trackingNumber)
  console.log("Advancing to 'shipped' (CJ code 1)...");
  await runMutation("shipping/tracking:updateTrackingStatus", {
    trackingNumber: "YT2426801234567890",
    cjStatusCode: 1,
    description: "Package handed to carrier — YunExpress Sensitive",
    location: "Shenzhen, CN",
    timestamp: orderDate + 1 * 24 * 60 * 60 * 1000,
  });

  console.log("Advancing to 'in_transit' (CJ code 5)...");
  await runMutation("shipping/tracking:updateTrackingStatus", {
    trackingNumber: "YT2426801234567890",
    cjStatusCode: 5,
    description: "Package departed Shenzhen sorting facility",
    location: "Shenzhen Airport, CN",
    timestamp: orderDate + 2 * 24 * 60 * 60 * 1000,
  });

  // Add detailed tracking events
  console.log("Adding tracking event history...");
  await runMutation("shipping/tracking:updateTrackingEvents", {
    trackingNumber: "YT2426801234567890",
    events: [
      {
        status: "order_placed",
        description: "Order confirmed and payment received",
        timestamp: orderDate,
      },
      {
        status: "processing",
        description: "Order received by CJ warehouse",
        timestamp: orderDate + 6 * 60 * 60 * 1000,
      },
      {
        status: "processing",
        description: "Quality inspection passed",
        timestamp: orderDate + 12 * 60 * 60 * 1000,
      },
      {
        status: "processing",
        description: "Packaging completed",
        timestamp: orderDate + 18 * 60 * 60 * 1000,
      },
      {
        status: "shipped",
        description: "Picked up by YunExpress Sensitive",
        timestamp: orderDate + 1 * 24 * 60 * 60 * 1000,
        location: "Shenzhen, CN",
      },
      {
        status: "shipped",
        description: "Arrived at Shenzhen sorting center",
        timestamp: orderDate + 1.5 * 24 * 60 * 60 * 1000,
        location: "Shenzhen, CN",
      },
      {
        status: "in_transit",
        description: "Departed origin country — in transit to US",
        timestamp: orderDate + 2 * 24 * 60 * 60 * 1000,
        location: "Shenzhen Airport, CN",
      },
      {
        status: "in_transit",
        description: "Arrived at transit hub",
        timestamp: orderDate + 3 * 24 * 60 * 60 * 1000,
        location: "Hong Kong, HK",
      },
      {
        status: "in_transit",
        description: "Departed transit hub — en route to destination",
        timestamp: orderDate + 3.5 * 24 * 60 * 60 * 1000,
        location: "Hong Kong, HK",
      },
      {
        status: "in_transit",
        description: "In transit — international shipment",
        timestamp: orderDate + 4.5 * 24 * 60 * 60 * 1000,
      },
    ],
  });

  console.log("\nMock shipment seeded successfully!");
  console.log("  Order: #10042 (order_mock_demo_001)");
  console.log("  Customer: cus_mock_demo_001");
  console.log("  Status: in_transit");
  console.log("  Tracking: YT2426801234567890 via YunExpress Sensitive");
  console.log("  Items: 3 (1x chandelier + 2x sconces) = $189.99");
  console.log("\nTo view in the storefront, you'll need a customer session");
  console.log("with customerId = 'cus_mock_demo_001'");
  console.log("OR visit /shipping/order_mock_demo_001 directly (auth required).");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
