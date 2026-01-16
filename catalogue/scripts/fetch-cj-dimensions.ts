#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Fetch Product Dimensions from CJ API
 * 
 * This script fetches product dimensions (weight, height, width, length, material)
 * from the CJ Dropshipping API and updates the Convex staging tables.
 * 
 * Usage:
 *   npx tsx scripts/fetch-cj-dimensions.ts
 * 
 * Options:
 *   --limit N       Only process first N products
 *   --product-id X  Process a specific Convex medusaProducts ID
 *   --dry-run       Show what would be fetched without updating
 *   --stats         Show current dimension stats
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8008';

interface CJDimensionsResponse {
  success: boolean;
  data?: {
    pid: string;
    productSku: string;
    productWeight: number;
    materialName: string;
    materialNameEn: string;
    variants: Array<{
      vid: string;
      variantSku: string;
      variantName: string;
      variantNameEn: string;
      variantWeight: number;
      variantLength: number;
      variantWidth: number;
      variantHeight: number;
    }>;
  };
  error?: string;
}

interface StagedProduct {
  _id: Id<"medusaProducts">;
  title: string;
  externalId: string; // CJ product ID
  material?: string;
  weight?: string;
}

async function fetchDimensionsFromCJ(pid: string): Promise<CJDimensionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cj/products/dimensions?pid=${pid}`);
  return response.json();
}

async function showStats(convex: ConvexHttpClient) {
  console.log('📊 Fetching dimension stats...\n');
  
  // Get all products
  const products = await convex.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  
  let withMaterial = 0;
  let withWeight = 0;
  let withoutDimensions = 0;
  
  for (const product of products) {
    if (product.material) withMaterial++;
    if (product.weight) withWeight++;
    if (!product.material && !product.weight) withoutDimensions++;
  }
  
  console.log(`Total products: ${products.length}`);
  console.log(`With material: ${withMaterial}`);
  console.log(`With weight: ${withWeight}`);
  console.log(`Without dimensions: ${withoutDimensions}`);
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   CJ Dimensions Fetch Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    stats: args.includes('--stats'),
    limit: 50,
    productId: '',
  };

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  const productIdIndex = args.indexOf('--product-id');
  if (productIdIndex !== -1 && args[productIdIndex + 1]) {
    options.productId = args[productIdIndex + 1];
  }

  console.log('Options:', options);
  console.log('');

  // Validate configuration
  if (!CONVEX_URL) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(CONVEX_URL);
  console.log(`🔗 Convex URL: ${CONVEX_URL}`);
  console.log(`📡 API URL: ${API_BASE_URL}`);
  console.log('');

  // Stats mode
  if (options.stats) {
    await showStats(convex);
    return;
  }

  try {
    let products: StagedProduct[];

    if (options.productId) {
      // Fetch specific product
      const product = await convex.query(api.medusaStaging.getProductWithChildren, {
        productId: options.productId as Id<"medusaProducts">,
      });
      if (!product) {
        console.error('❌ Product not found:', options.productId);
        process.exit(1);
      }
      products = [product as StagedProduct];
      console.log(`📦 Processing single product: ${product.title}`);
    } else {
      // Fetch products without dimensions
      const allProducts = await convex.query(api.medusaStaging.getAllProducts, { 
        limit: options.limit 
      });
      // Filter to only products without material set
      products = allProducts.filter((p): p is StagedProduct => !p.material);
      console.log(`📦 Found ${products.length} products without dimensions (limit: ${options.limit})`);
    }

    if (products.length === 0) {
      console.log('✅ All products already have dimensions!');
      return;
    }

    console.log('');
    
    let success = 0;
    let failed = 0;
    const updates: Array<{
      externalId: string;
      material?: string;
      productWeight?: number;
      variantDimensions?: Array<{
        variantTitle: string;
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
      }>;
    }> = [];

    for (const product of products) {
      console.log(`🔍 Fetching: ${product.title.substring(0, 50)}...`);
      
      try {
        const result = await fetchDimensionsFromCJ(product.externalId);
        
        if (!result.success || !result.data) {
          console.log(`   ⚠️  Failed: ${result.error || 'Unknown error'}`);
          failed++;
          continue;
        }

        const data = result.data;
        
        // Prepare update data
        const update: typeof updates[0] = {
          externalId: product.externalId,
        };

        if (data.materialNameEn || data.materialName) {
          // Clean up material - CJ returns it as JSON array string like '["Plastic"]'
          let material = data.materialNameEn || data.materialName;
          try {
            const parsed = JSON.parse(material);
            if (Array.isArray(parsed)) {
              material = parsed.join(', ');
            }
          } catch {
            // Not JSON, use as-is
          }
          update.material = material;
          console.log(`   📦 Material: ${update.material}`);
        }

        if (data.productWeight) {
          // CJ API returns weight as string, parse to number
          const weight = typeof data.productWeight === 'string' 
            ? parseFloat(data.productWeight) 
            : data.productWeight;
          update.productWeight = weight;
          console.log(`   ⚖️  Product weight: ${weight}g`);
        }

        if (data.variants && data.variants.length > 0) {
          update.variantDimensions = data.variants.map((v) => ({
            variantTitle: v.variantNameEn || v.variantName,
            weight: v.variantWeight || undefined,
            length: v.variantLength || undefined,
            width: v.variantWidth || undefined,
            height: v.variantHeight || undefined,
          }));
          
          const withDims = data.variants.filter(v => v.variantWeight || v.variantLength);
          console.log(`   📐 Variants with dimensions: ${withDims.length}/${data.variants.length}`);
        }

        updates.push(update);
        success++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        failed++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Fetch Complete: ${success} success, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    if (options.dryRun) {
      console.log('🔸 Dry run - no updates made');
      console.log('Sample update data:', JSON.stringify(updates.slice(0, 2), null, 2));
      return;
    }

    if (updates.length === 0) {
      console.log('No updates to apply.');
      return;
    }

    // Apply updates to Convex
    console.log(`💾 Applying ${updates.length} updates to Convex...`);
    
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const result = await convex.mutation(api.medusaStaging.bulkUpdateDimensions, {
        updates: batch,
      });
      console.log(`   Batch ${Math.floor(i / batchSize) + 1}: ${result.productsUpdated} products, ${result.variantsUpdated} variants`);
    }

    console.log('');
    console.log('✅ Done! Run --stats to verify.');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
