#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

function parseArgs(argv) {
  const args = {
    readyOnly: true,
    includeSynced: false,
    includeFailed: true,
    sampleSize: 5,
    out: null,
    convexUrl: null,
    medusaBackendUrl: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--include-synced") {
      args.includeSynced = true;
      continue;
    }

    if (arg === "--exclude-failed") {
      args.includeFailed = false;
      continue;
    }

    if (arg === "--all-products") {
      args.readyOnly = false;
      continue;
    }

    if (arg === "--sample-size") {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--sample-size requires a positive number");
      }
      args.sampleSize = Math.floor(value);
      i += 1;
      continue;
    }

    if (arg === "--out") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--out requires a file path");
      }
      args.out = value;
      i += 1;
      continue;
    }

    if (arg === "--convex-url") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--convex-url requires a URL");
      }
      args.convexUrl = value;
      i += 1;
      continue;
    }

    if (arg === "--medusa-url") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--medusa-url requires a URL");
      }
      args.medusaBackendUrl = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

async function getStoreProductCount(medusaBackendUrl, publishableKey) {
  if (!medusaBackendUrl) {
    return null;
  }

  const url = new URL("/store/products", medusaBackendUrl);
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", "id");

  const headers = {};
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Store API request failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    total: payload.count ?? null,
    retrieved: Array.isArray(payload.products) ? payload.products.length : 0,
  };
}

async function getMedusaAdminJwt(medusaBackendUrl, email, password) {
  const response = await fetch(new URL("/auth/user/emailpass", medusaBackendUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Admin login failed (${response.status}). Check MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD.`);
  }
  const { token } = await response.json();
  return token;
}

async function getAdminProductCounts(medusaBackendUrl, jwtToken) {
  if (!medusaBackendUrl || !jwtToken) {
    return null;
  }

  const fetchStatusCount = async (status) => {
    const url = new URL("/admin/products", medusaBackendUrl);
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", "id");
    if (status) {
      url.searchParams.append("status[]", status);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (!response.ok) {
      throw new Error(`Admin API request failed (${response.status}) for status=${status ?? "all"}`);
    }

    const payload = await response.json();
    return payload.count ?? null;
  };

  const [all, draft, proposed, published, rejected] = await Promise.all([
    fetchStatusCount(null),
    fetchStatusCount("draft"),
    fetchStatusCount("proposed"),
    fetchStatusCount("published"),
    fetchStatusCount("rejected"),
  ]);

  return { all, draft, proposed, published, rejected };
}

// --------------- Full Medusa parity helpers ---------------

async function adminFetchJson(medusaBackendUrl, jwtToken, path, params = {}) {
  const url = new URL(path, medusaBackendUrl);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`Admin ${path} failed (${res.status})`);
  return res.json();
}

async function adminPaginateAll(medusaBackendUrl, jwtToken, path, key, fields, pageSize = 200) {
  const all = [];
  let offset = 0;
  while (true) {
    const params = { limit: pageSize, offset };
    if (fields) params.fields = fields;
    const data = await adminFetchJson(medusaBackendUrl, jwtToken, path, params);
    const items = data[key] ?? [];
    all.push(...items);
    if (all.length >= (data.count ?? items.length) || items.length === 0) break;
    offset += items.length;
  }
  return all;
}

async function getMedusaDependencies(medusaBackendUrl, jwtToken) {
  const [salesChannels, stockLocations, regions, shippingProfiles] = await Promise.all([
    adminPaginateAll(medusaBackendUrl, jwtToken, "/admin/sales-channels", "sales_channels", "id,name,is_disabled"),
    adminPaginateAll(medusaBackendUrl, jwtToken, "/admin/stock-locations", "stock_locations", "id,name"),
    adminFetchJson(medusaBackendUrl, jwtToken, "/admin/regions", { limit: 100 }).then(d => d.regions ?? []),
    adminPaginateAll(medusaBackendUrl, jwtToken, "/admin/shipping-profiles", "shipping_profiles", "id,name,type"),
  ]);

  const activeSalesChannels = salesChannels.filter(sc => !sc.is_disabled);
  const regionCurrencies = [...new Set(regions.map(r => r.currency_code))];

  const issues = [];
  if (activeSalesChannels.length === 0) issues.push("No active sales channels found");
  if (stockLocations.length === 0) issues.push("No stock locations found — inventory cannot be assigned");
  if (regions.length === 0) issues.push("No regions found — prices won't resolve to storefront");
  if (shippingProfiles.length === 0) issues.push("No shipping profiles found — products cannot ship");

  return {
    salesChannels: activeSalesChannels.map(sc => ({ id: sc.id, name: sc.name })),
    stockLocations: stockLocations.map(sl => ({ id: sl.id, name: sl.name })),
    regions: regions.map(r => ({ id: r.id, name: r.name, currency_code: r.currency_code })),
    shippingProfiles: shippingProfiles.map(sp => ({ id: sp.id, name: sp.name, type: sp.type })),
    currencies: regionCurrencies,
    issues,
    ok: issues.length === 0,
  };
}

async function getMedusaCategoryParity(medusaBackendUrl, jwtToken) {
  const categories = await adminPaginateAll(
    medusaBackendUrl, jwtToken,
    "/admin/product-categories", "product_categories",
    "id,name,handle,parent_category_id,rank",
    200,
  );

  const topLevel = categories.filter(c => !c.parent_category_id);
  const byParent = {};
  for (const c of categories) {
    const pid = c.parent_category_id ?? "__root__";
    (byParent[pid] ??= []).push(c);
  }
  const tree = topLevel.map(c => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    childCount: (byParent[c.id] ?? []).length,
  }));

  return {
    total: categories.length,
    topLevel: topLevel.length,
    tree,
    allHandles: categories.map(c => c.handle),
  };
}

async function getMedusaProductMatching(medusaBackendUrl, jwtToken, convexExternalIds) {
  // Fetch all Medusa products (paginated) with minimal fields for matching
  const medusaProducts = await adminPaginateAll(
    medusaBackendUrl, jwtToken,
    "/admin/products", "products",
    "id,title,handle,status,external_id",
    200,
  );

  const medusaByExternalId = {};
  const medusaByHandle = {};
  for (const p of medusaProducts) {
    if (p.external_id) medusaByExternalId[p.external_id] = p;
    if (p.handle) (medusaByHandle[p.handle] ??= []).push(p);
  }

  const convexExtIdSet = new Set(convexExternalIds);
  const matched = [];
  const unmatched = [];
  const medusaOrphans = [];

  for (const eid of convexExternalIds) {
    if (medusaByExternalId[eid]) {
      matched.push({ externalId: eid, medusaId: medusaByExternalId[eid].id, status: medusaByExternalId[eid].status });
    } else {
      unmatched.push(eid);
    }
  }

  for (const p of medusaProducts) {
    if (p.external_id && !convexExtIdSet.has(p.external_id)) {
      medusaOrphans.push({ medusaId: p.id, externalId: p.external_id, title: p.title });
    }
  }

  return {
    medusaTotalProducts: medusaProducts.length,
    convexTargetProducts: convexExternalIds.length,
    matchedByExternalId: matched.length,
    unmatchedInConvex: unmatched.length,
    medusaOrphans: medusaOrphans.length,
    matchedSample: matched.slice(0, 5),
    unmatchedSample: unmatched.slice(0, 10),
    orphanSample: medusaOrphans.slice(0, 5),
    toCreate: unmatched.length,
    toUpdate: matched.length,
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const convexUrl = args.convexUrl ?? process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  const medusaBackendUrl = args.medusaBackendUrl ?? process.env.MEDUSA_BACKEND_URL;
  const medusaPublishableKey =
    process.env.MEDUSA_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const medusaAdminEmail = process.env.MEDUSA_ADMIN_EMAIL;
  const medusaAdminPassword = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!convexUrl) {
    throw new Error("Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL)");
  }

  if (convexUrl.includes("<") || convexUrl.includes(">")) {
    throw new Error(
      "Invalid --convex-url value: it still contains placeholder brackets. Use your real Convex deployment URL, for example https://your-deployment.convex.cloud"
    );
  }

  try {
    // Validate early so we can fail with a concise, user-friendly message.
    new URL(convexUrl);
  } catch {
    throw new Error(
      `Invalid --convex-url value: ${convexUrl}. Provide a full URL such as https://your-deployment.convex.cloud`
    );
  }

  const convex = new ConvexHttpClient(convexUrl);

  let convexScope;
  try {
    convexScope = await convex.query(api["medusa/staging"].getImportScopeReport, {
      readyOnly: args.readyOnly,
      includeSynced: args.includeSynced,
      includeFailed: args.includeFailed,
      sampleSize: args.sampleSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const hint = message.includes("fetch")
      ? "Unable to reach Convex. Check CONVEX_URL or pass --convex-url (and ensure the deployment is running)."
      : "Convex query failed.";
    throw new Error(`${hint}\nDetails: ${message}`);
  }

  let storeCounts = null;
  let adminCounts = null;

  try {
    storeCounts = await getStoreProductCount(medusaBackendUrl, medusaPublishableKey);
  } catch (error) {
    storeCounts = {
      error: error instanceof Error ? error.message : "Unknown store API error",
    };
  }

  let adminJwt = null;
  if (medusaBackendUrl && medusaAdminEmail && medusaAdminPassword) {
    try {
      adminJwt = await getMedusaAdminJwt(medusaBackendUrl, medusaAdminEmail, medusaAdminPassword);
    } catch (error) {
      adminCounts = {
        error: error instanceof Error ? error.message : "Admin login failed",
      };
    }
  }

  if (adminJwt) {
    try {
      adminCounts = await getAdminProductCounts(medusaBackendUrl, adminJwt);
    } catch (error) {
      adminCounts = {
        error: error instanceof Error ? error.message : "Unknown admin API error",
      };
    }
  }

  // ---- Full parity checks (require admin JWT) ----
  let dependencies = null;
  let categoryParity = null;
  let productMatching = null;

  if (adminJwt) {
    try {
      dependencies = await getMedusaDependencies(medusaBackendUrl, adminJwt);
    } catch (error) {
      dependencies = { error: error instanceof Error ? error.message : "Dependency check failed" };
    }

    try {
      categoryParity = await getMedusaCategoryParity(medusaBackendUrl, adminJwt);
    } catch (error) {
      categoryParity = { error: error instanceof Error ? error.message : "Category check failed" };
    }

    // Collect external IDs from Convex scope for matching
    let allExternalIds = [];
    try {
      allExternalIds = await convex.query(api["medusa/staging"].getAllExternalIds);
    } catch {
      allExternalIds = [];
    }

    if (allExternalIds.length > 0) {
      try {
        productMatching = await getMedusaProductMatching(medusaBackendUrl, adminJwt, allExternalIds);
      } catch (error) {
        productMatching = { error: error instanceof Error ? error.message : "Product matching failed" };
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    config: {
      convexUrl,
      medusaBackendUrl: medusaBackendUrl ?? null,
      hasPublishableKey: Boolean(medusaPublishableKey),
      hasAdminCredentials: Boolean(medusaAdminEmail && medusaAdminPassword),
      filters: {
        readyOnly: args.readyOnly,
        includeSynced: args.includeSynced,
        includeFailed: args.includeFailed,
        sampleSize: args.sampleSize,
      },
    },
    convex: convexScope,
    medusa: {
      store: storeCounts,
      admin: adminCounts,
      dependencies,
      categories: categoryParity,
      productMatching,
    },
    parity: {
      targetConvexProducts: convexScope.scope.validProducts,
      medusaPublishedProducts:
        adminCounts && typeof adminCounts.published === "number"
          ? adminCounts.published
          : storeCounts && typeof storeCounts.total === "number"
            ? storeCounts.total
            : null,
      medusaAllProducts:
        adminCounts && typeof adminCounts.all === "number" ? adminCounts.all : null,
      productsToCreate: productMatching?.toCreate ?? null,
      productsToUpdate: productMatching?.toUpdate ?? null,
      medusaOrphans: productMatching?.medusaOrphans ?? null,
      dependenciesOk: dependencies?.ok ?? null,
      dependencyIssues: dependencies?.issues ?? [],
    },
  };

  const output = JSON.stringify(report, null, 2);
  console.log(output);

  if (args.out) {
    const outputPath = path.resolve(args.out);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${output}\n`, "utf8");
    console.error(`\nReport written to ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
