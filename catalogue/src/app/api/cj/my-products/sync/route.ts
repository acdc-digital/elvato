import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../../auth/route';
import { 
  CJMyProduct,
  CJMyProductListResponse,
  CJ_RATE_LIMIT_ERROR 
} from '@/types/cj-dropshipping';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const SAVE_BATCH_SIZE = 50; // Save to Convex every 50 products
const PARALLEL_DESCRIPTION_FETCHES = 3; // Fetch 3 descriptions in parallel

/**
 * Fetch product details (including description) from CJ API
 * Includes retry logic for rate limiting (429 errors)
 */
interface ProductDetailsResult {
  description?: string;
  isRemovedFromShelves?: boolean;
  cjStatusMessage?: string;
  error?: string;
}

async function fetchProductDetails(
  token: string,
  productId: string,
  retryCount = 0
): Promise<ProductDetailsResult> {
  const url = `${CJ_API_BASE}/product/query?pid=${productId}`;
  const maxRetries = 3;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
    });

    // Handle rate limiting with exponential backoff retry
    if (response.status === 429) {
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount + 1) * 2000; // 4s, 8s, 16s backoff
        console.log(`[CJ Sync] Rate limited, waiting ${waitTime/1000}s before retry ${retryCount + 1}/${maxRetries}...`);
        await delay(waitTime);
        return fetchProductDetails(token, productId, retryCount + 1);
      }
      return { error: `HTTP 429 (rate limited after ${maxRetries} retries)` };
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    // Check for "removed from shelves" message
    if (data.message && data.message.toLowerCase().includes('removed from shelves')) {
      return {
        isRemovedFromShelves: true,
        cjStatusMessage: data.message,
      };
    }
    
    if (data.code !== 200 || !data.data) {
      return { error: data.message || 'Failed to fetch product details' };
    }

    return { 
      description: data.data.description || undefined,
      isRemovedFromShelves: false,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch a single page of My Products from CJ API
 */
async function fetchMyProductsPage(
  token: string, 
  pageNum: number, 
  pageSize: number = 100
): Promise<CJMyProductListResponse> {
  const url = `${CJ_API_BASE}/product/myProduct/query?pageNum=${pageNum}&pageSize=${pageSize}`;

  console.log(`[CJ Sync] Fetching page ${pageNum}...`);
  console.log(`[CJ Sync] URL: ${url}`);
  console.log(`[CJ Sync] Token (first 20 chars): ${token?.substring(0, 20)}...`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`CJ API request failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Debug: Log the raw response
  console.log(`[CJ Sync] RAW Response:`, JSON.stringify(data, null, 2).slice(0, 2000));
  
  return data;
}

/**
 * Transform CJ My Product to Convex-compatible format
 */
function transformProduct(product: CJMyProduct) {
  // Handle productName which can be string[] or sometimes a JSON string
  let productNames: string[] = [];
  if (Array.isArray(product.productName)) {
    productNames = product.productName;
  } else if (typeof product.productName === 'string') {
    try {
      productNames = JSON.parse(product.productName);
    } catch {
      productNames = [product.productName];
    }
  }

  // Convert createAt from Unix timestamp (ms) to ISO string
  let cjCreatedAt: string;
  if (typeof product.createAt === 'number') {
    cjCreatedAt = new Date(product.createAt).toISOString();
  } else if (typeof product.createAt === 'string') {
    cjCreatedAt = product.createAt;
  } else {
    cjCreatedAt = new Date().toISOString();
  }

  // Handle price which can be a range like "33.87-130.65" or a single value
  let price = 0;
  if (typeof product.totalPrice === 'number') {
    price = product.totalPrice;
  } else if (typeof product.totalPrice === 'string') {
    // Take the first (lowest) price from range
    const priceStr = product.totalPrice.split('-')[0];
    price = parseFloat(priceStr) || 0;
  }

  return {
    cjProductId: product.productId,
    sku: product.sku || '',
    nameEn: product.nameEn || productNames[0] || 'Unknown',
    productNames,
    bigImage: product.bigImage || '',
    price,
    productType: typeof product.productType === 'string' ? parseInt(product.productType, 10) : (product.productType || 0),
    listedShopNum: product.listedShopNum,
    cjCreatedAt,
  };
}

/**
 * Add delay between API calls to respect rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface TransformedProduct {
  cjProductId: string;
  sku: string;
  nameEn: string;
  productNames: string[];
  bigImage: string;
  price: number;
  productType: number;
  listedShopNum?: string;
  cjCreatedAt: string;
  description?: string;
  isRemovedFromShelves?: boolean;
  cjStatusMessage?: string;
}

/**
 * POST /api/cj/my-products/sync - Fetch all My Products from CJ for syncing
 * 
 * This endpoint fetches all products from CJ's "My Products" section
 * and returns them in a format ready to be synced to Convex.
 * 
 * The actual Convex sync should be done client-side using the returned data.
 * 
 * Options:
 * - pageSize: Number of products per page (max 200, default 100)
 * - maxPages: Maximum pages to fetch (for testing, default unlimited)
 * - fetchDescriptions: Whether to fetch descriptions for each product (default true)
 * - descriptionBatchSize: How many descriptions to fetch at once (default 5)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pageSize = Math.min(body.pageSize || 100, 200);
    const maxPages = body.maxPages || Infinity;
    const fetchDescriptions = body.fetchDescriptions !== false; // Default true
    const descriptionBatchSize = body.descriptionBatchSize || 5;
    
    console.log('[CJ Sync] Starting fetch...', { pageSize, maxPages, fetchDescriptions });
    
    // Get auth token
    const token = await getValidToken();
    
    // Fetch first page to get total count
    const firstPage = await fetchMyProductsPage(token, 1, pageSize);
    
    if (firstPage.code === CJ_RATE_LIMIT_ERROR) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait and try again.',
          rateLimited: true,
        },
        { status: 429 }
      );
    }
    
    if (firstPage.code !== 200) {
      throw new Error(firstPage.message || 'Failed to fetch My Products from CJ API');
    }
    
    const total = firstPage.data?.totalRecords || 0;
    const totalPages = Math.min(firstPage.data?.totalPages || Math.ceil(total / pageSize), maxPages);
    
    console.log(`[CJ Sync] Total products: ${total}, Pages to fetch: ${totalPages}`);
    
    const allProducts: TransformedProduct[] = [];
    const errors: string[] = [];
    
    // Process first page
    if (firstPage.data?.content?.length) {
      const transformedProducts = firstPage.data.content.map(transformProduct);
      allProducts.push(...transformedProducts);
      console.log(`[CJ Sync] Page 1: fetched ${transformedProducts.length} products`);
    }
    
    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      // Rate limit: wait between requests
      await delay(400);
      
      try {
        let pageData = await fetchMyProductsPage(token, page, pageSize);
        
        if (pageData.code === CJ_RATE_LIMIT_ERROR) {
          console.warn(`[CJ Sync] Rate limited on page ${page}, waiting 5s...`);
          await delay(5000);
          
          // Retry once
          pageData = await fetchMyProductsPage(token, page, pageSize);
          if (pageData.code !== 200) {
            errors.push(`Page ${page}: Rate limited after retry`);
            continue;
          }
        }
        
        if (pageData.code !== 200) {
          errors.push(`Page ${page}: ${pageData.message || 'Unknown error'}`);
          continue;
        }
        
        if (pageData.data?.content?.length) {
          const transformedProducts = pageData.data.content.map(transformProduct);
          allProducts.push(...transformedProducts);
          console.log(`[CJ Sync] Page ${page}/${totalPages}: fetched ${transformedProducts.length} products`);
        }
      } catch (error) {
        const msg = `Page ${page} error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('[CJ Sync]', msg);
        errors.push(msg);
      }
    }

    // Initialize Convex client for direct saves
    const convex = new ConvexHttpClient(CONVEX_URL);
    let totalSaved = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalRemoved = 0;

    // Helper function to save a batch to Convex
    async function saveBatchToConvex(batch: TransformedProduct[]) {
      if (batch.length === 0) return;
      try {
        const result = await convex.mutation(api.cjMyProducts.batchUpsert, {
          products: batch,
        });
        totalSaved += batch.length;
        totalCreated += result.created;
        totalUpdated += result.updated;
        totalRemoved += result.removed || 0;
        console.log(`[CJ Sync] Saved batch to Convex: ${result.created} new, ${result.updated} updated, ${result.removed || 0} removed`);
      } catch (err) {
        console.error('[CJ Sync] Failed to save batch to Convex:', err);
      }
    }

    // Fetch descriptions for each product (parallel with adaptive rate limiting)
    // Save to Convex in batches as we go
    if (fetchDescriptions && allProducts.length > 0) {
      console.log(`[CJ Sync] Fetching descriptions for ${allProducts.length} products (${PARALLEL_DESCRIPTION_FETCHES} parallel)...`);
      console.log(`[CJ Sync] Estimated time: ~${Math.ceil(allProducts.length / PARALLEL_DESCRIPTION_FETCHES * 1.2 / 60)} minutes`);
      console.log(`[CJ Sync] Saving to Convex every ${SAVE_BATCH_SIZE} products`);
      let descriptionsLoaded = 0;
      let rateLimitHits = 0;
      let currentDelay = 800; // Start with 800ms between batches
      let pendingBatch: TransformedProduct[] = [];
      
      // Process in parallel chunks
      for (let i = 0; i < allProducts.length; i += PARALLEL_DESCRIPTION_FETCHES) {
        const chunk = allProducts.slice(i, i + PARALLEL_DESCRIPTION_FETCHES);
        
        // Fetch descriptions in parallel
        const results = await Promise.all(
          chunk.map(product => 
            fetchProductDetails(token, product.cjProductId)
              .then(result => ({ product, result }))
          )
        );
        
        // Process results
        for (const { product, result } of results) {
          // Check if we hit a rate limit
          if (result.error?.includes('429')) {
            rateLimitHits++;
            currentDelay = Math.min(currentDelay + 300, 4000);
          } else if (rateLimitHits > 0 && !result.error) {
            currentDelay = Math.max(currentDelay - 50, 600);
          }
          
          if (result.isRemovedFromShelves) {
            product.isRemovedFromShelves = true;
            product.cjStatusMessage = result.cjStatusMessage;
          } else if (result.description) {
            product.description = result.description;
            product.isRemovedFromShelves = false;
            descriptionsLoaded++;
          } else if (result.error) {
            console.warn(`[CJ Sync] Could not fetch description for ${product.cjProductId}: ${result.error}`);
          }
          
          pendingBatch.push(product);
        }
        
        // Save batch when it reaches the threshold
        if (pendingBatch.length >= SAVE_BATCH_SIZE) {
          await saveBatchToConvex(pendingBatch);
          pendingBatch = [];
        }
        
        // Delay before next parallel batch
        if (i + PARALLEL_DESCRIPTION_FETCHES < allProducts.length) {
          await delay(currentDelay);
        }
        
        // Log progress every ~50 products
        const processed = Math.min(i + PARALLEL_DESCRIPTION_FETCHES, allProducts.length);
        if (processed % 50 < PARALLEL_DESCRIPTION_FETCHES || processed === allProducts.length) {
          console.log(`[CJ Sync] Progress: ${processed}/${allProducts.length} (${descriptionsLoaded} descriptions, ${totalSaved} saved, delay: ${currentDelay}ms)`);
        }
      }
      
      // Save any remaining products
      if (pendingBatch.length > 0) {
        await saveBatchToConvex(pendingBatch);
      }
      
      console.log(`[CJ Sync] Descriptions loaded: ${descriptionsLoaded}/${allProducts.length}`);
      if (rateLimitHits > 0) {
        console.log(`[CJ Sync] Rate limit hits during sync: ${rateLimitHits}`);
      }
    } else {
      // No descriptions - just save all products directly
      console.log(`[CJ Sync] Saving ${allProducts.length} products to Convex (no descriptions)...`);
      for (let i = 0; i < allProducts.length; i += SAVE_BATCH_SIZE) {
        const batch = allProducts.slice(i, i + SAVE_BATCH_SIZE);
        await saveBatchToConvex(batch);
      }
    }
    
    console.log(`[CJ Sync] Sync complete! Total saved: ${totalSaved}`);
    console.log(`[CJ Sync] Created: ${totalCreated}, Updated: ${totalUpdated}, Removed: ${totalRemoved}`);
    
    const removedCount = allProducts.filter(p => p.isRemovedFromShelves).length;
    
    return NextResponse.json({
      success: true,
      message: `Synced ${totalSaved} products to Convex`,
      stats: {
        totalInCJ: total,
        fetched: allProducts.length,
        saved: totalSaved,
        created: totalCreated,
        updated: totalUpdated,
        pages: totalPages,
        errors: errors.length,
        withDescriptions: allProducts.filter(p => p.description).length,
        removedFromShelves: removedCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[CJ Sync] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cj/my-products/sync - Get info about CJ My Products
 * Returns total count without fetching all products
 */
export async function GET() {
  try {
    const token = await getValidToken();
    
    // Fetch just one product to get the total count
    const response = await fetchMyProductsPage(token, 1, 1);
    
    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to fetch from CJ API');
    }
    
    return NextResponse.json({
      success: true,
      totalProducts: response.data?.totalRecords || 0,
      message: `CJ My Products contains ${response.data?.totalRecords || 0} products`,
    });
  } catch (error) {
    console.error('[CJ Sync] Info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get info',
      },
      { status: 500 }
    );
  }
}
