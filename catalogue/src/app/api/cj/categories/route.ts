import { NextResponse } from 'next/server';
import { getValidToken } from '../auth/route';
import { 
  CJCategoryResponse, 
  CJCategoryOption, 
  CJCategoryFirst,
  LIGHTING_PRESETS 
} from '@/types/cj-dropshipping';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

// Server-side category cache (refresh every hour)
let categoryCache: {
  data: CJCategoryOption[];
  lightingCategories: CJCategoryOption[];
  fetchedAt: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Flatten category hierarchy into a searchable list
 */
function flattenCategories(categories: CJCategoryFirst[]): CJCategoryOption[] {
  const flattened: CJCategoryOption[] = [];

  console.log('[CJ Categories] Processing', categories?.length || 0, 'first-level categories');

  if (!Array.isArray(categories)) {
    console.error('[CJ Categories] Expected array, got:', typeof categories);
    return [];
  }

  for (const firstLevel of categories) {
    // Handle both possible structures from CJ API
    const secondLevels = firstLevel.categoryFirstList || [];
    
    for (const secondLevel of secondLevels) {
      const thirdLevels = secondLevel.categorySecondList || [];
      
      for (const thirdLevel of thirdLevels) {
        flattened.push({
          id: thirdLevel.categoryId,
          name: thirdLevel.categoryName,
          level: 3,
          parentName: secondLevel.categorySecondName,
          fullPath: `${firstLevel.categoryFirstName} > ${secondLevel.categorySecondName} > ${thirdLevel.categoryName}`,
        });
      }
    }
  }

  console.log('[CJ Categories] Flattened to', flattened.length, 'categories');
  return flattened;
}

/**
 * Filter categories that match lighting-related keywords
 */
function filterLightingCategories(categories: CJCategoryOption[]): CJCategoryOption[] {
  const lightingKeywords = new Set<string>();
  
  // Collect all keywords from presets
  for (const preset of LIGHTING_PRESETS) {
    for (const keyword of preset.categoryKeywords) {
      lightingKeywords.add(keyword.toLowerCase());
    }
  }

  return categories.filter(cat => {
    const fullPathLower = cat.fullPath.toLowerCase();
    const nameLower = cat.name.toLowerCase();
    
    for (const keyword of lightingKeywords) {
      if (fullPathLower.includes(keyword) || nameLower.includes(keyword)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Fetch categories from CJ API
 */
async function fetchCategories(): Promise<CJCategoryOption[]> {
  console.log('[CJ Categories] Fetching categories from CJ API...');
  const token = await getValidToken();

  const response = await fetch(`${CJ_API_BASE}/product/getCategory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  });

  if (!response.ok) {
    console.error('[CJ Categories] HTTP error:', response.status);
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CJ Categories] Response code:', data.code, 'message:', data.message);

  if (data.code !== 200) {
    console.error('[CJ Categories] API error:', data.message);
    throw new Error(data.message || 'Failed to get categories from CJ API');
  }

  if (!data.data) {
    console.error('[CJ Categories] No data in response');
    throw new Error('No category data returned from CJ API');
  }

  console.log('[CJ Categories] Raw data type:', typeof data.data, 'isArray:', Array.isArray(data.data));
  return flattenCategories(data.data);
}

/**
 * GET /api/cj/categories - Get category list
 * Query params:
 *   - lighting=true: Only return lighting-related categories
 *   - search=keyword: Filter categories by keyword
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lightingOnly = searchParams.get('lighting') === 'true';
    const searchQuery = searchParams.get('search')?.toLowerCase();

    // Check cache
    if (!categoryCache || Date.now() - categoryCache.fetchedAt > CACHE_DURATION) {
      const categories = await fetchCategories();
      const lightingCategories = filterLightingCategories(categories);
      
      categoryCache = {
        data: categories,
        lightingCategories,
        fetchedAt: Date.now(),
      };
    }

    let result = lightingOnly ? categoryCache.lightingCategories : categoryCache.data;

    // Apply search filter if provided
    if (searchQuery) {
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery) ||
        cat.fullPath.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      categories: result,
      totalCategories: categoryCache.data.length,
      lightingCategoryCount: categoryCache.lightingCategories.length,
      presets: LIGHTING_PRESETS,
    });
  } catch (error) {
    console.error('CJ Categories error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        categories: [],
      },
      { status: 500 }
    );
  }
}
