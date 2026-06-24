const CANONICAL_IMAGE_HOSTS = new Set([
  "elvatostorage-cdn.b-cdn.net",
  "superb-dotterel-37.convex.cloud",
  "superb-dotterel-37.convex.site",
])

const configuredConvexHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    return url ? new URL(url).hostname.toLowerCase() : null
  } catch {
    return null
  }
})()

if (configuredConvexHost) {
  CANONICAL_IMAGE_HOSTS.add(configuredConvexHost)
}

export function isCanonicalProductImageUrl(url?: string | null): boolean {
  if (!url) return false

  try {
    const host = new URL(url).hostname.toLowerCase()
    return CANONICAL_IMAGE_HOSTS.has(host)
  } catch {
    return false
  }
}