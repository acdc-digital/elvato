import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../../auth/route';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

export interface CJProductDimensions {
  pid: string;
  productSku: string;
  productWeight: number; // grams
  materialName: string;
  materialNameEn: string;
  variants: Array<{
    vid: string;
    variantSku: string;
    variantName: string;
    variantNameEn: string;
    variantWeight: number; // grams
    variantLength: number; // mm
    variantWidth: number;  // mm
    variantHeight: number; // mm
  }>;
}

/**
 * GET /api/cj/products/dimensions?pid=xxx or ?productSku=xxx
 * 
 * Fetches product details including dimensions from CJ API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pid = searchParams.get('pid');
    const productSku = searchParams.get('productSku');

    if (!pid && !productSku) {
      return NextResponse.json(
        { success: false, error: 'Either pid or productSku is required' },
        { status: 400 }
      );
    }

    const token = await getValidToken();

    // Build query params
    const queryParam = pid ? `pid=${pid}` : `productSku=${productSku}`;
    console.log('[CJ API] Fetching product dimensions for:', queryParam);

    const response = await fetch(`${CJ_API_BASE}/product/query?${queryParam}`, {
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

    if (data.code !== 200) {
      throw new Error(data.message || 'Failed to fetch product details');
    }

    const product = data.data;
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Extract dimensions data
    const dimensions: CJProductDimensions = {
      pid: product.pid,
      productSku: product.productSku,
      productWeight: product.productWeight || 0,
      materialName: product.materialName || '',
      materialNameEn: product.materialNameEn || '',
      variants: [],
    };

    // Extract variant dimensions
    if (product.variants && Array.isArray(product.variants)) {
      dimensions.variants = product.variants.map((v: {
        vid: string;
        variantSku: string;
        variantName: string;
        variantNameEn: string;
        variantWeight: number;
        variantLength: number;
        variantWidth: number;
        variantHeight: number;
      }) => ({
        vid: v.vid,
        variantSku: v.variantSku,
        variantName: v.variantName || '',
        variantNameEn: v.variantNameEn || '',
        variantWeight: v.variantWeight || 0,
        variantLength: v.variantLength || 0,
        variantWidth: v.variantWidth || 0,
        variantHeight: v.variantHeight || 0,
      }));
    }

    console.log('[CJ API] Found dimensions for', dimensions.variants.length, 'variants');

    return NextResponse.json({
      success: true,
      data: dimensions,
    });
  } catch (error) {
    console.error('CJ Product Dimensions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product dimensions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cj/products/dimensions - Batch fetch dimensions for multiple products
 * Body: { pids: string[] } or { productSkus: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pids, productSkus } = body;

    if ((!pids || pids.length === 0) && (!productSkus || productSkus.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Either pids or productSkus array is required' },
        { status: 400 }
      );
    }

    const token = await getValidToken();
    const results: CJProductDimensions[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    // Process each product (with rate limiting awareness)
    const items = pids || productSkus;
    const queryType = pids ? 'pid' : 'productSku';

    for (const id of items) {
      try {
        const queryParam = `${queryType}=${id}`;
        
        const response = await fetch(`${CJ_API_BASE}/product/query?${queryParam}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        });

        if (!response.ok) {
          errors.push({ id, error: `HTTP ${response.status}` });
          continue;
        }

        const data = await response.json();

        if (data.code !== 200 || !data.data) {
          errors.push({ id, error: data.message || 'Product not found' });
          continue;
        }

        const product = data.data;
        const dimensions: CJProductDimensions = {
          pid: product.pid,
          productSku: product.productSku,
          productWeight: product.productWeight || 0,
          materialName: product.materialName || '',
          materialNameEn: product.materialNameEn || '',
          variants: [],
        };

        if (product.variants && Array.isArray(product.variants)) {
          dimensions.variants = product.variants.map((v: {
            vid: string;
            variantSku: string;
            variantName: string;
            variantNameEn: string;
            variantWeight: number;
            variantLength: number;
            variantWidth: number;
            variantHeight: number;
          }) => ({
            vid: v.vid,
            variantSku: v.variantSku,
            variantName: v.variantName || '',
            variantNameEn: v.variantNameEn || '',
            variantWeight: v.variantWeight || 0,
            variantLength: v.variantLength || 0,
            variantWidth: v.variantWidth || 0,
            variantHeight: v.variantHeight || 0,
          }));
        }

        results.push(dimensions);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      fetched: results.length,
      errors: errors.length,
      data: results,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('CJ Batch Dimensions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dimensions',
      },
      { status: 500 }
    );
  }
}
