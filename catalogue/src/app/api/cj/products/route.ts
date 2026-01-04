import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../auth/route';
import { 
  CJSearchParams, 
  CJProductListResponse, 
  CJProduct,
  DEFAULT_LIGHTING_SEARCH,
  CJ_RATE_LIMIT_ERROR 
} from '@/types/cj-dropshipping';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Build query string from search params
 */
function buildQueryString(params: CJSearchParams): string {
  const queryParts: string[] = [];

  // Add each parameter if it exists
  if (params.keyWord) queryParts.push(`keyWord=${encodeURIComponent(params.keyWord)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.size) queryParts.push(`size=${params.size}`);
  if (params.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
  if (params.countryCode) queryParts.push(`countryCode=${params.countryCode}`);
  if (params.startSellPrice !== undefined) queryParts.push(`startSellPrice=${params.startSellPrice}`);
  if (params.endSellPrice !== undefined) queryParts.push(`endSellPrice=${params.endSellPrice}`);
  if (params.addMarkStatus !== undefined) queryParts.push(`addMarkStatus=${params.addMarkStatus}`);
  if (params.productType !== undefined) queryParts.push(`productType=${params.productType}`);
  if (params.productFlag !== undefined) queryParts.push(`productFlag=${params.productFlag}`);
  if (params.startWarehouseInventory !== undefined) queryParts.push(`startWarehouseInventory=${params.startWarehouseInventory}`);
  if (params.endWarehouseInventory !== undefined) queryParts.push(`endWarehouseInventory=${params.endWarehouseInventory}`);
  if (params.verifiedWarehouse !== undefined) queryParts.push(`verifiedWarehouse=${params.verifiedWarehouse}`);
  if (params.isWarehouse !== undefined) queryParts.push(`isWarehouse=${params.isWarehouse}`);
  if (params.currency) queryParts.push(`currency=${params.currency}`);
  if (params.sort) queryParts.push(`sort=${params.sort}`);
  if (params.orderBy !== undefined) queryParts.push(`orderBy=${params.orderBy}`);
  if (params.hasCertification !== undefined) queryParts.push(`hasCertification=${params.hasCertification}`);
  if (params.customization !== undefined) queryParts.push(`customization=${params.customization}`);
  if (params.supplierId) queryParts.push(`supplierId=${params.supplierId}`);
  if (params.zonePlatform) queryParts.push(`zonePlatform=${params.zonePlatform}`);
  if (params.timeStart) queryParts.push(`timeStart=${params.timeStart}`);
  if (params.timeEnd) queryParts.push(`timeEnd=${params.timeEnd}`);
  
  // Handle arrays
  if (params.lv2categoryList?.length) {
    params.lv2categoryList.forEach(id => queryParts.push(`lv2categoryList=${id}`));
  }
  if (params.lv3categoryList?.length) {
    params.lv3categoryList.forEach(id => queryParts.push(`lv3categoryList=${id}`));
  }
  if (params.features?.length) {
    params.features.forEach(feature => queryParts.push(`features=${feature}`));
  }

  return queryParts.join('&');
}

/**
 * Fetch products from CJ API
 */
async function fetchProducts(params: CJSearchParams): Promise<CJProductListResponse> {
  const token = await getValidToken();
  const queryString = buildQueryString(params);

  console.log('[CJ API] Fetching products with query:', queryString);

  const response = await fetch(`${CJ_API_BASE}/product/listV2?${queryString}`, {
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
  
  // Debug: log the actual structure
  console.log('[CJ API] Response code:', data.code, 'message:', data.message);
  console.log('[CJ API] data.data keys:', data.data ? Object.keys(data.data) : 'no data');
  console.log('[CJ API] content type:', typeof data.data?.content, 'isArray:', Array.isArray(data.data?.content));
  
  if (Array.isArray(data.data?.content) && data.data.content.length > 0) {
    console.log('[CJ API] content[0] keys:', Object.keys(data.data.content[0]));
    console.log('[CJ API] content[0].productList length:', data.data.content[0]?.productList?.length);
  }
  
  // CJ API returns products in data.content[0].productList
  const content = data.data?.content;
  const productList = Array.isArray(content) && content.length > 0 
    ? content[0]?.productList || []
    : content?.productList || [];
  
  console.log('[CJ API] Products extracted:', productList.length);
  
  // Normalize the response structure
  return {
    ...data,
    data: {
      ...data.data,
      content: {
        productList,
        relatedCategoryList: Array.isArray(content) ? content[0]?.relatedCategoryList : content?.relatedCategoryList,
        keyWord: Array.isArray(content) ? content[0]?.keyWord : content?.keyWord,
        keyWordOld: Array.isArray(content) ? content[0]?.keyWordOld : content?.keyWordOld,
      }
    }
  };
}

/**
 * GET /api/cj/products - Search products
 * Supports all CJSearchParams as query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build search params from query string
    const params: CJSearchParams = {
      // Always include description
      features: ['enable_description'],
    };

    // Parse query parameters
    const keyWord = searchParams.get('keyWord');
    const page = searchParams.get('page');
    const size = searchParams.get('size');
    const categoryId = searchParams.get('categoryId');
    const countryCode = searchParams.get('countryCode');
    const startSellPrice = searchParams.get('startSellPrice');
    const endSellPrice = searchParams.get('endSellPrice');
    const addMarkStatus = searchParams.get('addMarkStatus');
    const productFlag = searchParams.get('productFlag');
    const sort = searchParams.get('sort');
    const orderBy = searchParams.get('orderBy');
    const verifiedWarehouse = searchParams.get('verifiedWarehouse');
    const useLightingDefaults = searchParams.get('lightingDefaults');

    // Apply lighting defaults if requested
    if (useLightingDefaults === 'true') {
      Object.assign(params, DEFAULT_LIGHTING_SEARCH);
    }

    // Override with explicit params
    if (keyWord) params.keyWord = keyWord;
    if (page) params.page = parseInt(page, 10);
    if (size) params.size = Math.min(parseInt(size, 10), 100); // Max 100
    if (categoryId) params.categoryId = categoryId;
    if (countryCode) params.countryCode = countryCode;
    if (startSellPrice) params.startSellPrice = parseFloat(startSellPrice);
    if (endSellPrice) params.endSellPrice = parseFloat(endSellPrice);
    if (addMarkStatus) params.addMarkStatus = parseInt(addMarkStatus, 10);
    if (productFlag) params.productFlag = parseInt(productFlag, 10);
    if (sort === 'asc' || sort === 'desc') params.sort = sort;
    if (orderBy) params.orderBy = parseInt(orderBy, 10);
    if (verifiedWarehouse) params.verifiedWarehouse = parseInt(verifiedWarehouse, 10);

    // Handle category list arrays
    const lv3categories = searchParams.getAll('lv3categoryList');
    if (lv3categories.length) params.lv3categoryList = lv3categories;

    // Fetch from CJ API
    const response = await fetchProducts(params);

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
      throw new Error(response.message || 'Failed to fetch products from CJ API');
    }

    // Transform products for consistent format
    const products: CJProduct[] = response.data?.content?.productList || [];

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page: response.data?.pageNumber || 1,
        size: response.data?.pageSize || 20,
        totalRecords: response.data?.totalRecords || 0,
        totalPages: response.data?.totalPages || 0,
      },
      searchKeyword: response.data?.content?.keyWord,
    });
  } catch (error) {
    console.error('CJ Products error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        products: [],
        pagination: {
          page: 1,
          size: 20,
          totalRecords: 0,
          totalPages: 0,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cj/products - Search with complex filters (body params)
 */
export async function POST(request: NextRequest) {
  try {
    const body: CJSearchParams = await request.json();
    
    // Ensure description is included
    const params: CJSearchParams = {
      ...body,
      features: body.features || ['enable_description'],
    };

    const response = await fetchProducts(params);

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
      throw new Error(response.message || 'Failed to fetch products from CJ API');
    }

    const products: CJProduct[] = response.data?.content?.productList || [];

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page: response.data?.pageNumber || 1,
        size: response.data?.pageSize || 20,
        totalRecords: response.data?.totalRecords || 0,
        totalPages: response.data?.totalPages || 0,
      },
      searchKeyword: response.data?.content?.keyWord,
    });
  } catch (error) {
    console.error('CJ Products POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        products: [],
        pagination: {
          page: 1,
          size: 20,
          totalRecords: 0,
          totalPages: 0,
        },
      },
      { status: 500 }
    );
  }
}
