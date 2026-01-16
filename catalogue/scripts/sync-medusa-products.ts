#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Sync Medusa PostgreSQL Products to Convex
 * 
 * This script fetches all products from the Medusa PostgreSQL database
 * and syncs them to the Convex medusa staging tables.
 * 
 * Usage:
 *   npx tsx scripts/sync-medusa-products.ts
 * 
 * Options:
 *   --clear    Clear all existing staging products before syncing
 *   --dry-run  Fetch products but don't sync to Convex
 *   --limit N  Only sync first N products (for testing)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Configuration
const DATABASE_URL = process.env.MEDUSA_DATABASE_URL || 'postgres://matthewsimon@localhost/medusa-elvato';
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const BATCH_SIZE = 10; // Products per Convex mutation batch

interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  is_giftcard: boolean;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  thumbnail: string | null;
  discountable: boolean;
  metadata: Record<string, unknown> | null;
}

interface MedusaVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  allow_backorder: boolean;
  manage_inventory: boolean;
}

interface MedusaImage {
  id: string;
  product_id: string;
  url: string;
  rank: number;
}

interface MedusaPrice {
  variant_id: string;
  currency_code: string;
  amount: number;
}

interface TransformedProduct {
  title: string;
  handle: string;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  isGiftcard: boolean;
  discountable: boolean;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
  variants: {
    title: string;
    sku?: string;
    medusaVariantId: string;
    allowBackorder: boolean;
    manageInventory: boolean;
    prices: { currencyCode: string; amount: number }[];
  }[];
  images: { url: string; rank: number }[];
}

async function fetchProductsFromMedusa(client: Client): Promise<TransformedProduct[]> {
  console.log('📡 Fetching products from Medusa PostgreSQL...');
  
  // Fetch products
  const productsResult = await client.query<MedusaProduct>(`
    SELECT id, title, handle, subtitle, description, is_giftcard, status, thumbnail, discountable, metadata
    FROM product
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);
  console.log(`   Found ${productsResult.rows.length} products`);
  
  // Fetch variants
  const variantsResult = await client.query<MedusaVariant>(`
    SELECT id, product_id, title, sku, allow_backorder, manage_inventory
    FROM product_variant
    WHERE deleted_at IS NULL
    ORDER BY variant_rank ASC
  `);
  console.log(`   Found ${variantsResult.rows.length} variants`);
  
  // Fetch images
  const imagesResult = await client.query<MedusaImage>(`
    SELECT id, product_id, url, rank
    FROM image
    WHERE deleted_at IS NULL
    ORDER BY rank ASC
  `);
  console.log(`   Found ${imagesResult.rows.length} images`);
  
  // Fetch prices (via price_set linkage)
  const pricesResult = await client.query<MedusaPrice>(`
    SELECT 
      pvps.variant_id,
      p.currency_code,
      p.amount
    FROM product_variant_price_set pvps
    JOIN price p ON p.price_set_id = pvps.price_set_id
    WHERE p.deleted_at IS NULL
  `);
  console.log(`   Found ${pricesResult.rows.length} prices`);
  
  // Build lookup maps
  const variantsByProduct = new Map<string, MedusaVariant[]>();
  variantsResult.rows.forEach(v => {
    const list = variantsByProduct.get(v.product_id) || [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  });
  
  const imagesByProduct = new Map<string, MedusaImage[]>();
  imagesResult.rows.forEach(img => {
    const list = imagesByProduct.get(img.product_id) || [];
    list.push(img);
    imagesByProduct.set(img.product_id, list);
  });
  
  const pricesByVariant = new Map<string, MedusaPrice[]>();
  pricesResult.rows.forEach(p => {
    const list = pricesByVariant.get(p.variant_id) || [];
    list.push(p);
    pricesByVariant.set(p.variant_id, list);
  });
  
  // Transform to Convex format
  const transformed: TransformedProduct[] = productsResult.rows.map(product => {
    const variants = variantsByProduct.get(product.id) || [];
    const images = imagesByProduct.get(product.id) || [];
    
    return {
      title: product.title,
      handle: product.handle,
      status: product.status,
      isGiftcard: product.is_giftcard,
      discountable: product.discountable,
      subtitle: product.subtitle || undefined,
      description: product.description || undefined,
      thumbnail: product.thumbnail || undefined,
      externalId: product.id,
      metadata: product.metadata || undefined,
      variants: variants.map(v => ({
        title: v.title,
        sku: v.sku || undefined,
        medusaVariantId: v.id,
        allowBackorder: v.allow_backorder,
        manageInventory: v.manage_inventory,
        prices: (pricesByVariant.get(v.id) || []).map(p => ({
          currencyCode: p.currency_code,
          amount: Number(p.amount),
        })),
      })),
      images: images.map(img => ({
        url: img.url,
        rank: img.rank,
      })),
    };
  });
  
  return transformed;
}

async function syncToConvex(
  convex: ConvexHttpClient,
  products: TransformedProduct[],
  options: { dryRun?: boolean; limit?: number }
): Promise<{ productsCreated: number; productsUpdated: number; variantsCreated: number; imagesCreated: number; pricesCreated: number }> {
  let productsToSync = products;
  
  if (options.limit && options.limit > 0) {
    productsToSync = products.slice(0, options.limit);
    console.log(`🔢 Limiting to first ${options.limit} products`);
  }

  if (options.dryRun) {
    console.log('🧪 Dry run mode - not syncing to Convex');
    console.log(`   Would sync ${productsToSync.length} products`);
    productsToSync.forEach(p => {
      console.log(`   - ${p.title} (${p.variants.length} variants, ${p.images.length} images)`);
    });
    return { productsCreated: 0, productsUpdated: 0, variantsCreated: 0, imagesCreated: 0, pricesCreated: 0 };
  }

  console.log(`📤 Syncing ${productsToSync.length} products to Convex...`);
  
  let totalStats = { productsCreated: 0, productsUpdated: 0, variantsCreated: 0, imagesCreated: 0, pricesCreated: 0 };
  const batches = Math.ceil(productsToSync.length / BATCH_SIZE);

  for (let i = 0; i < productsToSync.length; i += BATCH_SIZE) {
    const batch = productsToSync.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    process.stdout.write(`   Batch ${batchNum}/${batches} (${batch.length} products)...`);
    
    try {
      const result = await convex.mutation(api.medusaStaging.batchImportFromMedusa, {
        products: batch,
      });
      
      totalStats.productsCreated += result.productsCreated;
      totalStats.productsUpdated += result.productsUpdated;
      totalStats.variantsCreated += result.variantsCreated;
      totalStats.imagesCreated += result.imagesCreated;
      totalStats.pricesCreated += result.pricesCreated;
      
      console.log(` ✓ (${result.productsCreated} new, ${result.productsUpdated} updated)`);
    } catch (error) {
      console.log(` ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return totalStats;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Medusa PostgreSQL → Convex Sync Script');
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
    process.exit(1);
  }

  // Initialize clients
  const convex = new ConvexHttpClient(CONVEX_URL);
  const pgClient = new Client({ connectionString: DATABASE_URL });
  
  console.log(`🔗 Convex URL: ${CONVEX_URL}`);
  console.log(`🐘 PostgreSQL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');

  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Get current Convex stats
    const currentStats = await convex.query(api.medusaStaging.getSyncStats, {});
    console.log(`📊 Current Convex staging stats:`);
    console.log(`   Products: ${currentStats.products.total} (${currentStats.products.synced} synced)`);
    console.log(`   Variants: ${currentStats.variants}`);
    console.log(`   Images: ${currentStats.images}`);
    console.log(`   Prices: ${currentStats.prices}`);
    console.log('');

    // Clear if requested
    if (options.clear && !options.dryRun) {
      console.log('🗑️  Clearing existing staging data...');
      const clearResult = await convex.mutation(api.medusaStaging.clearAllStaging, {});
      console.log(`   Deleted: ${JSON.stringify(clearResult.deleted)}`);
      console.log('');
    }

    // Fetch from Medusa
    const startTime = Date.now();
    const products = await fetchProductsFromMedusa(pgClient);
    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Fetched ${products.length} products in ${fetchDuration}s`);
    console.log('');

    // Sync to Convex
    if (products.length > 0) {
      const syncStartTime = Date.now();
      const syncResult = await syncToConvex(convex, products, options);
      const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(1);
      
      console.log('');
      console.log(`✅ Sync complete in ${syncDuration}s`);
      console.log(`   Products: ${syncResult.productsCreated} created, ${syncResult.productsUpdated} updated`);
      console.log(`   Variants: ${syncResult.variantsCreated} created`);
      console.log(`   Images: ${syncResult.imagesCreated} created`);
      console.log(`   Prices: ${syncResult.pricesCreated} created`);
    } else {
      console.log('⚠️  No products to sync');
    }

    // Final stats
    if (!options.dryRun) {
      console.log('');
      const finalStats = await convex.query(api.medusaStaging.getSyncStats, {});
      console.log(`📊 Final Convex staging stats:`);
      console.log(`   Products: ${finalStats.products.total}`);
      console.log(`   Variants: ${finalStats.variants}`);
      console.log(`   Images: ${finalStats.images}`);
      console.log(`   Prices: ${finalStats.prices}`);
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
  } finally {
    await pgClient.end();
  }
}

main();
