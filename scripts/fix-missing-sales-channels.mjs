#!/usr/bin/env node

/**
 * Fix: Assign all published products missing a sales channel to the
 * Default Sales Channel so they become visible on the storefront.
 *
 * Root cause: Products synced from Convex in later batches were created
 * without a sales_channels assignment, making them invisible to the
 * Store API (returns 404). The storefront shows "out of stock" because
 * these products can't be fetched.
 *
 * Usage:
 *   node scripts/fix-missing-sales-channels.mjs --dry-run   # preview
 *   node scripts/fix-missing-sales-channels.mjs              # apply fix
 */

import fs from "node:fs";
import path from "node:path";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const SALES_CHANNEL_ID = "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z"; // Default Sales Channel

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 20;

function loadEnv() {
  for (const p of ["admin/.env", "storefront/.env.local", ".env"]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function adminFetch(jwt, endpoint, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(new URL(endpoint, MEDUSA_URL), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        ...options.headers,
      },
    });
    const body = await res.text();
    let json;
    try { json = JSON.parse(body); } catch { json = null; }
    if (!res.ok) {
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        console.log(`      ⏳ ${res.status} — retry ${attempt}/${retries}...`);
        await sleep(attempt * 2000);
        continue;
      }
      throw new Error(`Medusa ${res.status}: ${json?.message || body.slice(0, 200)}`);
    }
    return json;
  }
}

async function main() {
  loadEnv();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Fix Missing Sales Channel Assignments                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Sales Channel:  ${SALES_CHANNEL_ID}`);
  console.log(`  Dry Run:        ${DRY_RUN}`);
  console.log();

  // Auth
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD");

  const authRes = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!authRes.ok) throw new Error(`Auth failed (${authRes.status})`);
  const { token: jwt } = await authRes.json();
  console.log("🔐 Authenticated\n");

  // 1. Fetch ALL products with their sales channel assignments
  console.log("📦 Scanning all products for missing sales channel...\n");
  let allProducts = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await adminFetch(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,status,*sales_channels`
    );
    allProducts.push(...(data.products || []));
    if ((data.products || []).length < limit) break;
    offset += limit;
    process.stdout.write(`  Fetched ${allProducts.length} products...\r`);
    await sleep(200);
  }
  console.log(`  ✓ ${allProducts.length} total products loaded\n`);

  // 2. Find published products missing the sales channel
  const published = allProducts.filter(p => p.status === "published");
  const missingChannel = published.filter(
    p => !(p.sales_channels || []).some(sc => sc.id === SALES_CHANNEL_ID)
  );
  const drafts = allProducts.filter(p => p.status !== "published");

  console.log(`  📊 Published: ${published.length}`);
  console.log(`     Drafts/other: ${drafts.length}`);
  console.log(`     Published WITH channel: ${published.length - missingChannel.length}`);
  console.log(`     Published MISSING channel: ${missingChannel.length}`);
  console.log();

  if (missingChannel.length === 0) {
    console.log("  ✓ All published products have the sales channel. Nothing to fix!");
    return;
  }

  // 3. Also check drafts that are missing the channel (fix them too)
  const draftsMissingChannel = drafts.filter(
    p => !(p.sales_channels || []).some(sc => sc.id === SALES_CHANNEL_ID)
  );
  console.log(`  Also: ${draftsMissingChannel.length} drafts missing channel (will fix these too)\n`);

  const toFix = [...missingChannel, ...draftsMissingChannel];

  // 4. Fix: assign the sales channel to each product
  console.log(`🔧 Assigning sales channel to ${toFix.length} products...\n`);

  let fixed = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
    const batch = toFix.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toFix.length / BATCH_SIZE);

    for (const product of batch) {
      try {
        if (DRY_RUN) {
          fixed++;
          continue;
        }

        // Add product to sales channel (Medusa v2: from sales channel side)
        await adminFetch(
          jwt,
          `/admin/sales-channels/${SALES_CHANNEL_ID}/products`,
          {
            method: "POST",
            body: JSON.stringify({ add: [product.id] }),
          }
        );
        fixed++;
      } catch (err) {
        failed++;
        errors.push({ id: product.id, title: product.title, error: err.message?.slice(0, 150) });
      }
    }

    const progress = Math.round(((i + batch.length) / toFix.length) * 100);
    console.log(`  Batch ${batchNum}/${totalBatches} | Progress: ${progress}% | Fixed: ${fixed} | Failed: ${failed}`);
    
    if (i + BATCH_SIZE < toFix.length) await sleep(300);
  }

  // 5. Verify: spot-check a few
  if (!DRY_RUN && missingChannel.length > 0) {
    console.log("\n🔍 Verifying a sample...");
    const sample = missingChannel.slice(0, 3);
    for (const p of sample) {
      const data = await adminFetch(jwt, `/admin/products/${p.id}?fields=id,title,*sales_channels`);
      const scs = data.product?.sales_channels || [];
      const hasChannel = scs.some(sc => sc.id === SALES_CHANNEL_ID);
      console.log(`  ${data.product.title}: ${hasChannel ? "✓ FIXED" : "❌ STILL MISSING"}`);
    }

    // Also verify via Store API
    console.log("\n🏪 Verifying via Store API...");
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (pk) {
      for (const p of sample) {
        const storeRes = await fetch(
          new URL(`/store/products/${p.id}?fields=id,title`, MEDUSA_URL),
          { headers: { "x-publishable-api-key": pk } }
        );
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          console.log(`  ${storeData.product?.title}: ✓ Visible in Store API`);
        } else {
          console.log(`  ${p.title}: ❌ Still 404 in Store API`);
        }
      }
    }
  }

  // 6. Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  SALES CHANNEL FIX SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Products checked:    ${allProducts.length}`);
  console.log(`  Needed fix:          ${toFix.length}`);
  console.log(`  Fixed:               ${fixed}${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`  Failed:              ${failed}`);
  console.log("═══════════════════════════════════════════════════");

  if (errors.length > 0) {
    console.log(`\n⚠ Errors:`);
    for (const e of errors.slice(0, 20)) console.log(`  - ${e.title}: ${e.error}`);
  }

  // Write report
  const reportPath = path.join("reports", `fix-sales-channels-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: {
      total: allProducts.length,
      published: published.length,
      missingChannel: missingChannel.length,
      draftsMissingChannel: draftsMissingChannel.length,
      fixed,
      failed,
    },
    errors: errors.length > 0 ? errors : undefined,
    fixedProducts: toFix.map(p => ({ id: p.id, title: p.title, status: p.status })),
  }, null, 2));
  console.log(`\n📄 Report: ${reportPath}`);
}

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
