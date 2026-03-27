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

import { Redis } from "@upstash/redis"

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://superb-dotterel-37.convex.cloud"

type ConvexImage = {
  path: string
  url: string
  contentType: string
  size: number
}

/** TTL for cached CDN URLs (24 hours). */
const CACHE_TTL = 60 * 60 * 24

/** Lazy-initialised Upstash Redis client. Falls back to in-memory maps when
 *  env vars are not set (local dev without Redis). */
let _redis: Redis | null | undefined

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (url && token) {
    _redis = new Redis({ url, token })
  } else {
    _redis = null
  }
  return _redis
}

/** In-memory fallback for local dev (no Redis). */
const memImageCache = new Map<string, ConvexImage[]>()
const memThumbCache = new Map<string, string | null>()

/**
 * Query the Convex backend for all ConvexFS images belonging to a product.
 * Returns an array of { path, url, contentType, size }.
 */
async function fetchProductImages(
  handle: string
): Promise<ConvexImage[]> {
  const redis = getRedis()
  const key = `cdn:images:${handle}`

  // Try Redis first
  if (redis) {
    const cached = await redis.get<ConvexImage[]>(key)
    if (cached) return cached
  } else {
    const cached = memImageCache.get(handle)
    if (cached) return cached
  }

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
      if (redis) {
        await redis.set(key, images, { ex: CACHE_TTL })
      } else {
        memImageCache.set(handle, images)
      }
    }
    return images
  } catch {
    return []
  }
}

/**
 * Batch-fetch CDN thumbnail URLs for multiple product handles in a single
 * Convex query. Results are cached in Redis (or in-memory fallback).
 */
export async function prefetchThumbnails(
  handles: string[]
): Promise<Record<string, string | null>> {
  const redis = getRedis()
  const results: Record<string, string | null> = {}
  const uncached: string[] = []

  if (redis) {
    // Pipeline MGET for all handles
    const keys = handles.map((h) => `cdn:thumb:${h}`)
    const cached = keys.length > 0 ? await redis.mget<(string | null)[]>(...keys) : []
    for (let i = 0; i < handles.length; i++) {
      const val = cached[i]
      if (val !== null && val !== undefined) {
        results[handles[i]] = val === "__null__" ? null : val
      } else {
        uncached.push(handles[i])
      }
    }
  } else {
    for (const h of handles) {
      if (memThumbCache.has(h)) {
        results[h] = memThumbCache.get(h)!
      } else {
        uncached.push(h)
      }
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

      if (redis) {
        // Pipeline all SETs
        const pipeline = redis.pipeline()
        for (const h of uncached) {
          const url = batch[h] ?? null
          results[h] = url
          // Store "__null__" sentinel so we distinguish "no CDN" from "not cached"
          pipeline.set(`cdn:thumb:${h}`, url ?? "__null__", { ex: CACHE_TTL })
        }
        await pipeline.exec()
      } else {
        for (const h of uncached) {
          const url = batch[h] ?? null
          memThumbCache.set(h, url)
          results[h] = url
        }
      }
    }
  } catch {
    // Fall through — uncached handles will be null
  }

  return results
}

/**
 * Get the CDN thumbnail URL for a product, or null if not ingested.
 * Checks Redis (or in-memory fallback) before querying Convex.
 */
export async function getCdnThumbnail(
  handle: string
): Promise<string | null> {
  const redis = getRedis()
  const key = `cdn:thumb:${handle}`

  if (redis) {
    const cached = await redis.get<string>(key)
    if (cached !== null && cached !== undefined) {
      return cached === "__null__" ? null : cached
    }
  } else {
    if (memThumbCache.has(handle)) return memThumbCache.get(handle)!
  }

  // Only query individually if this handle was never batch-checked
  const images = await fetchProductImages(handle)
  const thumb = images.find((i) => i.path.includes("/thumbnail."))
  const url = thumb?.url ?? null

  if (redis) {
    await redis.set(key, url ?? "__null__", { ex: CACHE_TTL })
  } else {
    memThumbCache.set(handle, url)
  }
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
