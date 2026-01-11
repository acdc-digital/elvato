import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../../auth/route';
import { 
  CJMyProduct,
  CJMyProductListResponse,
  CJ_RATE_LIMIT_ERROR 
} from '@/types/cj-dropshipping';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pageSize = Math.min(body.pageSize || 100, 200);
    const maxPages = body.maxPages || Infinity;
    
    console.log('[CJ Sync] Starting fetch...', { pageSize, maxPages });
    
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
      // Rate limit: wait between requests (CJ allows ~1-2 req/sec for most users)
      await delay(600);
      
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
    
    console.log(`[CJ Sync] Fetch complete! Total fetched: ${allProducts.length}`);
    
    return NextResponse.json({
      success: true,
      message: `Fetched ${allProducts.length} products from CJ`,
      products: allProducts,
      stats: {
        totalInCJ: total,
        fetched: allProducts.length,
        pages: totalPages,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[CJ Sync] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed',
        products: [],
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
