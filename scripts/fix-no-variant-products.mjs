#!/usr/bin/env node

/**
 * Fix 37 products that have 0 variants in Medusa.
 * 
 * For each product:
 * 1. Checks if it still has 0 variants
 * 2. Reads its product options (if any)  
 * 3. Creates a default variant with manage_inventory=false and placeholder prices
 * 
 * These products were created during Convex→Medusa sync but variant creation failed.
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const DRY_RUN = process.argv.includes("--dry-run");

// Load env
for (const p of ["admin/.env", "storefront/.env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq).trim()])
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(30000),
  });
  return res;
}

async function main() {
  // Auth
  const authRes = await apiFetch("/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token: jwt } = await authRes.json();
  const headers = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  // Load no-variant product list
  const report = JSON.parse(
    fs.readFileSync("reports/post-fix-scan.json", "utf-8")
  );
  const noVarProducts = report.productsNoVariants || [];

  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Products with 0 variants: ${noVarProducts.length}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const results = [];

  for (const p of noVarProducts) {
    // First check current state: variants + options
    const prodRes = await apiFetch(
      `/admin/products/${p.id}?fields=id,title,status,*options,*variants`,
      { headers }
    );
    if (!prodRes.ok) {
      console.log(`❌ "${p.title}" — failed to fetch product (${prodRes.status})`);
      failed++;
      results.push({ id: p.id, title: p.title, status: "fetch_error" });
      continue;
    }
    const { product } = await prodRes.json();

    // Skip if already has variants
    if (product.variants && product.variants.length > 0) {
      console.log(`⏭️  "${p.title}" — already has ${product.variants.length} variants`);
      skipped++;
      results.push({ id: p.id, title: p.title, status: "already_has_variants" });
      continue;
    }

    // Build option values for the variant (match product options)
    const options = product.options || [];
    const variantOptions = {};
    for (const opt of options) {
      // Use the first defined value, or "Default"
      const firstValue = opt.values?.[0]?.value || "Default";
      variantOptions[opt.title] = firstValue;
    }

    // If no options exist on the product, we need to create a "Default" option first
    if (options.length === 0) {
      if (!DRY_RUN) {
        const optRes = await apiFetch(`/admin/products/${p.id}/options`, {
          method: "POST",
          headers,
          body: JSON.stringify({ title: "Default", values: ["Default"] }),
        });
        if (!optRes.ok) {
          const errText = await optRes.text();
          console.log(`❌ "${p.title}" — failed to create option: ${optRes.status} ${errText.slice(0, 150)}`);
          failed++;
          results.push({ id: p.id, title: p.title, status: "option_error", error: optRes.status });
          continue;
        }
      }
      variantOptions["Default"] = "Default";
    }

    if (DRY_RUN) {
      console.log(`[DRY] Would create default variant for "${p.title}" (options: ${JSON.stringify(variantOptions)})`);
      created++;
      results.push({ id: p.id, title: p.title, status: "would_create", options: variantOptions });
      continue;
    }

    // Create a default variant
    const variantPayload = {
      title: "Default",
      manage_inventory: false,
      allow_backorder: true,
      options: variantOptions,
      prices: [
        { amount: 0, currency_code: "eur" },
        { amount: 0, currency_code: "usd" },
      ],
    };

    const cRes = await apiFetch(`/admin/products/${p.id}/variants`, {
      method: "POST",
      headers,
      body: JSON.stringify(variantPayload),
    });

    if (cRes.ok) {
      const { product_variant } = await cRes.json();
      console.log(`✅ "${p.title}" — variant created (${product_variant?.id || "ok"})`);
      created++;
      results.push({ id: p.id, title: p.title, status: "created", variantId: product_variant?.id });
    } else {
      const errText = await cRes.text();
      console.log(`❌ "${p.title}" — ${cRes.status}: ${errText.slice(0, 200)}`);
      failed++;
      results.push({ id: p.id, title: p.title, status: "failed", error: cRes.status, detail: errText.slice(0, 200) });
    }
  }

  console.log(`\n════════════════════════════════════`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`════════════════════════════════════`);

  const filename = `reports/fix-no-variant-products-${DRY_RUN ? "dry" : "live"}.json`;
  fs.writeFileSync(
    filename,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: DRY_RUN ? "dry" : "live",
        summary: { created, skipped, failed },
        results,
      },
      null,
      2
    )
  );
  console.log(`Report saved to ${filename}`);
}

main().catch(console.error);
