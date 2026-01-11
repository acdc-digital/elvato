#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Sync CJ My Products to Convex
 * 
 * This script fetches all products from CJ Dropshipping's "My Products" section
 * and syncs them to the Convex cjMyProducts table.
 * 
 * Usage:
 *   npx tsx scripts/sync-cj-my-products.ts
 * 
 * Options:
 *   --clear    Clear all existing products before syncing
 *   --dry-run  Fetch products but don't sync to Convex
 *   --limit N  Only sync first N products (for testing)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8008';
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const BATCH_SIZE = 50; // Products per Convex mutation batch

interface TransformedProduct {
  cjProductId: string;
  sku: string;
  nameEn: string;
  productNames: string[];
  bigImage: string;
  price: number;
  productType: number;
  listedShopNum?: string;
  cjCreatedAt: string;
}

interface SyncResponse {
  success: boolean;
  products?: TransformedProduct[];
  stats?: {
    totalInCJ: number;
    fetched: number;
    pages: number;
    errors: number;
  };
  error?: string;
  errors?: string[];
}

async function fetchProductsFromCJ(): Promise<SyncResponse> {
  console.log('📡 Fetching products from CJ API...');
  console.log(`   API URL: ${API_BASE_URL}/api/cj/my-products/sync`);
  
  const response = await fetch(`${API_BASE_URL}/api/cj/my-products/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pageSize: 100, // Max reasonable size per page
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function syncToConvex(
  convex: ConvexHttpClient,
  products: TransformedProduct[],
  options: { dryRun?: boolean; limit?: number }
): Promise<{ created: number; updated: number }> {
  let productsToSync = products;
  
  if (options.limit && options.limit > 0) {
    productsToSync = products.slice(0, options.limit);
    console.log(`🔢 Limiting to first ${options.limit} products`);
  }

  if (options.dryRun) {
    console.log('🧪 Dry run mode - not syncing to Convex');
    console.log(`   Would sync ${productsToSync.length} products`);
    return { created: 0, updated: 0 };
  }

  console.log(`📤 Syncing ${productsToSync.length} products to Convex...`);
  
  let totalCreated = 0;
  let totalUpdated = 0;
  const batches = Math.ceil(productsToSync.length / BATCH_SIZE);

  for (let i = 0; i < productsToSync.length; i += BATCH_SIZE) {
    const batch = productsToSync.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    process.stdout.write(`   Batch ${batchNum}/${batches} (${batch.length} products)...`);
    
    try {
      const result = await convex.mutation(api.cjMyProducts.batchUpsert, {
        products: batch,
      });
      
      totalCreated += result.created;
      totalUpdated += result.updated;
      
      console.log(` ✓ (${result.created} new, ${result.updated} updated)`);
    } catch (error) {
      console.log(` ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return { created: totalCreated, updated: totalUpdated };
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CJ My Products → Convex Sync Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    clear: args.includes('--clear'),
    dryRun: args.includes('--dry-run'),
    limit: 0,
  };

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  console.log('Options:', options);
  console.log('');

  // Validate Convex URL
  if (!CONVEX_URL) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    console.error('   Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }

  // Initialize Convex client
  const convex = new ConvexHttpClient(CONVEX_URL);
  console.log(`🔗 Convex URL: ${CONVEX_URL}`);

  try {
    // Get current stats
    const currentStats = await convex.query(api.cjMyProducts.getSyncStats, {});
    console.log(`📊 Current Convex stats: ${currentStats.totalProducts} products`);
    if (currentStats.lastSyncedAt) {
      console.log(`   Last sync: ${new Date(currentStats.lastSyncedAt).toLocaleString()}`);
    }
    console.log('');

    // Clear if requested
    if (options.clear && !options.dryRun) {
      console.log('🗑️  Clearing existing products...');
      const clearResult = await convex.mutation(api.cjMyProducts.clearAll, {});
      console.log(`   Deleted ${clearResult.deleted} products`);
      console.log('');
    }

    // Fetch from CJ
    const startTime = Date.now();
    const fetchResult = await fetchProductsFromCJ();

    if (!fetchResult.success) {
      console.error('❌ Failed to fetch from CJ:', fetchResult.error);
      process.exit(1);
    }

    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Fetched ${fetchResult.products?.length || 0} products in ${fetchDuration}s`);
    
    if (fetchResult.stats) {
      console.log(`   Total in CJ: ${fetchResult.stats.totalInCJ}`);
      console.log(`   Pages fetched: ${fetchResult.stats.pages}`);
      if (fetchResult.stats.errors > 0) {
        console.log(`   ⚠️  Errors: ${fetchResult.stats.errors}`);
      }
    }
    
    if (fetchResult.errors && fetchResult.errors.length > 0) {
      console.log('   Error details:');
      fetchResult.errors.forEach(err => console.log(`     - ${err}`));
    }
    console.log('');

    // Sync to Convex
    if (fetchResult.products && fetchResult.products.length > 0) {
      const syncStartTime = Date.now();
      const syncResult = await syncToConvex(convex, fetchResult.products, options);
      const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(1);
      
      console.log('');
      console.log(`✅ Sync complete in ${syncDuration}s`);
      console.log(`   Created: ${syncResult.created}`);
      console.log(`   Updated: ${syncResult.updated}`);
    } else {
      console.log('⚠️  No products to sync');
    }

    // Final stats
    if (!options.dryRun) {
      console.log('');
      const finalStats = await convex.query(api.cjMyProducts.getSyncStats, {});
      console.log(`📊 Final Convex stats: ${finalStats.totalProducts} products`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Done!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
