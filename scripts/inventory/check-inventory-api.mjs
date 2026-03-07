/**
 * Quick check: what does the Medusa Store & Admin API return for inventory_quantity?
 */

const BASE = "https://medusa-backend-production-d681.up.railway.app";

async function main() {
  // Admin auth
  const authRes = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@medusa-test.com", password: "supersecret" }),
  });
  const { token } = await authRes.json();
  console.log("✓ Authenticated\n");

  // Get 5 products (offset 100 to skip the 0-variant ones)
  const prodRes = await fetch(
    `${BASE}/admin/products?limit=5&offset=100&fields=id,title,variants.id,variants.title,variants.inventory_quantity,variants.manage_inventory`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const { products } = await prodRes.json();

  for (const p of products) {
    console.log(`📦 ${p.title}`);
    for (const v of p.variants || []) {
      console.log(`   variant: ${v.title} | inventory_quantity: ${v.inventory_quantity} | manage_inventory: ${v.manage_inventory}`);
    }
  }

  // Check an inventory item + its levels directly
  const sampleVariant = products[0]?.variants?.[0];
  if (sampleVariant) {
    console.log(`\n--- Inventory item details for variant ${sampleVariant.id} ---`);
    // Find the inventory item
    const iiRes = await fetch(
      `${BASE}/admin/inventory-items?sku=${encodeURIComponent(sampleVariant.title)}&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const iiData = await iiRes.json();
    console.log(`Inventory items found: ${iiData.inventory_items?.length}`);
    if (iiData.inventory_items?.[0]) {
      const ii = iiData.inventory_items[0];
      console.log(`  id: ${ii.id}, stocked_quantity: ${ii.stocked_quantity}, reserved_quantity: ${ii.reserved_quantity}`);
      console.log(`  location_levels:`, JSON.stringify(ii.location_levels, null, 2));
    }
  }

  // Now check via STORE API (how the storefront actually fetches)
  console.log("\n\n=== STORE API CHECK ===");
  // Get publishable API key
  const keysRes = await fetch(`${BASE}/admin/api-keys?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const keysData = await keysRes.json();
  const pubKey = keysData.api_keys?.find((k) => k.type === "publishable");
  console.log(`Publishable key: ${pubKey?.token || "NOT FOUND"}`);

  if (pubKey) {
    // Fetch a product via Store API the way storefront does
    const handle = products[0]?.handle;
    if (!handle) {
      // Use product ID directly
      const storeRes = await fetch(
        `${BASE}/store/products/${products[0].id}?fields=*variants.calculated_price,+variants.inventory_quantity`,
        {
          headers: {
            "x-publishable-api-key": pubKey.token,
          },
        }
      );
      const storeData = await storeRes.json();
      console.log("\nStore API product:", JSON.stringify(storeData.product?.variants?.map(v => ({
        title: v.title,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
      })), null, 2));
    }
  }

  // Also check: what region / sales channel is configured
  console.log("\n\n=== REGIONS & SALES CHANNELS ===");
  const regRes = await fetch(`${BASE}/admin/regions?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const regData = await regRes.json();
  for (const r of regData.regions || []) {
    console.log(`Region: ${r.name} (${r.id}) | currency: ${r.currency_code}`);
  }

  const scRes = await fetch(`${BASE}/admin/sales-channels?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const scData = await scRes.json();
  for (const sc of scData.sales_channels || []) {
    console.log(`Sales Channel: ${sc.name} (${sc.id})`);
  }

  // Check stock location <-> sales channel link
  const slRes = await fetch(`${BASE}/admin/stock-locations?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const slData = await slRes.json();
  for (const sl of slData.stock_locations || []) {
    console.log(`\nStock Location: ${sl.name} (${sl.id})`);
    console.log(`  sales_channels:`, JSON.stringify(sl.sales_channels, null, 2));
    console.log(`  fulfillment_sets:`, JSON.stringify(sl.fulfillment_sets?.map(f => f.name), null, 2));
  }
}

main().catch(console.error);
