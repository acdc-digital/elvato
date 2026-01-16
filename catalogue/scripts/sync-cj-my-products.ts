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
 *   --no-descriptions  Skip fetching individual product descriptions
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

interface SyncResponse {
  success: boolean;
  stats?: {
    totalInCJ: number;
    fetched: number;
    saved: number;
    created: number;
    updated: number;
    pages: number;
    errors: number;
    withDescriptions?: number;
    removedFromShelves?: number;
  };
  error?: string;
  errors?: string[];
}

async function triggerSync(options: { fetchDescriptions?: boolean }): Promise<SyncResponse> {
  console.log('📡 Triggering CJ sync via API...');
  console.log(`   API URL: ${API_BASE_URL}/api/cj/my-products/sync`);
  if (options.fetchDescriptions !== false) {
    console.log('   ⏳ This may take 8-15 minutes for description fetching...');
  }
  console.log('   💾 Data will be saved to Convex in batches as it syncs');
  
  // Use AbortController with 60-minute timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60 * 60 * 1000);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/cj/my-products/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize: 100,
        fetchDescriptions: options.fetchDescriptions !== false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 60 minutes');
    }
    throw error;
  }
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
    noDescriptions: args.includes('--no-descriptions'),
  };

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
    if (options.clear) {
      console.log('🗑️  Clearing existing products...');
      const clearResult = await convex.mutation(api.cjMyProducts.clearAll, {});
      console.log(`   Deleted ${clearResult.deleted} products`);
      console.log('');
    }

    // Trigger sync - API now saves directly to Convex
    const startTime = Date.now();
    const syncResult = await triggerSync({ fetchDescriptions: !options.noDescriptions });

    if (!syncResult.success) {
      console.error('❌ Sync failed:', syncResult.error);
      process.exit(1);
    }

    const syncDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('');
    console.log(`✅ Sync complete in ${syncDuration} minutes`);
    
    if (syncResult.stats) {
      console.log(`   Total in CJ: ${syncResult.stats.totalInCJ}`);
      console.log(`   Fetched: ${syncResult.stats.fetched}`);
      console.log(`   Saved to Convex: ${syncResult.stats.saved}`);
      console.log(`   Created: ${syncResult.stats.created}`);
      console.log(`   Updated: ${syncResult.stats.updated}`);
      if (syncResult.stats.withDescriptions !== undefined) {
        console.log(`   With descriptions: ${syncResult.stats.withDescriptions}`);
      }
      if (syncResult.stats.removedFromShelves !== undefined && syncResult.stats.removedFromShelves > 0) {
        console.log(`   ⚠️  Removed from shelves: ${syncResult.stats.removedFromShelves}`);
      }
      if (syncResult.stats.errors > 0) {
        console.log(`   ⚠️  Errors: ${syncResult.stats.errors}`);
      }
    }
    
    if (syncResult.errors && syncResult.errors.length > 0) {
      console.log('   Error details:');
      syncResult.errors.forEach(err => console.log(`     - ${err}`));
    }

    // Final stats from Convex
    console.log('');
    const finalStats = await convex.query(api.cjMyProducts.getSyncStats, {});
    const removedCount = await convex.query(api.cjMyProducts.getRemovedCount, {});
    console.log(`📊 Final Convex stats: ${finalStats.totalProducts} products`);
    if (removedCount > 0) {
      console.log(`   ⚠️  Total removed from shelves: ${removedCount}`);
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
