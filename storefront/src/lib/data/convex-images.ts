/**
 * Fetch product image CDN URLs from ConvexFS (Bunny CDN).
 *
 * The Convex backend stores images at:
 *   /products/{handle}/thumbnail.{ext}
 *   /products/{handle}/images/{rank}.{ext}
 *
 * The `getProductImages` query returns signed proxy URLs that 302-redirect
 * to the Bunny CDN edge. This module provides helpers to swap the slow
 * CJ Dropshipping URLs with fast CDN equivalents.
 */

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210"

type ConvexImage = {
  path: string
  url: string
  contentType: string
  size: number
}

/** Cache CDN URLs in-memory for the lifetime of the server process. */
const imageCache = new Map<string, ConvexImage[]>()
const thumbCache = new Map<string, string | null>()

/**
 * Query the Convex backend for all ConvexFS images belonging to a product.
 * Returns an array of { path, url, contentType, size }.
 */
async function fetchProductImages(
  handle: string
): Promise<ConvexImage[]> {
  const cached = imageCache.get(handle)
  if (cached) return cached

  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "files:getProductImages",
        args: { productHandle: handle },
      }),
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const data = await res.json()
    const images: ConvexImage[] = data.value ?? []
    if (images.length > 0) {
      imageCache.set(handle, images)
    }
    return images
  } catch {
    return []
  }
}

/**
 * Batch-fetch CDN thumbnail URLs for multiple product handles in a single
 * Convex query. Results are cached in-memory.
 */
export async function prefetchThumbnails(
  handles: string[]
): Promise<Record<string, string | null>> {
  // Split into cached and uncached
  const results: Record<string, string | null> = {}
  const uncached: string[] = []

  for (const h of handles) {
    if (thumbCache.has(h)) {
      results[h] = thumbCache.get(h)!
    } else {
      uncached.push(h)
    }
  }

  if (uncached.length === 0) return results

  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "files:getBatchThumbnails",
        args: { handles: uncached },
      }),
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const data = await res.json()
      const batch: Record<string, string | null> = data.value ?? {}
      for (const [handle, url] of Object.entries(batch)) {
        thumbCache.set(handle, url)
        results[handle] = url
      }
    }
  } catch {
    // Fall through — uncached handles will be null
  }

  return results
}

/**
 * Get the CDN thumbnail URL for a product, or null if not ingested.
 */
export async function getCdnThumbnail(
  handle: string
): Promise<string | null> {
  // Check thumb cache first (populated by prefetchThumbnails)
  if (thumbCache.has(handle)) return thumbCache.get(handle)!

  const images = await fetchProductImages(handle)
  const thumb = images.find((i) => i.path.includes("/thumbnail."))
  const url = thumb?.url ?? null
  thumbCache.set(handle, url)
  return url
}

/**
 * Get all CDN gallery image URLs for a product, sorted by rank.
 * Returns an array of { url, id } objects matching Medusa's image shape.
 */
export async function getCdnGalleryImages(
  handle: string
): Promise<Array<{ url: string; id: string }>> {
  const images = await fetchProductImages(handle)
  return images
    .filter((i) => i.path.includes("/images/"))
    .sort((a, b) => {
      const rankA = parseInt(a.path.split("/").pop()?.split(".")[0] ?? "0")
      const rankB = parseInt(b.path.split("/").pop()?.split(".")[0] ?? "0")
      return rankA - rankB
    })
    .map((i) => ({ url: i.url, id: i.path }))
}

/**
 * Given a Medusa product, replace its thumbnail and image URLs with
 * CDN equivalents when available. Falls back to original URLs.
 */
export async function withCdnImages<
  T extends {
    handle?: string | null
    thumbnail?: string | null
    images?: Array<{ url: string; id?: string; [key: string]: any }> | null
  }
>(product: T): Promise<T> {
  if (!product.handle) return product

  const [cdnThumb, cdnGallery] = await Promise.all([
    getCdnThumbnail(product.handle),
    getCdnGalleryImages(product.handle),
  ])

  return {
    ...product,
    thumbnail: cdnThumb ?? product.thumbnail,
    images:
      cdnGallery.length > 0
        ? cdnGallery
        : product.images,
  }
}
