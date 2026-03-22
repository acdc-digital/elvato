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
  main_category: string
  sub_categories: string[]
  materials: string[]
  styles: string[]
  room_types: string[]
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

  // Compatible with meilisearch SDK v0.46+ (task methods moved to client.tasks namespace)
  private async waitForTask(taskUid: number, timeoutMs = 60000): Promise<void> {
    const client = await this.getClient()
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const task = await client.tasks.getTask(taskUid)
      if (task.status === "succeeded") return
      if (task.status === "failed" || task.status === "canceled") {
        throw new Error(
          `MeiliSearch task ${taskUid} ${task.status}: ${JSON.stringify(task.error)}`
        )
      }
      await new Promise((r) => setTimeout(r, 500))
    }
    throw new Error(`MeiliSearch task ${taskUid} timed out after ${timeoutMs}ms`)
  }

  async indexData(documents: Record<string, any>[]) {
    if (!documents.length) return
    const index = await this.getProductIndex()
    const task = await index.addDocuments(documents, { primaryKey: "id" })
    await this.waitForTask(task.taskUid, 30000)
    return task
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
    const task = await index.updateSettings(settings)
    await this.waitForTask(task.taskUid, 60000)
    return task
  }

  async getIndexStats() {
    const index = await this.getProductIndex()
    return index.getStats()
  }
}
