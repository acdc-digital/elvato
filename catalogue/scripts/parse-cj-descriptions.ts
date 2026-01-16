#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Parse CJ Descriptions & Generate Variants
 * 
 * This script parses HTML descriptions from cjMyProducts, extracts variant options
 * (sizes, colors, voltages, etc.), and generates medusaProductVariants with unique SKUs.
 * 
 * After processing, descriptions are cleared (data extracted to variants/metadata).
 * 
 * Usage:
 *   npx tsx scripts/parse-cj-descriptions.ts
 * 
 * Options:
 *   --limit N          Process only N products (default: all)
 *   --preview          Preview extraction without saving
 *   --preview-id ID    Preview a specific product by ID
 *   --stats            Show current parsing stats only
 *   --force            Re-process even already-processed products
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const BATCH_SIZE = 50; // Process in batches to avoid timeout

interface ParseResult {
  processed: number;
  skipped: number;
  totalVariantsCreated: number;
  totalOptionsCreated: number;
  remaining: number;
  errors?: { productId: string; error: string }[];
}

interface ParsingStats {
  totalProducts: number;
  processed: number;
  pending: number;
  totalVariants: number;
  totalOptions: number;
  productsWithMultipleVariants: number;
  avgVariantsPerProduct: string;
  optionTypeCounts: Record<string, number>;
}

interface PreviewResult {
  productTitle: string;
  hasDescription: boolean;
  originalDescription?: string;
  extractedOptions: Record<string, string[]>;
  extractedSpecs: Record<string, string>;
  variantOptionTypes?: string[];
  potentialVariants: number;
  remainingText?: string;
}

function parseArgs(): {
  limit?: number;
  preview: boolean;
  previewId?: string;
  stats: boolean;
  force: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    limit: undefined as number | undefined,
    preview: false,
    previewId: undefined as string | undefined,
    stats: false,
    force: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--preview') {
      options.preview = true;
    } else if (arg === '--preview-id' && args[i + 1]) {
      options.previewId = args[i + 1];
      i++;
    } else if (arg === '--stats') {
      options.stats = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }
  
  return options;
}

async function showStats(convex: ConvexHttpClient) {
  console.log('📊 Fetching parsing statistics...');
  console.log('');
  
  const stats: ParsingStats = await convex.query(api.medusaStaging.getParsingStats, {});
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  DESCRIPTION PARSING STATS                  ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Products:              ${stats.totalProducts.toString().padStart(6)}                       ║`);
  console.log(`║  Processed (desc cleared):    ${stats.processed.toString().padStart(6)}                       ║`);
  console.log(`║  Pending (has description):   ${stats.pending.toString().padStart(6)}                       ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Variants:              ${stats.totalVariants.toString().padStart(6)}                       ║`);
  console.log(`║  Total Product Options:       ${stats.totalOptions.toString().padStart(6)}                       ║`);
  console.log(`║  Products with 2+ Variants:   ${stats.productsWithMultipleVariants.toString().padStart(6)}                       ║`);
  console.log(`║  Avg Variants/Product:        ${stats.avgVariantsPerProduct.padStart(6)}                       ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Option Types Found:                                       ║');
  
  const sortedOptions = Object.entries(stats.optionTypeCounts)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [optionType, count] of sortedOptions) {
    const line = `    ${optionType}: ${count} products`;
    console.log(`║  ${line.padEnd(56)}║`);
  }
  
  if (sortedOptions.length === 0) {
    console.log('║    (none yet)                                              ║');
  }
  
  console.log('╚════════════════════════════════════════════════════════════╝');
}

async function previewProduct(convex: ConvexHttpClient, productId: string) {
  console.log(`🔍 Previewing product: ${productId}`);
  console.log('');
  
  const preview: PreviewResult | null = await convex.query(
    api.medusaStaging.previewDescriptionParsing,
    { medusaProductId: productId as Id<"medusaProducts"> }
  );
  
  if (!preview) {
    console.log('❌ Product not found');
    return;
  }
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    EXTRACTION PREVIEW                       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Product: ${preview.productTitle.substring(0, 48).padEnd(48)} ║`);
  console.log(`║  Has Description: ${preview.hasDescription ? 'Yes' : 'No'}                                    ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  if (!preview.hasDescription) {
    console.log('║  No description to parse                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    return;
  }
  
  console.log('║  EXTRACTED OPTIONS (will become variants):                  ║');
  for (const [optionType, values] of Object.entries(preview.extractedOptions)) {
    console.log(`║    ${optionType}:`.padEnd(60) + '║');
    const valuesStr = values.join(', ');
    const chunks = valuesStr.match(/.{1,52}/g) || [valuesStr];
    for (const chunk of chunks) {
      console.log(`║      ${chunk.padEnd(54)}║`);
    }
  }
  
  if (Object.keys(preview.extractedOptions).length === 0) {
    console.log('║    (none found)                                            ║');
  }
  
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  EXTRACTED SPECS (will go to metadata):                     ║');
  for (const [specType, value] of Object.entries(preview.extractedSpecs)) {
    console.log(`║    ${specType}: ${value}`.substring(0, 58).padEnd(58) + '║');
  }
  
  if (Object.keys(preview.extractedSpecs).length === 0) {
    console.log('║    (none found)                                            ║');
  }
  
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Potential Variants: ${preview.potentialVariants.toString().padEnd(36)}║`);
  console.log(`║  Variant Option Types: ${(preview.variantOptionTypes?.join(', ') || 'none').substring(0, 34).padEnd(34)}║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  if (preview.originalDescription) {
    console.log('║  ORIGINAL DESCRIPTION (first 300 chars):                   ║');
    const descChunks = preview.originalDescription.substring(0, 300).match(/.{1,56}/g) || [];
    for (const chunk of descChunks.slice(0, 5)) {
      console.log(`║  ${chunk.padEnd(58)}║`);
    }
  }
  
  console.log('╚════════════════════════════════════════════════════════════╝');
}

async function previewMultiple(convex: ConvexHttpClient, limit: number) {
  console.log(`🔍 Previewing extraction for up to ${limit} products...`);
  console.log('');
  
  // Get products with descriptions
  const products = await convex.query(api.medusaStaging.getAllProducts, { limit: 100 });
  const withDescriptions = products.filter(p => p.description && p.description.trim().length > 0);
  
  console.log(`Found ${withDescriptions.length} products with descriptions`);
  console.log('');
  
  const samplesToPreview = withDescriptions.slice(0, limit);
  
  for (const product of samplesToPreview) {
    const preview: PreviewResult | null = await convex.query(
      api.medusaStaging.previewDescriptionParsing,
      { medusaProductId: product._id }
    );
    
    if (!preview || !preview.hasDescription) continue;
    
    const optionTypes = Object.keys(preview.extractedOptions);
    const optionSummary = optionTypes.length > 0 
      ? optionTypes.map(t => `${t}(${preview.extractedOptions[t].length})`).join(', ')
      : '(no variant options)';
    
    console.log(`📦 ${preview.productTitle.substring(0, 50)}`);
    console.log(`   Options: ${optionSummary}`);
    console.log(`   Specs: ${Object.keys(preview.extractedSpecs).join(', ') || '(none)'}`);
    console.log(`   → ${preview.potentialVariants} variant(s) would be created`);
    console.log('');
  }
}

async function runBulkParsing(convex: ConvexHttpClient, options: { limit?: number; force: boolean }) {
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalVariants = 0;
  let totalOptions = 0;
  let totalSkipped = 0;
  let batchNumber = 0;
  
  console.log('');
  console.log('🚀 Starting bulk description parsing...');
  if (options.limit) {
    console.log(`   Limit: ${options.limit} products`);
  }
  if (options.force) {
    console.log('   Force: Re-processing all products');
  }
  console.log('');
  
  // Get initial stats
  const initialStats: ParsingStats = await convex.query(api.medusaStaging.getParsingStats, {});
  const pendingCount = initialStats.pending;
  
  console.log(`📊 Products pending: ${pendingCount}`);
  console.log('');
  
  let remaining = pendingCount;
  const targetLimit = options.limit || pendingCount;
  
  while (totalProcessed + totalSkipped < targetLimit && remaining > 0) {
    batchNumber++;
    const batchLimit = Math.min(BATCH_SIZE, targetLimit - totalProcessed - totalSkipped);
    
    console.log(`⏳ Batch ${batchNumber}: Processing up to ${batchLimit} products...`);
    
    const result: ParseResult = await convex.mutation(
      api.medusaStaging.bulkParseAndGenerateVariants,
      {
        limit: batchLimit,
        skipAlreadyProcessed: !options.force,
        deleteExistingVariants: true,
      }
    );
    
    totalProcessed += result.processed;
    totalVariants += result.totalVariantsCreated;
    totalOptions += result.totalOptionsCreated;
    totalSkipped += result.skipped;
    remaining = result.remaining;
    
    console.log(`   ✅ Processed: ${result.processed}, Skipped: ${result.skipped}, Variants: ${result.totalVariantsCreated}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${result.errors.length}`);
      for (const err of result.errors.slice(0, 3)) {
        console.log(`      - ${err.productId}: ${err.error}`);
      }
    }
    
    // Small delay between batches
    if (remaining > 0 && totalProcessed + totalSkipped < targetLimit) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    PARSING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Duration:           ${duration}s`);
  console.log(`   Products Processed: ${totalProcessed}`);
  console.log(`   Products Skipped:   ${totalSkipped}`);
  console.log(`   Variants Created:   ${totalVariants}`);
  console.log(`   Options Created:    ${totalOptions}`);
  console.log(`   Remaining:          ${remaining}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Show final stats
  console.log('');
  await showStats(convex);
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CJ Description Parser & Variant Generator');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const options = parseArgs();
  
  // Validate Convex URL
  if (!CONVEX_URL) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    console.error('   Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }
  
  // Initialize Convex client
  const convex = new ConvexHttpClient(CONVEX_URL);
  console.log(`🔗 Convex URL: ${CONVEX_URL}`);
  console.log('');
  
  try {
    if (options.stats) {
      // Just show stats
      await showStats(convex);
    } else if (options.previewId) {
      // Preview single product
      await previewProduct(convex, options.previewId);
    } else if (options.preview) {
      // Preview multiple products
      await previewMultiple(convex, options.limit || 5);
    } else {
      // Run actual parsing
      await runBulkParsing(convex, { limit: options.limit, force: options.force });
    }
    
    console.log('');
    console.log('Done! ✨');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
