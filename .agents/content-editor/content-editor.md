The Product Content Generator is a TypeScript CLI agent that uses Claude claude-sonnet-4-20250514 to generate professional e-commerce content for products in the Convex `medusaProducts` table.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  catalogue/agents/product-content-generator.ts                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLI Arguments:                                                 │
│    --limit N       Process N products (default: 10)             │
│    --product-id    Process specific product by Convex _id       │
│    --all           Process all products needing content         │
│    --dry-run       Preview without saving to Convex             │
│    --force         Regenerate content even if already exists    │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Anthropic Claude claude-sonnet-4-20250514                                        │
├─────────────────────────────────────────────────────────────────┤
│  System Prompt: E-commerce copywriter for lighting/home decor   │
│                                                                 │
│  Input: Original CJ product data (title, description, images)   │
│                                                                 │
│  Output (JSON):                                                 │
│    • title (max 60 chars) - Professional, keyword-rich          │
│    • subtitle (max 100 chars) - Value proposition               │
│    • description (150-300 words) - Feature-focused, persuasive  │
│    • tags (5-10 strings) - SEO keywords, categories             │
│    • productType - Category classification                      │
│    • suggestedCategories - Medusa category recommendations      │
│    • seoTitle (max 60 chars) - Meta title                       │
│    • seoDescription (max 155 chars) - Meta description          │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Convex medusaProducts Table                                    │
├─────────────────────────────────────────────────────────────────┤
│  Direct Field Updates:                                          │
│    • title         ← AI-generated title                         │
│    • subtitle      ← AI-generated subtitle                      │
│    • description   ← AI-generated description                   │
│    • typeValue     ← AI-generated productType                   │
│                                                                 │
│  Metadata Storage (for review):                                 │
│    metadata.aiContent: {                                        │
│      generatedAt: ISO timestamp                                 │
│      model: "claude-sonnet-4-20250514"                            │
│      tags: string[]                                             │
│      suggestedCategories: string[]    ← stored for later review │
│      seoTitle: string                                           │
│      seoDescription: string                                     │
│      originalTitle: string            ← preserved for reference │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Processing Flow

1. **Query**: Fetches products from `medusaProducts` where `metadata.aiContent` is undefined (or all with `--force`)
2. **Sequential Processing**: Processes one product at a time with **500ms delay** between API calls (rate limit protection)
3. **AI Generation**: Sends product context to Claude with structured JSON output schema
4. **Storage**: Writes generated content to Convex fields + stores review data in `metadata.aiContent`
5. **Logging**: Reports success/failure for each product with running totals

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Sequential with 500ms delays | Prevents Anthropic rate limiting, allows graceful interruption |
| Categories in metadata | Enables human review before linking to Medusa categories |
| Original title preserved | Allows comparison and rollback if needed |
| Dry-run mode | Test prompt engineering without writing to database |
| Force flag | Regenerate content after prompt improvements |

### Environment

```bash
# Required in catalogue/.env.local
ANTHROPIC_API_KEY=sk-ant-...
CONVEX_URL=http://127.0.0.1:3210  # or production URL
```

### Usage

```bash
cd catalogue

# Process 10 products (default)
npx ts-node agents/product-content-generator.ts

# Process specific product
npx ts-node agents/product-content-generator.ts --product-id abc123

# Preview without saving
npx ts-node agents/product-content-generator.ts --dry-run --limit 5

# Force regenerate all products
npx ts-node agents/product-content-generator.ts --all --force
```

## Setup

Add your Anthropic API key to `catalogue/.env.local`:

```bash
# Required for AI content generation
ANTHROPIC_API_KEY=sk-ant-api03-...

# Convex URL (should already be set)
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

## Convex Schema

The agent uses these existing fields in the `medusaProducts` table:

| Field | Type | Purpose |
|-------|------|---------|
| `title` | string | AI-generated product title |
| `subtitle` | string | AI-generated value proposition |
| `description` | string | AI-generated product description |
| `typeValue` | string | Product type classification |
| `handle` | string | URL slug (auto-regenerated from new title) |
| `metadata.aiContent` | object | Review data and generation metadata |

### metadata.aiContent Structure

```json
{
  "generatedAt": "2026-01-16T12:00:00.000Z",
  "model": "claude-sonnet-4-20250514",
  "tags": ["pendant-light", "modern", "dining-room"],
  "suggestedCategories": ["Lighting > Pendant Lights > Modern"],
  "seoTitle": "Modern Glass Pendant Light | Home Decor",
  "seoDescription": "Illuminate your space with our elegant glass pendant...",
  "originalTitle": "2024 New Arrival Lamp Glass Nordic Light..."
}
```

## API Reference

### Queries

```typescript
// Get products needing content
const products = await convex.query(api.medusaStaging.getProductsNeedingContent, {
  limit: 10,
  includeWithContent: false,  // true for --force mode
});

// Get single product by ID
const product = await convex.query(api.medusaStaging.getProductForAiContent, {
  productId: "abc123...",
});

// Get generation statistics
const stats = await convex.query(api.medusaStaging.getAiContentStats, {});
// Returns: { totalProducts, withAiContent, withoutAiContent, percentComplete }
```

### Mutations

```typescript
// Save AI-generated content
await convex.mutation(api.medusaStaging.updateProductAiContent, {
  productId: "abc123...",
  title: "Modern Glass Pendant Light",
  subtitle: "Elegant minimalist design",
  description: "Transform your space...",
  productType: "Pendant Light",
  tags: ["modern", "glass", "pendant"],
  suggestedCategories: ["Lighting > Pendants"],
  seoTitle: "Modern Glass Pendant | Shop",
  seoDescription: "Discover our collection...",
  model: "claude-sonnet-4-20250514",
});
```