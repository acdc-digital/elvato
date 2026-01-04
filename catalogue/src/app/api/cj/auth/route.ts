import { NextRequest, NextResponse } from 'next/server';
import { CJAuthResponse, CJTokenState } from '@/types/cj-dropshipping';

// Server-side token storage (in production, use Redis or database)
let tokenCache: CJTokenState | null = null;

// Track last token request to avoid rate limiting (5 min between requests)
let lastTokenRequestTime: number = 0;
const TOKEN_REQUEST_COOLDOWN = 5 * 60 * 1000; // 5 minutes in ms

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * Get access token from CJ API
 */
async function getAccessToken(apiKey: string): Promise<CJAuthResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<CJAuthResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if token is expired or about to expire (within 1 hour)
 */
function isTokenExpired(expiryDate: Date): boolean {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return expiryDate <= oneHourFromNow;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;

  if (!apiKey) {
    throw new Error('CJ_API_KEY environment variable not set');
  }

  // Check if we have a cached token that's still valid
  if (tokenCache && !isTokenExpired(tokenCache.accessTokenExpiry)) {
    console.log('[CJ Auth] Using cached token');
    return tokenCache.accessToken;
  }

  // Try to refresh if we have a valid refresh token
  if (tokenCache && !isTokenExpired(tokenCache.refreshTokenExpiry)) {
    try {
      console.log('[CJ Auth] Refreshing token...');
      const refreshResponse = await refreshAccessToken(tokenCache.refreshToken);
      
      if (refreshResponse.code === 200 && refreshResponse.data) {
        tokenCache = {
          accessToken: refreshResponse.data.accessToken,
          refreshToken: refreshResponse.data.refreshToken,
          accessTokenExpiry: new Date(refreshResponse.data.accessTokenExpiryDate),
          refreshTokenExpiry: new Date(refreshResponse.data.refreshTokenExpiryDate),
        };
        return tokenCache.accessToken;
      }
    } catch (error) {
      console.error('[CJ Auth] Failed to refresh token:', error);
    }
  }

  // Check rate limit cooldown
  const now = Date.now();
  const timeSinceLastRequest = now - lastTokenRequestTime;
  if (timeSinceLastRequest < TOKEN_REQUEST_COOLDOWN && lastTokenRequestTime > 0) {
    const waitTime = Math.ceil((TOKEN_REQUEST_COOLDOWN - timeSinceLastRequest) / 1000);
    throw new Error(`Rate limited. Please wait ${waitTime} seconds before trying again.`);
  }

  // Get new token using API key
  console.log('[CJ Auth] Getting new access token...');
  lastTokenRequestTime = now;
  const authResponse = await getAccessToken(apiKey);

  if (authResponse.code !== 200 || !authResponse.data) {
    // Reset timer if request failed so we can retry sooner
    lastTokenRequestTime = 0;
    throw new Error(authResponse.message || 'Failed to authenticate with CJ API');
  }

  tokenCache = {
    accessToken: authResponse.data.accessToken,
    refreshToken: authResponse.data.refreshToken,
    accessTokenExpiry: new Date(authResponse.data.accessTokenExpiryDate),
    refreshTokenExpiry: new Date(authResponse.data.refreshTokenExpiryDate),
  };

  console.log('[CJ Auth] Token obtained, expires:', tokenCache.accessTokenExpiry);
  return tokenCache.accessToken;}

/**
 * GET /api/cj/auth - Check authentication status
 */
export async function GET() {
  try {
    const apiKey = process.env.CJ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'CJ_API_KEY not configured' 
        },
        { status: 500 }
      );
    }

    // Try to get a valid token to verify auth is working
    await getValidToken();

    return NextResponse.json({
      authenticated: true,
      tokenExpiry: tokenCache?.accessTokenExpiry?.toISOString(),
    });
  } catch (error) {
    console.error('CJ Auth error:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cj/auth - Force token refresh
 */
export async function POST() {
  try {
    // Clear cache to force new token
    tokenCache = null;
    
    await getValidToken();

    return NextResponse.json({
      success: true,
      tokenExpiry: tokenCache ? tokenCache.accessTokenExpiry.toISOString() : null,
    });
  } catch (error) {
    console.error('CJ Auth refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      },
      { status: 500 }
    );
  }
}
