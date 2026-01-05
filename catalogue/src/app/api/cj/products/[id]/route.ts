import { NextRequest, NextResponse } from 'next/server';
import { getValidToken } from '../../auth/route';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * GET /api/cj/products/[id] - Get product details including all images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getValidToken();

    console.log('[CJ API] Fetching product details for:', id);

    const response = await fetch(`${CJ_API_BASE}/product/query?pid=${id}`, {
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

    // Extract images from the response
    // CJ returns productImage as a comma-separated string or array
    const product = data.data;
    let images: string[] = [];

    if (product) {
      // Main image first
      if (product.productImage) {
        // productImage can be comma-separated string
        if (typeof product.productImage === 'string') {
          images = product.productImage.split(',').map((img: string) => img.trim()).filter(Boolean);
        } else if (Array.isArray(product.productImage)) {
          images = product.productImage;
        }
      }
      
      // Add variant images if available
      if (product.variants && Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (variant.variantImage && !images.includes(variant.variantImage)) {
            images.push(variant.variantImage);
          }
        }
      }

      // Fallback to bigImage if no images found
      if (images.length === 0 && product.bigImage) {
        images = [product.bigImage];
      }
    }

    console.log('[CJ API] Found', images.length, 'images for product');

    return NextResponse.json({
      success: true,
      productId: id,
      images,
      productName: product?.productNameEn || product?.nameEn || '',
    });
  } catch (error) {
    console.error('CJ Product Detail error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product details',
        images: [],
      },
      { status: 500 }
    );
  }
}
