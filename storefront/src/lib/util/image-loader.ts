/**
 * Custom Next.js image loader.
 *
 * Goal: stop Vercel from counting an "image optimization transformation" for
 * every product image. Bunny CDN already serves our product images, and we
 * have Bunny Optimizer enabled on the `elvatoStorage-CDN` pull zone, so we
 * route Bunny URLs through Bunny Optimizer query params and pass everything
 * else through untouched.
 *
 * Bunny Optimizer params: width, quality, format=auto (AVIF/WebP negotiation)
 * Docs: https://docs.bunny.net/docs/optimizer-image-processing
 */

const BUNNY_HOST = "elvatostorage-cdn.b-cdn.net"

type LoaderArgs = {
  src: string
  width: number
  quality?: number
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  // Local /public assets — serve as-is. They're typically small SVGs/PNGs and
  // don't need transformation.
  if (src.startsWith("/")) {
    return src
  }

  // Parse the URL. If it isn't absolute (or is malformed), bail to passthrough.
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }

  const host = url.hostname.toLowerCase()

  // Bunny CDN: use Bunny Optimizer query params. This costs Bunny Optimizer
  // requests, NOT Vercel image transformations.
  if (host === BUNNY_HOST) {
    url.searchParams.set("width", String(width))
    url.searchParams.set("quality", String(quality ?? 80))
    return url.toString()
  }

  // All other remote hosts (cjdropshipping, convex, S3, etc.): passthrough.
  // The browser loads the original asset; no Vercel transformation is incurred.
  return src
}
