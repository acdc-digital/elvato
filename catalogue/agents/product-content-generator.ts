#!/usr/bin/env npx ts-node
/**
 * Product Content Generator Agent
 * 
 * Uses Claude claude-sonnet-4-20250514 to generate professional e-commerce content
 * for products in the Convex medusaProducts table.
 * 
 * Usage:
 *   npx ts-node agents/product-content-generator.ts [options]
 * 
 * Options:
 *   --limit N         Process N products (default: 10)
 *   --product-id ID   Process a specific product by Convex _id
 *   --all             Process all products needing content
 *   --dry-run         Preview without saving to Convex
 *   --force           Regenerate content even if already exists
 */

import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// =============================================================================
// CONFIGURATION
// =============================================================================

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const DELAY_BETWEEN_REQUESTS_MS = 500;

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL or NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

// =============================================================================
// TYPES
// =============================================================================

interface ProductForAi {
  _id: Id<"medusaProducts">;
  title: string;
  description?: string;
  thumbnail?: string;
  cjOriginalTitle?: string;
  cjOriginalDescription?: string;
  cjCategoryName?: string;
  hasAiContent: boolean;
}

interface AiGeneratedContent {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  productType: string;
  suggestedCategories: string[];
  seoTitle: string;
  seoDescription: string;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter specializing in lighting fixtures and home decor products. Your task is to transform raw product data into polished, SEO-optimized content that appeals to modern homeowners and interior designers.

BRAND CONTEXT:
- Target audience: Homeowners, interior designers, home renovation enthusiasts
- Style: Modern, minimalist, Nordic-inspired
- Price range: Mid-market (affordable luxury)
- Category focus: Lighting fixtures (pendants, chandeliers, wall sconces, table lamps)

WRITING GUIDELINES:
1. Title: Create a compelling, keyword-rich title (max 60 characters)
   - Lead with product type, followed by style/feature
   - Avoid ALL CAPS, use Title Case
   - Example: "Modern Glass Globe Pendant Light"

2. Subtitle: Write a concise value proposition (max 100 characters)
   - Highlight the main benefit or use case
   - Example: "Elegant minimalist design for dining rooms and entryways"

3. Description: Write engaging product copy (150-300 words)
   - Start with an emotional hook about the atmosphere it creates
   - Include key features and specifications naturally
   - Mention ideal placement/use cases
   - Use sensory language (warm glow, sleek lines, etc.)
   - End with a call to action or installation ease

4. Tags: Generate 5-10 relevant keywords
   - Mix of product type, style, room, and feature tags
   - Use lowercase, single words or two-word phrases

5. Product Type: Single category classification
   - Choose from: Pendant Light, Chandelier, Wall Sconce, Table Lamp, Floor Lamp, Ceiling Light, LED Strip, Outdoor Light

6. Suggested Categories: 2-4 Medusa category paths
   - Format as hierarchical paths: "Lighting > Pendant Lights > Modern"

7. SEO Title: Meta title for search engines (max 60 chars)

8. SEO Description: Meta description for search (max 155 chars)

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "title": "string",
  "subtitle": "string",
  "description": "string",
  "tags": ["string"],
  "productType": "string",
  "suggestedCategories": ["string"],
  "seoTitle": "string",
  "seoDescription": "string"
}`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + "...";
}

// =============================================================================
// MAIN AGENT LOGIC
// =============================================================================

async function generateContentForProduct(
  anthropic: Anthropic,
  product: ProductForAi
): Promise<AiGeneratedContent> {
  // Build context from product data
  const context = `
PRODUCT DATA:
- Original Title: ${product.cjOriginalTitle || product.title}
- Current Title: ${product.title}
- CJ Category: ${product.cjCategoryName || "Not specified"}
- Thumbnail URL: ${product.thumbnail || "None"}

ORIGINAL DESCRIPTION:
${stripHtml(product.cjOriginalDescription || product.description) || "No description available"}
`.trim();

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate professional e-commerce content for this product:\n\n${context}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  // Extract text content from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }

  // Parse JSON from response
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as AiGeneratedContent;

  // Validate required fields
  const requiredFields: (keyof AiGeneratedContent)[] = [
    "title",
    "subtitle",
    "description",
    "tags",
    "productType",
    "suggestedCategories",
    "seoTitle",
    "seoDescription",
  ];

  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsed;
}

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    productId: null as string | null,
    all: false,
    dryRun: false,
    force: false,
    stats: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--limit":
        options.limit = parseInt(args[++i], 10);
        break;
      case "--product-id":
        options.productId = args[++i];
        break;
      case "--all":
        options.all = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--stats":
        options.stats = true;
        break;
    }
  }

  // Stats-only mode
  if (options.stats) {
    const convex = new ConvexHttpClient(CONVEX_URL!);
    const stats = await convex.query(api.medusaStaging.getAiContentStats, {});
    console.log("📊 AI Content Generation Stats");
    console.log("═══════════════════════════════════════════");
    console.log(`   Total products: ${stats.totalProducts}`);
    console.log(`   With AI content: ${stats.withAiContent}`);
    console.log(`   Remaining: ${stats.withoutAiContent}`);
    console.log(`   Complete: ${stats.percentComplete}%`);
    process.exit(0);
  }

  console.log("🚀 Product Content Generator Agent");
  console.log("═══════════════════════════════════════════");
  console.log(`Model: ${ANTHROPIC_MODEL}`);
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Force regenerate: ${options.force ? "Yes" : "No"}`);
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS_MS}ms`);
  console.log("");

  // Initialize clients
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const convex = new ConvexHttpClient(CONVEX_URL!);

  // Fetch products to process
  let products: ProductForAi[] = [];

  if (options.productId) {
    // Single product mode
    const product = await convex.query(api.medusaStaging.getProductForAiContent, {
      productId: options.productId as Id<"medusaProducts">,
    });
    if (!product) {
      console.error(`❌ Product not found: ${options.productId}`);
      process.exit(1);
    }
    products = [product];
    console.log(`📦 Processing single product: ${product.title}`);
  } else {
    // Batch mode
    const limit = options.all ? 10000 : options.limit;
    products = await convex.query(api.medusaStaging.getProductsNeedingContent, {
      limit,
      includeWithContent: options.force,
    });
    console.log(`📦 Found ${products.length} products to process`);
  }

  if (products.length === 0) {
    console.log("✅ No products need content generation!");
    process.exit(0);
  }

  // Process products sequentially with delay
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ title: string; error: string }> = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;

    try {
      console.log(`\n${progress} Processing: ${truncate(product.title, 50)}`);

      // Generate content with Claude
      const content = await generateContentForProduct(anthropic, product);

      console.log(`   ✓ Generated: "${truncate(content.title, 40)}"`);
      console.log(`   ✓ Type: ${content.productType}`);
      console.log(`   ✓ Tags: ${content.tags.slice(0, 5).join(", ")}${content.tags.length > 5 ? "..." : ""}`);
      console.log(`   ✓ Categories: ${content.suggestedCategories.join(", ")}`);

      // Save to Convex (unless dry-run)
      if (!options.dryRun) {
        await convex.mutation(api.medusaStaging.updateProductAiContent, {
          productId: product._id,
          title: content.title,
          subtitle: content.subtitle,
          description: content.description,
          productType: content.productType,
          tags: content.tags,
          suggestedCategories: content.suggestedCategories,
          seoTitle: content.seoTitle,
          seoDescription: content.seoDescription,
          model: ANTHROPIC_MODEL,
        });
        console.log(`   ✓ Saved to Convex`);
      } else {
        console.log(`   ⏭ DRY RUN - Not saved`);
      }

      successCount++;

      // Delay before next request (rate limiting)
      if (i < products.length - 1) {
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ title: product.title, error: errorMsg });
      console.log(`   ❌ Error: ${errorMsg}`);
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("📊 Summary");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  if (options.dryRun) {
    console.log(`   ⚠️  DRY RUN - No changes saved to Convex`);
  }

  if (errors.length > 0) {
    console.log("\n❌ Failed products:");
    for (const err of errors) {
      console.log(`   - ${truncate(err.title, 40)}: ${err.error}`);
    }
  }

  // Get updated stats
  if (!options.dryRun) {
    const stats = await convex.query(api.medusaStaging.getAiContentStats, {});
    console.log("\n📈 Overall Progress:");
    console.log(`   Total: ${stats.totalProducts}`);
    console.log(`   With AI content: ${stats.withAiContent}`);
    console.log(`   Remaining: ${stats.withoutAiContent}`);
    console.log(`   Complete: ${stats.percentComplete}%`);
  }
}

// Run the agent
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
