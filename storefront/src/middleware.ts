import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const REGION_CACHE_TAG = "regions-public"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [REGION_CACHE_TAG],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Resolves the country code for a request.
 *
 * Resolution order:
 *   1. URL already contains a valid country code → keep it (deterministic for SEO).
 *   2. Persisted user choice cookie (`_user_region`) → use it.
 *   3. GeoIP header (Vercel's `x-vercel-ip-country`) → use it if it matches a region.
 *   4. DEFAULT_REGION fallback.
 *
 * Steps 2 + 3 only fire when the URL has no country prefix, so Googlebot
 * (which has no cookie and arrives at bare URLs) still gets a deterministic
 * destination — DEFAULT_REGION — preserving SEO.
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      return urlCountryCode
    }

    // 2. Returning visitor — honour their last chosen region.
    const cookieCountry = request.cookies
      .get("_user_region")
      ?.value?.toLowerCase()
    if (cookieCountry && regionMap.has(cookieCountry)) {
      return cookieCountry
    }

    // 3. First-time visitor — try GeoIP from Vercel/CDN header.
    //    `x-vercel-ip-country` is set by Vercel; `cf-ipcountry` by Cloudflare.
    const geoCountry = (
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      ""
    ).toLowerCase()
    if (geoCountry && regionMap.has(geoCountry)) {
      return geoCountry
    }

    // 4. Deterministic fallback.
    if (regionMap.has(DEFAULT_REGION)) {
      return DEFAULT_REGION
    }

    return regionMap.keys().next().value
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

const USER_REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/callback") {
    return NextResponse.next()
  }

  // Attempt to load the region map from Medusa.  If the backend is
  // unreachable we fall back gracefully instead of returning 500 to every
  // request (which tanks Google's crawl of the whole site).
  let regionMap: Map<string, HttpTypes.StoreRegion> | undefined
  try {
    regionMap = await getRegionMap()
  } catch (error) {
    console.error("Middleware: region map fetch failed, passing through", error)
    // Let the request continue — pages can still render from cache / ISR.
    return NextResponse.next()
  }

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // URL already has a valid country code — pass through without mutating
  // cookies. The country prefix is already deterministic, and setting cookies
  // here makes anonymous public pages harder for the CDN/browser to cache.
  if (urlHasCountryCode) {
    return NextResponse.next()
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // No country code in the URL — redirect to the prefixed version.
  // Use 301 (permanent) so search engines transfer link equity and index
  // the canonical /{countryCode}/… URL directly.
  if (countryCode) {
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    const response = NextResponse.redirect(redirectUrl, 301)
    if (
      request.cookies.get("_user_region")?.value?.toLowerCase() !== countryCode
    ) {
      response.cookies.set("_user_region", countryCode, {
        maxAge: USER_REGION_COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      })
    }
    return response
  }

  // Fallback: no valid country code could be resolved (empty regions).
  // Instead of returning 500, fall through and let the page attempt to
  // render. If regions truly aren't configured the page will handle it.
  console.error(
    "Middleware: no country code resolved, falling through to page render"
  )
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
