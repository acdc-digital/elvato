import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../auth/route';
import { 
  CJMyProductSearchParams, 
  CJMyProductListResponse,
  CJ_RATE_LIMIT_ERROR 
} from '@/types/cj-dropshipping';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Build query string from search params
 */
function buildQueryString(params: CJMyProductSearchParams): string {
  const queryParts: string[] = [];

  if (params.keyword) queryParts.push(`keyword=${encodeURIComponent(params.keyword)}`);
  if (params.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
  if (params.startAt) queryParts.push(`startAt=${encodeURIComponent(params.startAt)}`);
  if (params.endAt) queryParts.push(`endAt=${encodeURIComponent(params.endAt)}`);
  if (params.isListed !== undefined) queryParts.push(`isListed=${params.isListed}`);
  if (params.visiable !== undefined) queryParts.push(`visiable=${params.visiable}`);
  if (params.hasPacked !== undefined) queryParts.push(`hasPacked=${params.hasPacked}`);
  if (params.hasVirPacked !== undefined) queryParts.push(`hasVirPacked=${params.hasVirPacked}`);
  if (params.pageNum !== undefined) queryParts.push(`pageNum=${params.pageNum}`);
  if (params.pageSize !== undefined) queryParts.push(`pageSize=${params.pageSize}`);

  return queryParts.join('&');
}

/**
 * Fetch My Products from CJ API
 */
async function fetchMyProducts(params: CJMyProductSearchParams): Promise<CJMyProductListResponse> {
  const token = await getValidToken();
  const queryString = buildQueryString(params);
  const url = `${CJ_API_BASE}/product/myProduct/query${queryString ? `?${queryString}` : ''}`;

  console.log('[CJ API] Fetching My Products:', url);

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
  
  console.log('[CJ API] My Products RAW response:', JSON.stringify(data, null, 2).slice(0, 1000));
  console.log('[CJ API] My Products response code:', data.code);
  console.log('[CJ API] My Products message:', data.message);
  console.log('[CJ API] My Products data keys:', data.data ? Object.keys(data.data) : 'no data');
  console.log('[CJ API] My Products total:', data.data?.total);
  console.log('[CJ API] My Products list count:', data.data?.list?.length);
  
  return data;
}

/**
 * GET /api/cj/my-products - Fetch products from CJ "My Products"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: CJMyProductSearchParams = {};

    // Parse query parameters
    const keyword = searchParams.get('keyword');
    const categoryId = searchParams.get('categoryId');
    const startAt = searchParams.get('startAt');
    const endAt = searchParams.get('endAt');
    const isListed = searchParams.get('isListed');
    const visiable = searchParams.get('visiable');
    const pageNum = searchParams.get('pageNum');
    const pageSize = searchParams.get('pageSize');

    if (keyword) params.keyword = keyword;
    if (categoryId) params.categoryId = categoryId;
    if (startAt) params.startAt = startAt;
    if (endAt) params.endAt = endAt;
    if (isListed) params.isListed = parseInt(isListed, 10);
    if (visiable) params.visiable = parseInt(visiable, 10);
    if (pageNum) params.pageNum = parseInt(pageNum, 10);
    if (pageSize) params.pageSize = Math.min(parseInt(pageSize, 10), 200); // Max 200 per page

    // Default to page 1 with reasonable size
    if (!params.pageNum) params.pageNum = 1;
    if (!params.pageSize) params.pageSize = 100;

    const response = await fetchMyProducts(params);

    if (response.code === CJ_RATE_LIMIT_ERROR) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to fetch My Products from CJ API');
    }

    return NextResponse.json({
      success: true,
      products: response.data?.content || [],
      pagination: {
        pageNum: response.data?.pageNumber || 1,
        pageSize: response.data?.pageSize || 100,
        total: response.data?.totalRecords || 0,
        totalPages: response.data?.totalPages || 0,
      },
    });
  } catch (error) {
    console.error('CJ My Products error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch My Products',
        products: [],
        pagination: {
          pageNum: 1,
          pageSize: 100,
          total: 0,
          totalPages: 0,
        },
      },
      { status: 500 }
    );
  }
}
