/**
 * SEO helpers for canonical URL + hreflang construction.
 *
 * Strategy: a single default-region URL is the canonical surface for the
 * entire catalog. Other country prefixes still serve users (currency,
 * shipping) but are de-duplicated for search engines via canonical and
 * (optional) hreflang annotations.
 *
 * See `.docs/SEO/05-indexing-recovery.md` for the rationale.
 */

import { getBaseURL } from "./env"

/** Default country prefix used as the canonical SEO surface. */
export const DEFAULT_SEO_COUNTRY =
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

/**
 * Returns the absolute canonical URL for a given path, always anchored to
 * `DEFAULT_SEO_COUNTRY`. The `path` argument should NOT include the country
 * prefix — pass `/products/foo`, not `/dk/products/foo`.
 */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${getBaseURL()}/${DEFAULT_SEO_COUNTRY}${normalized}`
}

/**
 * Builds a `Metadata.alternates` block with:
 *   - `canonical` → default-country absolute URL
 *   - `languages` → hreflang map with `x-default` pointing to the canonical
 *
 * If `countryCodes` is empty, only `canonical` + `x-default` are emitted.
 *
 * Pass the path WITHOUT the country prefix.
 */
export function buildAlternates(
  path: string,
  countryCodes: string[] = []
): {
  canonical: string
  languages: Record<string, string>
} {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const base = getBaseURL()
  const canonical = `${base}/${DEFAULT_SEO_COUNTRY}${normalized}`

  const languages: Record<string, string> = {
    "x-default": canonical,
  }

  for (const code of countryCodes) {
    if (!code) continue
    languages[code] = `${base}/${code}${normalized}`
  }

  return { canonical, languages }
}
