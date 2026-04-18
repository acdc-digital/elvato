#!/usr/bin/env node
/**
 * Expand "Modern Gold Wall Sconce" (Medusa product prod_01KJK5WG6WWRHXSQX9VF2M0KMD)
 * from a single "Default" variant into the full 4-variant matrix that CJ exposes
 * for SKU CJJT1386169.
 *
 * Option model (buyer-facing):
 *   - Size:        "Large (590mm)" | "Small (390mm)"   ← was sold as "A" / "B" on CJ
 *   - Light Color: "Warm White"   | "3-Color"
 *
 * Variants (4):
 *   Large + Warm    → CJJT138616901AZ  (CJ cost $27.88) ← REUSES current variant
 *   Large + 3-Color → CJJT138616902BY  (CJ cost $29.27)
 *   Small + Warm    → CJJT138616903CX  (CJ cost $27.88)
 *   Small + 3-Color → CJJT138616904DW  (CJ cost $28.58)
 *
 * Pricing strategy: preserve the *current* effective markup. The existing variant
 * is priced at $117.77 against a base CJ cost of $27.88 → ratio 4.2241×. We apply
 * that same multiplier to each variant's CJ cost so:
 *   - A + Warm stays at $117.77 (no customer-visible price change for current SKU)
 *   - Other variants are scaled proportionally
 *
 * Usage:
 *   node scripts/catalog/expand-variants-CJJT1386169.mjs           # dry-run (default)
 *   node scripts/catalog/expand-variants-CJJT1386169.mjs --live    # apply
 *
 * Env (auto-loaded from admin/.env):
 *   MEDUSA_BACKEND_URL (defaults to Railway prod), MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";

// ─── env ───────────────────────────────────────────────────────────────────────
for (const p of ["admin/.env", "storefront/.env.local", ".env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
  }
}

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ||
  "https://medusa-backend-production-d681.up.railway.app";
const LIVE = process.argv.includes("--live");
const PRODUCT_ID = "prod_01KJK5WG6WWRHXSQX9VF2M0KMD";
const CJ_PRODUCT_SKU = "CJJT1386169";

// ─── target matrix ─────────────────────────────────────────────────────────────
const SIZE_LARGE = "Large (590mm)";
const SIZE_SMALL = "Small (390mm)";
const LIGHT_WARM = "Warm White";
const LIGHT_3C = "3-Color";

/** CJ cost in cents → markup-adjusted retail in cents using the current ratio. */
function priceCentsFromCjCostUsd(cjCostUsd, ratio) {
  return Math.round(cjCostUsd * 100 * ratio);
}

// CJ-supplied product images, paired by Size (A → Large, B → Small).
const IMG_LARGE =
  "https://cf.cjdropshipping.com/91d49997-89bd-401b-a792-17c5ed54922b.jpg";
const IMG_SMALL =
  "https://cf.cjdropshipping.com/f138f3d3-bb30-4bcb-a59e-c60796f7977b.jpg";

const TARGET_VARIANTS = [
  {
    sku: "CJJT138616901AZ",
    size: SIZE_LARGE,
    light: LIGHT_WARM,
    cjCostUsd: 27.88,
    title: `${SIZE_LARGE} / ${LIGHT_WARM}`,
    weightGrams: 2020,
    dimensionsMm: { length: 590, width: 240, height: 180 },
    image: IMG_LARGE,
  },
  {
    sku: "CJJT138616902BY",
    size: SIZE_LARGE,
    light: LIGHT_3C,
    cjCostUsd: 29.27,
    title: `${SIZE_LARGE} / ${LIGHT_3C}`,
    weightGrams: 2020,
    dimensionsMm: { length: 590, width: 240, height: 180 },
    image: IMG_LARGE,
  },
  {
    sku: "CJJT138616903CX",
    size: SIZE_SMALL,
    light: LIGHT_WARM,
    cjCostUsd: 27.88,
    title: `${SIZE_SMALL} / ${LIGHT_WARM}`,
    weightGrams: 2020,
    dimensionsMm: { length: 390, width: 240, height: 180 },
    image: IMG_SMALL,
  },
  {
    sku: "CJJT138616904DW",
    size: SIZE_SMALL,
    light: LIGHT_3C,
    cjCostUsd: 28.58,
    title: `${SIZE_SMALL} / ${LIGHT_3C}`,
    weightGrams: 2020,
    dimensionsMm: { length: 390, width: 240, height: 180 },
    image: IMG_SMALL,
  },
];

// ─── helpers ───────────────────────────────────────────────────────────────────
async function api(jwt, endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${init.method || "GET"} ${endpoint} → ${res.status}: ${detail.slice(0, 400)}`);
  }
  return body;
}

async function login() {
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Admin login failed (${res.status})`);
  const { token } = await res.json();
  return token;
}

// ─── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const mode = LIVE ? "LIVE" : "DRY-RUN";
  console.log(`\n══ Expand variants for ${PRODUCT_ID} (${CJ_PRODUCT_SKU}) ── ${mode} ══\n`);

  const jwt = await login();

  // 1. Fetch current product state
  const { product } = await api(
    jwt,
    `/admin/products/${PRODUCT_ID}?fields=id,title,handle,*options,*options.values,*variants,*variants.options,*variants.prices`,
  );

  console.log(`Product: ${product.title}`);
  console.log(`Current options: ${product.options.map((o) => o.title).join(", ")}`);
  console.log(`Current variants: ${product.variants.length}`);
  for (const v of product.variants) {
    const usd = (v.prices || []).find((p) => p.currency_code === "usd");
    console.log(`  - ${v.sku} "${v.title}" $${(usd?.amount ?? 0) / 100}`);
  }

  // 2. Compute markup ratio from the current variant
  const currentVariant = product.variants[0];
  if (!currentVariant) throw new Error("Product has no existing variant — aborting (unexpected state).");
  const currentUsd = (currentVariant.prices || []).find((p) => p.currency_code === "usd");
  if (!currentUsd) throw new Error("Existing variant has no USD price — aborting.");
  const baseCjCostUsd = 27.88; // CJJT138616901AZ → matches the existing default
  const ratio = currentUsd.amount / 100 / baseCjCostUsd;
  console.log(`\nMarkup ratio derived from current variant: ${ratio.toFixed(4)}× (CJ cost $${baseCjCostUsd} → $${(currentUsd.amount / 100).toFixed(2)})`);

  // 3. Build the plan
  const plan = {
    optionUpdates: [],
    optionCreates: [],
    variantUpdates: [],
    variantCreates: [],
  };

  // 3a. Repurpose the existing "Default" option as "Size"
  const defaultOpt = product.options.find((o) => o.title === "Default");
  const sizeOpt = product.options.find((o) => o.title === "Size");
  const lightOpt = product.options.find((o) => o.title === "Light Color");

  if (sizeOpt) {
    plan.optionUpdates.push({
      id: sizeOpt.id,
      title: "Size",
      values: [SIZE_LARGE, SIZE_SMALL],
    });
  } else if (defaultOpt) {
    plan.optionUpdates.push({
      id: defaultOpt.id,
      title: "Size",
      values: [SIZE_LARGE, SIZE_SMALL],
      _note: "Repurposing existing 'Default' option → 'Size'",
    });
  } else {
    plan.optionCreates.push({ title: "Size", values: [SIZE_LARGE, SIZE_SMALL] });
  }

  if (lightOpt) {
    plan.optionUpdates.push({
      id: lightOpt.id,
      title: "Light Color",
      values: [LIGHT_WARM, LIGHT_3C],
    });
  } else {
    plan.optionCreates.push({ title: "Light Color", values: [LIGHT_WARM, LIGHT_3C] });
  }

  // 3b. Variant plan — reuse existing variant for SKU 01AZ to preserve id (cart, links, history)
  const reuseTarget = TARGET_VARIANTS[0]; // 01AZ / Large + Warm
  plan.variantUpdates.push({
    id: currentVariant.id,
    sku: reuseTarget.sku,
    title: reuseTarget.title,
    options: { Size: reuseTarget.size, "Light Color": reuseTarget.light },
    keepPriceCents: currentUsd.amount,
    metadata: { image: reuseTarget.image },
    _note: "Reuse existing 'Default' variant — no price change, just rename + set options + new SKU",
  });

  for (let i = 1; i < TARGET_VARIANTS.length; i++) {
    const t = TARGET_VARIANTS[i];
    plan.variantCreates.push({
      sku: t.sku,
      title: t.title,
      options: { Size: t.size, "Light Color": t.light },
      priceCents: priceCentsFromCjCostUsd(t.cjCostUsd, ratio),
      cjCostUsd: t.cjCostUsd,
      weightGrams: t.weightGrams,
      dimensionsMm: t.dimensionsMm,
      metadata: { image: t.image },
    });
  }

  // 3c. Print plan
  console.log(`\n── PLAN ──`);
  console.log(JSON.stringify(plan, null, 2));

  // 4. Save report
  const reportDir = path.join(process.cwd(), "reports", "sync");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(
    reportDir,
    `expand-variants-${CJ_PRODUCT_SKU}-${LIVE ? "live" : "dry"}.json`,
  );
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode,
        productId: PRODUCT_ID,
        cjProductSku: CJ_PRODUCT_SKU,
        markupRatio: ratio,
        currentState: {
          options: product.options.map((o) => ({ id: o.id, title: o.title, values: o.values })),
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            title: v.title,
            prices: v.prices,
            options: v.options,
          })),
        },
        plan,
      },
      null,
      2,
    ),
  );
  console.log(`\nReport: ${reportPath}`);

  if (!LIVE) {
    console.log(`\nDry-run complete. Re-run with --live to apply.`);
    return;
  }

  // 5. APPLY (only in --live mode)
  console.log(`\n── APPLYING ──`);

  // 5a. Option updates
  for (const u of plan.optionUpdates) {
    await api(jwt, `/admin/products/${PRODUCT_ID}/options/${u.id}`, {
      method: "POST",
      body: JSON.stringify({ title: u.title, values: u.values }),
    });
    console.log(`  ✓ Updated option ${u.id} → "${u.title}" (${u.values.join(", ")})`);
  }

  // 5b. Option creates
  for (const c of plan.optionCreates) {
    await api(jwt, `/admin/products/${PRODUCT_ID}/options`, {
      method: "POST",
      body: JSON.stringify({ title: c.title, values: c.values }),
    });
    console.log(`  ✓ Created option "${c.title}" (${c.values.join(", ")})`);
  }

  // 5c. Variant update (reuse existing)
  for (const u of plan.variantUpdates) {
    await api(jwt, `/admin/products/${PRODUCT_ID}/variants/${u.id}`, {
      method: "POST",
      body: JSON.stringify({
        title: u.title,
        sku: u.sku,
        options: u.options,
        metadata: u.metadata,
      }),
    });
    console.log(`  ✓ Updated variant ${u.id} → "${u.title}" sku=${u.sku} (price preserved)`);
  }

  // 5d. Variant creates
  for (const c of plan.variantCreates) {
    const payload = {
      title: c.title,
      sku: c.sku,
      manage_inventory: false,
      allow_backorder: true,
      weight: c.weightGrams,
      length: c.dimensionsMm.length,
      width: c.dimensionsMm.width,
      height: c.dimensionsMm.height,
      options: c.options,
      prices: [{ amount: c.priceCents, currency_code: "usd" }],
      metadata: c.metadata,
    };
    const { product_variant } = await api(
      jwt,
      `/admin/products/${PRODUCT_ID}/variants`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    console.log(
      `  ✓ Created variant ${product_variant?.id} "${c.title}" sku=${c.sku} $${(c.priceCents / 100).toFixed(2)}`,
    );
  }

  console.log(`\n✅ Live changes applied.`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
