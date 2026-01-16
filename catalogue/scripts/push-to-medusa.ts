#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Push Staged Products from Convex to Medusa
 * 
 * This script reads products from the Convex medusaProducts staging table
 * that are marked as ready to sync, and creates them in Medusa via the Admin API.
 * 
 * Usage:
 *   npx tsx scripts/push-to-medusa.ts
 * 
 * Options:
 *   --dry-run     Show what would be pushed without actually pushing
 *   --limit N     Only push first N products
 *   --product-id  Push a specific Convex medusaProducts ID
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
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

// Store session token after authentication
let authToken: string | null = null;

async function authenticateWithMedusa(): Promise<boolean> {
  if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
    console.error('❌ MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set');
    return false;
  }
  
  try {
    // First, get a session by logging in
    const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: MEDUSA_ADMIN_EMAIL,
        password: MEDUSA_ADMIN_PASSWORD,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Authentication failed: ${response.status} - ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    authToken = result.token;
    console.log('✅ Authenticated with Medusa Admin API');
    return true;
  } catch (error) {
    console.error('❌ Authentication error:', error instanceof Error ? error.message : error);
    return false;
  }
}

interface StagedProduct {
  _id: Id<"medusaProducts">;
  title: string;
  handle: string;
  externalId: string; // CJ product ID
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  isGiftcard: boolean;
  discountable: boolean;
  description?: string;
  thumbnail?: string;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  originCountry?: string;
  hsCode?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  variants: {
    _id: Id<"medusaProductVariants">;
    title: string;
    sku?: string;
    allowBackorder: boolean;
    manageInventory: boolean;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    options?: Record<string, string>;
    prices: {
      currencyCode: string;
      amount: number;
    }[];
  }[];
  images: {
    url: string;
    rank: number;
  }[];
}

interface MedusaProductPayload {
  title: string;
  handle?: string;
  external_id?: string;
  status?: string;
  is_giftcard?: boolean;
  discountable?: boolean;
  description?: string;
  thumbnail?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  origin_country?: string;
  hs_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  images?: { url: string }[];
  options?: { title: string; values: string[] }[];
  variants?: {
    title: string;
    sku?: string;
    allow_backorder?: boolean;
    manage_inventory?: boolean;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    prices?: { currency_code: string; amount: number }[];
    options?: Record<string, string>;
  }[];
}

async function createProductInMedusa(
  product: StagedProduct,
  dryRun: boolean
): Promise<{ success: boolean; medusaId?: string; variantMappings?: { convexVariantId: Id<"medusaProductVariants">; medusaVariantId: string }[]; error?: string }> {
  
  // Transform to Medusa API format
  const payload: MedusaProductPayload = {
    title: product.title,
    handle: product.handle,
    status: product.status,
    is_giftcard: product.isGiftcard,
    discountable: product.discountable,
    description: product.description || '',
    thumbnail: product.thumbnail,
    metadata: product.metadata,
    external_id: product.externalId, // CJ product ID for reference
  };
  
  // Add physical attributes
  // Material: use stored material, or extract from metadata.extractedSpecs
  if (product.material) {
    payload.material = product.material;
  } else if (product.metadata?.extractedSpecs && typeof product.metadata.extractedSpecs === 'object') {
    const specs = product.metadata.extractedSpecs as Record<string, string>;
    if (specs.Material) {
      payload.material = specs.Material;
    }
  }
  
  // Origin country: default to CN for all CJ products
  payload.origin_country = product.originCountry || 'CN';
  
  // Weight (convert string to number if needed)
  if (product.weight) {
    const weight = typeof product.weight === 'string' ? parseFloat(product.weight) : product.weight;
    if (!isNaN(weight)) payload.weight = weight;
  }
  
  // Dimensions (convert string to number if needed)
  if (product.length) {
    const length = typeof product.length === 'string' ? parseFloat(product.length) : product.length;
    if (!isNaN(length)) payload.length = length;
  }
  if (product.height) {
    const height = typeof product.height === 'string' ? parseFloat(product.height) : product.height;
    if (!isNaN(height)) payload.height = height;
  }
  if (product.width) {
    const width = typeof product.width === 'string' ? parseFloat(product.width) : product.width;
    if (!isNaN(width)) payload.width = width;
  }
  
  // HS Code if available
  if (product.hsCode) {
    payload.hs_code = product.hsCode;
  }
  
  // Add images
  if (product.images && product.images.length > 0) {
    payload.images = product.images
      .sort((a, b) => a.rank - b.rank)
      .map(img => ({ url: img.url }));
  }
  
  // Add options and variants
  // Medusa v2 requires at least one option for products with variants
  if (product.variants && product.variants.length > 0) {
    // Build options dynamically from variant options data
    // Collect all unique option titles and their values
    const optionsMap = new Map<string, Set<string>>();
    
    for (const variant of product.variants) {
      if (variant.options) {
        for (const [optionTitle, optionValue] of Object.entries(variant.options)) {
          if (!optionsMap.has(optionTitle)) {
            optionsMap.set(optionTitle, new Set());
          }
          optionsMap.get(optionTitle)!.add(optionValue);
        }
      }
    }
    
    // If no options found in variants, fall back to Default
    if (optionsMap.size === 0) {
      const uniqueVariantTitles = [...new Set(product.variants.map(v => v.title))];
      payload.options = [{
        title: 'Default',
        values: uniqueVariantTitles.length > 0 ? uniqueVariantTitles : ['Default'],
      }];
    } else {
      // Build options array from collected data
      payload.options = Array.from(optionsMap.entries()).map(([title, values]) => ({
        title,
        values: Array.from(values),
      }));
    }
    
    payload.variants = product.variants.map(variant => {
      const v: MedusaProductPayload['variants'][0] = {
        title: variant.title,
        sku: variant.sku,
        allow_backorder: variant.allowBackorder,
        manage_inventory: variant.manageInventory,
        // Use variant's options if available, otherwise fallback to Default
        options: variant.options || { Default: variant.title },
      };
      
      if (variant.weight) v.weight = variant.weight;
      if (variant.length) v.length = variant.length;
      if (variant.height) v.height = variant.height;
      if (variant.width) v.width = variant.width;
      
      // Add prices
      if (variant.prices && variant.prices.length > 0) {
        v.prices = variant.prices.map(p => ({
          currency_code: p.currencyCode.toLowerCase(),
          amount: p.amount, // Already in cents
        }));
      }
      
      return v;
    });
  }
  
  if (dryRun) {
    console.log('   📋 Payload:', JSON.stringify(payload, null, 2));
    return { success: true, medusaId: 'dry-run-id' };
  }
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }
    
    const result = await response.json();
    const createdProduct = result.product;
    
    // Map variant IDs
    const variantMappings: { convexVariantId: Id<"medusaProductVariants">; medusaVariantId: string }[] = [];
    
    if (createdProduct.variants && product.variants) {
      // Match by SKU or order
      for (let i = 0; i < product.variants.length; i++) {
        const convexVariant = product.variants[i];
        const medusaVariant = createdProduct.variants.find(
          (mv: { sku?: string }) => mv.sku === convexVariant.sku
        ) || createdProduct.variants[i];
        
        if (medusaVariant) {
          variantMappings.push({
            convexVariantId: convexVariant._id,
            medusaVariantId: medusaVariant.id,
          });
        }
      }
    }
    
    return { 
      success: true, 
      medusaId: createdProduct.id,
      variantMappings,
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Convex → Medusa Push Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    limit: 10,
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
  console.log(`🏪 Medusa Backend: ${MEDUSA_BACKEND_URL}`);
  console.log('');

  try {
    // Authenticate with Medusa (unless dry-run)
    if (!options.dryRun) {
      const authenticated = await authenticateWithMedusa();
      if (!authenticated) {
        console.error('❌ Failed to authenticate with Medusa');
        process.exit(1);
      }
      console.log('');
    }
    
    // Get products ready to sync
    let products: StagedProduct[];
    
    if (options.productId) {
      // Fetch specific product
      const product = await convex.query(api.medusaStaging.getProductWithChildren, {
        productId: options.productId as Id<"medusaProducts">,
      });
      
      if (!product) {
        console.error(`❌ Product not found: ${options.productId}`);
        process.exit(1);
      }
      
      products = [product as StagedProduct];
      console.log(`📦 Fetched specific product: ${product.title}`);
    } else {
      // Fetch products ready to sync
      products = await convex.query(api.medusaStaging.getProductsReadyToSync, {
        limit: options.limit,
      }) as StagedProduct[];
      console.log(`📦 Found ${products.length} products ready to sync`);
    }
    
    if (products.length === 0) {
      console.log('');
      console.log('⚠️  No products ready to sync.');
      console.log('   Use stageCjProduct mutation to stage a product, then markReadyToSync to mark it ready.');
      console.log('');
      process.exit(0);
    }
    
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of products) {
      console.log(`📤 Pushing: ${product.title}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Variants: ${product.variants?.length || 0}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      
      // Mark as syncing
      if (!options.dryRun) {
        await convex.mutation(api.medusaStaging.updateSyncStatus, {
          medusaProductId: product._id,
          status: 'syncing',
        });
      }
      
      const result = await createProductInMedusa(product, options.dryRun);
      
      if (result.success) {
        console.log(`   ✅ Success! Medusa ID: ${result.medusaId}`);
        successCount++;
        
        // Update sync status
        if (!options.dryRun) {
          await convex.mutation(api.medusaStaging.updateSyncStatus, {
            medusaProductId: product._id,
            status: 'synced',
            medusaId: result.medusaId,
            variantMappings: result.variantMappings,
          });
        }
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failCount++;
        
        // Update sync status
        if (!options.dryRun) {
          await convex.mutation(api.medusaStaging.updateSyncStatus, {
            medusaProductId: product._id,
            status: 'failed',
            error: result.error,
          });
        }
      }
      
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Done! Success: ${successCount}, Failed: ${failCount}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
