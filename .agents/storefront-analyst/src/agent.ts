/**
 * Storefront Analyst Agent
 *
 * An AI agent that browses the internet, takes screenshots, and analyzes
 * e-commerce storefronts with expertise in residential designer lighting.
 *
 * Uses:
 * - Anthropic Claude API (with vision) for analysis
 * - Brave Search API for web research
 * - Playwright for headless browser screenshots
 *
 * Usage:
 *   npx tsx src/agent.ts --url https://www.elvato.shop/
 *   npx tsx src/agent.ts --url https://www.elvato.shop/ --model claude-sonnet-4-20250514
 *   npx tsx src/agent.ts --url https://www.elvato.shop/ --max-turns 30 --prompt "Focus on mobile UX"
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions } from "./tools.js";
import { executeTool, closeBrowser, type ToolResult } from "./handlers.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

// ─── CLI Args ──────────────────────────────────────────────────────

function parseArgs(): {
  url: string;
  model: string;
  maxTurns: number;
  prompt: string;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const getArg = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  return {
    url: getArg("--url", "https://www.elvato.shop/"),
    model: getArg("--model", "claude-sonnet-4-20250514"),
    maxTurns: parseInt(getArg("--max-turns", "40"), 10),
    prompt: getArg(
      "--prompt",
      ""
    ),
    verbose: args.includes("--verbose"),
  };
}

// ─── Agent Loop ────────────────────────────────────────────────────

async function runAgent() {
  const config = parseArgs();
  const client = new Anthropic();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Elvato Storefront Analyst Agent                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Target:     ${config.url.padEnd(35)}║`);
  console.log(`║  Model:      ${config.model.padEnd(35)}║`);
  console.log(`║  Max Turns:  ${String(config.maxTurns).padEnd(35)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Build the initial user message
  let userPrompt = `Please perform a comprehensive review of this e-commerce storefront: ${config.url}

Start by:
1. Taking a screenshot of the homepage (above the fold)
2. Scrolling down and taking screenshots of each major section
3. Getting page metadata and link structure
4. Searching for current best practices in lighting e-commerce
5. Analyzing everything you find
6. Writing a detailed review report

Focus on actionable improvements that will increase conversion rates and improve the shopping experience for someone buying residential designer lighting.`;

  if (config.prompt) {
    userPrompt += `\n\nAdditional focus area: ${config.prompt}`;
  }

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let turnCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (turnCount < config.maxTurns) {
    turnCount++;
    console.log(`\n── Turn ${turnCount}/${config.maxTurns} ──────────────────────`);

    // Call Claude
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Process response content blocks
    const assistantContent: Anthropic.ContentBlock[] = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    // Log text blocks
    for (const block of assistantContent) {
      if (block.type === "text" && block.text) {
        console.log(`\n💬 ${block.text.slice(0, 200)}${block.text.length > 200 ? "..." : ""}`);
      }
    }

    // Check stop reason
    if (response.stop_reason === "end_turn") {
      console.log("\n✅ Agent completed its analysis.");
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
        console.log(`   Input: ${JSON.stringify(block.input).slice(0, 200)}`);
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

      // Log non-image results briefly
      for (const r of results) {
        if (r.type === "text") {
          console.log(
            `   📄 ${r.text.slice(0, 120)}${r.text.length > 120 ? "..." : ""}`
          );
        } else if (r.type === "image") {
          const sizeKB = Math.round((r.source.data.length * 3) / 4 / 1024);
          console.log(`   📸 Screenshot captured (${sizeKB}KB)`);
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: results.map((r) => {
          if (r.type === "text") return r;
          return r;
        }),
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  if (turnCount >= config.maxTurns) {
    console.log(`\n⚠️  Reached maximum turns (${config.maxTurns}).`);
  }

  // Cost estimate
  const inputCost = (totalInputTokens / 1_000_000) * 3; // $3/M for Sonnet
  const outputCost = (totalOutputTokens / 1_000_000) * 15; // $15/M for Sonnet
  const totalCost = inputCost + outputCost;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Agent Session Complete                         ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Turns:         ${String(turnCount).padEnd(32)}║`);
  console.log(`║  Input tokens:  ${totalInputTokens.toLocaleString().padEnd(32)}║`);
  console.log(`║  Output tokens: ${totalOutputTokens.toLocaleString().padEnd(32)}║`);
  console.log(`║  Est. cost:     $${totalCost.toFixed(4).padEnd(31)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  await closeBrowser();
}

// ─── Entry Point ───────────────────────────────────────────────────

runAgent().catch(async (err) => {
  console.error("\n❌ Fatal error:", err);
  await closeBrowser();
  process.exit(1);
});
