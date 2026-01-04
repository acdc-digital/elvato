import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../../auth/route';
import { 
  CJProductDetailResponse,
  CJProductVariant,
} from '@/types/cj-dropshipping';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * GET /api/cj/products/[id] - Get detailed product information
 * Fetches full product details including all variant images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const token = await getValidToken();

    console.log('[CJ API] Fetching product details for ID:', id);

    const response = await fetch(
      `${CJ_API_BASE}/product/query?pid=${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': token,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CJ API request failed: ${response.status}`);
    }

    const data: CJProductDetailResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(data.message || 'Failed to fetch product details from CJ API');
    }

    // Extract all unique images from product and variants
    const images: string[] = [];
    
    // Add main product image if available
    if (data.data?.productImage) {
      images.push(data.data.productImage);
    }

    // Add all variant images
    if (data.data?.variants && Array.isArray(data.data.variants)) {
      data.data.variants.forEach((variant: CJProductVariant) => {
        if (variant.variantImage && !images.includes(variant.variantImage)) {
          images.push(variant.variantImage);
        }
      });
    }

    console.log('[CJ API] Product details fetched. Images found:', images.length);

    return NextResponse.json({
      success: true,
      product: {
        id: data.data.pid,
        name: data.data.productNameEn || data.data.productName,
        sku: data.data.productSku,
        description: data.data.description,
        images,
        variants: data.data.variants || [],
      },
    });
  } catch (error) {
    console.error('CJ Product detail error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product details',
      },
      { status: 500 }
    );
  }
}
