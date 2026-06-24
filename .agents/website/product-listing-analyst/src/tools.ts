/**
 * Tool definitions for the Product Listing Analyst Agent.
 *
 * Tools:
 * - query_products: List/search products from Neon PostgreSQL
 * - get_product_detail: Full product + variants + inventory from DB
 * - check_inventory_levels: Diagnose inventory chain for a product's variants
 * - fix_inventory: Create missing inventory_level via Medusa Admin API
 * - check_cj_stock: Query CJ API for real supplier stock
 * - get_cj_product_detail: Fetch full CJ product info
 * - audit_listing: Score a product's listing completeness
 * - list_stock_locations: Fetch stock locations from Medusa Admin API
 * - update_product: Update product fields via Medusa Admin API
 * - write_report: Save markdown report to reports/ directory
 */

import type Anthropic from "@anthropic-ai/sdk";

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "query_products",
    description:
      "List or search products in the Neon PostgreSQL database. Returns product ID, title, handle, status, collection, category, variant count, and thumbnail. Use this to find products to analyze or to get an overview of the catalog.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            'Filter by product status: "published", "draft", "proposed", "rejected". Omit for all statuses.',
        },
        search: {
          type: "string",
          description:
            "Search term to match against product title (case-insensitive ILIKE).",
        },
        limit: {
          type: "number",
          description: "Max products to return (default: 50, max: 500).",
        },
        offset: {
          type: "number",
          description: "Offset for pagination (default: 0).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_product_detail",
    description:
      "Get complete product details including all variants, inventory items, inventory levels, pricing, options, SKU, material, weight, and images. Use this to deeply inspect a single product.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "The Medusa product ID (e.g., prod_01J...).",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "check_inventory_levels",
    description:
      "Diagnose the inventory chain for all variants of a product. Returns each variant's manage_inventory flag, inventory_item_id, whether an inventory_level exists, and the stocked_quantity. This is the key diagnostic tool for finding out-of-stock issues caused by missing inventory levels.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "The Medusa product ID to check inventory for.",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "fix_inventory",
    description:
      "Create a missing inventory_level for an inventory_item at a stock location via the Medusa Admin API. This fixes the 'out of stock' issue for variants that have manage_inventory=true but no inventory_level record. Uses the Medusa Admin API to ensure event system triggers (Meilisearch reindex, cache invalidation).",
    input_schema: {
      type: "object" as const,
      properties: {
        inventory_item_id: {
          type: "string",
          description:
            "The inventory_item ID (e.g., iitem_01J...) to create a level for.",
        },
        location_id: {
          type: "string",
          description:
            "The stock_location ID (e.g., sloc_01J...) to link the inventory to.",
        },
        stocked_quantity: {
          type: "number",
          description:
            "The quantity to stock (default: 1000000 — standard for dropshipping).",
        },
      },
      required: ["inventory_item_id", "location_id"],
    },
  },
  {
    name: "check_cj_stock",
    description:
      "Query the CJ Dropshipping API to check real-time supplier stock for a variant. Returns warehouse-level inventory breakdown. Use this to verify whether a product is actually available from the supplier before fixing inventory.",
    input_schema: {
      type: "object" as const,
      properties: {
        vid: {
          type: "string",
          description:
            "The CJ variant ID (vid) to check stock for.",
        },
      },
      required: ["vid"],
    },
  },
  {
    name: "get_cj_product_detail",
    description:
      "Fetch full product information from the CJ Dropshipping API, including all variants, pricing, dimensions, weight, material, and category. Use this to compare CJ source data against the Medusa listing for completeness.",
    input_schema: {
      type: "object" as const,
      properties: {
        pid: {
          type: "string",
          description: "The CJ product ID to look up.",
        },
      },
      required: ["pid"],
    },
  },
  {
    name: "audit_listing",
    description:
      "Score a product listing's completeness and quality. Checks: title quality (length, brand mentions), description (exists, length, not raw HTML), images (count, thumbnail, valid URLs), variants (SKU, prices, options), and specs (material, weight, dimensions). Returns a structured scorecard with per-field pass/fail.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "The Medusa product ID to audit.",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "list_stock_locations",
    description:
      "Fetch all stock locations from the Medusa Admin API. Returns location IDs and names. Call this once at the start to get the location_id needed for fix_inventory.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_product",
    description:
      "Update product fields via the Medusa Admin API. Can update title, description, status, metadata, and other top-level product fields.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "The Medusa product ID to update.",
        },
        fields: {
          type: "object",
          description:
            'Object of fields to update. Common fields: { title, description, subtitle, status, metadata, weight, material, origin_country }.',
        },
      },
      required: ["product_id", "fields"],
    },
  },
  {
    name: "write_report",
    description:
      "Write a report as a markdown file. The report will be saved to .agents/product-listing-analyst/reports/ with a date-stamped filename. Use this to save audit findings, inventory fix logs, and analysis results.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "The markdown content to write.",
        },
        filename_suffix: {
          type: "string",
          description:
            'Suffix for the filename (default: "report"). Example: "inventory-fix" produces inventory-fix-03042026-1.md.',
        },
      },
      required: ["content"],
    },
  },
];
