import { MetadataRoute } from "next"
import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { DEFAULT_SEO_COUNTRY } from "@lib/util/seo"

// ISR: rebuild the sitemap at most once per hour. Avoids re-fetching the
// entire catalog on every Googlebot request (which previously caused
// timeouts when Medusa was warming up). See .docs/SEO/05-indexing-recovery.md.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()
  const country = DEFAULT_SEO_COUNTRY

  // Static pages
  const staticPages = [
    "",
    "/store",
    "/about",
    "/design-services",
    "/how-it-works",
    "/leditorial",
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}/${country}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }))

  // Per-section fetches isolated so one failure cannot blank the sitemap.
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: country,
      queryParams: { limit: 1000, fields: "handle,updated_at" },
    })
    productEntries = response.products.map((product) => ({
      url: `${baseUrl}/${country}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch products", e)
  }

  let collectionEntries: MetadataRoute.Sitemap = []
  try {
    const { collections } = await listCollections()
    collectionEntries = collections.map((collection) => ({
      url: `${baseUrl}/${country}/collections/${collection.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch collections", e)
  }

  let categoryEntries: MetadataRoute.Sitemap = []
  try {
    const categories = await listCategories()
    categoryEntries = (categories ?? []).map((category) => ({
      url: `${baseUrl}/${country}/categories/${category.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch categories", e)
  }

  return [
    ...staticEntries,
    ...productEntries,
    ...collectionEntries,
    ...categoryEntries,
  ]
}
