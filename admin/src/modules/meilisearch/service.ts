type MeilisearchModuleOptions = {
  host: string
  apiKey: string
  productIndexName: string
}

type ProductDocument = {
  id: string
  handle: string
  title: string
  description: string
  status: string
  thumbnail: string | null
  category_ids: string[]
  category_names: string[]
  tags: string[]
  option_values: string[]
  price_cents: number
  created_at: number
  variant_count: number
}

export default class MeilisearchModuleService {
  private client_: any
  private productIndexName: string
  private host: string
  private apiKey: string

  constructor({}, options: MeilisearchModuleOptions) {
    this.host = options.host
    this.apiKey = options.apiKey
    this.productIndexName = options.productIndexName
  }

  private async getClient() {
    if (!this.client_) {
      const { MeiliSearch } = await import("meilisearch")
      this.client_ = new MeiliSearch({
        host: this.host,
        apiKey: this.apiKey,
      })
    }
    return this.client_
  }

  private async getProductIndex() {
    const client = await this.getClient()
    return client.index(this.productIndexName)
  }

  async indexData(documents: ProductDocument[]) {
    if (!documents.length) return
    const index = await this.getProductIndex()
    return index.addDocuments(documents, { primaryKey: "id" })
  }

  async deleteFromIndex(ids: string[]) {
    if (!ids.length) return
    const index = await this.getProductIndex()
    return index.deleteDocuments(ids)
  }

  async search(query: string, options?: Record<string, any>) {
    const index = await this.getProductIndex()
    return index.search(query, options)
  }

  async configureIndex(settings: Record<string, any>) {
    const index = await this.getProductIndex()
    return index.updateSettings(settings)
  }

  async getIndexStats() {
    const index = await this.getProductIndex()
    return index.getStats()
  }
}
