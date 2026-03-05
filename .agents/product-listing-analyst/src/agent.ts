/**
 * Product Listing Analyst Agent
 *
 * An AI agent that audits and fixes product listings in the Neon PostgreSQL
 * database for Elvato's lighting e-commerce store.
 *
 * Capabilities:
 * - Direct SQL queries to Neon PostgreSQL for product/inventory reads
 * - Medusa Admin API for inventory fixes and product updates
 * - CJ Dropshipping API for real-time supplier stock checks
 * - Listing completeness audit and scoring
 *
 * Usage:
 *   npx tsx src/agent.ts --mode inventory-fix
 *   npx tsx src/agent.ts --mode audit
 *   npx tsx src/agent.ts --mode full
 *   npx tsx src/agent.ts --mode inventory-fix --product-id prod_01J... --max-turns 10
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions } from "./tools.js";
import { executeTool, closeDb, type ToolResult } from "./handlers.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

// ─── CLI Args ──────────────────────────────────────────────────────

type AgentMode = "inventory-fix" | "audit" | "full";

function parseArgs(): {
  mode: AgentMode;
  model: string;
  maxTurns: number;
  productId: string | null;
  batchSize: number;
  verbose: boolean;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const getArg = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  const mode = getArg("--mode", "full") as AgentMode;
  if (!["inventory-fix", "audit", "full"].includes(mode)) {
    console.error(`Invalid mode: ${mode}. Use: inventory-fix, audit, full`);
    process.exit(1);
  }

  return {
    mode,
    model: getArg("--model", "claude-sonnet-4-20250514"),
    maxTurns: parseInt(getArg("--max-turns", "100"), 10),
    productId: getArg("--product-id", "") || null,
    batchSize: parseInt(getArg("--batch-size", "50"), 10),
    verbose: args.includes("--verbose"),
    dryRun: args.includes("--dry-run"),
  };
}

// ─── Build Initial Prompt ──────────────────────────────────────────

function buildUserPrompt(config: ReturnType<typeof parseArgs>): string {
  const dryNote = config.dryRun
    ? "\n\n⚠️ DRY RUN MODE: Do NOT call fix_inventory or update_product. Only diagnose and report."
    : "";

  if (config.productId) {
    switch (config.mode) {
      case "inventory-fix":
        return `Fix the inventory for product ${config.productId}.

1. Call list_stock_locations to get the stock location ID
2. Call check_inventory_levels for product ${config.productId}
3. For any variants with missing inventory_levels, call fix_inventory with stocked_quantity 1000000
4. Call write_report with a summary of what was fixed${dryNote}`;

      case "audit":
        return `Audit the listing quality for product ${config.productId}.

1. Call audit_listing for the product
2. Call get_product_detail to inspect the full product data
3. If the product has a CJ external_id in metadata, call get_cj_product_detail to compare source data
4. Call write_report with findings and recommendations${dryNote}`;

      case "full":
        return `Perform a complete analysis of product ${config.productId}.

1. Fix any inventory issues (list_stock_locations → check_inventory_levels → fix_inventory)
2. Audit the listing quality (audit_listing → get_product_detail)
3. Check CJ source data if available (get_cj_product_detail)
4. Call write_report with a comprehensive analysis${dryNote}`;
    }
  }

  // Batch mode (no specific product ID)
  switch (config.mode) {
    case "inventory-fix":
      return `Fix inventory levels for all published products that are showing as out of stock.

Workflow:
1. Call list_stock_locations to get the stock location ID (you'll need this for every fix)
2. Call query_products with status "published" to get the first batch (limit ${config.batchSize})
3. For each product, call check_inventory_levels to find variants with missing inventory_levels
4. For each variant with status "OUT_OF_STOCK: missing inventory_level", call fix_inventory with:
   - inventory_item_id: from the check results
   - location_id: the stock location ID from step 1
   - stocked_quantity: 1000000
5. Continue with the next batch using offset
6. Call write_report with a complete summary: products checked, variants fixed, any errors

Process ALL published products. Track progress and report totals after each batch.${dryNote}`;

    case "audit":
      return `Audit listing quality for all published products.

Workflow:
1. Call query_products with status "published" to get the first batch (limit ${config.batchSize})
2. For each product, call audit_listing to get a completeness scorecard
3. Note products with grade C or below for detailed investigation
4. Continue with the next batch using offset
5. Call write_report with findings: overall stats, worst listings, common issues

Process ALL published products. Track progress after each batch.${dryNote}`;

    case "full":
      return `Perform a complete product listing analysis: fix inventory AND audit quality.

Phase 1 — Inventory Fix:
1. Call list_stock_locations to get the stock location ID
2. Call query_products with status "published" (limit ${config.batchSize})
3. For each product, call check_inventory_levels and fix any missing levels with fix_inventory
4. Continue batches until all products are processed

Phase 2 — Quality Audit:
5. Call query_products again (limit ${config.batchSize})
6. For each product, call audit_listing
7. Continue batches until all products are audited

Phase 3 — Report:
8. Call write_report with comprehensive findings: inventory fixes applied, audit scores, issues found

Process ALL published products systematically.${dryNote}`;
  }
}

// ─── Agent Loop ────────────────────────────────────────────────────

async function runAgent() {
  const config = parseArgs();
  const client = new Anthropic();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Elvato Product Listing Analyst Agent           ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Mode:       ${config.mode.padEnd(35)}║`);
  console.log(`║  Model:      ${config.model.padEnd(35)}║`);
  console.log(`║  Max Turns:  ${String(config.maxTurns).padEnd(35)}║`);
  if (config.productId) {
    console.log(`║  Product:    ${config.productId.padEnd(35)}║`);
  }
  if (config.dryRun) {
    console.log(`║  ⚠️  DRY RUN MODE                                ║`);
  }
  console.log("╚══════════════════════════════════════════════════╝\n");

  const userPrompt = buildUserPrompt(config);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let turnCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    while (turnCount < config.maxTurns) {
      turnCount++;
      console.log(
        `\n── Turn ${turnCount}/${config.maxTurns} ──────────────────────`
      );

      const response = await client.messages.create({
        model: config.model,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions,
        messages,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const assistantContent: Anthropic.ContentBlock[] = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      // Log text blocks
      for (const block of assistantContent) {
        if (block.type === "text" && block.text) {
          console.log(
            `\n💬 ${block.text.slice(0, 300)}${block.text.length > 300 ? "..." : ""}`
          );
        }
      }

      // Check stop reason
      if (response.stop_reason === "end_turn") {
        console.log("\n✅ Agent completed its work.");
        break;
      }

      if (response.stop_reason !== "tool_use") {
        console.log(`\n⚠️  Unexpected stop reason: ${response.stop_reason}`);
        break;
      }

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of assistantContent) {
        if (block.type !== "tool_use") continue;

        console.log(`\n🔧 Tool: ${block.name}`);
        if (config.verbose) {
          console.log(
            `   Input: ${JSON.stringify(block.input).slice(0, 300)}`
          );
        }

        const startTime = Date.now();
        let results: ToolResult[];

        try {
          results = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Unknown error";
          console.log(`   ❌ Error: ${errorMsg}`);
          results = [{ type: "text", text: `Tool error: ${errorMsg}` }];
        }

        const elapsed = Date.now() - startTime;
        console.log(`   ⏱  ${elapsed}ms`);

        for (const r of results) {
          console.log(
            `   📄 ${r.text.slice(0, 150)}${r.text.length > 150 ? "..." : ""}`
          );
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: results,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    if (turnCount >= config.maxTurns) {
      console.log(`\n⚠️  Reached maximum turns (${config.maxTurns}).`);
    }
  } finally {
    await closeDb();
  }

  // Cost estimate (Sonnet pricing)
  const inputCost = (totalInputTokens / 1_000_000) * 3;
  const outputCost = (totalOutputTokens / 1_000_000) * 15;
  const totalCost = inputCost + outputCost;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Agent Session Complete                         ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Mode:          ${config.mode.padEnd(32)}║`);
  console.log(`║  Turns:         ${String(turnCount).padEnd(32)}║`);
  console.log(
    `║  Input tokens:  ${totalInputTokens.toLocaleString().padEnd(32)}║`
  );
  console.log(
    `║  Output tokens: ${totalOutputTokens.toLocaleString().padEnd(32)}║`
  );
  console.log(`║  Est. cost:     $${totalCost.toFixed(4).padEnd(31)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");
}

runAgent().catch((err) => {
  console.error("Fatal error:", err);
  closeDb().finally(() => process.exit(1));
});
