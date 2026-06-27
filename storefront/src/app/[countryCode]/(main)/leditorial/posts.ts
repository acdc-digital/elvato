import rawPosts from "../../../../content/leditorial/posts.json"

export type LeditorialPost = {
  slug: string
  category: string
  title: string
  excerpt: string
  image: string
  alt: string
  readTime: string
  publishedAt: string
  dek: string
  sections: Array<{
    heading: string
    body: string[]
  }>
  contentMarkdown?: string
  relatedHref: string
  relatedLabel: string
  editorial?: {
    date: string
    topic: string
    objective: string
    primaryKeyword: string
    secondaryKeywords: string[]
    searchIntent: string
    targetAudience: string
    funnelStage: string
    articleType: string
    estimatedReadingTime: string
    confidenceScore: string
  }
  seo?: {
    metaTitle: string
    metaDescription: string
    ogTitle: string
    ogDescription: string
    canonicalPath: string
  }
  hero?: {
    headline: string
    subtitle: string
    featuredImagePrompt?: string
  }
  images?: Array<{
    src: string
    serpapiSearchQuery?: string
    alt: string
    caption?: string
    placement?: string
  }>
  internalLinks?: Array<{
    label: string
    href: string
    reason?: string
  }>
  productPlacements?: Array<{
    title: string
    href: string
    context: string
  }>
  ctas?: {
    newsletter?: {
      label: string
      href: string
      copy: string
    }
    shopping?: {
      label: string
      href: string
      copy: string
    }
    consultation?: {
      label: string
      href: string
      copy: string
    }
  }
  faq?: Array<{
    question: string
    answer: string
  }>
  editorialNotes?: {
    whyChosenToday: string
    expectedSeoValue: string
    futureFollowUps: string[]
  }
}

export const posts = [...(rawPosts as LeditorialPost[])].sort(
  (a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
)

export const featuredPost = posts[0]

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug)
}