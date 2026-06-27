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
  relatedHref: string
  relatedLabel: string
}

export const posts = [...(rawPosts as LeditorialPost[])].sort(
  (a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
)

export const featuredPost = posts[0]

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug)
}