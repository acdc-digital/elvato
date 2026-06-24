/**
 * Tool execution handlers for the Product Listing Analyst Agent.
 *
 * Implements:
 * - Neon PostgreSQL direct queries (read-only via pg.Client)
 * - Medusa Admin API calls (JWT auth, inventory fixes, product updates)
 * - CJ Dropshipping API (stock checks, product details)
 * - Report file writing
 */

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// ─── Database Connection ────────────────────────────────────────────

let dbClient: Client | null = null;

async function ensureDb(): Promise<Client> {
  if (!dbClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not set in environment.");
    }
    dbClient = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await dbClient.connect();
  }
  return dbClient;
}

export async function closeDb(): Promise<void> {
  if (dbClient) {
    await dbClient.end().catch(() => {});
    dbClient = null;
  }
}

// ─── Medusa Admin API ──────────────────────────────────────────────

let medusaJwt: string | null = null;

async function getMedusaJwt(): Promise<string> {
  if (medusaJwt) return medusaJwt;

  const baseUrl = process.env.MEDUSA_BACKEND_URL;
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!baseUrl || !email || !password) {
    throw new Error(
      "Missing MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, or MEDUSA_ADMIN_PASSWORD."
    );
  }

  const res = await fetch(`${baseUrl}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.text();
  let json: { token?: string } | null = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }

  if (!res.ok || !json?.token) {
    throw new Error(`Medusa auth failed (${res.status}): ${body.slice(0, 400)}`);
  }

  medusaJwt = json.token;
  return medusaJwt;
}

async function medusaFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const baseUrl = process.env.MEDUSA_BACKEND_URL;
  const jwt = await getMedusaJwt();

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const body = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: string })?.message ||
      (json as { message?: string; error?: string })?.error ||
      body.slice(0, 300);
    throw new Error(`Medusa API ${res.status}: ${msg}`);
  }

  return json;
}

// ─── CJ Dropshipping API ──────────────────────────────────────────

const CJ_BASE = "https://developers.cjdropshipping.com";
let cjAccessToken: string | null = null;

async function ensureCjToken(): Promise<string> {
  if (cjAccessToken) return cjAccessToken;

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error("CJ_API_KEY not set in environment.");
  }

  const res = await fetch(
    `${CJ_BASE}/api2.0/v1/authentication/getAccessToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    }
  );

  const data = (await res.json()) as {
    code: number;
    result: boolean;
    data?: { accessToken?: string };
    message?: string;
  };

  if (!data.result || !data.data?.accessToken) {
    throw new Error(
      `CJ auth failed (code ${data.code}): ${data.message || "No access token"}`
    );
  }

  cjAccessToken = data.data.accessToken;
  return cjAccessToken;
}

async function cjFetch(
  endpoint: string,
  method: "GET" | "POST" = "GET"
): Promise<unknown> {
  const token = await ensureCjToken();

  const res = await fetch(`${CJ_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
  });

  const data = (await res.json()) as {
    code: number;
    result: boolean;
    data?: unknown;
    message?: string;
  };

  if (data.code === 1600001 || data.code === 1600002) {
    // Token expired — refresh and retry once
    cjAccessToken = null;
    const newToken = await ensureCjToken();
    const retryRes = await fetch(`${CJ_BASE}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": newToken,
      },
    });
    return retryRes.json();
  }

  return data;
}

// ─── Tool Handlers ─────────────────────────────────────────────────

async function queryProducts(input: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<string> {
  const db = await ensureDb();
  const limit = Math.min(input.limit || 50, 500);
  const offset = input.offset || 0;

  const conditions: string[] = ["p.deleted_at IS NULL"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (input.status) {
    conditions.push(`p.status = $${paramIdx++}`);
    params.push(input.status);
  }

  if (input.search) {
    conditions.push(`p.title ILIKE $${paramIdx++}`);
    params.push(`%${input.search}%`);
  }

  const whereClause = conditions.join(" AND ");

  const result = await db.query(
    `
    SELECT
      p.id,
      p.title,
      p.handle,
      p.status,
      pc.title as collection_name,
      COUNT(DISTINCT pv.id) as variant_count
    FROM product p
    LEFT JOIN product_collection pc ON pc.id = p.collection_id
    LEFT JOIN product_variant pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
    WHERE ${whereClause}
    GROUP BY p.id, p.title, p.handle, p.status, pc.title
    ORDER BY p.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `,
    [...params, limit, offset]
  );

  // Also get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM product p WHERE ${whereClause}`,
    params
  );

  return JSON.stringify(
    {
      products: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    },
    null,
    2
  );
}

async function getProductDetail(productId: string): Promise<string> {
  const db = await ensureDb();

  // Product base
  const product = await db.query(
    `
    SELECT p.*, pc.title as collection_name
    FROM product p
    LEFT JOIN product_collection pc ON pc.id = p.collection_id
    WHERE p.id = $1
    `,
    [productId]
  );

  if (product.rows.length === 0) {
    return JSON.stringify({ error: `Product ${productId} not found.` });
  }

  // Variants with inventory chain
  const variants = await db.query(
    `
    SELECT
      pv.id, pv.title, pv.sku, pv.manage_inventory, pv.allow_backorder,
      pv.weight, pv.material, pv.metadata as variant_metadata,
      pvii.inventory_item_id,
      ii.sku as inventory_sku,
      il.id as level_id, il.stocked_quantity, il.location_id,
      sl.name as location_name
    FROM product_variant pv
    LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
    LEFT JOIN inventory_item ii ON ii.id = pvii.inventory_item_id
    LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
    LEFT JOIN stock_location sl ON sl.id = il.location_id
    WHERE pv.product_id = $1 AND pv.deleted_at IS NULL
    ORDER BY pv.created_at
    `,
    [productId]
  );

  // Variant prices
  const prices = await db.query(
    `
    SELECT pvps.variant_id, pvp.amount, pvp.currency_code
    FROM product_variant_price_set pvps
    JOIN price_set ps ON ps.id = pvps.price_set_id
    JOIN price pvp ON pvp.price_set_id = ps.id
    WHERE pvps.variant_id = ANY($1::text[])
    `,
    [variants.rows.map((v: { id: string }) => v.id)]
  );

  // Variant options
  const options = await db.query(
    `
    SELECT pov.variant_id, po.title as option_title, pov.value
    FROM product_option_value pov
    JOIN product_option po ON po.id = pov.option_id
    WHERE pov.variant_id = ANY($1::text[])
    `,
    [variants.rows.map((v: { id: string }) => v.id)]
  );

  // Images
  const images = await db.query(
    `SELECT id, url, rank FROM product_image WHERE product_id = $1 ORDER BY rank`,
    [productId]
  );

  // Categories
  const categories = await db.query(
    `
    SELECT pcat.name, pcat.handle
    FROM product_category_product pcp
    JOIN product_category pcat ON pcat.id = pcp.product_category_id
    WHERE pcp.product_id = $1
    `,
    [productId]
  );

  // Build price map
  const pricesByVariant: Record<string, { amount: number; currency_code: string }[]> = {};
  for (const p of prices.rows) {
    if (!pricesByVariant[p.variant_id]) pricesByVariant[p.variant_id] = [];
    pricesByVariant[p.variant_id].push({ amount: p.amount, currency_code: p.currency_code });
  }

  // Build options map
  const optionsByVariant: Record<string, { option: string; value: string }[]> = {};
  for (const o of options.rows) {
    if (!optionsByVariant[o.variant_id]) optionsByVariant[o.variant_id] = [];
    optionsByVariant[o.variant_id].push({ option: o.option_title, value: o.value });
  }

  const enrichedVariants = variants.rows.map((v: Record<string, unknown>) => ({
    ...v,
    prices: pricesByVariant[v.id as string] || [],
    options: optionsByVariant[v.id as string] || [],
    in_stock:
      !(v.manage_inventory as boolean) ||
      (v.allow_backorder as boolean) ||
      ((v.stocked_quantity as number) > 0),
  }));

  return JSON.stringify(
    {
      product: product.rows[0],
      variants: enrichedVariants,
      images: images.rows,
      categories: categories.rows,
    },
    null,
    2
  );
}

async function checkInventoryLevels(productId: string): Promise<string> {
  const db = await ensureDb();

  const result = await db.query(
    `
    SELECT
      pv.id as variant_id,
      pv.title as variant_title,
      pv.sku,
      pv.manage_inventory,
      pv.allow_backorder,
      pvii.inventory_item_id,
      il.id as level_id,
      il.stocked_quantity,
      il.reserved_quantity,
      il.location_id,
      sl.name as location_name,
      CASE
        WHEN pv.manage_inventory = false THEN 'in_stock (unmanaged)'
        WHEN pv.allow_backorder = true THEN 'in_stock (backorder)'
        WHEN il.id IS NOT NULL AND il.stocked_quantity > 0 THEN 'in_stock'
        WHEN pvii.inventory_item_id IS NULL THEN 'ERROR: no inventory_item'
        WHEN il.id IS NULL THEN 'OUT_OF_STOCK: missing inventory_level'
        ELSE 'OUT_OF_STOCK: zero quantity'
      END as stock_status
    FROM product_variant pv
    LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
    LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
    LEFT JOIN stock_location sl ON sl.id = il.location_id
    WHERE pv.product_id = $1 AND pv.deleted_at IS NULL
    ORDER BY pv.created_at
    `,
    [productId]
  );

  const needsFix = result.rows.filter(
    (r: { stock_status: string }) => r.stock_status.startsWith("OUT_OF_STOCK") || r.stock_status.includes("no inventory_item")
  );

  const summary = {
    product_id: productId,
    total_variants: result.rows.length,
    in_stock: result.rows.filter(
      (r: { stock_status: string }) => r.stock_status.startsWith("in_stock")
    ).length,
    out_of_stock: result.rows.filter(
      (r: { stock_status: string }) => r.stock_status.startsWith("OUT_OF_STOCK")
    ).length,
    missing_inventory_item: result.rows.filter(
      (r: { stock_status: string }) => r.stock_status.includes("no inventory_item")
    ).length,
    missing_inventory_level: result.rows.filter(
      (r: { stock_status: string }) => r.stock_status.includes("missing inventory_level")
    ).length,
    // Only include variants that need fixing to keep context small
    variants_needing_fix: needsFix,
  };

  return JSON.stringify(summary, null, 2);
}

async function fixInventory(input: {
  inventory_item_id: string;
  location_id: string;
  stocked_quantity?: number;
}): Promise<string> {
  const qty = input.stocked_quantity ?? 1_000_000;

  const result = await medusaFetch(
    `/admin/inventory-items/${input.inventory_item_id}/location-levels`,
    {
      method: "POST",
      body: JSON.stringify({
        location_id: input.location_id,
        stocked_quantity: qty,
      }),
    }
  );

  return JSON.stringify(
    {
      success: true,
      inventory_item_id: input.inventory_item_id,
      location_id: input.location_id,
      stocked_quantity: qty,
      response: result,
    },
    null,
    2
  );
}

async function checkCjStock(vid: string): Promise<string> {
  const data = await cjFetch(
    `/api2.0/v1/product/stock/queryByVid?vid=${encodeURIComponent(vid)}`
  );
  return JSON.stringify(data, null, 2);
}

async function getCjProductDetail(pid: string): Promise<string> {
  const data = await cjFetch(
    `/api2.0/v1/product/query?pid=${encodeURIComponent(pid)}&features=enable_inventory`
  );
  return JSON.stringify(data, null, 2);
}

async function auditListing(productId: string): Promise<string> {
  const db = await ensureDb();

  // Get product
  const product = await db.query(
    `SELECT id, title, description, subtitle, handle, status, thumbnail, metadata, weight, material
     FROM product WHERE id = $1`,
    [productId]
  );

  if (product.rows.length === 0) {
    return JSON.stringify({ error: `Product ${productId} not found.` });
  }

  const p = product.rows[0];

  // Get variant count and check completeness
  const variants = await db.query(
    `SELECT id, title, sku, manage_inventory, weight, material
     FROM product_variant WHERE product_id = $1 AND deleted_at IS NULL`,
    [productId]
  );

  // Get image count
  const images = await db.query(
    `SELECT COUNT(*) as count FROM product_image WHERE product_id = $1`,
    [productId]
  );

  // Get price count
  const prices = await db.query(
    `SELECT COUNT(DISTINCT pvps.variant_id) as variants_with_prices
     FROM product_variant_price_set pvps
     JOIN price_set ps ON ps.id = pvps.price_set_id
     JOIN price pvp ON pvp.price_set_id = ps.id
     WHERE pvps.variant_id = ANY($1::text[])`,
    [variants.rows.map((v: { id: string }) => v.id)]
  );

  // Get categories
  const categories = await db.query(
    `SELECT COUNT(*) as count FROM product_category_product WHERE product_id = $1`,
    [productId]
  );

  // Score each field
  const scorecard = {
    product_id: productId,
    title: p.title,
    status: p.status,
    checks: {
      title_exists: { pass: !!p.title, value: p.title || null },
      title_length: {
        pass: p.title && p.title.length >= 20 && p.title.length <= 150,
        value: p.title?.length || 0,
        expected: "20-150 chars",
      },
      description_exists: { pass: !!p.description, value: !!p.description },
      description_length: {
        pass: p.description && p.description.length >= 50,
        value: p.description?.length || 0,
        expected: ">50 chars",
      },
      description_not_raw_html: {
        pass: !p.description || !p.description.includes("<img"),
        value: p.description?.includes("<img") ? "contains <img> tags" : "clean",
      },
      thumbnail_exists: { pass: !!p.thumbnail, value: p.thumbnail || null },
      image_count: {
        pass: parseInt(images.rows[0].count) >= 3,
        value: parseInt(images.rows[0].count),
        expected: "≥3 images",
      },
      variant_count: {
        pass: variants.rows.length >= 1,
        value: variants.rows.length,
      },
      variants_have_sku: {
        pass: variants.rows.every((v: { sku: string | null }) => !!v.sku),
        value: variants.rows.filter((v: { sku: string | null }) => !!v.sku).length,
        total: variants.rows.length,
      },
      variants_have_prices: {
        pass: parseInt(prices.rows[0].variants_with_prices) === variants.rows.length,
        value: parseInt(prices.rows[0].variants_with_prices),
        total: variants.rows.length,
      },
      has_category: {
        pass: parseInt(categories.rows[0].count) >= 1,
        value: parseInt(categories.rows[0].count),
      },
      has_material: {
        pass: !!p.material || variants.rows.some((v: { material: string | null }) => !!v.material),
        value: p.material || variants.rows.find((v: { material: string | null }) => v.material)?.material || null,
      },
      has_weight: {
        pass: !!p.weight || variants.rows.some((v: { weight: number | null }) => !!v.weight),
        value: p.weight || variants.rows.find((v: { weight: number | null }) => v.weight)?.weight || null,
      },
    },
  };

  const checks = Object.values(scorecard.checks);
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;

  return JSON.stringify(
    {
      ...scorecard,
      score: `${passed}/${total}`,
      grade:
        passed === total
          ? "A"
          : passed >= total * 0.8
            ? "B"
            : passed >= total * 0.6
              ? "C"
              : passed >= total * 0.4
                ? "D"
                : "F",
    },
    null,
    2
  );
}

async function listStockLocations(): Promise<string> {
  const result = await medusaFetch(
    "/admin/stock-locations?limit=100&fields=id,name"
  );
  return JSON.stringify(result, null, 2);
}

async function updateProduct(
  productId: string,
  fields: Record<string, unknown>
): Promise<string> {
  const result = await medusaFetch(`/admin/products/${productId}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
  return JSON.stringify(
    { success: true, product_id: productId, updated_fields: Object.keys(fields), response: result },
    null,
    2
  );
}

function writeReport(content: string, suffix: string = "report"): string {
  const reportsDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "reports"
  );
  fs.mkdirSync(reportsDir, { recursive: true });

  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}${now.getFullYear()}`;

  const existing = fs.readdirSync(reportsDir).filter((f: string) =>
    f.startsWith(`${suffix}-${dateStr}`)
  );
  const n = existing.length + 1;

  const filename = `${suffix}-${dateStr}-${n}.md`;
  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, content, "utf-8");

  return JSON.stringify({ saved: true, path: filepath, filename });
}

// ─── Tool Router ───────────────────────────────────────────────────

export type ToolResult = { type: "text"; text: string };

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult[]> {
  switch (name) {
    case "query_products": {
      const text = await queryProducts(input as Parameters<typeof queryProducts>[0]);
      return [{ type: "text", text }];
    }
    case "get_product_detail": {
      const text = await getProductDetail(input.product_id as string);
      return [{ type: "text", text }];
    }
    case "check_inventory_levels": {
      const text = await checkInventoryLevels(input.product_id as string);
      return [{ type: "text", text }];
    }
    case "fix_inventory": {
      const text = await fixInventory(
        input as Parameters<typeof fixInventory>[0]
      );
      return [{ type: "text", text }];
    }
    case "check_cj_stock": {
      const text = await checkCjStock(input.vid as string);
      return [{ type: "text", text }];
    }
    case "get_cj_product_detail": {
      const text = await getCjProductDetail(input.pid as string);
      return [{ type: "text", text }];
    }
    case "audit_listing": {
      const text = await auditListing(input.product_id as string);
      return [{ type: "text", text }];
    }
    case "list_stock_locations": {
      const text = await listStockLocations();
      return [{ type: "text", text }];
    }
    case "update_product": {
      const text = await updateProduct(
        input.product_id as string,
        input.fields as Record<string, unknown>
      );
      return [{ type: "text", text }];
    }
    case "write_report": {
      const text = writeReport(
        input.content as string,
        (input.filename_suffix as string) || "report"
      );
      return [{ type: "text", text }];
    }
    default:
      return [{ type: "text", text: `Unknown tool: ${name}` }];
  }
}
