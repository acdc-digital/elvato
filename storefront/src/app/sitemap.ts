import { MetadataRoute } from "next"
import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  let defaultCountry = "us"
  try {
    const regions = await listRegions()
    const countryCodes =
      regions
        ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
        .filter(Boolean) ?? []
    defaultCountry = countryCodes[0] || "us"
  } catch (e) {
    console.error("Sitemap: failed to fetch regions", e)
  }

  // Static pages
  const staticPages = [
    "",
    "/store",
    "/about",
    "/design-services",
    "/how-it-works",
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}/${defaultCountry}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }))

  // Product pages
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: defaultCountry,
      queryParams: { limit: 1000, fields: "handle,updated_at" },
    })
    productEntries = response.products.map((product) => ({
      url: `${baseUrl}/${defaultCountry}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch products", e)
  }

  // Collection pages
  let collectionEntries: MetadataRoute.Sitemap = []
  try {
    const { collections } = await listCollections()
    collectionEntries = collections.map((collection) => ({
      url: `${baseUrl}/${defaultCountry}/collections/${collection.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch collections", e)
  }

  // Category pages
  let categoryEntries: MetadataRoute.Sitemap = []
  try {
    const categories = await listCategories()
    categoryEntries = (categories ?? []).map((category) => ({
      url: `${baseUrl}/${defaultCountry}/categories/${category.handle}`,
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
