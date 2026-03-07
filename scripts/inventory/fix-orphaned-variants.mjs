#!/usr/bin/env node

/**
 * Fix 45 products whose variants have manage_inventory=true but no
 * inventory items attached → Store API returns null qty → storefront
 * shows out-of-stock. Sets manage_inventory=false (correct for dropshipping).
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

async function main() {
  // Auth
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
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

  // Load the OOS products from the post-fix scan
  const report = JSON.parse(
    fs.readFileSync("reports/post-fix-scan.json", "utf-8")
  );
  const oosProducts = report.productsOos || [];

  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Products to fix: ${oosProducts.length}\n`);

  let totalFixed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const results = [];

  for (const p of oosProducts) {
    // Fetch variants (paginate in batches of 20 to avoid timeouts on large products)
    let allVariants = [];
    let offset = 0;
    const PAGE = 20;
    try {
      while (true) {
        const vRes = await fetch(
          `${MEDUSA_URL}/admin/products/${p.id}/variants?fields=id,title,manage_inventory&limit=${PAGE}&offset=${offset}`,
          { headers, signal: AbortSignal.timeout(30000) }
        );
        if (!vRes.ok) {
          console.log(`❌ "${p.title}" — failed to fetch variants (${vRes.status})`);
          totalFailed++;
          results.push({ id: p.id, title: p.title, status: "fetch_error" });
          break;
        }
        const { variants: page, count } = await vRes.json();
        allVariants = allVariants.concat(page || []);
        if (allVariants.length >= (count || 0) || (page || []).length < PAGE) break;
        offset += PAGE;
      }
    } catch (err) {
      console.log(`❌ "${p.title}" — timeout/error: ${err.message}`);
      totalFailed++;
      results.push({ id: p.id, title: p.title, status: "timeout" });
      continue;
    }
    if (allVariants.length === 0 && results[results.length - 1]?.status === "fetch_error") continue;
    const variants = allVariants;
    let fixed = 0;

    for (const v of variants) {
      if (!v.manage_inventory) {
        totalSkipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `  [DRY] Would set manage_inventory=false on "${v.title}" (${v.id})`
        );
        fixed++;
        continue;
      }

      const uRes = await fetch(
        `${MEDUSA_URL}/admin/products/${p.id}/variants/${v.id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ manage_inventory: false }),
          signal: AbortSignal.timeout(30000),
        }
      );
      if (uRes.ok) {
        fixed++;
      } else {
        console.log(
          `  ❌ Failed to update "${v.title}" (${v.id}): ${uRes.status}`
        );
        totalFailed++;
      }
    }

    totalFixed += fixed;
    const icon = fixed > 0 ? "✅" : "⏭️";
    console.log(
      `${icon} "${p.title}" — ${fixed}/${variants.length} variants updated`
    );
    results.push({
      id: p.id,
      title: p.title,
      variantCount: variants.length,
      fixed,
    });
  }

  console.log(`\n════════════════════════════════════`);
  console.log(`Fixed: ${totalFixed} variants`);
  console.log(`Skipped (already manage_inventory=false): ${totalSkipped}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`════════════════════════════════════`);

  // Save report
  const reportOut = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? "dry" : "live",
    summary: { totalFixed, totalSkipped, totalFailed },
    results,
  };
  const filename = `reports/fix-orphaned-variants-${
    DRY_RUN ? "dry" : "live"
  }.json`;
  fs.writeFileSync(filename, JSON.stringify(reportOut, null, 2));
  console.log(`\nReport saved to ${filename}`);
}

main().catch(console.error);
